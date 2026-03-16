"""MCP Server for the Proof-of-Decision Protocol.

Exposes AI-callable tools over the MCP (Model Context Protocol) transport
with wallet-verified authentication using the Weilliptic SDK.

Run:
    python mcp_server.py

Requires a private_key.wc file for on-chain operations.
Falls back to demo mode otherwise.
"""

import asyncio
import json
import logging
import sys
from pathlib import Path

# ── WADK SDK path ─────────────────────────────────────────────────────────────
_WADK_PYTHON_DIR = (
    Path(__file__).resolve().parent.parent.parent  # → BLOCKCHAIN/
    / "wadk"
    / "adk"
    / "python"
)
for _p in (_WADK_PYTHON_DIR, _WADK_PYTHON_DIR / "weil_wallet", _WADK_PYTHON_DIR / "weil_ai"):
    _str = str(_p)
    if _str not in sys.path:
        sys.path.insert(0, _str)

import uvicorn
from fastmcp import FastMCP

# Import after sys.path is set
from weil_service import weil_service

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("pdp.mcp_server")

# ── Decision Store (shared in-memory) ─────────────────────────────────────────
from decision_store import DecisionStore

store = DecisionStore()

# ── FastMCP Server ────────────────────────────────────────────────────────────
mcp = FastMCP("pdp-mcp-server")


@mcp.tool()
async def submit_decision(
    agent: str,
    confidence: float,
    reasoning: str,
    input_data: str,
    decision_type: str = "general",
) -> str:
    """Submit an AI decision for on-chain audit logging.

    Args:
        agent: Name of the AI agent (e.g. 'Cerebrum AI')
        confidence: Confidence score 0-100
        reasoning: The AI's reasoning trace
        input_data: The input that triggered the decision
        decision_type: Category of decision (default: 'general')

    Returns:
        JSON with the decision record and on-chain transaction info.
    """
    # Normalize confidence to 0-100 range
    if confidence <= 1.0:
        confidence = confidence * 100

    # Create local record
    record = store.create(
        agent=agent,
        confidence=confidence,
        reasoning=reasoning,
        input_data=input_data,
        decision_type=decision_type,
    )

    # Audit on-chain
    audit_data = {
        "type": "ai_decision",
        "id": record.id,
        "agent": agent,
        "confidence": confidence,
        "decision_hash": record.decision_hash,
        "decision_type": decision_type,
        "timestamp": record.timestamp,
    }
    tx_info = await weil_service.audit_decision(audit_data)

    if tx_info:
        store.update_on_chain(
            record.id,
            tx_hash=tx_info.get("txn_result", ""),
            block_height=tx_info.get("block_height"),
        )

    return json.dumps({
        "decision": record.model_dump(),
        "on_chain": tx_info is not None,
        "tx_info": tx_info,
        "message": "Decision recorded and audited on WeilChain." if tx_info else "Decision recorded (demo mode).",
    }, default=str)


@mcp.tool()
async def query_decisions(limit: int = 20) -> str:
    """Query recent decision history.

    Args:
        limit: Max number of decisions to return (default: 20)

    Returns:
        JSON array of decision records.
    """
    decisions = store.list_all()[:limit]
    return json.dumps([d.model_dump() for d in decisions], default=str)


@mcp.tool()
async def verify_decision(decision_id: str) -> str:
    """Verify a specific decision by its ID.

    Args:
        decision_id: The UUID of the decision to verify

    Returns:
        JSON with the decision record and verification status.
    """
    record = store.get(decision_id)
    if record is None:
        return json.dumps({"error": "Decision not found", "decision_id": decision_id})

    return json.dumps({
        "decision": record.model_dump(),
        "verified": record.status.value == "Confirmed",
        "on_chain": record.tx_hash is not None,
    }, default=str)


@mcp.tool()
async def approve_decision(decision_id: str, reviewer_notes: str = "") -> str:
    """Approve a pending decision (human-in-the-loop review).

    Args:
        decision_id: The UUID of the decision to approve
        reviewer_notes: Optional reviewer notes

    Returns:
        JSON with the updated decision and on-chain audit info.
    """
    record = store.approve(decision_id, reviewer_notes or None)
    if record is None:
        return json.dumps({"error": "Decision not found", "decision_id": decision_id})

    # Audit the review on-chain
    review_data = {
        "type": "human_review",
        "action": "approved",
        "decision_id": decision_id,
        "decision_hash": record.decision_hash,
        "reviewer_notes": reviewer_notes,
    }
    tx_info = await weil_service.audit_review(review_data)

    return json.dumps({
        "decision_id": decision_id,
        "action": "approved",
        "on_chain": tx_info is not None,
        "tx_info": tx_info,
        "message": "Decision approved and audited on-chain." if tx_info else "Decision approved (demo mode).",
    }, default=str)


@mcp.tool()
async def reject_decision(decision_id: str, reason: str) -> str:
    """Reject a pending decision (human-in-the-loop review).

    Args:
        decision_id: The UUID of the decision to reject
        reason: Reason for rejection

    Returns:
        JSON with the updated decision and on-chain audit info.
    """
    record = store.reject(decision_id, reason)
    if record is None:
        return json.dumps({"error": "Decision not found", "decision_id": decision_id})

    review_data = {
        "type": "human_review",
        "action": "rejected",
        "decision_id": decision_id,
        "decision_hash": record.decision_hash,
        "reason": reason,
    }
    tx_info = await weil_service.audit_review(review_data)

    return json.dumps({
        "decision_id": decision_id,
        "action": "rejected",
        "on_chain": tx_info is not None,
        "tx_info": tx_info,
        "message": "Decision rejected and audited on-chain." if tx_info else "Decision rejected (demo mode).",
    }, default=str)


@mcp.tool()
async def get_health() -> str:
    """Get backend and WeilChain health status.

    Returns:
        JSON with service, wallet, and chain status.
    """
    info = weil_service.health_info()
    info["mcp_server"] = True
    info["service"] = "PDP MCP Server"
    return json.dumps(info)


# ── Build ASGI app ────────────────────────────────────────────────────────────
app = mcp.http_app(transport="streamable-http")

# Add Weil wallet-verified auth middleware
try:
    from weil_ai.mcp import weil_middleware
    app.add_middleware(weil_middleware())
    logger.info("Weil auth middleware added to MCP server")
except ImportError:
    logger.warning("weil_ai not available — MCP server running without auth middleware")
except Exception as e:
    logger.warning("Could not load weil_middleware: %s — running without auth", e)


# ── Startup/shutdown hooks ────────────────────────────────────────────────────
@app.on_event("startup")
async def startup():
    connected = await weil_service.init_wallet()
    if connected:
        logger.info("MCP Server: WeilChain connected — wallet: %s", weil_service.wallet_address)
    else:
        logger.info("MCP Server: Running in DEMO mode (no private_key.wc found)")


@app.on_event("shutdown")
async def shutdown():
    await weil_service.close()
    logger.info("MCP Server shut down")


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8001)
