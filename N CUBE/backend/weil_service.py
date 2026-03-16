"""WeilService — Bridge between the PDP backend and WeilChain.

Wraps `weil_wallet.WeilClient` so the rest of the app never touches
the SDK directly.  Falls back to demo mode when no private key is
available.
"""

from __future__ import annotations

import json
import logging
import sys
from pathlib import Path
from typing import Optional

logger = logging.getLogger("pdp.weil_service")

# ── Resolve the WADK SDK path ──────────────────────────────────────────────────
# The weil_wallet / weil_ai packages live in the cloned WADK repo.
# We add them to sys.path so they can be imported without pip-installing.
_WADK_PYTHON_DIR = (
    Path(__file__).resolve().parent.parent.parent  # → BLOCKCHAIN/
    / "wadk"
    / "adk"
    / "python"
)

# Add both the python dir and the individual package dirs
for _p in (_WADK_PYTHON_DIR, _WADK_PYTHON_DIR / "weil_wallet", _WADK_PYTHON_DIR / "weil_ai"):
    _str = str(_p)
    if _str not in sys.path:
        sys.path.insert(0, _str)


class WeilService:
    """Manages wallet initialisation and on-chain interactions."""

    def __init__(self) -> None:
        self._wallet = None
        self._client = None
        self._wallet_address: Optional[str] = None
        self._demo_mode: bool = True
        self._sentinel_host: str = "https://sentinel.unweil.me"

    # ── Lifecycle ──────────────────────────────────────────────────────────

    async def init_wallet(self, key_path: Optional[str] = None) -> bool:
        """Try to load a private key and connect to WeilChain.

        Returns True if real chain mode is active, False for demo mode.
        """
        if key_path is None:
            # Search common locations
            candidates = [
                Path(__file__).parent / "private_key.wc",
                Path.cwd() / "private_key.wc",
                _WADK_PYTHON_DIR / "private_key.wc",
                _WADK_PYTHON_DIR / "examples" / "private_key.wc",
            ]
            for c in candidates:
                if c.is_file():
                    key_path = str(c)
                    break

        if key_path is None:
            logger.warning("No private_key.wc found — running in DEMO mode.")
            self._demo_mode = True
            return False

        try:
            from weil_wallet import PrivateKey, Wallet, WeilClient  # type: ignore

            pk = PrivateKey.from_file(key_path)
            self._wallet = Wallet(pk)
            self._client = WeilClient(self._wallet, sentinel_host=self._sentinel_host)
            self._wallet_address = self._client.wallet_addr()
            self._demo_mode = False
            logger.info("Wallet loaded from %s — address: %s", key_path, self._wallet_address)
            return True
        except Exception as exc:
            logger.error("Failed to load wallet: %s — falling back to demo mode", exc)
            self._demo_mode = True
            return False

    async def close(self) -> None:
        if self._client is not None:
            await self._client.close()

    # ── Properties ─────────────────────────────────────────────────────────

    @property
    def is_demo(self) -> bool:
        return self._demo_mode

    @property
    def wallet_address(self) -> Optional[str]:
        return self._wallet_address

    @property
    def sentinel_host(self) -> str:
        return self._sentinel_host

    # ── On-chain operations ────────────────────────────────────────────────

    async def audit_decision(self, decision_data: dict) -> Optional[dict]:
        """Submit a decision audit log to WeilChain.

        Returns a dict with tx info on success, or None in demo mode.
        """
        if self._demo_mode or self._client is None:
            logger.info("[DEMO] Would audit: %s", json.dumps(decision_data)[:120])
            return None

        try:
            log_entry = json.dumps(decision_data, sort_keys=True)

            async with self._client as client:
                result = await client.audit(log_entry)

            return {
                "status": str(result.status),
                "block_height": result.block_height,
                "batch_id": result.batch_id,
                "tx_idx": result.tx_idx,
                "txn_result": result.txn_result,
                "creation_time": result.creation_time,
            }
        except Exception as exc:
            logger.error("On-chain audit failed: %s", exc)
            return None

    async def audit_review(self, review_data: dict) -> Optional[dict]:
        """Submit a human review action (approve/reject) on-chain."""
        if self._demo_mode or self._client is None:
            logger.info("[DEMO] Would audit review: %s", json.dumps(review_data)[:120])
            return None

        try:
            log_entry = json.dumps(review_data, sort_keys=True)

            async with self._client as client:
                result = await client.audit(log_entry)

            return {
                "status": str(result.status),
                "block_height": result.block_height,
                "txn_result": result.txn_result,
            }
        except Exception as exc:
            logger.error("On-chain review audit failed: %s", exc)
            return None


# Singleton
weil_service = WeilService()
