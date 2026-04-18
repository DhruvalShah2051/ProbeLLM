from datetime import datetime
import enum

from sqlalchemy import (
    Column, Integer, String, Text, Float, Boolean,
    DateTime, ForeignKey, Enum as SAEnum, JSON
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from .database import Base


# ---------------------------------------------------------------------------
# Enums
# ---------------------------------------------------------------------------

class JudgeProvider(str, enum.Enum):
    openai    = "openai"
    anthropic = "anthropic"
    groq      = "groq"

class ScanStatus(str, enum.Enum):
    queued     = "queued"
    running    = "running"
    completed  = "completed"
    failed     = "failed"


class AttackCategory(str, enum.Enum):
    evasion      = "evasion"
    exfiltration = "exfiltration"
    injection    = "injection"
    jailbreak    = "jailbreak"


class AttackStatus(str, enum.Enum):
    queued      = "queued"
    running     = "running"
    passed      = "passed"
    failed      = "failed"
    vulnerable  = "vulnerable"


class Severity(str, enum.Enum):
    low      = "low"
    medium   = "medium"
    high     = "high"
    critical = "critical"


# ---------------------------------------------------------------------------
# User
# ---------------------------------------------------------------------------

class User(Base):
    __tablename__ = "users"

    id              = Column(Integer, primary_key=True, index=True)
    email           = Column(String(255), unique=True, nullable=False, index=True)
    hashed_password = Column(String(255), nullable=False)
    full_name       = Column(String(255), nullable=True)
    is_active       = Column(Boolean, default=True, nullable=False)
    created_at      = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at      = Column(DateTime(timezone=True), server_default=func.now(),
                             onupdate=func.now(), nullable=False)

    # Relationships
    scans       = relationship("Scan", back_populates="user", cascade="all, delete-orphan")
    audit_logs  = relationship("AuditLog", back_populates="user", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<User id={self.id} email={self.email!r}>"


# ---------------------------------------------------------------------------
# Scan
# ---------------------------------------------------------------------------

class Scan(Base):
    __tablename__ = "scans"

    id              = Column(Integer, primary_key=True, index=True)
    user_id         = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"),
                             nullable=False, index=True)

    # Target
    target_url      = Column(String(512), nullable=False)
    target_model    = Column(String(255), nullable=False)
    target_api_key = Column(String(512), nullable=True)

    # Judge
    judge_provider = Column(SAEnum(JudgeProvider), nullable=False)
    judge_model     = Column(String(128), nullable=True)

    # Which attack categories were selected (stored as JSON list)
    attack_categories = Column(JSON, nullable=False, default=list)

    # Status & progress
    status          = Column(SAEnum(ScanStatus), default=ScanStatus.queued,
                             nullable=False, index=True)
    total_attacks   = Column(Integer, default=0)
    completed_attacks = Column(Integer, default=0)

    # Aggregate results
    vulnerabilities_found = Column(Integer, default=0)
    overall_severity      = Column(SAEnum(Severity), nullable=True)

    # Timestamps
    created_at      = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    started_at      = Column(DateTime(timezone=True), nullable=True)
    completed_at    = Column(DateTime(timezone=True), nullable=True)

    # Relationships
    user            = relationship("User", back_populates="scans")
    attack_results  = relationship("AttackResult", back_populates="scan",
                                   cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Scan id={self.id} status={self.status} user_id={self.user_id}>"


# ---------------------------------------------------------------------------
# AttackResult
# ---------------------------------------------------------------------------

class AttackResult(Base):
    """One row per individual attack prompt sent during a scan."""
    __tablename__ = "attack_results"

    id              = Column(Integer, primary_key=True, index=True)
    scan_id         = Column(Integer, ForeignKey("scans.id", ondelete="CASCADE"),
                             nullable=False, index=True)

    # Attack identity
    attack_name     = Column(String(255), nullable=False)   # from YAML template name
    category        = Column(SAEnum(AttackCategory), nullable=False, index=True)
    payload         = Column(Text, nullable=False)           # the actual prompt sent

    # Response from the target LLM
    response        = Column(Text, nullable=True)
    response_time_ms = Column(Integer, nullable=True)        # latency in ms

    # Judge verdict
    status          = Column(SAEnum(AttackStatus), default=AttackStatus.queued,
                             nullable=False, index=True)
    severity        = Column(SAEnum(Severity), nullable=True)
    judge_reasoning = Column(Text, nullable=True)            # judge LLM explanation
    judge_score     = Column(Float, nullable=True)           # 0.0–1.0 confidence

    # Timestamps
    created_at      = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    completed_at    = Column(DateTime(timezone=True), nullable=True)

    # Relationship
    scan            = relationship("Scan", back_populates="attack_results")

    def __repr__(self):
        return (f"<AttackResult id={self.id} attack={self.attack_name!r} "
                f"status={self.status} severity={self.severity}>")


# ---------------------------------------------------------------------------
# AuditLog
# ---------------------------------------------------------------------------

class AuditLog(Base):
    """Lightweight record of significant user actions."""
    __tablename__ = "audit_logs"

    id          = Column(Integer, primary_key=True, index=True)
    user_id     = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"),
                         nullable=False, index=True)

    action      = Column(String(128), nullable=False)   # e.g. "scan_created", "login"
    resource    = Column(String(128), nullable=True)    # e.g. "scan:42"
    detail      = Column(JSON, nullable=True)           # any extra context
    ip_address  = Column(String(64), nullable=True)

    created_at  = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    # Relationship
    user        = relationship("User", back_populates="audit_logs")

    def __repr__(self):
        return f"<AuditLog id={self.id} user_id={self.user_id} action={self.action!r}>"