import React from 'react';
import { Database, Clock, XCircle, AlertCircle, Hash, ShieldCheck } from 'lucide-react';

interface AuditRecord {
  id: string;
  timestamp: string;
  decisionType: string;
  inputSummary: string;
  hash: string;
  blockNumber: string;
  status: 'Pending' | 'Confirmed' | 'Rejected';
}

const mockHistory: AuditRecord[] = [
  {
    id: '1',
    timestamp: '10:45:02 UTC',
    decisionType: 'Alert Patient',
    inputSummary: 'HR > 110bpm',
    hash: 'WAITING...',
    blockNumber: '-',
    status: 'Pending'
  },
  {
    id: '2',
    timestamp: '10:38:15 UTC',
    decisionType: 'Normal Diagnosis',
    inputSummary: 'HR: 75bpm, BP: 120/80',
    hash: '0x3fb892...c74a',
    blockNumber: '#149201',
    status: 'Confirmed'
  },
  {
    id: '3',
    timestamp: '10:22:41 UTC',
    decisionType: 'Administer Meds',
    inputSummary: 'Temp: 102F',
    hash: '0xa74c01...d8e1',
    blockNumber: '#149200',
    status: 'Rejected'
  }
];

export default function BlockchainAuditHistory() {
  return (
    <div className="bg-[#0b1121] border border-[#2d1b69] rounded-xl shadow-[0_0_15px_rgba(168,130,255,0.05)] overflow-hidden">
      <div className="px-5 py-4 bg-[#050811]/90 backdrop-blur-md border-b border-[#2d1b69] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Database className="text-[#a882ff]" size={20} strokeWidth={2.5} />
          <h2 className="text-sm font-semibold text-white tracking-widest uppercase font-mono">Blockchain Verification History</h2>
        </div>
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
            {mockHistory.map((record) => (
              <tr key={record.id} className="hover:bg-[#141b30] transition-colors border-l-2 border-transparent hover:border-[#a882ff]/50">
                <td className="px-5 py-4 text-gray-400 flex items-center gap-2 font-mono text-[11px]">
                  <Clock size={12} className="text-[#a882ff]" />
                  {record.timestamp}
                </td>
                <td className="px-5 py-4 font-bold text-gray-200">
                  {record.decisionType}
                </td>
                <td className="px-5 py-4 text-gray-400 text-xs truncate max-w-[150px]">
                  {record.inputSummary}
                </td>
                <td className="px-5 py-4 font-mono text-[#a882ff] text-[11px] font-bold">
                  {record.blockNumber}
                </td>
                <td className="px-5 py-4 font-mono text-gray-400 text-[11px] flex flex-col justify-center gap-1">
                  <div className="flex items-center gap-1.5">
                    <Hash size={10} className="text-[#a882ff]/50" />
                    {record.hash}
                  </div>
                </td>
                <td className="px-5 py-4">
                  {record.status === 'Confirmed' && (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded text-[9px] font-black uppercase tracking-widest bg-green-500/10 text-green-400 border border-green-500/30">
                      <ShieldCheck size={12} className="text-green-400" />
                      Verified on PDP Chain
                    </span>
                  )}
                  {record.status === 'Pending' && (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded text-[9px] font-black uppercase tracking-widest bg-amber-500/10 text-amber-400 border border-amber-500/30">
                      <AlertCircle size={10} className="text-amber-400 animate-pulse" />
                      MemPool Pending
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
