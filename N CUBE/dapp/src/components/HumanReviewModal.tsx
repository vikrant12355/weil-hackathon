"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Fingerprint, XCircle, CheckCircle } from 'lucide-react';
import { approveBlock, rejectBlock } from '@/utils/blockchain';

interface HumanReviewModalProps {
  isOpen: boolean;
  decisionId: string | null;
  decisionSummary?: string;
  reasoningTrace?: string;
  confidence?: number;
  onClose: () => void;
  onReviewComplete?: (action: "approved" | "rejected") => void;
}

export default function HumanReviewModal({
  isOpen,
  decisionId,
  decisionSummary = "Alert Patient - High Risk",
  reasoningTrace = "Heart rate exceeds threshold and patient risk profile indicates anomaly.",
  confidence = 87,
  onClose,
  onReviewComplete,
}: HumanReviewModalProps) {
  const [isSigning, setIsSigning] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [completionAction, setCompletionAction] = useState<string>("");
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleApprove = async () => {
    if (!decisionId) return;
    setIsSigning(true);
    setError(null);
    try {
      const result = await approveBlock(decisionId);
      setCompletionAction(result.on_chain ? "Approved & Recorded on WeilChain" : "Approved (Demo Mode)");
      setIsComplete(true);
      onReviewComplete?.("approved");
      setTimeout(() => {
        onClose();
        resetState();
      }, 2000);
    } catch (err) {
      setError(`Approval failed: ${err}`);
    } finally {
      setIsSigning(false);
    }
  };

  const handleReject = async () => {
    if (!decisionId) return;
    if (!reason) {
      setError("Please provide an override explanation.");
      return;
    }
    setIsSigning(true);
    setError(null);
    try {
      const result = await rejectBlock(decisionId, reason);
      setCompletionAction(result.on_chain ? "Rejected & Recorded on WeilChain" : "Rejected (Demo Mode)");
      setIsComplete(true);
      onReviewComplete?.("rejected");
      setTimeout(() => {
        onClose();
        resetState();
      }, 2000);
    } catch (err) {
      setError(`Rejection failed: ${err}`);
    } finally {
      setIsSigning(false);
    }
  };

  const resetState = () => {
    setIsComplete(false);
    setCompletionAction("");
    setReason("");
    setError(null);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#030610]/80 backdrop-blur-md">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="bg-[#0b1121] border border-[#2d1b69] shadow-[0_0_30px_rgba(168,130,255,0.2)] rounded-2xl w-full max-w-lg overflow-hidden flex flex-col font-sans"
          >
            {/* Header */}
            <div className="bg-amber-500/10 px-6 py-4 flex items-center gap-3 border-b border-amber-500/30">
              <AlertTriangle className="text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.6)]" strokeWidth={2.5} size={24} />
              <h2 className="text-xl font-black tracking-tight text-white uppercase font-mono">Human Review Required</h2>
            </div>
            
            {/* Completion Banner */}
            {isComplete && (
              <motion.div 
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                className="bg-green-500/10 border-b border-green-500/30 px-6 py-3 flex items-center gap-2"
              >
                <CheckCircle className="text-green-400" size={18} />
                <span className="text-green-300 text-sm font-bold font-mono uppercase tracking-wider">{completionAction}</span>
              </motion.div>
            )}

            {/* Body */}
            <div className="p-6 space-y-7">
              
              <div className="space-y-1.5 border-b border-[#232a45] pb-4">
                <span className="text-[10px] uppercase font-bold text-gray-400 tracking-widest font-mono">Decision Summary</span>
                <p className="font-bold text-lg text-[#a882ff] bg-[#141b30] px-4 py-2.5 rounded-lg border border-[#232a45] shadow-inner">{decisionSummary}</p>
              </div>

              <div className="space-y-1.5 border-b border-[#232a45] pb-4 relative">
                <div className="absolute top-8 left-0 w-1 h-3/4 bg-amber-500/50 rounded-r"></div>
                <span className="text-[10px] uppercase font-bold text-gray-400 tracking-widest font-mono pl-3">Reasoning Trace</span>
                <p className="text-amber-200/90 italic bg-amber-500/5 border border-amber-500/20 rounded-lg p-4 text-[13px] leading-relaxed font-mono font-medium shadow-inner ml-3">
                   &quot;{reasoningTrace}&quot;
                </p>
              </div>

              <div className="space-y-1.5 border-b border-[#232a45] pb-4 pl-3">
                <span className="text-[10px] uppercase font-bold text-gray-400 tracking-widest font-mono flex items-center gap-2">
                  Confidence Score
                  {confidence < 90 && (
                    <span className="bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded px-1.5 py-0.5 text-[9px] uppercase font-bold tracking-widest">
                      Beneath 90%
                    </span>
                  )}
                </span>
                <div className="flex items-end gap-1 mt-1">
                  <span className="text-4xl font-black text-amber-500 tracking-tighter drop-shadow-[0_0_8px_rgba(245,158,11,0.4)]">{confidence}</span>
                  <span className="text-xl font-bold text-amber-500/70 mb-1">%</span>
                </div>
              </div>

              <div className="space-y-2 pl-3">
                <label htmlFor="reason" className="text-[10px] uppercase font-bold text-gray-400 tracking-widest font-mono block">
                  Override Rationale
                </label>
                <textarea 
                  id="reason"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full bg-[#141b30] border border-[#232a45] rounded-lg p-3 text-[13px] text-gray-200 focus:bg-[#0b1121] focus:outline-none focus:ring-1 focus:ring-[#a882ff] focus:border-[#a882ff] transition-colors min-h-[90px] font-mono shadow-inner custom-scrollbar"
                  placeholder="Explain why human override is needed if rejecting..."
                />
              </div>

              {error && (
                <div className="text-red-400 text-xs bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2 font-mono">
                  {error}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="bg-[#050811]/90 border-t border-[#2d1b69] px-6 py-4 flex items-center justify-end gap-4 relative overflow-hidden">
               <div className="absolute inset-0 bg-[#a882ff] opacity-5 pointer-events-none"></div>
              <button 
                onClick={handleReject}
                className="flex items-center gap-2 px-5 py-2.5 rounded-lg border border-[#232a45] bg-[#141b30] text-gray-300 font-bold hover:bg-[#232a45] hover:text-white transition-colors text-sm uppercase tracking-wider font-mono shadow-md z-10"
                disabled={isSigning || isComplete}
              >
                <XCircle size={16} /> Reject / Override
              </button>
              <button 
                onClick={handleApprove}
                className="flex items-center gap-2 px-6 py-2.5 rounded-lg border border-transparent bg-indigo-600 hover:bg-[#a882ff] text-white font-bold transition-all text-sm uppercase tracking-wider font-mono shadow-[0_0_15px_rgba(79,70,229,0.5)] z-10 overflow-hidden relative group"
                disabled={isSigning || isComplete}
              >
                {isSigning && <div className="absolute inset-0 bg-black/20"></div>}
                
                {isSigning ? (
                  <span className="flex items-center gap-2 relative z-10">
                    <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }} className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"></motion.div>
                    Signing on WeilChain...
                  </span>
                ) : (
                  <span className="flex items-center gap-2 relative z-10">
                    <Fingerprint size={16} className="group-hover:drop-shadow-[0_0_8px_rgba(255,255,255,0.8)]" /> Approve & Sign
                  </span>
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
