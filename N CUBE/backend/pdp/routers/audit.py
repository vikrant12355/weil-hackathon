"""
pdp/routers/audit.py
GET  /api/v1/audit           — query & filter past AI decisions
GET  /api/v1/audit/{id}      — retrieve a single decision with full detail
POST /api/v1/audit/export    — export decisions as JSON / CSV
"""
import csv
import io
import json
import uuid
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Query, Request
from fastapi.responses import StreamingResponse
from sqlalchemy import and_, func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from pdp.routers.auth import require_min_role


from pdp.database import get_db
from pdp.models import AuditLog, BlockchainAnchor, DecisionRecord, User
from pdp.schemas import AuditQueryResponse, DecisionSummary

router = APIRouter(prefix="/audit", tags=["Audit"])


def _apply_filters(stmt, model_id, sector, is_anchored, from_date, to_date):
    conditions = []
    if model_id:
        conditions.append(DecisionRecord.model_id == model_id)
    if sector:
        conditions.append(DecisionRecord.sector == sector)
    if is_anchored is not None:
        conditions.append(DecisionRecord.is_anchored == is_anchored)
    if from_date:
        conditions.append(DecisionRecord.captured_at >= from_date)
    if to_date:
        conditions.append(DecisionRecord.captured_at <= to_date)
    if conditions:
        stmt = stmt.where(and_(*conditions))
    return stmt


@router.get("", response_model=AuditQueryResponse)
async def query_decisions(
    request: Request,
    model_id: str | None = Query(None),
    sector: str | None = Query(None),
    is_anchored: bool | None = Query(None),
    from_date: datetime | None = Query(None),
    to_date: datetime | None = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_min_role("auditor")),
):
    """
    **Query past AI decisions** with optional filters.

    Supports pagination, date ranges, model/sector filtering, and anchoring status.
    Results include the blockchain tx_hash when the record has been anchored.
    """
    # Count query
    count_stmt = _apply_filters(
        select(func.count()).select_from(DecisionRecord),
        model_id, sector, is_anchored, from_date, to_date,
    )
    total = (await db.execute(count_stmt)).scalar_one()

    # Data query — eager-load anchor for tx_hash
    data_stmt = (
        _apply_filters(
            select(DecisionRecord).options(selectinload(DecisionRecord.anchor)),
            model_id, sector, is_anchored, from_date, to_date,
        )
        .order_by(DecisionRecord.captured_at.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
    )
    records = (await db.execute(data_stmt)).scalars().all()

    # Write audit log
    db.add(AuditLog(
        actor_id=current_user.id,
        action="QUERY",
        detail={"filters": {"model_id": model_id, "sector": sector, "page": page}},
        ip_address=request.client.host if request.client else None,
    ))
    await db.commit()

    summaries = [
        DecisionSummary(
            id=r.id,
            model_id=r.model_id,
            model_version=r.model_version,
            sector=r.sector,
            decision_label=r.decision_label,
            confidence_score=r.confidence_score,
            record_hash=r.record_hash,
            is_anchored=r.is_anchored,
            captured_at=r.captured_at,
            tx_hash=r.anchor.tx_hash if r.anchor else None,
        )
        for r in records
    ]

    return AuditQueryResponse(total=total, page=page, page_size=page_size, results=summaries)


@router.get("/{decision_id}")
async def get_decision_detail(
    decision_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_min_role("auditor")),
):
    """
    **Full detail view** of a single decision record, including the explanation
    payload (SHAP values etc.) and the full blockchain anchor metadata.
    """
    result = await db.execute(
        select(DecisionRecord)
        .options(selectinload(DecisionRecord.anchor))
        .where(DecisionRecord.id == decision_id)
    )
    record = result.scalar_one_or_none()
    if not record:
        raise HTTPException(status_code=404, detail="Decision not found")

    anchor = record.anchor
    return {
        "id":               str(record.id),
        "model_id":         record.model_id,
        "model_version":    record.model_version,
        "sector":           record.sector,
        "input_data":       record.input_data,
        "output_data":      record.output_data,
        "confidence_score": record.confidence_score,
        "decision_label":   record.decision_label,
        "explanation":      record.explanation,
        "record_hash":      record.record_hash,
        "is_anchored":      record.is_anchored,
        "captured_at":      record.captured_at.isoformat(),
        "event_timestamp":  record.event_timestamp.isoformat() if record.event_timestamp else None,
        "notes":            record.notes,
        "tags":             record.tags,
        "blockchain": {
            "tx_hash":          anchor.tx_hash if anchor else None,
            "block_number":     anchor.block_number if anchor else None,
            "block_hash":       anchor.block_hash if anchor else None,
            "contract_address": anchor.contract_address if anchor else None,
            "network":          anchor.network if anchor else None,
            "anchored_at":      anchor.anchored_at.isoformat() if anchor else None,
        },
    }


@router.get("/export/csv")
async def export_csv(
    model_id: str | None = Query(None),
    sector: str | None = Query(None),
    from_date: datetime | None = Query(None),
    to_date: datetime | None = Query(None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_min_role("auditor")),
):
    """Export filtered decisions as a streaming CSV file."""
    stmt = _apply_filters(
        select(DecisionRecord).options(selectinload(DecisionRecord.anchor)),
        model_id, sector, None, from_date, to_date,
    ).order_by(DecisionRecord.captured_at.desc())

    records = (await db.execute(stmt)).scalars().all()

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        "decision_id", "model_id", "model_version", "sector",
        "decision_label", "confidence_score", "record_hash",
        "is_anchored", "tx_hash", "captured_at",
    ])
    for r in records:
        writer.writerow([
            str(r.id), r.model_id, r.model_version, r.sector,
            r.decision_label, r.confidence_score, r.record_hash,
            r.is_anchored,
            r.anchor.tx_hash if r.anchor else "",
            r.captured_at.isoformat(),
        ])

    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=pdp_decisions.csv"},
    )
