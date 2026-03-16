"""
pdp/schemas.py
Pydantic v2 request / response schemas for the PDP API.
"""
import uuid
from datetime import datetime
from typing import Any, Optional

from pydantic import BaseModel, EmailStr, Field


# ── Auth ──────────────────────────────────────────────────────────────────────

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: str

class LoginRequest(BaseModel):
    username: str
    password: str

class UserCreate(BaseModel):
    username: str = Field(..., min_length=3, max_length=64)
    email: EmailStr
    password: str = Field(..., min_length=8)
    role: str = Field(default="viewer", pattern="^(viewer|auditor|service|admin)$")

class UserOut(BaseModel):
    id: uuid.UUID
    username: str
    email: str
    role: str
    is_active: bool
    created_at: datetime
    model_config = {"from_attributes": True}


# ── Decision Capture ──────────────────────────────────────────────────────────

class CaptureRequest(BaseModel):
    """Payload sent to POST /api/v1/capture"""

    model_id: str = Field(..., description="Logical model name, e.g. 'fraud-detector-v3'")
    model_version: str = Field(..., description="Semantic version or git SHA")
    sector: Optional[str] = Field(None, description="defence|healthcare|cybersecurity|finance|legal")

    input_data: dict[str, Any] = Field(..., description="Sanitised input features")
    output_data: dict[str, Any] = Field(..., description="Raw model output")
    confidence_score: Optional[float] = Field(None, ge=0.0, le=1.0)
    decision_label: Optional[str] = None

    # Explainability placeholder — attach SHAP values, LIME weights, etc.
    explanation: Optional[dict[str, Any]] = Field(
        None,
        description=(
            "Model-generated explanation. Recommended structure:\n"
            "  {\n"
            "    'method': 'shap',\n"
            "    'shap_values': {'feature_a': 0.42, ...},\n"
            "    'top_features': [['feature_a', 0.42], ...],\n"
            "    'base_value': 0.5\n"
            "  }"
        ),
    )

    event_timestamp: Optional[datetime] = Field(
        None, description="Timestamp from the originating AI system (UTC)"
    )
    notes: Optional[str] = None
    tags: Optional[dict[str, str]] = Field(default_factory=dict)


class CaptureResponse(BaseModel):
    decision_id: uuid.UUID
    record_hash: str
    is_anchored: bool
    captured_at: datetime
    model_config = {"from_attributes": True}


# ── Proof-of-Decision certificate ────────────────────────────────────────────

class ProofCertificate(BaseModel):
    decision_id: uuid.UUID
    record_hash: str
    tx_hash: Optional[str]
    block_number: Optional[int]
    block_hash: Optional[str]
    contract_address: Optional[str]
    verification_key: str
    certificate_hash: str
    signature: str
    issued_at: datetime
    is_valid: bool


# ── Audit / Query ─────────────────────────────────────────────────────────────

class AuditQueryParams(BaseModel):
    """Query filters for GET /api/v1/audit"""
    model_id: Optional[str] = None
    sector: Optional[str] = None
    is_anchored: Optional[bool] = None
    from_date: Optional[datetime] = None
    to_date: Optional[datetime] = None
    page: int = Field(default=1, ge=1)
    page_size: int = Field(default=20, ge=1, le=100)


class DecisionSummary(BaseModel):
    id: uuid.UUID
    model_id: str
    model_version: str
    sector: Optional[str]
    decision_label: Optional[str]
    confidence_score: Optional[float]
    record_hash: str
    is_anchored: bool
    captured_at: datetime
    tx_hash: Optional[str] = None
    model_config = {"from_attributes": True}


class AuditQueryResponse(BaseModel):
    total: int
    page: int
    page_size: int
    results: list[DecisionSummary]


class VerifyRequest(BaseModel):
    decision_id: uuid.UUID
    record_hash: str


class VerifyResponse(BaseModel):
    decision_id: uuid.UUID
    hash_matches_local: bool
    hash_matches_onchain: bool
    tampered: bool
