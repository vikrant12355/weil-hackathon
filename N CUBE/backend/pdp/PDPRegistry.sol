// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title PDPRegistry
 * @notice Proof-of-Decision Protocol — immutable on-chain registry for AI decision records.
 *
 * Each AI decision is anchored by storing its SHA-256 hash (bytes32) along with the
 * decision UUID (bytes32) and the block timestamp.  The hash was computed off-chain
 * over the canonicalised decision payload (see pdp/services/crypto.py).
 *
 * Deploy with:
 *   npx hardhat run scripts/deploy.js --network <network>
 * or
 *   forge create --rpc-url $RPC_URL --private-key $PK src/PDPRegistry.sol:PDPRegistry
 */
contract PDPRegistry {
    // ── Events ────────────────────────────────────────────────────────────────

    event DecisionLogged(
        bytes32 indexed decisionId,
        bytes32          recordHash,
        uint256          timestamp
    );

    // ── Storage ───────────────────────────────────────────────────────────────

    struct DecisionEntry {
        bytes32 recordHash;
        uint256 timestamp;
        address logger;
    }

    mapping(bytes32 => DecisionEntry) private _decisions;

    // Role-based write control (simplified — use OpenZeppelin AccessControl in production)
    mapping(address => bool) public authorisedLoggers;
    address public owner;

    // ── Constructor ───────────────────────────────────────────────────────────

    constructor() {
        owner = msg.sender;
        authorisedLoggers[msg.sender] = true;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    modifier onlyLogger() {
        require(authorisedLoggers[msg.sender], "Not an authorised logger");
        _;
    }

    // ── Write ─────────────────────────────────────────────────────────────────

    /**
     * @notice Anchor an AI decision record on-chain.
     * @param decisionId  32-byte representation of the off-chain UUID.
     * @param recordHash  SHA-256 digest of the canonicalised decision payload.
     */
    function logDecision(bytes32 decisionId, bytes32 recordHash) external onlyLogger {
        require(_decisions[decisionId].timestamp == 0, "Decision already logged");

        _decisions[decisionId] = DecisionEntry({
            recordHash: recordHash,
            timestamp:  block.timestamp,
            logger:     msg.sender
        });

        emit DecisionLogged(decisionId, recordHash, block.timestamp);
    }

    // ── Read ──────────────────────────────────────────────────────────────────

    /**
     * @notice Retrieve the anchored hash and timestamp for a decision.
     * @return recordHash  The SHA-256 hash stored on-chain.
     * @return timestamp   Unix timestamp of the anchoring block.
     */
    function getDecision(bytes32 decisionId)
        external
        view
        returns (bytes32 recordHash, uint256 timestamp)
    {
        DecisionEntry storage entry = _decisions[decisionId];
        return (entry.recordHash, entry.timestamp);
    }

    // ── Admin ─────────────────────────────────────────────────────────────────

    function addLogger(address logger) external onlyOwner {
        authorisedLoggers[logger] = true;
    }

    function removeLogger(address logger) external onlyOwner {
        authorisedLoggers[logger] = false;
    }
}
