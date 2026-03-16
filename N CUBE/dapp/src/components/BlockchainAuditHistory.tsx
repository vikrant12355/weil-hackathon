"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Database, Clock, XCircle, AlertCircle, Hash, ShieldCheck, RefreshCw } from 'lucide-react';
import { getBlockchainHistory, type DecisionRecord } from '@/utils/blockchain';

export default function BlockchainAuditHistory() {
  const [history, setHistory] = useState<DecisionRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchHistory = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getBlockchainHistory();
      setHistory(data);
    } catch (err) {
      console.error("Failed to fetch history:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHistory();
    // Poll every 5 seconds
    const interval = setInterval(fetchHistory, 5000);
    return () => clearInterval(interval);
  }, [fetchHistory]);

  return (
    <div className="rounded-xl overflow-hidden relative">
      <div className="px-5 py-4 bg-[#050811]/90 backdrop-blur-md border-b border-[#2d1b69] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Database className="text-[#a882ff]" size={20} strokeWidth={2.5} />
          <h2 className="text-sm font-semibold text-white tracking-widest uppercase font-mono">Blockchain Verification History</h2>
        </div>
        <button
          onClick={fetchHistory}
          className="p-1.5 rounded-lg border border-[#232a45] text-gray-400 hover:text-[#a882ff] hover:border-[#a882ff]/50 transition-colors"
          title="Refresh"
        >
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
        </button>
      </div>
      <div className="overflow-x-auto custom-scrollbar">
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead className="bg-[#080d1a] text-gray-400 font-bold text-[10px] uppercase tracking-widest font-mono border-b border-[#232a45]">
            <tr>
              <th className="px-5 py-4">Timestamp</th>
              <th className="px-5 py-4">Decision Type</th>
              <th className="px-5 py-4">Input Summary</th>
              <th className="px-5 py-4">Block #</th>
              <th className="px-5 py-4">Decision Hash</th>
              <th className="px-5 py-4">Verification Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#232a45] bg-[#0b1121]">
            {history.length === 0 && !loading && (
              <tr>
                <td colSpan={6} className="px-5 py-8 text-center text-gray-600 italic">
                  No decisions recorded yet. Submit a decision to see it here.
                </td>
              </tr>
            )}
            {history.map((record) => (
              <tr key={record.id} className="hover:bg-[#141b30] transition-colors border-l-2 border-transparent hover:border-[#a882ff]/50">
                <td className="px-5 py-4 text-gray-400 flex items-center gap-2 font-mono text-[11px]">
                  <Clock size={12} className="text-[#a882ff]" />
                  {new Date(record.timestamp).toLocaleTimeString()}
                </td>
                <td className="px-5 py-4 font-bold text-gray-200">
                  {record.decision_type}
                </td>
                <td className="px-5 py-4 text-gray-400 text-xs truncate max-w-[150px]">
                  {typeof record.input_data === 'object' 
                    ? JSON.stringify(record.input_data) 
                    : record.input_data}
                </td>
                <td className="px-5 py-4 font-mono text-[#a882ff] text-[11px] font-bold">
                  {record.on_chain?.block_height ? `#${record.on_chain.block_height}` : '-'}
                </td>
                <td className="px-5 py-4 font-mono text-gray-400 text-[11px] flex flex-col justify-center gap-1">
                  <div className="flex items-center gap-1.5">
                    <Hash size={10} className="text-[#a882ff]/50" />
                    {record.decision_hash.slice(0, 14)}...{record.decision_hash.slice(-4)}
                  </div>
                </td>
                <td className="px-5 py-4">
                  {record.status === 'confirmed' && (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded text-[9px] font-black uppercase tracking-widest bg-green-500/10 text-green-400 border border-green-500/30">
                      <ShieldCheck size={12} className="text-green-400" />
                      {record.on_chain?.tx_hash ? 'Verified on WeilChain' : 'Verified on PDP Chain'}
                    </span>
                  )}
                  {record.status === 'pending' && (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded text-[9px] font-black uppercase tracking-widest bg-amber-500/10 text-amber-400 border border-amber-500/30">
                      <AlertCircle size={10} className="text-amber-400 animate-pulse" />
                      Awaiting Review
                    </span>
                  )}
                  {record.status === 'Rejected' && (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded text-[9px] font-black uppercase tracking-widest bg-red-500/10 text-red-400 border border-red-500/30">
                      <XCircle size={10} />
                      Rejected
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
