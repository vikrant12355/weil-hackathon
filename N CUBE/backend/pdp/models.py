"""
pdp/models.py
SQLAlchemy ORM models for off-chain metadata storage (PostgreSQL).
"""
import uuid
from datetime import datetime, timezone
from typing import Optional

from sqlalchemy import (
    Boolean, DateTime, Float, ForeignKey, Integer,
    String, Text, func, JSON, Uuid
)

from sqlalchemy.orm import Mapped, mapped_column, relationship


from pdp.database import Base


# ── Users & RBAC ─────────────────────────────────────────────────────────────

class User(Base):
    """Authenticated user (human operator, auditor, or service account)."""
    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(
        primary_key=True, default=uuid.uuid4
    )

    username: Mapped[str] = mapped_column(String(64), unique=True, nullable=False, index=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[str] = mapped_column(
        String(32), nullable=False, default="viewer"
        # roles: "admin" | "auditor" | "service" | "viewer"
    )
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    decisions: Mapped[list["DecisionRecord"]] = relationship(
        back_populates="captured_by_user", lazy="select"
    )


# ── Decision Records ──────────────────────────────────────────────────────────

class DecisionRecord(Base):
    """
    Core off-chain metadata for every AI decision event.
    The heavy cryptographic proof lives in BlockchainAnchor; this table
    is optimised for fast querying & full-text search.
    """
    __tablename__ = "decision_records"

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid, primary_key=True, default=uuid.uuid4
    )


    # ── Who / what made the decision ─────────────────────────────────────────
    model_id: Mapped[str] = mapped_column(String(128), nullable=False, index=True,
        comment="Logical name of the AI model (e.g. 'gpt-4-healthcare-v2')")
    model_version: Mapped[str] = mapped_column(String(64), nullable=False,
        comment="Semantic version or git SHA of the model artifact")
    sector: Mapped[Optional[str]] = mapped_column(String(64), index=True,
        comment="Domain: defence | healthcare | cybersecurity | finance | legal")

    # ── Decision payload ─────────────────────────────────────────────────────
    input_data: Mapped[dict] = mapped_column(JSON, nullable=False,
        comment="Sanitised input features fed to the model")
    output_data: Mapped[dict] = mapped_column(JSON, nullable=False,
        comment="Raw model output (labels, probabilities, actions)")
    confidence_score: Mapped[Optional[float]] = mapped_column(Float,
        comment="Top-1 confidence or aggregate certainty score [0, 1]")
    decision_label: Mapped[Optional[str]] = mapped_column(String(256),
        comment="Human-readable decision outcome, e.g. 'APPROVE_LOAN'")

    # ── Explainability (SHAP / LIME / feature importance) ────────────────────
    explanation: Mapped[Optional[dict]] = mapped_column(JSON,
        comment="Model-generated explanation; e.g. {'shap_values': {...}, 'top_features': [...]}")


    # ── Cryptographic fingerprint ─────────────────────────────────────────────
    record_hash: Mapped[str] = mapped_column(String(128), unique=True, nullable=False, index=True,
        comment="SHA-256 hex digest of the canonical decision payload")

    # ── Blockchain anchor (populated after on-chain write) ────────────────────
    is_anchored: Mapped[bool] = mapped_column(Boolean, default=False, index=True)
    anchor: Mapped[Optional["BlockchainAnchor"]] = relationship(
        back_populates="decision", uselist=False, lazy="select"
    )

    # ── Audit metadata ────────────────────────────────────────────────────────
    captured_by: Mapped[Optional[uuid.UUID]] = mapped_column(
        ForeignKey("users.id"), nullable=True
    )

    captured_by_user: Mapped[Optional["User"]] = relationship(back_populates="decisions")
    captured_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), index=True
    )
    event_timestamp: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True),
        comment="Timestamp reported by the originating AI system"
    )
    notes: Mapped[Optional[str]] = mapped_column(Text)

    # ── Compliance tags ───────────────────────────────────────────────────────
    tags: Mapped[Optional[dict]] = mapped_column(JSON, default=dict,
        comment="Arbitrary key-value labels for compliance filtering")



# ── Blockchain Anchors ────────────────────────────────────────────────────────

class BlockchainAnchor(Base):
    """
    On-chain proof metadata returned after anchoring a DecisionRecord
    to the blockchain (Ethereum / Hyperledger Fabric).
    """
    __tablename__ = "blockchain_anchors"

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid, primary_key=True, default=uuid.uuid4
    )

    decision_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("decision_records.id"), unique=True, nullable=False
    )

    decision: Mapped["DecisionRecord"] = relationship(back_populates="anchor")

    # ── On-chain details ──────────────────────────────────────────────────────
    tx_hash: Mapped[str] = mapped_column(String(256), unique=True, nullable=False,
        comment="Blockchain transaction hash")
    block_number: Mapped[Optional[int]] = mapped_column(Integer)
    block_hash: Mapped[Optional[str]] = mapped_column(String(256))
    contract_address: Mapped[Optional[str]] = mapped_column(String(256),
        comment="Smart contract that emitted the DecisionLogged event")
    network: Mapped[str] = mapped_column(String(64), default="ethereum",
        comment="ethereum | hyperledger | polygon | …")
    chain_id: Mapped[Optional[int]] = mapped_column(Integer)

    # ── Proof-of-Decision certificate ─────────────────────────────────────────
    verification_key: Mapped[str] = mapped_column(String(512), nullable=False,
        comment="ECDSA public key used to sign this proof certificate")
    certificate_hash: Mapped[str] = mapped_column(String(256), nullable=False,
        comment="SHA-256 of the full PoD certificate JSON")

    anchored_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )


# ── Audit Log ─────────────────────────────────────────────────────────────────

class AuditLog(Base):
    """
    Immutable append-only log of every access / action performed on
    DecisionRecords — satisfies regulatory audit-trail requirements.
    """
    __tablename__ = "audit_logs"

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid, primary_key=True, default=uuid.uuid4
    )

    actor_id: Mapped[Optional[uuid.UUID]] = mapped_column(ForeignKey("users.id"))

    action: Mapped[str] = mapped_column(String(64), nullable=False, index=True,
        comment="CAPTURE | ANCHOR | QUERY | VERIFY | EXPORT")
    resource_type: Mapped[str] = mapped_column(String(64), default="decision")
    resource_id: Mapped[Optional[str]] = mapped_column(String(256), index=True)
    detail: Mapped[Optional[dict]] = mapped_column(JSON)
    ip_address: Mapped[Optional[str]] = mapped_column(String(64))

    occurred_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), index=True
    )
