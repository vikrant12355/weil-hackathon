"""In-memory decision store for the PDP Backend.

Keeps a local log of AI decisions alongside their on-chain transaction
references.  Can be swapped for SQLite / Postgres later.
"""

from __future__ import annotations

import hashlib
import json
import uuid
from datetime import datetime, timezone
from typing import Dict, List, Optional

from models import DecisionRecord, DecisionStatus


class DecisionStore:
    """Thread-safe (single-process) in-memory decision ledger."""

    def __init__(self) -> None:
        self._decisions: Dict[str, DecisionRecord] = {}

    # ── Helpers ────────────────────────────────────────────────────────────

    @staticmethod
    def _generate_id() -> str:
        return str(uuid.uuid4())

    @staticmethod
    def _hash_decision(data: dict) -> str:
        """SHA-256 hash of the canonical JSON representation."""
        canonical = json.dumps(data, sort_keys=True, separators=(",", ":"))
        return "0x" + hashlib.sha256(canonical.encode()).hexdigest()

    # ── CRUD ───────────────────────────────────────────────────────────────

    def create(
        self,
        agent: str,
        confidence: float,
        reasoning: str,
        input_data: str,
        decision_type: str,
    ) -> DecisionRecord:
        """Create a new decision record (initially PENDING)."""
        decision_id = self._generate_id()
        now = datetime.now(timezone.utc).isoformat()

        hash_payload = {
            "id": decision_id,
            "timestamp": now,
            "agent": agent,
            "confidence": confidence,
            "reasoning": reasoning,
            "input_data": input_data,
            "decision_type": decision_type,
        }

        record = DecisionRecord(
            id=decision_id,
            timestamp=now,
            agent=agent,
            confidence=confidence,
            reasoning=reasoning,
            input_data=input_data,
            decision_type=decision_type,
            decision_hash=self._hash_decision(hash_payload),
            status=DecisionStatus.PENDING,
        )
        self._decisions[decision_id] = record
        return record

    def get(self, decision_id: str) -> Optional[DecisionRecord]:
        return self._decisions.get(decision_id)

    def list_all(self) -> List[DecisionRecord]:
        """Return decisions newest-first."""
        return sorted(
            self._decisions.values(),
            key=lambda d: d.timestamp,
            reverse=True,
        )

    def update_on_chain(
        self,
        decision_id: str,
        tx_hash: str,
        block_height: Optional[int],
    ) -> Optional[DecisionRecord]:
        """Attach on-chain tx info and mark as CONFIRMED."""
        rec = self._decisions.get(decision_id)
        if rec is None:
            return None
        rec.tx_hash = tx_hash
        rec.block_height = block_height
        rec.status = DecisionStatus.CONFIRMED
        return rec

    def approve(
        self,
        decision_id: str,
        reviewer_notes: Optional[str] = None,
    ) -> Optional[DecisionRecord]:
        rec = self._decisions.get(decision_id)
        if rec is None:
            return None
        rec.status = DecisionStatus.CONFIRMED
        rec.human_signature = "approved"
        rec.reviewer_notes = reviewer_notes
        return rec

    def reject(
        self,
        decision_id: str,
        reason: str,
    ) -> Optional[DecisionRecord]:
        rec = self._decisions.get(decision_id)
        if rec is None:
            return None
        rec.status = DecisionStatus.REJECTED
        rec.human_signature = "rejected"
        rec.reviewer_notes = reason
        return rec
