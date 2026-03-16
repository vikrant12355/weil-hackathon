"""
main.py
Entry point for the Proof-of-Decision Protocol (PDP) FastAPI backend.

Run:
    uvicorn main:app --reload --port 8000
"""
import logging
import sys
from pathlib import Path

import structlog
from fastapi import FastAPI, Request, status, Depends

from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from pdp.config import settings
from pdp.database import Base, engine, get_db

from pdp.routers import auth, audit, capture, proof
from pdp.schemas import CaptureRequest, CaptureResponse, DecisionSummary, AuditQueryResponse
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from pdp.models import DecisionRecord

# Import WeilService singleton
_BACKEND_DIR = Path(__file__).resolve().parent.parent
if str(_BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(_BACKEND_DIR))

from weil_service import weil_service



# ── Logging ───────────────────────────────────────────────────────────────────
logging.basicConfig(level=logging.INFO)
structlog.configure(
    processors=[
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.dev.ConsoleRenderer(),
    ]
)
logger = structlog.get_logger()


# ── Application factory ───────────────────────────────────────────────────────

def create_app() -> FastAPI:
    app = FastAPI(
        title="Proof-of-Decision Protocol (PDP)",
        description=(
            "Tamper-proof trust infrastructure for autonomous AI — records, verifies, "
            "and audits every AI decision on an immutable blockchain ledger."
        ),
        version="1.0.0",
        docs_url="/docs",
        redoc_url="/redoc",
        openapi_tags=[
            {"name": "Auth",    "description": "Authentication and user management"},
            {"name": "Capture", "description": "AI decision event ingestion"},
            {"name": "Proof",   "description": "Proof-of-Decision certificate issuance & verification"},
            {"name": "Audit",   "description": "Query, inspect, and export decision records"},
        ],
    )

    @app.middleware("http")
    async def log_requests(request: Request, call_next):
        logger.info(f"Incoming {request.method} {request.url}")
        response = await call_next(request)
        return response

    # CORS will be added last to ensure it's the outermost middleware





    # ── Routers ───────────────────────────────────────────────────────────────
    PREFIX = "/api/v1"
    app.include_router(auth.router,    prefix=PREFIX)
    app.include_router(capture.router, prefix=PREFIX)
    app.include_router(proof.router,   prefix=PREFIX)
    app.include_router(audit.router,   prefix=PREFIX)

    # ── Startup / shutdown ────────────────────────────────────────────────────
    @app.on_event("startup")
    async def startup():
        logger.info("PDP backend starting", env=settings.APP_ENV)
        # Auto-create tables (use Alembic migrations in production)
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)

        # Create default admin user if none exists
        from sqlalchemy.ext.asyncio import AsyncSession
        from sqlalchemy.orm import sessionmaker
        async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
        async with async_session() as session:
            from pdp.models import User
            from pdp.routers.auth import hash_password
            result = await session.execute(select(User).where(User.username == "admin"))
            if not result.scalar_one_or_none():
                admin = User(
                    username="admin",
                    email="admin@example.com",
                    hashed_password=hash_password("admin123"), # Change in production
                    role="admin"
                )
                session.add(admin)
                await session.commit()
                logger.info("Default admin user created")
        logger.info("Database tables verified / created")

        # Initialize WeilChain wallet
        connected = await weil_service.init_wallet()
        if connected:
            logger.info("WeilChain connected", wallet=weil_service.wallet_address)
        else:
            logger.info("WeilChain running in DEMO mode")


    @app.on_event("shutdown")
    async def shutdown():
        await weil_service.close()
        await engine.dispose()
        logger.info("PDP backend shut down cleanly")

    # ── Health check ──────────────────────────────────────────────────────────
    @app.get("/health", tags=["Health"])
    async def health():
        info = weil_service.health_info()
        info["service"] = "PDP"
        info["version"] = "1.0.0"
        return info

    # ── Legacy Routes for Frontend Compatibility ──────────────────────────────
    @app.get("/api/health", tags=["Legacy"])
    async def legacy_health():
        return weil_service.health_info()

    @app.post("/api/decisions/submit", tags=["Legacy"])
    async def legacy_submit(
        payload: dict,
        request: Request,
        db: AsyncSession = Depends(get_db),
    ):
        # Adapter to convert legacy payload to CaptureRequest
        conf = payload.get("confidence", 0.0)
        if conf > 1.0:
            conf = conf / 100.0

        new_payload = CaptureRequest(
            model_id=payload.get("agent", "legacy-agent"),
            model_version="1.0.0",
            input_data={"raw": payload.get("input_data", "")},
            output_data={"reasoning": payload.get("reasoning", "")},
            confidence_score=conf,
            decision_label=payload.get("decision_type", "UNKNOWN")
        )

        # We need a user for capture.router, but for legacy we'll mock or bypass
        from pdp.models import User
        import uuid
        # Find or create a legacy user
        result = await db.execute(select(User).where(User.username == "legacy_user"))
        mock_user = result.scalar_one_or_none()
        if not mock_user:
            mock_user = User(id=uuid.uuid4(), username="legacy_user", role="admin", email="legacy@example.com", hashed_password="hashed")
            db.add(mock_user)
            await db.commit()
            await db.refresh(mock_user)

        from fastapi import BackgroundTasks
        captured = await capture.capture_decision(new_payload, BackgroundTasks(), request, db, mock_user)

        # Audit decision on WeilChain
        audit_data = {
            "type": "ai_decision",
            "id": str(captured.id),
            "agent": new_payload.model_id,
            "confidence": conf,
            "decision_hash": captured.record_hash,
            "decision_type": new_payload.decision_label,
        }
        tx_info = await weil_service.audit_decision(audit_data)

        on_chain = tx_info is not None
        tx_hash = tx_info.get("txn_result") if tx_info else None
        block_height = tx_info.get("block_height") if tx_info else None

        # Map back to legacy DecisionRecord format
        return {
            "decision": {
                "id": str(captured.id),
                "timestamp": captured.captured_at.isoformat(),
                "agent": new_payload.model_id,
                "confidence": new_payload.confidence_score,
                "reasoning": payload.get("reasoning", ""),
                "input_data": payload.get("input_data", ""),
                "decision_type": new_payload.decision_label,
                "decision_hash": captured.record_hash,
                "tx_hash": tx_hash,
                "block_height": block_height,
                "status": "Confirmed" if on_chain else "Pending",
                "human_signature": None,
                "reviewer_notes": None,
            },
            "on_chain": on_chain,
            "message": "Decision recorded and audited on WeilChain." if on_chain else "Decision recorded (demo mode)."
        }


    @app.get("/api/decisions/history", tags=["Legacy"])
    async def legacy_history(db: AsyncSession = Depends(get_db)):
        stmt = (
            select(DecisionRecord)
            .options(selectinload(DecisionRecord.anchor))
            .order_by(DecisionRecord.captured_at.desc())
            .limit(100)
        )
        records = (await db.execute(stmt)).scalars().all()
        return [
            {
                "id": str(r.id),
                "timestamp": r.captured_at.isoformat(),
                "agent": r.model_id,
                "confidence": r.confidence_score,
                "reasoning": r.output_data.get("reasoning", ""),
                "input_data": r.input_data.get("raw", ""),
                "decision_type": r.decision_label,
                "decision_hash": r.record_hash,
                "tx_hash": r.anchor.tx_hash if r.anchor else None,
                "block_height": r.anchor.block_number if r.anchor else None,
                "status": "Confirmed" if r.is_anchored else "Pending",
                "human_signature": None,
                "reviewer_notes": r.notes,
            }
            for r in records
        ]




    @app.exception_handler(Exception)
    async def global_exception_handler(request: Request, exc: Exception):
        # Use repr(exc) and a safe string to avoid encoding crashes on Windows console
        try:
            error_msg = str(exc)
        except UnicodeEncodeError:
            error_msg = repr(exc)
        
        logger.error("Unhandled exception", error=error_msg, path=request.url.path)
        return JSONResponse(
            status_code=500,
            content={"detail": "Internal server error", "error": error_msg},
        )


    # ── CORS (Outer Middleware) ───────────────────────────────────────────────
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=False,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    return app



app = create_app()
