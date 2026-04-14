from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text, Enum
from sqlalchemy.orm import declarative_base, relationship
import enum

Base = declarative_base()


class ScanStatus(str, enum.Enum):
    pending   = "pending"
    running   = "running"
    completed = "completed"
    failed    = "failed"


class Severity(str, enum.Enum):
    low      = "low"
    medium   = "medium"
    high     = "high"
    critical = "critical"


class Scan(Base):
    __tablename__ = "scans"

    id           = Column(String, primary_key=True, index=True)  # change to String for uuid
    target_url   = Column(String, nullable=False)
    target_name  = Column(String, nullable=True)
    model        = Column(String, nullable=False)
    judge_model  = Column(String, default="gpt-4o")
    categories   = Column(String, nullable=False)   # store as comma-separated string
    status       = Column(Enum(ScanStatus), default=ScanStatus.pending)
    created_at   = Column(DateTime, default=datetime.utcnow)
    updated_at   = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)

    attacks      = relationship("Attack", back_populates="scan")


class Attack(Base):
    __tablename__ = "attacks"

    id              = Column(Integer, primary_key=True, index=True)
    scan_id         = Column(String, ForeignKey("scans.id"), nullable=False)
    template_id     = Column(String, nullable=False)        # e.g. "prompt_injection/basic_override"
    category        = Column(String, nullable=False)        # e.g. "prompt_injection"
    payload         = Column(Text, nullable=False)          # The actual prompt sent
    response        = Column(Text, nullable=True)           # What the target LLM replied
    success         = Column(String, nullable=True)         # "pass" | "fail" | "error"
    severity        = Column(Enum(Severity), nullable=True)
    judge_reasoning = Column(Text, nullable=True)          # Why the judge scored it this way
    score           = Column(Float, nullable=True)          # 0.0 – 1.0
    created_at      = Column(DateTime, default=datetime.utcnow)

    scan            = relationship("Scan", back_populates="attacks")
    