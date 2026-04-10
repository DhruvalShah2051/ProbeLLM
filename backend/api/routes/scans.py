from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List
from datetime import datetime
import uuid

from db.database import get_db
from db.models import Scan, ScanStatus

from fastapi import BackgroundTasks
from core.pipeline import run_pipeline

router = APIRouter()


class ScanCreate(BaseModel):
    target_url: str
    model: str
    api_key: str
    judge_model: str = "gpt-4o"
    categories: List[str] = ["injection", "jailbreak", "exfiltration", "evasion"]


class ScanResponse(BaseModel):
    id: str
    target_url: str
    model: str
    judge_model: str
    categories: List[str]
    status: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


def serialize_categories(categories: List[str]) -> str:
    return ",".join(categories)


def deserialize_categories(categories_str: str) -> List[str]:
    if not categories_str:
        return []
    return categories_str.split(",")


def scan_to_response(scan: Scan) -> ScanResponse:
    return ScanResponse(
        id=scan.id,
        target_url=scan.target_url,
        model=scan.model,
        judge_model=scan.judge_model,
        categories=deserialize_categories(scan.categories),
        status=scan.status,
        created_at=scan.created_at,
        updated_at=scan.updated_at,
    )


@router.post("/", response_model=ScanResponse, status_code=201)
async def create_scan(payload: ScanCreate, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    scan = Scan(
        id=str(uuid.uuid4()),
        target_url=payload.target_url,
        model=payload.model,
        judge_model=payload.judge_model,
        categories=serialize_categories(payload.categories),
        status=ScanStatus.pending,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow(),
    )
    db.add(scan)
    db.commit()
    db.refresh(scan)

    background_tasks.add_task(run_pipeline, scan.id, payload.api_key)

    return scan_to_response(scan)


@router.get("/", response_model=List[ScanResponse])
def list_scans(db: Session = Depends(get_db)):
    db.expire_all()
    return [scan_to_response(scan) for scan in db.query(Scan).order_by(Scan.created_at.desc()).all()]


@router.get("/{scan_id}", response_model=ScanResponse)
def get_scan(scan_id: str, db: Session = Depends(get_db)):
    scan = db.query(Scan).filter(Scan.id == scan_id).first()
    if not scan:
        raise HTTPException(status_code=404, detail="Scan not found")
    return scan_to_response(scan)


@router.delete("/{scan_id}", status_code=204)
def delete_scan(scan_id: str, db: Session = Depends(get_db)):
    scan = db.query(Scan).filter(Scan.id == scan_id).first()
    if not scan:
        raise HTTPException(status_code=404, detail="Scan not found")
    db.delete(scan)
    db.commit()