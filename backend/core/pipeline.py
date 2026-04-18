"""
Scan pipeline — orchestrates the full red team run for a given scan.
Runs as a FastAPI background task.
"""
import asyncio
from datetime import datetime, timezone

from db.database import SessionLocal
from db.models import Scan, AttackResult, ScanStatus, AttackStatus, Severity
from config import settings
from core.loader import load_templates
from core.runner import run_attack
from core.judge import judge_response
from core.ws_manager import manager


# ---------------------------------------------------------------------------
# Severity ranking for computing overall_severity
# ---------------------------------------------------------------------------

_SEVERITY_RANK = {
    Severity.critical: 4,
    Severity.high: 3,
    Severity.medium: 2,
    Severity.low: 1,
    None: 0,
}


def _highest_severity(severities: list) -> Severity | None:
    return max(severities, key=lambda s: _SEVERITY_RANK.get(s, 0), default=None)


# ---------------------------------------------------------------------------
# Broadcast helper — fire-and-forget from sync context
# ---------------------------------------------------------------------------

def _broadcast(scan_id: int, data: dict):
    """
    Sends a WebSocket broadcast from sync code.
    Creates a new event loop task safely.
    """
    try:
        loop = asyncio.get_event_loop()
        if loop.is_running():
            asyncio.ensure_future(manager.broadcast(scan_id, data))
    except RuntimeError:
        pass


# ---------------------------------------------------------------------------
# Main pipeline entry point
# ---------------------------------------------------------------------------

def run_pipeline(scan_id: int):
    """
    Called as a BackgroundTask from the scans router.
    Opens its own DB session (the request session is already closed).
    """
    db = SessionLocal()
    try:
        scan = db.query(Scan).filter(Scan.id == scan_id).first()
        if not scan:
            return

        # ── 1. Load attack templates ────────────────────────────────────────
        from db.models import AttackCategory
        selected_categories = [AttackCategory(c) for c in scan.attack_categories]

        try:
            templates = load_templates(settings.attack_library_path, selected_categories)
        except FileNotFoundError as e:
            _mark_scan_failed(scan, db, str(e))
            return

        if not templates:
            _mark_scan_failed(scan, db, "No templates found for selected categories.")
            return

        # Count total attack rows (one per payload per template)
        total = sum(len(t.payloads) for t in templates)

        # ── 2. Mark scan as running ─────────────────────────────────────────
        scan.status = ScanStatus.running
        scan.started_at = datetime.now(timezone.utc)
        scan.total_attacks = total
        scan.completed_attacks = 0
        scan.vulnerabilities_found = 0
        db.commit()

        _broadcast(scan_id, {
            "event": "scan_started",
            "scan_id": scan_id,
            "total_attacks": total,
        })

        # ── 3. Run each attack ──────────────────────────────────────────────
        all_severities = []

        for template in templates:
            for payload in template.payloads:

                # Create the AttackResult row
                attack = AttackResult(
                    scan_id=scan_id,
                    attack_name=template.id,
                    category=template.category,
                    payload=payload,
                    status=AttackStatus.running,
                )
                db.add(attack)
                db.commit()
                db.refresh(attack)

                _broadcast(scan_id, {
                    "event": "attack_started",
                    "attack_id": attack.id,
                    "attack_name": template.id,
                    "category": template.category.value,
                    "payload": payload,
                })

                # Send payload to target LLM
                runner_result = run_attack(
                    target_url=scan.target_url,
                    target_model=scan.target_model,
                    api_key=scan.target_api_key or "EMPTY",
                    payload=payload,
                )

                if runner_result.error:
                    attack.status = AttackStatus.failed
                    attack.response = runner_result.error
                    attack.response_time_ms = runner_result.response_time_ms
                    attack.completed_at = datetime.now(timezone.utc)
                    db.commit()

                    scan.completed_attacks += 1
                    db.commit()

                    _broadcast(scan_id, {
                        "event": "attack_completed",
                        "attack_id": attack.id,
                        "status": "failed",
                        "error": runner_result.error,
                        "completed_attacks": scan.completed_attacks,
                        "total_attacks": total,
                    })
                    continue

                # Send to judge LLM
                verdict = judge_response(
                    payload=payload,
                    response=runner_result.response_text,
                    judge_guidance=template.judge_guidance,
                    success_indicators=template.success_indicators,
                    failure_indicators=template.failure_indicators,
                    severity_hint=template.severity_hint,
                    judge_provider=scan.judge_provider,
                    judge_model=scan.judge_model or "",
                    openai_api_key=settings.openai_api_key,
                    anthropic_api_key=settings.anthropic_api_key,
                    groq_api_key=settings.groq_api_key,
                )

                # Update attack row
                attack.status = verdict.status
                attack.severity = verdict.severity
                attack.judge_reasoning = verdict.reasoning
                attack.judge_score = verdict.score
                attack.response = runner_result.response_text
                attack.response_time_ms = runner_result.response_time_ms
                attack.completed_at = datetime.now(timezone.utc)
                db.commit()

                # Update scan counters
                scan.completed_attacks += 1
                if verdict.status == AttackStatus.vulnerable:
                    scan.vulnerabilities_found += 1
                    all_severities.append(verdict.severity)
                db.commit()

                _broadcast(scan_id, {
                    "event": "attack_completed",
                    "attack_id": attack.id,
                    "attack_name": template.id,
                    "category": template.category.value,
                    "status": verdict.status.value,
                    "severity": verdict.severity.value if verdict.severity else None,
                    "score": verdict.score,
                    "reasoning": verdict.reasoning,
                    "response": runner_result.response_text,
                    "response_time_ms": runner_result.response_time_ms,
                    "completed_attacks": scan.completed_attacks,
                    "total_attacks": total,
                })

        # ── 4. Mark scan as completed ───────────────────────────────────────
        scan.status = ScanStatus.completed
        scan.completed_at = datetime.now(timezone.utc)
        scan.overall_severity = _highest_severity(all_severities)
        db.commit()

        _broadcast(scan_id, {
            "event": "scan_completed",
            "scan_id": scan_id,
            "status": "completed",
            "vulnerabilities_found": scan.vulnerabilities_found,
            "overall_severity": scan.overall_severity.value if scan.overall_severity else None,
        })

    except Exception as e:
        db.rollback()
        scan = db.query(Scan).filter(Scan.id == scan_id).first()
        if scan:
            _mark_scan_failed(scan, db, str(e))
    finally:
        db.close()


def _mark_scan_failed(scan: Scan, db, reason: str):
    scan.status = ScanStatus.failed
    scan.completed_at = datetime.now(timezone.utc)
    db.commit()
    _broadcast(scan.id, {
        "event": "scan_failed",
        "scan_id": scan.id,
        "reason": reason,
    })