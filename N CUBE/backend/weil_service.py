"""WeilService — Bridge between the PDP backend and WeilChain.

Uses the official WADK Python SDK (weil_wallet + weil_ai) for:
  - Wallet initialisation and lifecycle management
  - On-chain audit logging via WeilClient.audit()
  - Contract execution via WeilClient.execute()
  - Auth header generation for MCP transports

Falls back to demo mode when no private key is available.
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
    """Manages wallet initialisation and all on-chain interactions."""

    def __init__(self) -> None:
        self._wallet = None
        self._client = None          # WeilClient (persistent, NOT context-managed per request)
        self._wallet_address: Optional[str] = None
        self._demo_mode: bool = True
        self._sentinel_host: str = "https://sentinel.unweil.me"
        self._key_path: Optional[str] = None

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
            self._client = WeilClient(
                self._wallet,
                sentinel_host=self._sentinel_host,
            )
            self._wallet_address = self._client.wallet_addr()
            self._key_path = key_path
            self._demo_mode = False

            # Pre-resolve the audit applet address
            try:
                await self._client._get_audit_contract_id()
                logger.info(
                    "Wallet loaded — address: %s, audit applet resolved",
                    self._wallet_address,
                )
            except Exception as exc:
                logger.warning("Audit applet resolution failed: %s (will retry on use)", exc)

            logger.info(
                "WeilChain connected — address: %s, key: %s",
                self._wallet_address,
                key_path,
            )
            return True

        except Exception as exc:
            logger.error("Failed to load wallet: %s — falling back to demo mode", exc)
            self._demo_mode = True
            return False

    async def close(self) -> None:
        """Shut down the HTTP client cleanly."""
        if self._client is not None:
            await self._client.close()
            self._client = None
            logger.info("WeilClient closed")

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

    @property
    def wallet(self):
        """Return the raw weil_wallet.Wallet for signing (used by MCP auth)."""
        return self._wallet

    # ── On-chain audit operations ──────────────────────────────────────────

    async def audit_decision(self, decision_data: dict) -> Optional[dict]:
        """Submit a decision audit log to WeilChain via client.audit().

        Returns a dict with tx info on success, or None in demo mode.
        """
        if self._demo_mode or self._client is None:
            logger.info("[DEMO] Would audit decision: %s", json.dumps(decision_data)[:200])
            return None

        try:
            log_entry = json.dumps(decision_data, sort_keys=True)
            result = await self._client.audit(log_entry)

            tx_info = {
                "status": str(result.status),
                "block_height": result.block_height,
                "batch_id": result.batch_id,
                "tx_idx": result.tx_idx,
                "txn_result": result.txn_result,
                "creation_time": result.creation_time,
            }
            logger.info(
                "Decision audited on-chain — block: %s, status: %s",
                result.block_height,
                result.status,
            )
            return tx_info

        except Exception as exc:
            logger.error("On-chain audit failed: %s", exc)
            return None

    async def audit_review(self, review_data: dict) -> Optional[dict]:
        """Submit a human review action (approve/reject) on-chain."""
        if self._demo_mode or self._client is None:
            logger.info("[DEMO] Would audit review: %s", json.dumps(review_data)[:200])
            return None

        try:
            log_entry = json.dumps(review_data, sort_keys=True)
            result = await self._client.audit(log_entry)

            tx_info = {
                "status": str(result.status),
                "block_height": result.block_height,
                "batch_id": result.batch_id,
                "txn_result": result.txn_result,
            }
            logger.info(
                "Review audited on-chain — block: %s, status: %s",
                result.block_height,
                result.status,
            )
            return tx_info

        except Exception as exc:
            logger.error("On-chain review audit failed: %s", exc)
            return None

    # ── Contract execution ─────────────────────────────────────────────────

    async def execute_contract(
        self,
        contract_address: str,
        method_name: str,
        method_args: str,
        should_hide_args: bool = True,
        is_non_blocking: bool = False,
    ) -> Optional[dict]:
        """Execute an arbitrary contract method on WeilChain."""
        if self._demo_mode or self._client is None:
            logger.info("[DEMO] Would execute %s.%s", contract_address, method_name)
            return None

        try:
            from weil_wallet import ContractId  # type: ignore

            cid = ContractId(contract_address)
            result = await self._client.execute(
                cid,
                method_name,
                method_args,
                should_hide_args,
                is_non_blocking,
            )

            return {
                "status": str(result.status),
                "block_height": result.block_height,
                "batch_id": result.batch_id,
                "tx_idx": result.tx_idx,
                "txn_result": result.txn_result,
                "creation_time": result.creation_time,
            }

        except Exception as exc:
            logger.error("Contract execution failed: %s", exc)
            return None

    # ── Auth helpers ───────────────────────────────────────────────────────

    def get_auth_headers(self) -> Optional[dict]:
        """Build signed auth headers for MCP transports.

        Returns None in demo mode.
        """
        if self._demo_mode or self._wallet is None:
            return None

        try:
            from weil_ai import build_auth_headers  # type: ignore
            return build_auth_headers(self._wallet)
        except Exception as exc:
            logger.error("Failed to build auth headers: %s", exc)
            return None

    # ── Health ─────────────────────────────────────────────────────────────

    def health_info(self) -> dict:
        """Return a health payload for the /health endpoint."""
        return {
            "status": "ok",
            "wallet_connected": not self._demo_mode,
            "wallet_address": self._wallet_address,
            "sentinel_host": self._sentinel_host,
            "demo_mode": self._demo_mode,
        }


# Singleton
weil_service = WeilService()
