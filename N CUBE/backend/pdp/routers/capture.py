"""
pdp/routers/capture.py
POST /api/v1/capture — intercept and record AI decision events.
"""
import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Request, status
from sqlalchemy.ext.asyncio import AsyncSession

from pdp.routers.auth import require_role

from pdp.database import get_db
from pdp.models import AuditLog, DecisionRecord, User
from pdp.schemas import CaptureRequest, CaptureResponse
from pdp.services.blockchain import anchor_decision
from pdp.services.crypto import hash_decision_record
import logging

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/capture", tags=["Capture"])


def _build_hashable_payload(req: CaptureRequest) -> dict:
    """
    Construct the canonical dict that will be hashed.
    Excludes mutable / non-deterministic fields (notes, tags).
    """
    return {
        "model_id":        req.model_id,
        "model_version":   req.model_version,
        "sector":          req.sector,
        "input_data":      req.input_data,
        "output_data":     req.output_data,
        "confidence_score": req.confidence_score,
        "decision_label":  req.decision_label,
        "explanation":     req.explanation,
        "event_timestamp": req.event_timestamp.isoformat() if req.event_timestamp else None,
    }


async def _anchor_and_update(decision_id: uuid.UUID, record_hash: str, db: AsyncSession):
    """Background task: anchor decision on-chain and update DB."""
    from sqlalchemy import select
    from pdp.models import BlockchainAnchor
    from pdp.services.crypto import generate_signing_keypair, build_pod_certificate

    try:
        anchor_data = await anchor_decision(str(decision_id), record_hash)

        private_key, _ = generate_signing_keypair()
        cert = build_pod_certificate(
            decision_id=decision_id,
            record_hash=record_hash,
            tx_hash=anchor_data["tx_hash"],
            block_number=anchor_data.get("block_number"),
            private_key=private_key,
        )

        async with db.begin():
            result = await db.execute(
                select(DecisionRecord).where(DecisionRecord.id == decision_id)
            )
            record = result.scalar_one()
            record.is_anchored = True

            anchor = BlockchainAnchor(
                decision_id=decision_id,
                tx_hash=anchor_data["tx_hash"],
                block_number=anchor_data.get("block_number"),
                block_hash=anchor_data.get("block_hash"),
                contract_address=anchor_data.get("contract_address"),
                chain_id=int(anchor_data.get("chain_id", 0)) if anchor_data.get("chain_id") else None,
                verification_key=cert["verification_key"],
                certificate_hash=cert["certificate_hash"],
            )
            db.add(anchor)

    except Exception as exc:
        logger.error("Background anchoring failed for %s: %s", decision_id, exc, exc_info=True)


@router.post("", response_model=CaptureResponse, status_code=status.HTTP_201_CREATED)
async def capture_decision(
    payload: CaptureRequest,
    background_tasks: BackgroundTasks,
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role("service", "admin")),
):
    """
    **Capture an AI decision event.**

    - Bundles input data, model version, confidence score, timestamp, and
      optional SHAP/explainability values.
    - Computes a tamper-evident SHA-256 hash of the canonical payload.
    - Persists the record in PostgreSQL.
    - Triggers asynchronous blockchain anchoring in the background.
    """
    hashable = _build_hashable_payload(payload)
    record_hash = hash_decision_record(hashable)

    record = DecisionRecord(
        model_id=payload.model_id,
        model_version=payload.model_version,
        sector=payload.sector,
        input_data=payload.input_data,
        output_data=payload.output_data,
        confidence_score=payload.confidence_score,
        decision_label=payload.decision_label,
        explanation=payload.explanation,
        record_hash=record_hash,
        captured_by=current_user.id,
        captured_at=datetime.now(timezone.utc),
        event_timestamp=payload.event_timestamp,
        notes=payload.notes,
        tags=payload.tags or {},
    )
    db.add(record)
    await db.flush()  # obtain the generated UUID before background task

    # Write audit log entry
    db.add(AuditLog(
        actor_id=current_user.id,
        action="CAPTURE",
        resource_id=str(record.id),
        detail={"model_id": payload.model_id, "record_hash": record_hash},
        ip_address=request.client.host if request.client else None,
    ))

    await db.commit()
    await db.refresh(record)

    # Kick off non-blocking blockchain anchoring
    background_tasks.add_task(_anchor_and_update, record.id, record_hash, db)

    return record
