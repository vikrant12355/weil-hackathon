"""
pdp/services/crypto.py
Cryptographic hashing engine — creates tamper-evident fingerprints for
AI decision records and issues Proof-of-Decision certificates.
"""
import hashlib
import hmac
import json
import uuid
from datetime import datetime, timezone
from typing import Any

from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.primitives.asymmetric import ec
from cryptography.hazmat.backends import default_backend

from pdp.config import settings


# ── Canonical serialisation ───────────────────────────────────────────────────

def _canonical_json(data: dict) -> bytes:
    """
    Produce a deterministic UTF-8 JSON bytes representation of *data*.
    Keys are sorted recursively so the same logical payload always yields
    the same byte string regardless of insertion order.
    """
    return json.dumps(data, sort_keys=True, separators=(",", ":"), default=str).encode("utf-8")


# ── Decision record hashing ───────────────────────────────────────────────────

def hash_decision_record(payload: dict) -> str:
    """
    Compute a SHA-256 hex digest of the canonical decision payload.

    The payload is canonicalised (sorted keys, no whitespace) before hashing,
    ensuring that any post-hoc field reordering or whitespace change is detected
    as a hash mismatch.

    Returns:
        64-character lowercase hex string (SHA-256 digest).
    """
    canonical = _canonical_json(payload)
    digest = hashlib.sha256(canonical).hexdigest()
    return digest


def verify_record_hash(payload: dict, expected_hash: str) -> bool:
    """
    Re-compute the hash of *payload* and compare to *expected_hash*.
    Returns True iff the record has not been tampered with.
    """
    return hmac.compare_digest(hash_decision_record(payload), expected_hash)


# ── ECDSA key management ──────────────────────────────────────────────────────

def generate_signing_keypair() -> tuple[ec.EllipticCurvePrivateKey, ec.EllipticCurvePublicKey]:
    """
    Generate a fresh NIST P-256 (secp256r1) key-pair.
    In production the private key should be stored in a secrets manager (HSM / Vault).
    """
    private_key = ec.generate_private_key(ec.SECP256R1(), default_backend())
    return private_key, private_key.public_key()


def export_public_key_pem(public_key: ec.EllipticCurvePublicKey) -> str:
    """Return PEM-encoded public key as a string."""
    return public_key.public_bytes(
        encoding=serialization.Encoding.PEM,
        format=serialization.PublicFormat.SubjectPublicKeyInfo,
    ).decode("utf-8")


# ── Proof-of-Decision certificate ────────────────────────────────────────────

def build_pod_certificate(
    decision_id: uuid.UUID,
    record_hash: str,
    tx_hash: str,
    block_number: int | None,
    private_key: ec.EllipticCurvePrivateKey,
) -> dict[str, Any]:
    """
    Assemble and ECDSA-sign a Proof-of-Decision (PoD) certificate.

    Certificate fields
    ------------------
    decision_id     : UUID of the off-chain decision record
    record_hash     : SHA-256 of the decision payload (tamper evidence)
    tx_hash         : Blockchain transaction hash (on-chain anchor)
    block_number    : Block height at time of anchoring (or null)
    issued_at       : ISO-8601 UTC timestamp of certificate issuance
    verification_key: PEM public key — used to verify the signature offline
    signature       : DER-encoded ECDSA signature over the certificate body

    Returns the complete certificate as a Python dict (JSON-serialisable).
    """
    body: dict[str, Any] = {
        "decision_id": str(decision_id),
        "record_hash": record_hash,
        "tx_hash": tx_hash,
        "block_number": block_number,
        "issued_at": datetime.now(timezone.utc).isoformat(),
        "verification_key": export_public_key_pem(private_key.public_key()),
    }

    # Sign the canonical representation of the certificate body
    body_bytes = _canonical_json(body)
    signature = private_key.sign(body_bytes, ec.ECDSA(hashes.SHA256()))

    return {
        **body,
        "signature": signature.hex(),
        "certificate_hash": hashlib.sha256(body_bytes).hexdigest(),
    }


def verify_pod_certificate(certificate: dict) -> bool:
    """
    Verify the ECDSA signature on a PoD certificate using the embedded
    verification_key.  Returns True iff the certificate is authentic.
    """
    try:
        # Reconstruct the signed body (everything except the signature fields)
        body = {k: v for k, v in certificate.items()
                if k not in ("signature", "certificate_hash")}
        body_bytes = _canonical_json(body)

        public_key = serialization.load_pem_public_key(
            certificate["verification_key"].encode("utf-8"),
            backend=default_backend(),
        )
        public_key.verify(
            bytes.fromhex(certificate["signature"]),
            body_bytes,
            ec.ECDSA(hashes.SHA256()),
        )
        return True
    except Exception:
        return False
