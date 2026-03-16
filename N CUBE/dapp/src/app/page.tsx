"use client";

import React, { useState, useEffect } from 'react';
import LiveDecisionStream from '@/components/LiveDecisionStream';
import DecisionDigestCard from '@/components/DecisionDigestCard';
import BlockchainAuditHistory from '@/components/BlockchainAuditHistory';
import HumanReviewModal from '@/components/HumanReviewModal';
import { checkHealth, type HealthResponse, getCubeMetrics, getNetworkStats } from '@/utils/apiClient';
import { type DecisionSubmitResponse } from '@/utils/blockchain';
import { useCUBE } from '@/components/cube/CUBEContext';
import { Filter, LayoutGrid, Shield, Activity, Lock, Radio, ShieldCheck, Server, Settings, Search, Bell, Moon, Sun, Monitor, Cpu, Globe, Database, HardDrive, Cpu as Chip, Zap, AlertTriangle, CheckCircle2, MoreVertical, ExternalLink, RefreshCcw } from '@/components/cube/Icons';

function IntegrityView() {
  const { metrics } = useCUBE();
  
  return (
    <div className="p-5 flex-1 flex flex-col min-w-0 overflow-y-auto custom-scrollbar">
      <div className="mb-6">
        <h1 className="font-[var(--ff-d)] text-[22px] font-extrabold tracking-[-0.02em]">System Integrity & Trust</h1>
        <p className="text-[var(--t3)] text-[13px] mt-1">Real-time verification of the Proof-of-Decision protocol health</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        <div className="gc p-6 flex flex-col items-center justify-center text-center">
            <div className="w-[120px] h-[120px] rounded-full border-4 border-[#22D3EE] flex flex-col items-center justify-center shadow-[0_0_20px_rgba(34,211,238,0.3)] mb-4 bg-[rgba(34,211,238,0.03)]">
                <span className="font-[var(--ff-m)] text-[32px] font-bold text-[#22D3EE] leading-none">{metrics.trustScore}</span>
                <span className="text-[10px] uppercase tracking-widest text-[var(--t3)] mt-1 font-bold">Trust Index</span>
            </div>
            <h3 className="text-lg font-bold text-[var(--t1)]">System Core Health</h3>
            <p className="text-[12px] text-[var(--t3)] mt-2">Aggregate trust score calculated from 512 validator shards and on-chain consensus.</p>
        </div>

        <div className="gc p-6 flex flex-col gap-4">
             <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--t3)]">Validation Speed</span>
                <span className="text-[var(--neon)] font-[var(--ff-m)] text-[14px]">{metrics.tps} TPS</span>
             </div>
             <div className="h-1.5 w-full bg-[var(--glass2)] rounded-full overflow-hidden">
                <div className="h-full bg-[var(--neon)]" style={{ width: '85%' }}></div>
             </div>

             <div className="flex items-center justify-between mt-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--t3)]">Network Stability</span>
                <span className="text-[var(--vio2)] font-[var(--ff-m)] text-[14px]">{metrics.uptime}%</span>
             </div>
             <div className="h-1.5 w-full bg-[var(--glass2)] rounded-full overflow-hidden">
                <div className="h-full bg-[var(--vio2)]" style={{ width: `${metrics.uptime}%` }}></div>
             </div>

             <div className="flex items-center justify-between mt-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--t3)]">Active Shards</span>
                <span className="text-[var(--go)] font-[var(--ff-m)] text-[14px]">{metrics.activeNodes} / 8</span>
             </div>
             <div className="h-1.5 w-full bg-[var(--glass2)] rounded-full overflow-hidden">
                <div className="h-full bg-[var(--go)]" style={{ width: '75%' }}></div>
             </div>
        </div>

        <div className="gc p-6">
            <h3 className="text-[11px] font-bold uppercase tracking-widest text-[var(--t3)] mb-4">Security Protocol</h3>
            <div className="flex flex-col gap-3">
                <div className="flex items-center gap-3 p-2.5 rounded-lg bg-[rgba(16,185,129,0.05)] border border-[rgba(16,185,129,0.1)]">
                    <CheckCircle2 size={16} className="text-[var(--go)]" />
                    <div>
                        <div className="text-[12px] font-bold">ECDSA Verification Active</div>
                        <div className="text-[10px] text-[var(--t3)]">P-256 Curv Signature Check</div>
                    </div>
                </div>
                <div className="flex items-center gap-3 p-2.5 rounded-lg bg-[rgba(139,92,246,0.05)] border border-[rgba(139,92,246,0.1)]">
                    <Lock size={16} className="text-[var(--vio2)]" />
                    <div>
                        <div className="text-[12px] font-bold">SHA-256 Immutable Hash</div>
                        <div className="text-[10px] text-[var(--t3)]">Content Integrity Guaranteed</div>
                    </div>
                </div>
                <div className="flex items-center gap-3 p-2.5 rounded-lg bg-[rgba(34,211,238,0.05)] border border-[rgba(34,211,238,0.1)]">
                    <Shield size={16} className="text-[var(--neon)]" />
                    <div>
                        <div className="text-[12px] font-bold">Zero-Knowledge Audit</div>
                        <div className="text-[10px] text-[var(--t3)]">Privacy-Preserving Proofs</div>
                    </div>
                </div>
            </div>
        </div>
      </div>

      <div className="mt-6 gc p-6 overflow-hidden">
        <div className="flex items-center justify-between mb-4">
             <h3 className="font-[Syne] font-bold text-lg">Shard Consensus Real-Time Feed</h3>
             <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-[var(--go)] animate-pulse"></div>
                <span className="text-[10px] uppercase font-bold tracking-widest text-[var(--go)]">Live Monitoring</span>
             </div>
        </div>
        <div className="space-y-4">
            {[1, 2, 3].map(i => (
                <div key={i} className="flex items-start gap-4 p-4 rounded-xl border border-white/5 bg-white/[0.02]">
                    <div className="bg-[var(--glass2)] p-2 rounded-lg">
                        <Chip size={20} className="text-[var(--t3)]" />
                    </div>
                    <div className="flex-1">
                        <div className="flex items-center justify-between">
                            <span className="text-[12px] font-bold font-[var(--ff-m)] text-[var(--t2)] tracking-tight">SHARD-0{i} // CONSENSUS_OK</span>
                            <span className="text-[10px] text-[var(--t3)] font-[var(--ff-m)]">Latency: {i * 12}ms</span>
                        </div>
                        <div className="mt-1 text-[11px] text-[var(--t3)]">Verifying block batch #8293{i}... Verification record anchored at height 294,302.</div>
                    </div>
                </div>
            ))}
        </div>
      </div>
    </div>
  );
}

