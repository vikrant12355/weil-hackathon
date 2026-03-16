/**
 * API Client — centralized fetch wrapper for the CUBE Demo backend.
 *
 * All requests are routed to the unified CUBE backend on port 8010.
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8010";

// ── Types ──────────────────────────────────────────────────────────────────────

export interface DecisionRecord {
  id: string;
  timestamp: number;
  decision_type: string;
  input_data: any;
  reasoning: string;
  confidence: number;
  decision_hash: string;
  status: string;
  on_chain: {
    tx_hash: string;
    block_height: number;
    status: string;
  } | null;
}

export interface DecisionSubmitResponse {
  decision: DecisionRecord;
  on_chain: any;
}

export interface HealthResponse {
  status: string;
  wallet_connected: boolean;
  wallet_address: string | null;
  sentinel_host: string;
  demo_mode: boolean;
}

// ── Helpers ────────────────────────────────────────────────────────────────────

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`API ${res.status}: ${body}`);
  }
  return res.json() as Promise<T>;
}

// ── Endpoints ──────────────────────────────────────────────────────────────────

export async function checkHealth(): Promise<HealthResponse> {
  return apiFetch<HealthResponse>("/api/cube/legacy/health");
}

export async function submitDecision(data: {
  decision_type: string;
  confidence: number;
  reasoning: string;
  input_data: any;
}): Promise<DecisionSubmitResponse> {
  return apiFetch<DecisionSubmitResponse>("/api/cube/submit", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function getDecisions(): Promise<DecisionRecord[]> {
  return apiFetch<DecisionRecord[]>("/api/cube/decisions");
}

export async function getDecisionHistory(): Promise<DecisionRecord[]> {
    return getDecisions();
}

export async function approveDecision(decisionId: string): Promise<any> {
  return { status: "success", info: "Demo mode" };
}

export async function rejectDecision(decisionId: string, reason: string): Promise<any> {
  return { status: "success", info: "Demo mode" };
}

// ── CUBE Specific Endpoints ──────────────────────────────────────────────────

export interface CubeMetrics {
  trustScore: number;
  uptime: number;
  tps: number;
  activeNodes: number;
  confirmedDecisions: number;
  pendingDecisions: number;
  failedDecisions: number;
  walletAddress: string | null;
}

export interface NetworkStats {
  blocks: number;
  nodes: number;
  shards: number;
  tps_avg: number;
  sentinel: string;
}

export async function getCubeMetrics(): Promise<CubeMetrics> {
  return apiFetch<CubeMetrics>("/api/cube/metrics");
}

export async function getNetworkStats(): Promise<NetworkStats> {
  return apiFetch<NetworkStats>("/api/cube/network");
}
