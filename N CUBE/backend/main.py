"""PDP Backend — FastAPI application.

Endpoints bridge the N CUBE Next.js dashboard to WeilChain via the
WADK Python SDK.
"""

from __future__ import annotations

import logging
import os
from contextlib import asynccontextmanager
from typing import Optional

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from decision_store import DecisionStore
from models import (
    DecisionSubmitRequest,
    DecisionSubmitResponse,
    HealthResponse,
    ReviewApproveRequest,
    ReviewRejectRequest,
    ReviewResponse,
)
from weil_service import weil_service

load_dotenv()

logging.basicConfig(level=logging.INFO, format="%(asctime)s | %(name)s | %(levelname)s | %(message)s")
logger = logging.getLogger("pdp.main")

# ── Shared State ───────────────────────────────────────────────────────────────
store = DecisionStore()


# ── App Lifecycle ──────────────────────────────────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    key_path = os.getenv("PRIVATE_KEY_PATH")
    connected = await weil_service.init_wallet(key_path)
    mode = "LIVE (WeilChain)" if connected else "DEMO (in-memory only)"
    logger.info("PDP Backend started in %s mode", mode)
    yield
    # Shutdown
    await weil_service.close()
    logger.info("PDP Backend shut down.")


app = FastAPI(
    title="PDP Backend — Proof-of-Decision Protocol",
    version="0.1.0",
    lifespan=lifespan,
)

# CORS — allow the Next.js dev server
origins = os.getenv("CORS_ORIGINS", "http://localhost:3000").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Endpoints ──────────────────────────────────────────────────────────────────


@app.get("/api/health", response_model=HealthResponse)
async def health():
    return HealthResponse(
        status="ok",
        wallet_connected=not weil_service.is_demo,
        wallet_address=weil_service.wallet_address,
        sentinel_host=weil_service.sentinel_host,
        demo_mode=weil_service.is_demo,
    )


@app.post("/api/decisions/submit", response_model=DecisionSubmitResponse)
async def submit_decision(req: DecisionSubmitRequest):
    """Create a decision record and optionally record it on-chain."""

    # 1. Store locally
    record = store.create(
        agent=req.agent,
        confidence=req.confidence,
        reasoning=req.reasoning,
        input_data=req.input_data,
        decision_type=req.decision_type,
    )

    # 2. Attempt on-chain audit
    on_chain = False
    tx_info = await weil_service.audit_decision(
        {
            "type": "decision",
            "decision_id": record.id,
            "decision_hash": record.decision_hash,
            "agent": record.agent,
            "confidence": record.confidence,
            "reasoning": record.reasoning,
            "input_data": record.input_data,
            "decision_type": record.decision_type,
            "timestamp": record.timestamp,
        }
    )

    if tx_info is not None:
        store.update_on_chain(
            record.id,
            tx_hash=tx_info.get("txn_result", ""),
            block_height=tx_info.get("block_height"),
        )
        on_chain = True

    # Re-fetch after possible update
    record = store.get(record.id)

    return DecisionSubmitResponse(
        decision=record,
        on_chain=on_chain,
        message="Decision recorded on-chain." if on_chain else "Decision recorded locally (demo mode).",
    )


@app.get("/api/decisions/history")
async def decision_history():
    """Return all decisions newest-first."""
    return store.list_all()


@app.get("/api/decisions/verify/{decision_hash}")
async def verify_decision(decision_hash: str):
    """Check if a decision hash exists in the local ledger."""
    for d in store.list_all():
        if d.decision_hash == decision_hash:
            return {
                "found": True,
                "decision": d,
                "on_chain": d.tx_hash is not None,
            }
    return {"found": False}


@app.post("/api/review/approve", response_model=ReviewResponse)
async def approve_decision(req: ReviewApproveRequest):
    record = store.get(req.decision_id)
    if record is None:
        raise HTTPException(status_code=404, detail="Decision not found.")

    # On-chain audit of approval
    tx_info = await weil_service.audit_review(
        {
            "type": "review_approve",
            "decision_id": req.decision_id,
            "decision_hash": record.decision_hash,
            "reviewer_notes": req.reviewer_notes or "",
        }
    )

    store.approve(req.decision_id, req.reviewer_notes)

    tx_hash: Optional[str] = None
    if tx_info:
        tx_hash = tx_info.get("txn_result")
        store.update_on_chain(req.decision_id, tx_hash or "", tx_info.get("block_height"))

    return ReviewResponse(
        decision_id=req.decision_id,
        action="approved",
        on_chain=tx_info is not None,
        tx_hash=tx_hash,
        message="Decision approved" + (" and recorded on-chain." if tx_info else " (demo mode)."),
    )


@app.post("/api/review/reject", response_model=ReviewResponse)
async def reject_decision(req: ReviewRejectRequest):
    record = store.get(req.decision_id)
    if record is None:
        raise HTTPException(status_code=404, detail="Decision not found.")

    # On-chain audit of rejection
    tx_info = await weil_service.audit_review(
        {
            "type": "review_reject",
            "decision_id": req.decision_id,
            "decision_hash": record.decision_hash,
            "reason": req.reason,
        }
    )

    store.reject(req.decision_id, req.reason)

    tx_hash: Optional[str] = None
    if tx_info:
        tx_hash = tx_info.get("txn_result")

    return ReviewResponse(
        decision_id=req.decision_id,
        action="rejected",
        on_chain=tx_info is not None,
        tx_hash=tx_hash,
        message="Decision rejected" + (" and recorded on-chain." if tx_info else " (demo mode)."),
    )