function NetworkView() {
  const { metrics } = useCUBE();
  
  return (
    <div className="p-5 flex-1 flex flex-col min-w-0 overflow-y-auto custom-scrollbar">
      <div className="mb-6">
        <h1 className="font-[var(--ff-d)] text-[22px] font-extrabold tracking-[-0.02em]">Network Explorer</h1>
        <p className="text-[var(--t3)] text-[13px] mt-1">Inspect the WeilChain infrastructure and shard status</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
        <div className="gc p-6">
            <div className="flex items-center gap-3 mb-6">
                <div className="bg-[var(--glass2)] p-2.5 rounded-lg border border-white/10">
                    <Globe size={24} className="text-[var(--neon)]" />
                </div>
                <div>
                    <h3 className="font-bold text-lg">Global Sentinel Nodes</h3>
                    <p className="text-[11px] text-[var(--t3)]">6 nodes active across 3 regions</p>
                </div>
            </div>
            
            <div className="space-y-4">
                {['Mumbai, IN', 'Frankfurt, DE', 'San Jose, US'].map((reg, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 rounded-lg bg-white/[0.03] border border-white/5">
                        <div className="flex items-center gap-3">
                            <div className={`w-2 h-2 rounded-full ${idx < 2 ? 'bg-[var(--go)]' : 'bg-[var(--warn)]'}`}></div>
                            <span className="text-[13px] font-medium">{reg}</span>
                        </div>
                        <div className="flex items-center gap-4 text-[11px] font-[var(--ff-m)]">
                            <span className="text-[var(--t3)]">RT: {15 * (idx + 1)}ms</span>
                            <span className={idx < 2 ? 'text-[var(--go)]' : 'text-[var(--warn)]'}>{idx < 2 ? 'ONLINE' : 'DEGRADED'}</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>

        <div className="gc p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-[200px] h-[200px] bg-[var(--neon)]/10 blur-[80px] -z-10 rounded-full"></div>
            <div className="flex items-center gap-3 mb-6">
                <div className="bg-[var(--glass2)] p-2.5 rounded-lg border border-white/10">
                    <Database size={24} className="text-[var(--vio2)]" />
                </div>
                <div>
                    <h3 className="font-bold text-lg">Shard Ledger Stats</h3>
                    <p className="text-[11px] text-[var(--t3)]">Real-time throughput metrics</p>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
                    <div className="text-[10px] uppercase font-bold text-[var(--t3)] mb-1">Total Blocks</div>
                    <div className="text-xl font-bold font-[var(--ff-m)] leading-none text-[var(--vio2)]">4.2M+</div>
                </div>
                <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
                    <div className="text-[10px] uppercase font-bold text-[var(--t3)] mb-1">Commits/Hour</div>
                    <div className="text-xl font-bold font-[var(--ff-m)] leading-none text-[var(--neon)]">12,482</div>
                </div>
                <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
                    <div className="text-[10px] uppercase font-bold text-[var(--t3)] mb-1">Avg Block Time</div>
                    <div className="text-xl font-bold font-[var(--ff-m)] leading-none text-[#F59E0B]">1.2s</div>
                </div>
                <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
                    <div className="text-[10px] uppercase font-bold text-[var(--t3)] mb-1">Chain Weight</div>
                    <div className="text-xl font-bold font-[var(--ff-m)] leading-none text-[var(--go)]">96.84 TH</div>
                </div>
            </div>
        </div>
      </div>

      <div className="gc overflow-hidden flex-1">
           <div className="p-4 border-b border-white/10 flex items-center justify-between">
                <h3 className="font-bold">Recent Shard Transactions</h3>
                <button className="text-[11px] text-[var(--neon)] hover:underline flex items-center gap-1">View Explorer <ExternalLink size={10} /></button>
           </div>
           <div className="p-0 overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-white/[0.02] text-[var(--t3)] text-[11px] uppercase tracking-wider">
                            <th className="p-4 font-bold border-b border-white/10">TX Hash</th>
                            <th className="p-4 font-bold border-b border-white/10">Method</th>
                            <th className="p-4 font-bold border-b border-white/10">Shard</th>
                            <th className="p-4 font-bold border-b border-white/10">Status</th>
                            <th className="p-4 font-bold border-b border-white/10">Age</th>
                        </tr>
                    </thead>
                    <tbody className="text-[12px] font-[var(--ff-m)]">
                        {[1, 2, 3, 4, 5].map(i => (
                            <tr key={i} className="hover:bg-white/[0.02] transition-colors group">
                                <td className="p-4 border-b border-white/5 text-[var(--neon)]">0x{Math.random().toString(16).slice(2, 10)}...{Math.random().toString(16).slice(2, 6)}</td>
                                <td className="p-4 border-b border-white/5 font-bold uppercase text-[10px] tracking-widest text-[var(--t2)]">{i % 2 === 0 ? 'SUBMIT_DECISION' : 'VERIFY_HASH'}</td>
                                <td className="p-4 border-b border-white/5 text-[var(--t3)]">SHARD-0{(i % 8) + 1}</td>
                                <td className="p-4 border-b border-white/5">
                                    <span className="py-0.5 px-2.5 rounded-full bg-[var(--go)]/10 text-[var(--go)] text-[10px] font-bold">CONFIRMED</span>
                                </td>
                                <td className="p-4 border-b border-white/5 text-[var(--t3)]">{i * 2}s ago</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
           </div>
      </div>
    </div>
  );
}

function DecisionLogView() {
    return (
        <div className="p-5 flex-1 flex flex-col min-w-0 overflow-y-auto custom-scrollbar">
            <div className="mb-6">
                <h1 className="font-[var(--ff-d)] text-[22px] font-extrabold tracking-[-0.02em]">Decision Log</h1>
                <p className="text-[var(--t3)] text-[13px] mt-1">Historical ledger of all AI decisions and their on-chain proofs</p>
            </div>
            <div className="gc p-4">
                <BlockchainAuditHistory />
            </div>
        </div>
    );
}

function SettingsView() {
    const { theme, setTheme, metrics } = useCUBE();
    
    return (
        <div className="p-5 flex-1 flex flex-col min-w-0 overflow-y-auto custom-scrollbar">
            <div className="mb-6">
                <h1 className="font-[var(--ff-d)] text-[22px] font-extrabold tracking-[-0.02em]">System Settings</h1>
                <p className="text-[var(--t3)] text-[13px] mt-1">Configure your WeilChain identity and dashboard preferences</p>
            </div>

            <div className="max-w-[700px] flex flex-col gap-6">
                <div className="gc p-6">
                    <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                        <Moon size={18} className="text-[var(--vio2)]" /> Dashboard Theme
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                        <button 
                            onClick={() => setTheme('dark')}
                            className={`p-4 rounded-xl border flex flex-col items-center gap-2 transition-all ${theme === 'dark' ? 'border-[var(--neon)] bg-[var(--neon)]/5' : 'border-white/10 hover:border-white/20'}`}
                        >
                            <Moon size={24} className={theme === 'dark' ? 'text-[var(--neon)]' : 'text-[var(--t3)]'} />
                            <span className="text-[13px] font-medium">Dark Mode (Default)</span>
                        </button>
                        <button 
                            onClick={() => setTheme('light')}
                            className={`p-4 rounded-xl border flex flex-col items-center gap-2 transition-all ${theme === 'light' ? 'border-[var(--neon)] bg-[var(--neon)]/5' : 'border-white/10 hover:border-white/20'}`}
                        >
                            <Sun size={24} className={theme === 'light' ? 'text-[var(--neon)]' : 'text-[var(--t3)]'} />
                            <span className="text-[13px] font-medium">Cyber-Light</span>
                        </button>
                    </div>
                </div>

                <div className="gc p-6">
                    <h3 className="font-bold text-lg mb-1 flex items-center gap-2">
                        <ShieldCheck size={18} className="text-[var(--go)]" /> Wallet Configuration
                    </h3>
                    <p className="text-[11px] text-[var(--t3)] mb-4">Your Weilliptic identity for on-chain audit signing</p>
                    
                    <div className="space-y-4">
                        <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
                            <div className="text-[10px] uppercase font-bold text-[var(--t3)] mb-2 tracking-widest">Active Wallet Address</div>
                            <div className="flex items-center justify-between">
                                <code className="text-[var(--neon)] font-[var(--ff-m)] text-[13px]">
                                    {metrics.walletAddress || '0x_W_Demo_Mode_Active'}
                                </code>
                                <button className="text-[10px] uppercase font-bold px-2 py-1 rounded bg-white/5 hover:bg-white/10 transition-colors">Copy</button>
                            </div>
                        </div>
                        
                        <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 opacity-50 cursor-not-allowed">
                            <div className="text-[10px] uppercase font-bold text-[var(--t3)] mb-2 tracking-widest">Private Key Status</div>
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-[var(--warn)]"></div>
                                <span className="text-[13px] font-medium">No `private_key.wc` found. System in read-only/demo mode.</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="gc p-6 border-red-500/10">
                    <h3 className="font-bold text-lg mb-4 text-red-500 flex items-center gap-2">
                        <AlertTriangle size={18} /> Danger Zone
                    </h3>
                    <div className="flex flex-col gap-3">
                        <button className="w-full py-3 px-4 rounded-xl border border-red-500/30 text-red-500 text-[13px] font-bold hover:bg-red-500/5 transition-all text-left flex items-center justify-between">
                            Reset Local Decision Ledger
                            <RefreshCcw size={16} />
                        </button>
                        <p className="text-[10px] text-[var(--t3)]">This will clear your local cache. On-chain audits remain immutable.</p>
                    </div>
                </div>
            </div>
        </div>
    );
}

function DashboardView({ latestDecision, onDecisionSubmitted }: { latestDecision: any, onDecisionSubmitted: (d: any) => void }) {
  const { metrics } = useCUBE();

  return (
    <div className="p-5 flex-1 flex flex-col min-w-0 overflow-y-auto custom-scrollbar">
      <div className="mb-4">
        <h1 className="font-[var(--ff-d)] text-[22px] font-extrabold tracking-[-0.02em]">Decision Protocol Dashboard</h1>
        <p className="text-[var(--t3)] text-[13px] mt-1">Real-time tamper-proof accountability for autonomous AI decisions</p>
      </div>

      <div className="flex items-center gap-1.5 flex-nowrap mb-4 overflow-x-auto pb-1 no-scrollbar">
        <button className="flex items-center gap-[5px] py-1 px-2.5 rounded-[7px] border border-[rgba(34,211,238,0.3)] bg-[rgba(34,211,238,0.07)] text-[#22D3EE] text-[11px] font-bold tracking-[0.05em] shrink-0">
          <LayoutGrid size={12} strokeWidth={2.5} /> ALL
          <span className="font-[var(--ff-m)] text-[10px] py-[1px] px-[6px] rounded bg-[var(--glass2)] ml-0.5">{metrics.confirmedDecisions + metrics.pendingDecisions}</span>
        </button>
        <button className="flex items-center gap-[5px] py-1 px-2.5 rounded-[7px] border border-white/10 hover:bg-white/5 text-[var(--t3)] text-[11px] font-bold tracking-[0.05em] shrink-0 transition-all">
          <Activity size={12} /> CRITICAL
        </button>
        <button className="flex items-center gap-[5px] py-1 px-2.5 rounded-[7px] border border-white/10 hover:bg-white/5 text-[var(--t3)] text-[11px] font-bold tracking-[0.05em] shrink-0 transition-all">
          <Globe size={12} /> NETWORK
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-4 min-h-0">
        <div className="flex flex-col gap-4 min-w-0">
          <LiveDecisionStream onDecisionSubmitted={onDecisionSubmitted} />
          <div className="gc p-4">
             <DecisionDigestCard
                inputData={latestDecision?.decision.input_data}
                reasoning={latestDecision?.decision.reasoning}
                confidence={latestDecision?.decision.confidence}
                decisionHash={latestDecision?.decision.decision_hash}
                onChain={latestDecision?.on_chain}
              />
          </div>
          <div className="gc p-4">
             <BlockchainAuditHistory />
          </div>
        </div>

        <div className="flex flex-col gap-3.5">
          <div className="gc">
            <div className="p-4 relative z-10">
              <div className="flex items-center gap-[7px] text-[11px] font-bold uppercase tracking-[0.12em] text-[var(--t3)] mb-3.5">
                <Activity size={13} className="text-[var(--neon)]" strokeWidth={2.5} /> Integrity Monitor
              </div>
              <div className="flex justify-around">
                <div className="flex flex-col items-center gap-2">
                  <div className="w-[80px] h-[80px] rounded-full border-4 border-[#22D3EE] flex items-center justify-center shadow-[0_0_10px_rgba(34,211,238,0.5)]">
                    <span className="font-[var(--ff-m)] text-[15px] font-semibold text-[#22D3EE]">{metrics.trustScore}</span>
                  </div>
                  <span className="text-[10px] uppercase font-bold tracking-widest text-[var(--t3)] mt-2">Trust</span>
                </div>
                <div className="flex flex-col items-center gap-2">
                  <div className="w-[80px] h-[80px] rounded-full border-4 border-[#A78BFA] flex items-center justify-center shadow-[0_0_10px_rgba(167,139,250,0.5)]">
                    <span className="font-[var(--ff-m)] text-[15px] font-semibold text-[#A78BFA]">{metrics.uptime}%</span>
                  </div>
                  <span className="text-[10px] uppercase font-bold tracking-widest text-[var(--t3)] mt-2">Uptime</span>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div className="gc p-3.5">
              <div className="text-[10px] font-bold uppercase tracking-[0.1em] text-[var(--go)] opacity-70 mb-1.5">Confirmed</div>
              <div className="font-[var(--ff-m)] text-[22px] font-bold text-[var(--go)]">{metrics.confirmedDecisions.toLocaleString()}</div>
            </div>
            <div className="gc p-3.5">
              <div className="text-[10px] font-bold uppercase tracking-[0.1em] text-[var(--warn)] opacity-70 mb-1.5">Pending</div>
              <div className="font-[var(--ff-m)] text-[22px] font-bold text-[var(--warn)]">{metrics.pendingDecisions.toLocaleString()}</div>
            </div>
            <div className="gc p-3.5">
              <div className="text-[10px] font-bold uppercase tracking-[0.1em] text-[var(--neon)] opacity-70 mb-1.5">TPS</div>
              <div className="font-[var(--ff-m)] text-[22px] font-bold text-[var(--neon)]">{metrics.tps}</div>
            </div>
            <div className="gc p-3.5">
              <div className="text-[10px] font-bold uppercase tracking-[0.1em] text-[var(--vio2)] opacity-70 mb-1.5">Nodes</div>
              <div className="font-[var(--ff-m)] text-[22px] font-bold text-[var(--vio2)]">{metrics.activeNodes}</div>
            </div>
          </div>
          
          <div className="gc p-4">
             <div className="text-[11px] font-bold uppercase tracking-[0.1em] text-[var(--t3)] mb-3">Recent Status</div>
             <div className="space-y-3">
                <div className="flex items-start gap-2.5">
                    <CheckCircle2 size={14} className="text-[var(--go)] mt-0.5" />
                    <div className="text-[11px] leading-relaxed">Consensus achieved on batch <span className="text-[var(--neon)]">#82910</span>.</div>
                </div>
                <div className="flex items-start gap-2.5">
                    <Shield size={14} className="text-[var(--vio2)] mt-0.5" />
                    <div className="text-[11px] leading-relaxed">Audit Log <span className="text-[var(--vio2)]">0x8a...2e</span> successfully anchored.</div>
                </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Page() {
  const { page, setMetrics } = useCUBE();
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [latestDecision, setLatestDecision] = useState<DecisionSubmitResponse | null>(null);
  const [showReview, setShowReview] = useState(false);

  useEffect(() => {
    // Initial health check
    checkHealth()
      .then(setHealth)
      .catch(() => setHealth(null));

    // Polling for CUBE metrics
    const poll = async () => {
      try {
        const [m, n] = await Promise.all([getCubeMetrics(), getNetworkStats()]);
        setMetrics({ ...m, network: n });
      } catch (e) {
        console.error("CUBE Polling Error:", e);
      }
    };

    poll();
    const interval = setInterval(poll, 3000);
    return () => clearInterval(interval);
  }, [setMetrics]);

  const handleDecisionSubmitted = (result: DecisionSubmitResponse) => {
    setLatestDecision(result);
    if (result.decision.confidence < 90) {
      setShowReview(true);
    }
  };

  return (
    <>
      {page === 'dashboard' && (
        <DashboardView 
          latestDecision={latestDecision} 
          onDecisionSubmitted={handleDecisionSubmitted} 
        />
      )}
      
      {page === 'log' && <DecisionLogView />}
      {page === 'audit' && <DecisionLogView />}
      {page === 'integrity' && <IntegrityView />}
      {page === 'network' && <NetworkView />}
      {page === 'settings' && <SettingsView />}

      <HumanReviewModal
        isOpen={showReview}
        decisionId={latestDecision?.decision.id ?? null}
        decisionSummary={latestDecision?.decision.decision_type}
        reasoningTrace={latestDecision?.decision.reasoning}
        confidence={latestDecision?.decision.confidence}
        onClose={() => setShowReview(false)}
      />
    </>
  );
}
