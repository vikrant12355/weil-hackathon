/**
 * Blockchain utility — now backed by the PDP backend API.
 *
 * All functions that previously used an in-memory array now delegate
 * to the Python/FastAPI backend which talks to WeilChain.
 */

import {
  submitDecision as apiSubmit,
  getDecisionHistory as apiHistory,
  verifyDecision as apiVerify,
  approveDecision as apiApprove,
  rejectDecision as apiReject,
  type DecisionRecord,
  type DecisionSubmitResponse,
  type ReviewResponse,
} from "./apiClient";

export type { DecisionRecord, DecisionSubmitResponse, ReviewResponse };

// ── Re-exported API wrappers ──────────────────────────────────────────────────

export async function storeDecisionBlock(
  aiAgent: string,
  confidenceScore: number,
  reasoning: string,
  inputData: string,
  decisionType: string = "Alert Patient"
): Promise<DecisionSubmitResponse> {
  return apiSubmit({
    agent: aiAgent,
    confidence: confidenceScore,
    reasoning,
    input_data: inputData,
    decision_type: decisionType,
  });
}

export async function getBlockchainHistory(): Promise<DecisionRecord[]> {
  return apiHistory();
}

export async function verifyDecisionHash(hash: string) {
  return apiVerify(hash);
}

export async function approveBlock(
  decisionId: string,
  notes?: string
): Promise<ReviewResponse> {
  return apiApprove(decisionId, notes);
}

export async function rejectBlock(
  decisionId: string,
  reason: string
): Promise<ReviewResponse> {
  return apiReject(decisionId, reason);
}
