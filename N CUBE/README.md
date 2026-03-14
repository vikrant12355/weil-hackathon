# N CUBE — Proof-of-Decision Protocol (PDP)

## Team Name
**N CUBE**

## Hackathon
Xpecto Weilliptic Hackathon 2026, IIT Mandi

---

## Project Title
**Glass Box AI Audit Dashboard — Proof-of-Decision Protocol (PDP)**

---

## Problem Statement

Autonomous AI systems are making critical decisions in healthcare, defense, and cybersecurity—yet they operate as **black boxes**. There is no transparent record of:

- **Why** a decision was made
- **What data** influenced it
- **Whether** it was tampered with after the fact

---

## Our Solution

The **Proof-of-Decision Protocol (PDP)** is a transparency and auditability layer for autonomous AI systems. Every AI decision is:

1. **Streamed live** via a real-time reasoning monitor
2. **Digested** into an auditable decision summary with a cryptographic hash
3. **Subject to Human-in-the-Loop (HITL) review** when confidence is below 90%
4. **Recorded on-chain** using SHA256-inspired block chaining simulation (PDP Chain)

---

## System Architecture

```
AI Layer
  └── Generates reasoning events + confidence scores

Audit Layer
  └── Captures trace, metadata, and decision hash

Blockchain Layer (Simulated PDP Chain)
  └── Stores tamper-proof hashes in linked block structure

Human Oversight Layer
  └── Allows approve / reject with digital signature simulation
```

---

## Features

| Feature | Component |
|---|---|
| Live AI Reasoning Stream | `LiveDecisionStream.tsx` |
| Decision Digest Panel | `DecisionDigestCard.tsx` |
| Human-in-the-Loop Modal | `HumanReviewModal.tsx` |
| On-Chain Verification History | `BlockchainAuditHistory.tsx` |
| Blockchain Simulation Utility | `utils/blockchain.ts` |

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS |
| Animations | Framer Motion |
| Icons | Lucide React |
| Blockchain | SHA256-inspired sequential block hashing (pure JS simulation) |

---

## How to Run

```bash
# 1. Navigate to the dapp folder
cd dapp

# 2. Install dependencies
npm install

# 3. Start development server
npm run dev

# 4. Open in browser
# http://localhost:3000
```

---

## Folder Structure

```
N CUBE/
├── README.md              ← This file
└── dapp/                  ← Next.js dashboard app
    ├── src/
    │   ├── app/
    │   │   ├── page.tsx            (Dashboard layout)
    │   │   └── globals.css
    │   ├── components/
    │   │   ├── LiveDecisionStream.tsx
    │   │   ├── DecisionDigestCard.tsx
    │   │   ├── HumanReviewModal.tsx
    │   │   └── BlockchainAuditHistory.tsx
    │   └── utils/
    │       └── blockchain.ts       (Block simulation logic)
    ├── package.json
    ├── tailwind.config.ts
    └── tsconfig.json
```

---

## Future Work

- Connect to a real Ethereum / Polygon testnet via Weil Wallet SDK
- Live WebSocket server for true real-time AI agent feeds
- IPFS-backed decision trace archive
- Multi-agent support (multiple AI node streams simultaneously)
