from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

from db.database import get_db
from db.models import JudgeProvider, Scan, AttackResult, ScanStatus, AttackCategory, AttackStatus, Severity, User
from db.schemas import UserResponse
from core.auth import get_current_user

router = APIRouter()


# ---------------------------------------------------------------------------
# Request / Response schemas
# ---------------------------------------------------------------------------

class ScanCreate(BaseModel):
    target_url: str
    target_model: str
    target_api_key: str = ""
    judge_provider: JudgeProvider = JudgeProvider.groq
    judge_model: Optional[str] = None
    attack_categories: List[AttackCategory] = list(AttackCategory)


class AttackResultResponse(BaseModel):
    id: int
    scan_id: int
    attack_name: str
    category: AttackCategory
    payload: str
    response: Optional[str]
    response_time_ms: Optional[int]
    status: AttackStatus
    severity: Optional[Severity]
    judge_reasoning: Optional[str]
    judge_score: Optional[float]
    created_at: datetime
    completed_at: Optional[datetime]

    model_config = {"from_attributes": True}


class ScanResponse(BaseModel):
    id: int
    user_id: int
    target_url: str
    target_model: str
    judge_provider: str
    judge_model: Optional[str]
    attack_categories: List[str]
    status: ScanStatus
    total_attacks: int
    completed_attacks: int
    vulnerabilities_found: int
    overall_severity: Optional[Severity]
    created_at: datetime
    started_at: Optional[datetime]
    completed_at: Optional[datetime]

    model_config = {"from_attributes": True}


class ScanExport(BaseModel):
    scan: ScanResponse
    summary: dict
    attacks: List[AttackResultResponse]


# ---------------------------------------------------------------------------
# POST /api/scans/  — create a new scan
# ---------------------------------------------------------------------------

@router.post("/", response_model=ScanResponse, status_code=status.HTTP_201_CREATED)
async def create_scan(
    payload: ScanCreate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    scan = Scan(
        user_id=current_user.id,
        target_url=payload.target_url,
        target_model=payload.target_model,
        target_api_key=payload.target_api_key,
        judge_provider=payload.judge_provider,
        judge_model=payload.judge_model,
        attack_categories=[c.value for c in payload.attack_categories],
        status=ScanStatus.queued,
    )
    db.add(scan)
    db.commit()
    db.refresh(scan)

    # Pipeline hook — uncomment when run_pipeline is ready
    from core.pipeline import run_pipeline
    background_tasks.add_task(run_pipeline, scan.id)

    return scan


# ---------------------------------------------------------------------------
# GET /api/scans/  — list all scans for the current user
# ---------------------------------------------------------------------------

@router.get("/", response_model=List[ScanResponse])
def list_scans(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return (
        db.query(Scan)
        .filter(Scan.user_id == current_user.id)
        .order_by(Scan.created_at.desc())
        .all()
    )


# ---------------------------------------------------------------------------
# GET /api/scans/{scan_id}  — get a single scan
# ---------------------------------------------------------------------------

@router.get("/{scan_id}", response_model=ScanResponse)
def get_scan(
    scan_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    scan = _get_scan_or_404(scan_id, current_user.id, db)
    return scan


# ---------------------------------------------------------------------------
# DELETE /api/scans/{scan_id}
# ---------------------------------------------------------------------------

@router.delete("/{scan_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_scan(
    scan_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    scan = _get_scan_or_404(scan_id, current_user.id, db)
    db.delete(scan)
    db.commit()


# ---------------------------------------------------------------------------
# GET /api/scans/{scan_id}/attacks  — all attack results for a scan
# ---------------------------------------------------------------------------

@router.get("/{scan_id}/attacks", response_model=List[AttackResultResponse])
def get_attacks(
    scan_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _get_scan_or_404(scan_id, current_user.id, db)
    return (
        db.query(AttackResult)
        .filter(AttackResult.scan_id == scan_id)
        .order_by(AttackResult.created_at)
        .all()
    )


# ---------------------------------------------------------------------------
# GET /api/scans/{scan_id}/export  — full report as JSON
# ---------------------------------------------------------------------------

@router.get("/{scan_id}/export")
def export_scan(
    scan_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    scan = _get_scan_or_404(scan_id, current_user.id, db)
    attacks = (
        db.query(AttackResult)
        .filter(AttackResult.scan_id == scan_id)
        .order_by(AttackResult.created_at)
        .all()
    )

    severity_counts = {s.value: 0 for s in Severity}
    for a in attacks:
        if a.severity:
            severity_counts[a.severity.value] += 1

    return {
        "scan": {
            "id": scan.id,
            "target_url": scan.target_url,
            "target_model": scan.target_model,
            "judge_provider": scan.judge_provider,
            "judge_model": scan.judge_model,
            "attack_categories": scan.attack_categories,
            "status": scan.status,
            "created_at": scan.created_at,
            "started_at": scan.started_at,
            "completed_at": scan.completed_at,
        },
        "summary": {
            "total_attacks": scan.total_attacks,
            "completed_attacks": scan.completed_attacks,
            "vulnerabilities_found": scan.vulnerabilities_found,
            "overall_severity": scan.overall_severity,
            "severity_counts": severity_counts,
        },
        "attacks": [
            {
                "attack_name": a.attack_name,
                "category": a.category,
                "status": a.status,
                "severity": a.severity,
                "judge_score": a.judge_score,
                "judge_reasoning": a.judge_reasoning,
                "payload": a.payload,
                "response": a.response,
                "response_time_ms": a.response_time_ms,
            }
            for a in attacks
        ],
    }


# ---------------------------------------------------------------------------
# Helper
# ---------------------------------------------------------------------------

def _get_scan_or_404(scan_id: int, user_id: int, db: Session) -> Scan:
    scan = (
        db.query(Scan)
        .filter(Scan.id == scan_id, Scan.user_id == user_id)
        .first()
    )
    if not scan:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Scan not found.")
    return scan