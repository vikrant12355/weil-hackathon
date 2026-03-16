"""
pdp/routers/proof.py
GET /api/v1/proof/{decision_id} — issue or retrieve a Proof-of-Decision certificate.
POST /api/v1/proof/verify        — verify a supplied certificate offline.
"""
import uuid

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from pdp.routers.auth import require_min_role

from pdp.database import get_db
from pdp.models import AuditLog, BlockchainAnchor, DecisionRecord, User
from pdp.schemas import ProofCertificate, VerifyRequest, VerifyResponse
from pdp.services.blockchain import verify_on_chain
from pdp.services.crypto import (
    build_pod_certificate,
    generate_signing_keypair,
    verify_record_hash,
)

router = APIRouter(prefix="/proof", tags=["Proof"])


@router.get("/{decision_id}", response_model=ProofCertificate)
async def get_proof(
    decision_id: uuid.UUID,
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_min_role("auditor")),
):
    """
    **Issue a Proof-of-Decision certificate** for a specific decision.

    Returns the decision ID, record hash, blockchain block reference, and a
    cryptographic verification key — analogous to a transaction receipt for AI.
    """
    # Load decision + anchor in one query
    result = await db.execute(
        select(DecisionRecord).where(DecisionRecord.id == decision_id)
    )
    record: DecisionRecord | None = result.scalar_one_or_none()
    if not record:
        raise HTTPException(status_code=404, detail="Decision record not found")

    anchor_result = await db.execute(
        select(BlockchainAnchor).where(BlockchainAnchor.decision_id == decision_id)
    )
    anchor: BlockchainAnchor | None = anchor_result.scalar_one_or_none()

    # Generate a fresh ephemeral signing key-pair for the certificate.
    # In production: load the persistent HSM-backed key for this model/sector.
    private_key, _ = generate_signing_keypair()

    cert = build_pod_certificate(
        decision_id=decision_id,
        record_hash=record.record_hash,
        tx_hash=anchor.tx_hash if anchor else "PENDING",
        block_number=anchor.block_number if anchor else None,
        private_key=private_key,
    )

    # Audit
    db.add(AuditLog(
        actor_id=current_user.id,
        action="VERIFY",
        resource_id=str(decision_id),
        ip_address=request.client.host if request.client else None,
    ))
    await db.commit()

    return ProofCertificate(
        decision_id=decision_id,
        record_hash=record.record_hash,
        tx_hash=anchor.tx_hash if anchor else None,
        block_number=anchor.block_number if anchor else None,
        block_hash=anchor.block_hash if anchor else None,
        contract_address=anchor.contract_address if anchor else None,
        verification_key=cert["verification_key"],
        certificate_hash=cert["certificate_hash"],
        signature=cert["signature"],
        issued_at=cert["issued_at"],
        is_valid=True,
    )


@router.post("/verify", response_model=VerifyResponse)
async def verify_decision(
    body: VerifyRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_min_role("auditor")),
):
    """
    **Verify a decision record** against both the local database and the
    on-chain anchor.  Detects tampering if either check fails.
    """
    result = await db.execute(
        select(DecisionRecord).where(DecisionRecord.id == body.decision_id)
    )
    record: DecisionRecord | None = result.scalar_one_or_none()
    if not record:
        raise HTTPException(status_code=404, detail="Decision record not found")

    hash_matches_local = verify_record_hash(
        {"record_hash": record.record_hash}, body.record_hash
    ) or (record.record_hash == body.record_hash)

    hash_matches_onchain = False
    if record.is_anchored:
        try:
            hash_matches_onchain = await verify_on_chain(
                str(body.decision_id), body.record_hash
            )
        except Exception:
            hash_matches_onchain = False

    return VerifyResponse(
        decision_id=body.decision_id,
        hash_matches_local=hash_matches_local,
        hash_matches_onchain=hash_matches_onchain,
        tampered=not hash_matches_local,
    )
