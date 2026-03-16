"""CUBE WeilChain Core — Official WADK Integration.

Handles wallet initialization, on-chain audits, and shard metrics.
"""

import sys
import json
import logging
from pathlib import Path
from typing import Optional, Dict, Any

logger = logging.getLogger("cube.core.weil")

# SDK Path Resolution
_WADK_DIR = Path(__file__).resolve().parent.parent.parent.parent / "wadk" / "adk" / "python"
for _p in (_WADK_DIR, _WADK_DIR / "weil_wallet", _WADK_DIR / "weil_ai"):
    _s = str(_p)
    if _s not in sys.path:
        sys.path.insert(0, _s)

class WeilConnector:
    def __init__(self):
        self.client = None
        self.wallet = None
        self.address = None
        self.demo_mode = True
        self.sentinel = "https://sentinel.unweil.me"

    async def initialize(self, key_path: Optional[str] = None):
        if not key_path:
            # Check local backend dir
            p = Path(__file__).resolve().parent.parent.parent / "private_key.wc"
            if p.exists():
                key_path = str(p)

        if not key_path:
            logger.warning("CUBE: Running in DEMO mode (no key)")
            self.demo_mode = True
            return

        try:
            from weil_wallet import PrivateKey, Wallet, WeilClient # type: ignore
            pk = PrivateKey.from_file(key_path)
            self.wallet = Wallet(pk)
            self.client = WeilClient(self.wallet, sentinel_host=self.sentinel)
            self.address = self.client.wallet_addr()
            self.demo_mode = False
            logger.info(f"CUBE: Connected to WeilChain - {self.address}")
        except Exception as e:
            logger.error(f"CUBE: Wallet init failed: {e}")
            self.demo_mode = True

    async def audit(self, data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        if self.demo_mode or not self.client:
            return None
        
        try:
            res = await self.client.audit(json.dumps(data))
            return {
                "tx_hash": res.txn_result,
                "block_height": res.block_height,
                "status": str(res.status)
            }
        except Exception as e:
            logger.error(f"CUBE: Audit failed: {e}")
            return None

    def get_status(self):
        return {
            "connected": not self.demo_mode,
            "address": self.address,
            "sentinel": self.sentinel,
            "mode": "Live" if not self.demo_mode else "Demo"
        }

# Singleton
connector = WeilConnector()
