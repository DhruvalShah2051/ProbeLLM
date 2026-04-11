import asyncio
from datetime import datetime
from sqlalchemy.orm import Session

from db.models import Scan, Attack, ScanStatus
from db.database import SessionLocal
from core.runner import get_attack_templates, run_attack
from core.judge import judge_response


async def run_pipeline(scan_id: str, api_key: str):
    """
    Full red team pipeline for a single scan:
    1. Load attack templates for the scan's categories
    2. Fire each payload at the target LLM
    3. Judge each response
    4. Write results to DB
    5. Update scan status
    """
    db = SessionLocal()
    try:
        scan = db.query(Scan).filter(Scan.id == scan_id).first()
        print(f"[pipeline] starting scan {scan.id}")
        categories = scan.categories.split(",")
        templates = get_attack_templates(categories)
        print(f"[pipeline] loaded {len(templates)} templates")

        scan.status = ScanStatus.running
        scan.updated_at = datetime.utcnow()
        db.commit()
        print(f"[pipeline] status set to running")

        for template in templates:
            print(f"[pipeline] running attack {template.id}")
            attack_result = await run_attack(
                template=template,
                target_url=scan.target_url,
                model=scan.model,
                api_key=api_key,
            )
            print(f"[pipeline] got result, error={attack_result.error}")

            if attack_result.error or not attack_result.response:
                attack_record = Attack(
                    scan_id=scan.id,
                    template_id=attack_result.template_id,
                    category=attack_result.category,
                    payload=attack_result.payload,
                    response=None,
                    success="error",
                    severity=template.severity,
                    judge_reasoning=attack_result.error,
                    score=None,
                    created_at=datetime.utcnow(),
                )
            else:
                verdict = await judge_response(
                    payload=attack_result.payload,
                    response=attack_result.response,
                    judge_model=scan.judge_model,
                )
                attack_record = Attack(
                    scan_id=scan.id,
                    template_id=attack_result.template_id,
                    category=attack_result.category,
                    payload=attack_result.payload,
                    response=attack_result.response,
                    success=verdict.success,
                    severity=template.severity,
                    judge_reasoning=verdict.reasoning,
                    score=verdict.score,
                    created_at=datetime.utcnow(),
                )

            db.add(attack_record)
            db.commit()
            # await asyncio.sleep(15)

        scan.status = ScanStatus.completed
        scan.completed_at = datetime.utcnow()
        scan.updated_at = datetime.utcnow()
        db.commit()
    finally:
        db.close()
