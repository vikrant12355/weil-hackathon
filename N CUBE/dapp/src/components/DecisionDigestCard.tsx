import React from 'react';
import { Shield, BrainCircuit, Activity, CheckCircle, ExternalLink, Hash } from 'lucide-react';

export default function DecisionDigestCard() {
  const hash = '0x92ad33bc12a';

  return (
    <div className="bg-[#0b1121] border border-[#2d1b69] rounded-xl shadow-[0_0_15px_rgba(168,130,255,0.1)] overflow-hidden h-[500px] flex flex-col">
      <div className="px-5 py-4 bg-[#050811]/90 backdrop-blur-md border-b border-[#2d1b69] flex items-center gap-3">
        <Shield className="text-[#a882ff]" size={22} strokeWidth={2.5} />
        <h2 className="text-sm font-semibold text-white tracking-widest uppercase font-mono">Decision Digest</h2>
      </div>

      <div className="p-5 flex-1 overflow-y-auto space-y-6 bg-gradient-to-b from-transparent to-[#080d1a]">
        
        {/* Input Data */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-[11px] font-bold text-gray-400 uppercase tracking-widest font-mono">
            <Activity size={14} className="text-[#a882ff]" /> Input Data
          </div>
          <div className="bg-[#141b30] border border-[#232a45] rounded-lg p-3.5 text-blue-200 font-medium text-sm shadow-[inset_0_1px_4px_rgba(0,0,0,0.5)]">
            Heart Rate: <span className="font-bold text-white">110 bpm</span>
          </div>
        </div>

        {/* AI Logic */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-[11px] font-bold text-gray-400 uppercase tracking-widest font-mono">
            <BrainCircuit size={14} className="text-[#a882ff]" /> AI Reasoning
          </div>
          <div className="bg-[#141b30] border border-[#232a45] rounded-lg p-3.5 text-gray-300 italic text-[13px] leading-relaxed relative">
            <div className="absolute top-0 left-0 w-1 h-full bg-[#a882ff] rounded-l-lg"></div>
            &quot;Heart rate exceeds threshold and patient risk profile indicates anomaly.&quot;
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 gap-5">
          <div className="space-y-2 bg-[#141b30] border border-[#232a45] p-4 rounded-xl flex flex-col justify-center relative overflow-hidden">
            <div className="absolute top-0 right-0 w-16 h-16 bg-[#a882ff] opacity-10 rounded-full blur-xl transform translate-x-4 -translate-y-4"></div>
            <div className="flex items-center gap-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest font-mono">
              <CheckCircle size={12} className="text-amber-400" /> Confidence
            </div>
            <div className="text-3xl font-black text-white leading-none tracking-tighter mt-1">
              87<span className="text-xl text-purple-400 font-normal">%</span>
            </div>
            <div className="mt-2">
               <p className="text-[9px] text-amber-300 font-black bg-amber-900/30 border border-amber-500/30 rounded px-1.5 py-0.5 inline-block uppercase tracking-widest">
                 Human Review Needed
               </p>
            </div>
          </div>

          <div className="space-y-2 bg-[#141b30] border border-[#232a45] p-4 rounded-xl flex flex-col justify-center group hover:border-[#a882ff]/50 transition-colors">
            <div className="flex items-center gap-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest font-mono">
              <Hash size={12} className="text-[#a882ff]" /> Decision Hash
            </div>
            <a 
              href={`https://explorer.pdpchain.local/tx/${hash}`} 
              target="_blank" 
              rel="noreferrer"
              className="flex flex-col justify-center mt-1"
            >
              <span className="font-mono text-[#a882ff] font-bold group-hover:text-white transition-colors text-xs truncate max-w-full">
                 {hash}
              </span>
              <span className="text-[10px] text-purple-300/60 flex items-center gap-1 mt-1.5 font-bold uppercase tracking-widest group-hover:text-purple-300 transition-colors">
                Verify on Explorer <ExternalLink size={10} />
              </span>
            </a>
          </div>
        </div>
        
      </div>
    </div>
  );
}
