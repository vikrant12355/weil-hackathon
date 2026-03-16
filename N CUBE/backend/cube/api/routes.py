"""CUBE API Routes — Serving the high-fidelity CUBE views.
"""

from fastapi import APIRouter
from pydantic import BaseModel
from typing import Dict, Any, List
from cube.core.weil import connector
from cube.core.metrics import MetricsEngine
from cube.core.store import store

router = APIRouter(prefix="/api/cube")
metrics_engine = MetricsEngine(connector)

class DecisionSubmitRequest(BaseModel):
    decision_type: str
    input_data: Dict[str, Any]
    reasoning: str
    confidence: float

@router.get("/health")
async def get_health():
    return connector.get_status()

@router.get("/metrics")
async def get_metrics():
    """Real-time metrics for IntegrityView."""
    return metrics_engine.get_integrity_metrics()

@router.get("/network")
async def get_network():
    """Real-time network stats for NetworkView."""
    return metrics_engine.get_network_stats()

@router.post("/submit")
async def submit_decision(req: DecisionSubmitRequest):
    """Submit a decision and audit it on-chain via WADK."""
    # 1. Store locally
    record = store.add_decision(
        req.decision_type, 
        req.input_data, 
        req.reasoning, 
        req.confidence
    )
    
    # 2. Audit on-chain
    audit_res = await connector.audit(record)
    if audit_res:
        record = store.update_on_chain(record["id"], audit_res)
        
    return {
        "decision": record,
        "on_chain": record["on_chain"]
    }

@router.get("/decisions")
async def get_decisions():
    """Get all historical decisions."""
    return store.get_all()

@router.get("/config")
async def get_config():
    """System configuration for SettingsView."""
    return {
        "sentinel_host": connector.sentinel,
        "demo_mode": connector.demo_mode,
        "wallet_address": connector.address,
        "version": "1.0.0-CUBE",
        "features": ["on-chain-audit", "mcp-server", "integrity-monitor"]
    }

# Legacy bridges (for existing frontend calls)
@router.get("/legacy/health")
async def legacy_health():
    status = connector.get_status()
    return {
        "status": "ok",
        "wallet_connected": status["connected"],
        "wallet_address": status["address"],
        "sentinel_host": status["sentinel"],
        "demo_mode": status["connected"] is False
    }
