/**
 * API Client — centralised fetch wrapper for the PDP backend.
 *
 * Base URL defaults to the local FastAPI dev server.
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

// ── Types ──────────────────────────────────────────────────────────────────────

export interface DecisionRecord {
  id: string;
  timestamp: string;
  agent: string;
  confidence: number;
  reasoning: string;
  input_data: string;
  decision_type: string;
  decision_hash: string;
  tx_hash: string | null;
  block_height: number | null;
  status: "Pending" | "Confirmed" | "Rejected";
  human_signature: string | null;
  reviewer_notes: string | null;
}

export interface DecisionSubmitResponse {
  decision: DecisionRecord;
  on_chain: boolean;
  message: string;
}

export interface ReviewResponse {
  decision_id: string;
  action: string;
  on_chain: boolean;
  tx_hash: string | null;
  message: string;
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
  return apiFetch<HealthResponse>("/api/health");
}

export async function submitDecision(data: {
  agent: string;
  confidence: number;
  reasoning: string;
  input_data: string;
  decision_type?: string;
}): Promise<DecisionSubmitResponse> {
  return apiFetch<DecisionSubmitResponse>("/api/decisions/submit", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function getDecisionHistory(): Promise<DecisionRecord[]> {
  return apiFetch<DecisionRecord[]>("/api/decisions/history");
}

export async function verifyDecision(
  hash: string
): Promise<{ found: boolean; decision?: DecisionRecord; on_chain?: boolean }> {
  return apiFetch("/api/decisions/verify/" + encodeURIComponent(hash));
}

export async function approveDecision(
  decisionId: string,
  reviewerNotes?: string
): Promise<ReviewResponse> {
  return apiFetch<ReviewResponse>("/api/review/approve", {
    method: "POST",
    body: JSON.stringify({ decision_id: decisionId, reviewer_notes: reviewerNotes }),
  });
}

export async function rejectDecision(
  decisionId: string,
  reason: string
): Promise<ReviewResponse> {
  return apiFetch<ReviewResponse>("/api/review/reject", {
    method: "POST",
    body: JSON.stringify({ decision_id: decisionId, reason }),
  });
}
