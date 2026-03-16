"use client";

import React, { useState, useEffect } from 'react';
import LiveDecisionStream from '@/components/LiveDecisionStream';
import DecisionDigestCard from '@/components/DecisionDigestCard';
import BlockchainAuditHistory from '@/components/BlockchainAuditHistory';
import HumanReviewModal from '@/components/HumanReviewModal';
import { Network, Database, Wifi, WifiOff } from 'lucide-react';
import { checkHealth, type HealthResponse } from '@/utils/apiClient';
import { type DecisionSubmitResponse } from '@/utils/blockchain';

export default function DashboardPage() {
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [latestDecision, setLatestDecision] = useState<DecisionSubmitResponse | null>(null);
  const [showReview, setShowReview] = useState(false);

  // Fetch backend health on mount
  useEffect(() => {
    checkHealth()
      .then(setHealth)
      .catch(() => setHealth(null));
  }, []);

  // When a decision comes in with confidence < 90, pop the review modal
  const handleDecisionSubmitted = (result: DecisionSubmitResponse) => {
    setLatestDecision(result);
    if (result.decision.confidence < 90) {
      setShowReview(true);
    }
  };

  const backendOnline = health !== null;
  const chainConnected = health?.wallet_connected ?? false;

  return (
    <div className="min-h-screen bg-[#030610] text-gray-200 font-sans selection:bg-[#a882ff]/30 relative">
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-indigo-900/10 via-[#030610] to-[#030610] pointer-events-none"></div>

      <header className="bg-[#050811]/80 backdrop-blur-xl border-b border-[#2d1b69] py-4 px-6 md:px-10 flex items-center justify-between sticky top-0 z-20 shadow-[0_4px_30px_rgba(0,0,0,0.5)]">
        <div className="flex items-center gap-4">
          <div className="bg-[#141b30] p-2.5 rounded-xl border border-[#2d1b69] text-[#a882ff] shadow-[0_0_15px_rgba(168,130,255,0.2)] flex items-center justify-center relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-tr from-purple-600/20 to-indigo-600/20 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <Network size={22} strokeWidth={2.5} className="relative z-10" />
          </div>
          <div>
            <h1 className="text-xl font-black tracking-tighter text-white leading-tight uppercase font-mono">Proof-of-Decision</h1>
            <p className="text-[10px] text-[#a882ff] font-bold tracking-widest uppercase flex items-center gap-1.5 mt-0.5">
               <Database size={10} /> PDP Blockchain Layer
            </p>
          </div>
        </div>
        <div className="flex items-center gap-5 text-sm font-medium">
          {/* Backend status */}
          <div className={`hidden sm:flex items-center gap-2.5 bg-[#0b1121] border ${backendOnline ? 'border-[#2d1b69]' : 'border-red-500/30'} text-gray-300 px-4 py-2 rounded-full shadow-inner`}>
            {backendOnline ? (
              <>
                <Wifi size={12} className="text-green-400" />
                <span className="text-[10px] uppercase tracking-widest font-bold font-mono">Backend Online</span>
              </>
            ) : (
              <>
                <WifiOff size={12} className="text-red-400" />
                <span className="text-[10px] uppercase tracking-widest font-bold font-mono">Backend Offline</span>
              </>
            )}
          </div>

          {/* Chain connection */}
          <div className="hidden sm:flex items-center gap-2.5 bg-[#0b1121] border border-[#2d1b69] text-gray-300 px-4 py-2 rounded-full shadow-inner">
            <div className="relative flex h-2 w-2">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${chainConnected ? 'bg-green-400' : 'bg-amber-400'} opacity-75`}></span>
              <span className={`relative inline-flex rounded-full h-2 w-2 ${chainConnected ? 'bg-green-500 shadow-[0_0_5px_rgba(34,197,94,0.8)]' : 'bg-amber-500 shadow-[0_0_5px_rgba(245,158,11,0.8)]'}`}></span>
            </div>
            <span className="text-[10px] uppercase tracking-widest font-bold font-mono">
              {chainConnected ? 'WeilChain Connected' : health ? 'Demo Mode' : 'PDP Chain'}
            </span>
          </div>

          {/* Wallet address */}
          <div className="flex items-center gap-2.5 bg-[#0b1121] border border-[#2d1b69] text-gray-300 px-4 py-2 rounded-full shadow-inner">
            <span className="text-[10px] uppercase font-bold tracking-widest text-[#a882ff] font-mono">Node ID:</span>
            <span className="font-mono text-[11px] font-bold text-gray-100">
              {health?.wallet_address
                ? `${health.wallet_address.slice(0, 6)}...${health.wallet_address.slice(-4)}`
                : '0x8aF...9cD2'}
            </span>
          </div>
        </div>
      </header>

      <main className="max-w-[1400px] mx-auto px-6 md:px-10 py-8 space-y-8 relative z-10">
        
        {/* Top row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <LiveDecisionStream onDecisionSubmitted={handleDecisionSubmitted} />
          <DecisionDigestCard
            inputData={latestDecision?.decision.input_data}
            reasoning={latestDecision?.decision.reasoning}
            confidence={latestDecision?.decision.confidence}
            decisionHash={latestDecision?.decision.decision_hash}
            onChain={latestDecision?.on_chain}
          />
        </div>

        {/* Bottom row */}
        <div className="grid grid-cols-1">
          <BlockchainAuditHistory />
        </div>

      </main>

      <HumanReviewModal
        isOpen={showReview}
        decisionId={latestDecision?.decision.id ?? null}
        decisionSummary={latestDecision?.decision.decision_type}
        reasoningTrace={latestDecision?.decision.reasoning}
        confidence={latestDecision?.decision.confidence}
        onClose={() => setShowReview(false)}
      />
    </div>
  );
}
