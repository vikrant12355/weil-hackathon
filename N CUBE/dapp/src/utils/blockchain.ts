/**
 * Blockchain utility — now backed by the unified CUBE backend.
 */

import {
  submitDecision as apiSubmit,
  getDecisions as apiHistory,
  approveDecision as apiApprove,
  rejectDecision as apiReject,
  type DecisionRecord,
  type DecisionSubmitResponse,
} from "./apiClient";

export type { DecisionRecord, DecisionSubmitResponse };

export async function storeDecisionBlock(
  aiAgent: string, // Simplified: map 'agent' to decision_type if needed
  confidenceScore: number,
  reasoning: string,
  inputData: any,
  decisionType: string = "Alert Patient"
): Promise<DecisionSubmitResponse> {
  return apiSubmit({
    decision_type: decisionType,
    confidence: confidenceScore,
    reasoning,
    input_data: inputData,
  });
}

export async function getBlockchainHistory(): Promise<DecisionRecord[]> {
  return apiHistory();
}

export async function verifyDecisionHash(hash: string): Promise<any> {
    const history = await apiHistory();
    const found = history.find(d => d.decision_hash === hash);
    return { found, decision: found };
}

export async function approveBlock(
  decisionId: string,
  notes?: string
): Promise<any> {
  return apiApprove(decisionId);
}

export async function rejectBlock(
  decisionId: string,
  reason: string
): Promise<any> {
  return apiReject(decisionId, reason);
}
