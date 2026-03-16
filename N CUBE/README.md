# N CUBE - Proof-of-Decision Dashboard

N CUBE is a state-of-the-art dashboard and backend system for the **Proof-of-Decision Protocol (PDP)**. It provides a secure, on-chain audit trail for AI-driven decisions and human-in-the-loop reviews, powered by **WeilChain**.

## 🚀 Key Features

- **AI Decision Tracking**: Real-time logging of AI agent decisions with confidence scores and reasoning.
- **On-Chain Auditing**: Every decision and review is cryptographically hashed and recorded on WeilChain using the **WADK SDK**.
- **Human-in-the-Loop**: A premium Next.js interface for reviewers to approve or reject AI actions.
- **MCP Integration**: Exposes decision tools via the **Model Context Protocol** (FastMCP) for seamless AI integration.
- **Wallet-Verified Auth**: Secure interactions using Weilliptic wallet signatures.

## 🛠 Tech Stack

### Backend
- **FastAPI**: High-performance web framework for the core API.
- **FastMCP**: Integration with the Model Context Protocol.
- **SQLAlchemy & aiosqlite**: Async database management.
- **WADK (Weil ADK)**: Direct integration with WeilChain for on-chain audits and wallet management.

### Frontend
- **Next.js 14**: Modern React framework for the dashboard.
- **Framer Motion**: Premium animations and micro-interactions.
- **Tailwind CSS**: Responsive, sleek UI design.
- **Lucide React**: Beautiful, consistent iconography.

## 📦 Getting Started

### Prerequisites
- Python 3.10+
- Node.js 18+
- A `private_key.wc` file (required for on-chain operations; falls back to demo mode otherwise).

### Backend Setup
1. Navigate to `backend/`.
2. Install dependencies: `pip install -r requirements.txt`.
3. Run the MCP server: `python mcp_server.py`.
   - The server runs on `http://localhost:8001`.

### Frontend Setup
1. Navigate to `dapp/`.
2. Install dependencies: `npm install`.
3. Start the development server: `npm run dev`.
   - The dashboard will be available at `http://localhost:3000`.

## 📜 License
This project is part of the Weil Hackathon.
