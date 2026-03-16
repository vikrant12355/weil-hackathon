"""Pydantic models for the PDP Backend API."""

from __future__ import annotations

from datetime import datetime
from enum import Enum
from typing import Optional

from pydantic import BaseModel, Field


# ── Enums ──────────────────────────────────────────────────────────────────────

class DecisionStatus(str, Enum):
    PENDING = "Pending"
    CONFIRMED = "Confirmed"
    REJECTED = "Rejected"


# ── Request Models ─────────────────────────────────────────────────────────────

class DecisionSubmitRequest(BaseModel):
    """Payload to submit a new AI decision for on-chain audit."""
    agent: str = Field(..., example="Cerebrum AI")
    confidence: float = Field(..., ge=0, le=100, example=87.0)
    reasoning: str = Field(..., example="Heart rate exceeds threshold and patient risk profile indicates anomaly.")
    input_data: str = Field(..., example="HR: 110bpm")
    decision_type: str = Field("Alert Patient", example="Alert Patient")


class ReviewApproveRequest(BaseModel):
    """Human approves a pending decision."""
    decision_id: str
    reviewer_notes: Optional[str] = None


class ReviewRejectRequest(BaseModel):
    """Human rejects/overrides a pending decision."""
    decision_id: str
    reason: str = Field(..., min_length=1, example="Override: false positive based on patient history.")


class WalletInitRequest(BaseModel):
    """Optionally set the private key path at runtime."""
    key_path: Optional[str] = None


# ── Response Models ────────────────────────────────────────────────────────────

class DecisionRecord(BaseModel):
    """A single decision stored locally + on-chain reference."""
    id: str
    timestamp: str
    agent: str
    confidence: float
    reasoning: str
    input_data: str
    decision_type: str
    decision_hash: str
    tx_hash: Optional[str] = None
    block_height: Optional[int] = None
    status: DecisionStatus = DecisionStatus.PENDING
    human_signature: Optional[str] = None
    reviewer_notes: Optional[str] = None


class DecisionSubmitResponse(BaseModel):
    """Returned after successfully submitting a decision."""
    decision: DecisionRecord
    on_chain: bool = False
    message: str = "Decision recorded."


class ReviewResponse(BaseModel):
    """Returned after a human review action."""
    decision_id: str
    action: str  # "approved" or "rejected"
    on_chain: bool = False
    tx_hash: Optional[str] = None
    message: str


class HealthResponse(BaseModel):
    """Health-check response."""
    status: str = "ok"
    wallet_connected: bool = False
    wallet_address: Optional[str] = None
    sentinel_host: str = ""
    demo_mode: bool = True
