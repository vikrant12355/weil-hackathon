"""CUBE Decision Store — In-memory ledger for AI decisions.
"""

import time
import hashlib
import json
from typing import List, Dict, Any, Optional

class DecisionStore:
    def __init__(self):
        self.decisions: List[Dict[str, Any]] = []
        self._counter = 0
        self._seed_data()

    def _seed_data(self):
        """Initial historical data for the demo."""
        seeds = [
            ("Predict Health Trend", {"patient": "P-8291", "metric": "HRV"}, "Detected abnormal variance in heart rate variability over 48h.", 94.2),
            ("Analyze Genomic Sequence", {"req_id": "G-0012"}, "Alignment complete. Marker for type-2 sensitivity identified.", 98.8),
            ("Submit Audit Proof", {"batch": "B-990"}, "Synthesizing ZK-proof for shard batch #88291.", 99.1)
        ]
        for dtype, idata, reason, conf in seeds:
            self.add_decision(dtype, idata, reason, conf)
            # Mark some as confirmed with mock tx
            self.decisions[-1]["status"] = "confirmed"
            self.decisions[-1]["on_chain"] = {
                "tx_hash": f"0x{hashlib.sha256(str(time.time()).encode()).hexdigest()[:32]}",
                "block_height": 294300,
                "status": "Finalized"
            }

    def add_decision(self, decision_type: str, input_data: Any, reasoning: str, confidence: float) -> Dict[str, Any]:
        self._counter += 1
        decision_id = f"DEC-{int(time.time())}-{self._counter}"
        
        # Calculate consistency hash
        raw_content = f"{decision_type}|{json.dumps(input_data)}|{reasoning}|{confidence}"
        decision_hash = hashlib.sha256(raw_content.encode()).hexdigest()
        
        record = {
            "id": decision_id,
            "timestamp": time.time(),
            "decision_type": decision_type,
            "input_data": input_data,
            "reasoning": reasoning,
            "confidence": confidence,
            "decision_hash": decision_hash,
            "status": "pending",
            "on_chain": None
        }
        
        self.decisions.append(record)
        return record

    def update_on_chain(self, decision_id: str, audit_data: Dict[str, Any]):
        for d in self.decisions:
            if d["id"] == decision_id:
                d["on_chain"] = audit_data
                d["status"] = "confirmed"
                return d
        return None

    def get_all(self):
        return sorted(self.decisions, key=lambda x: x["timestamp"], reverse=True)

# Singleton
store = DecisionStore()
