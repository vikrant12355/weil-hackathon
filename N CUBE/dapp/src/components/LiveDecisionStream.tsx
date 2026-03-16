"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Terminal, Cpu, CheckCircle2 } from 'lucide-react';
import { storeDecisionBlock, type DecisionSubmitResponse } from '@/utils/blockchain';

interface ReasoningEntry {
  id: string;
  timestamp: string;
  agent: string;
  text: string;
  confidenceScore?: number;
}

const simulatedMessages = [
  { text: "Detected abnormal heart rate exceeding safe threshold.", confidence: 95 },
  { text: "Cross-checking patient history...", confidence: 92 },
  { text: "Evaluating anomalies against baseline...", confidence: 89 },
  { text: "Risk classification: HIGH.", confidence: 87 }
];

interface LiveDecisionStreamProps {
  onDecisionSubmitted?: (result: DecisionSubmitResponse) => void;
}

export default function LiveDecisionStream({ onDecisionSubmitted }: LiveDecisionStreamProps) {
  const [entries, setEntries] = useState<ReasoningEntry[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [txResult, setTxResult] = useState<string | null>(null);

  const submitToChain = useCallback(async () => {
    if (submitted || submitting) return;
    setSubmitting(true);
    try {
      const lastMsg = simulatedMessages[simulatedMessages.length - 1];
      const allReasoning = simulatedMessages.map(m => m.text).join(" → ");
      const result = await storeDecisionBlock(
        "Cerebrum AI",
        lastMsg.confidence,
        allReasoning,
        { bpm: 110, trace: "detected abnormality" },
        "Alert Patient"
      );
      setSubmitted(true);
      setTxResult(
        result.on_chain
          ? `On-chain: ${result.decision.decision_hash.slice(0, 18)}...`
          : `Local: ${result.decision.decision_hash.slice(0, 18)}...`
      );
      onDecisionSubmitted?.(result);
    } catch (err) {
      console.error("Failed to submit decision:", err);
      setTxResult("Submission failed — backend offline?");
    } finally {
      setSubmitting(false);
    }
  }, [submitted, submitting, onDecisionSubmitted]);

  useEffect(() => {
    let index = 0;
    const interval = setInterval(() => {
      if (index < simulatedMessages.length) {
        const msg = simulatedMessages[index];
        setEntries(prev => [
          ...prev,
          {
            id: Date.now().toString() + index,
            timestamp: new Date().toLocaleTimeString(),
            agent: 'Cerebrum AI',
            text: msg.text,
            confidenceScore: msg.confidence
          }
        ]);
        index++;
      } else {
        clearInterval(interval);
        // Auto-submit after stream completes
        submitToChain();
      }
    }, 2800);

    return () => clearInterval(interval);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="h-[460px] flex flex-col overflow-hidden relative rounded-xl">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#080d1a] pointer-events-none z-0"></div>
      <div className="px-5 py-4 bg-[#050811]/90 backdrop-blur-md border-b border-[#2d1b69] flex items-center justify-between z-10">
        <div className="flex items-center gap-2 text-[#a882ff] font-mono text-sm uppercase tracking-widest font-bold">
          <Terminal size={18} />
          <span>AI DECISION MONITOR</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#a882ff]"></span>
          </span>
          <span className="text-[10px] text-purple-300 uppercase tracking-widest font-semibold">Live Mode</span>
        </div>
      </div>
      
      <div className="flex-1 p-5 overflow-y-auto font-mono text-sm z-10 custom-scrollbar">
        <AnimatePresence>
          {entries.map((entry) => (
            <motion.div
              key={entry.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              className="mb-5 last:mb-0 border-l-2 border-[#a882ff]/30 pl-4 py-1"
            >
              <div className="flex items-center justify-between mb-1.5">
                <div className="text-gray-500 text-xs">[{entry.timestamp}]</div>
              </div>
              <div className="flex items-start gap-3">
                <Cpu size={16} className="mt-0.5 text-purple-400 shrink-0" />
                <div className="w-full">
                  <div className="flex justify-between items-center w-full">
                    <span className="text-purple-300 font-bold uppercase tracking-wide text-xs">Agent: {entry.agent}</span>
                    {entry.confidenceScore && (
                       <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider bg-transparent border 
                          ${entry.confidenceScore >= 90 ? 'text-green-400 border-green-500/30' : 'text-amber-400 border-amber-500/30'}`}>
                         Conf: {entry.confidenceScore}%
                       </span>
                    )}
                  </div>
                  <div className="text-gray-200 mt-1.5 leading-relaxed text-[13px] bg-[#141b30] p-3 rounded-lg border border-[#232a45]">
                    &quot;{entry.text}&quot;
                  </div>
                </div>
              </div>
            </motion.div>
          ))}

          {/* On-chain submission status */}
          {(submitting || txResult) && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-5 border-l-2 border-green-500/50 pl-4 py-1"
            >
              <div className="flex items-start gap-3">
                <CheckCircle2 size={16} className="mt-0.5 text-green-400 shrink-0" />
                <div className="w-full">
                  <span className="text-green-400 font-bold uppercase tracking-wide text-xs">
                    {submitting ? "Submitting to WeilChain..." : "Decision Recorded"}
                  </span>
                  {txResult && (
                    <div className="text-green-300/80 mt-1.5 leading-relaxed text-[12px] bg-green-500/5 p-3 rounded-lg border border-green-500/20 font-mono">
                      {txResult}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {entries.length === 0 && (
            <div className="flex h-full items-center justify-center text-gray-600 italic">
               Awaiting reasoning stream...
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
