"""
pdp/services/blockchain.py
Blockchain anchoring service — writes hashed decision records to an
Ethereum-compatible ledger via Web3.py.

The minimal ABI below targets a deployed PDP smart contract that exposes:
    logDecision(bytes32 decisionId, bytes32 recordHash)  → emits DecisionLogged
    getDecision(bytes32 decisionId)                       → (bytes32 hash, uint256 timestamp)

Drop-in replacements for Hyperledger Fabric or Polygon are straightforward
(swap the provider URL and update the ABI / method names).
"""
import logging
from typing import Optional

from web3 import AsyncWeb3
from web3.middleware import ExtraDataToPOAMiddleware
from web3.types import TxReceipt

from pdp.config import settings

logger = logging.getLogger(__name__)

# ── Minimal ABI for the PDP smart contract ────────────────────────────────────
PDP_CONTRACT_ABI = [
    {
        "name": "logDecision",
        "type": "function",
        "stateMutability": "nonpayable",
        "inputs": [
            {"name": "decisionId", "type": "bytes32"},
            {"name": "recordHash", "type": "bytes32"},
        ],
        "outputs": [],
    },
    {
        "name": "getDecision",
        "type": "function",
        "stateMutability": "view",
        "inputs": [{"name": "decisionId", "type": "bytes32"}],
        "outputs": [
            {"name": "recordHash", "type": "bytes32"},
            {"name": "timestamp",  "type": "uint256"},
        ],
    },
    {
        "name": "DecisionLogged",
        "type": "event",
        "inputs": [
            {"name": "decisionId", "type": "bytes32", "indexed": True},
            {"name": "recordHash", "type": "bytes32", "indexed": False},
            {"name": "timestamp",  "type": "uint256", "indexed": False},
        ],
    },
]


# ── Web3 client singleton ─────────────────────────────────────────────────────

def _build_w3() -> AsyncWeb3:
    w3 = AsyncWeb3(AsyncWeb3.AsyncHTTPProvider(settings.WEB3_PROVIDER_URI))
    # Required for PoA networks (Polygon, BSC, Goerli, Ganache)
    w3.middleware_onion.inject(ExtraDataToPOAMiddleware, layer=0)
    return w3


_w3: Optional[AsyncWeb3] = None


def get_w3() -> AsyncWeb3:
    global _w3
    if _w3 is None:
        _w3 = _build_w3()
    return _w3


# ── Core anchoring functions ──────────────────────────────────────────────────

def _to_bytes32(hex_str: str) -> bytes:
    """Convert a hex string (with or without 0x) to a 32-byte value."""
    raw = bytes.fromhex(hex_str.replace("0x", "").replace("-", ""))
    if len(raw) > 32:
        raise ValueError(f"Value exceeds 32 bytes: {hex_str!r}")
    return raw.rjust(32, b"\x00")   # left-pad with zeros


async def anchor_decision(decision_id: str, record_hash: str) -> dict:
    """
    Write a decision record hash to the blockchain.

    Parameters
    ----------
    decision_id : str
        UUID or any unique identifier for the decision (hex, no dashes).
    record_hash : str
        SHA-256 hex digest of the decision payload.

    Returns
    -------
    dict with keys: tx_hash, block_number, block_hash, contract_address
    """
    w3 = get_w3()

    if not await w3.is_connected():
        raise ConnectionError("Cannot connect to the Ethereum node.")

    contract = w3.eth.contract(
        address=AsyncWeb3.to_checksum_address(settings.CONTRACT_ADDRESS),
        abi=PDP_CONTRACT_ABI,
    )

    account = w3.eth.account.from_key(settings.DEPLOYER_PRIVATE_KEY)
    nonce = await w3.eth.get_transaction_count(account.address)
    gas_price = await w3.eth.gas_price

    # Build the transaction
    tx = await contract.functions.logDecision(
        _to_bytes32(decision_id.replace("-", "")),
        _to_bytes32(record_hash),
    ).build_transaction({
        "chainId": settings.CHAIN_ID,
        "from": account.address,
        "nonce": nonce,
        "gasPrice": gas_price,
    })

    # Estimate gas and add 20 % buffer
    estimated_gas = await w3.eth.estimate_gas(tx)
    tx["gas"] = int(estimated_gas * 1.2)

    # Sign & send
    signed = account.sign_transaction(tx)
    tx_hash = await w3.eth.send_raw_transaction(signed.raw_transaction)

    logger.info("Transaction sent: %s", tx_hash.hex())

    # Wait for inclusion (up to ~90 s)
    receipt: TxReceipt = await w3.eth.wait_for_transaction_receipt(tx_hash, timeout=90)

    if receipt["status"] != 1:
        raise RuntimeError(f"Transaction reverted: {tx_hash.hex()}")

    return {
        "tx_hash": tx_hash.hex(),
        "block_number": receipt["blockNumber"],
        "block_hash": receipt["blockHash"].hex(),
        "contract_address": settings.CONTRACT_ADDRESS,
    }


async def verify_on_chain(decision_id: str, expected_hash: str) -> bool:
    """
    Query the smart contract and confirm the on-chain hash matches the
    locally stored record_hash.
    """
    w3 = get_w3()
    contract = w3.eth.contract(
        address=AsyncWeb3.to_checksum_address(settings.CONTRACT_ADDRESS),
        abi=PDP_CONTRACT_ABI,
    )

    on_chain_hash, _ = await contract.functions.getDecision(
        _to_bytes32(decision_id.replace("-", ""))
    ).call()

    return on_chain_hash.hex() == expected_hash
