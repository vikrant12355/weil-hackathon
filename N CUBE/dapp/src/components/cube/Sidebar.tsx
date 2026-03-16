"use client";

import React from 'react';
import { useCUBE } from './CUBEContext';
import { LayoutGrid, Radio, ShieldCheck, Activity, Server, Settings, Shield, PanelLeft, PanelLeftClose } from './Icons';

type NavItem = {
  id: 'dashboard' | 'log' | 'audit' | 'integrity' | 'network' | 'settings';
  label: string;
  icon: React.ElementType;
};

const NAV: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutGrid },
  { id: 'log', label: 'Decision Log', icon: Radio },
  { id: 'audit', label: 'Audit Vault', icon: ShieldCheck },
  { id: 'integrity', label: 'Integrity', icon: Activity },
  { id: 'network', label: 'Network', icon: Server },
  { id: 'settings', label: 'Settings', icon: Settings },
];

export function Sidebar() {
  const { page, setPage, sidebarOpen, setSidebarOpen } = useCUBE();

  return (
    <aside
      className={`flex flex-col bg-[var(--card)] backdrop-blur-[24px] border-r border-[#8B5CF6]/15 relative z-10 transition-all duration-250 ease-in-out shrink-0 ${
        sidebarOpen ? 'w-[220px]' : 'w-[58px]'
      }`}
    >
      <div className="h-[56px] flex items-center gap-3 px-[14px] border-b border-[#8B5CF6]/15 shrink-0 overflow-hidden">
        <div className="w-8 h-8 min-w-[32px] rounded-lg bg-gradient-to-br from-[#8B5CF6] to-[#22D3EE] flex items-center justify-center shadow-[0_0_20px_rgba(139,92,246,0.45)]">
          <Shield className="text-white" size={15} strokeWidth={2.5} />
        </div>
        <div className="overflow-hidden whitespace-nowrap">
          <div className="font-[Syne] font-extrabold text-[15px] tracking-[0.08em]">CUBE</div>
          <div className="font-[JetBrains_Mono] text-[9px] text-[var(--t3)] tracking-[0.1em] mt-[1px]">PDP v2.4.1</div>
        </div>
      </div>
      
      <nav className="flex-1 py-2 overflow-hidden">
        {NAV.map((n) => (
          <button
            key={n.id}
            onClick={() => setPage(n.id)}
            className={`w-full flex items-center gap-3 py-2.5 px-[14px] border-r-2 transition-all whitespace-nowrap text-[13px] font-medium text-left overflow-hidden ${
              page === n.id
                ? 'text-[#A78BFA] border-[#8B5CF6] bg-[rgba(139,92,246,0.08)]'
                : 'text-[var(--t3)] border-transparent hover:text-[var(--t2)] hover:bg-[var(--glass)]'
            }`}
          >
            <span className={`shrink-0 w-4 h-4 flex items-center justify-center ${page === n.id ? 'filter drop-shadow-[0_0_6px_var(--vio)]' : ''}`}>
              <n.icon size={16} strokeWidth={page === n.id ? 2.5 : 2} />
            </span>
            <span style={{ display: sidebarOpen ? 'block' : 'none' }}>{n.label}</span>
          </button>
        ))}
      </nav>

      <div className="p-2.5 border-t border-[#8B5CF6]/15">
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="w-full p-[9px] rounded-lg border border-[var(--e1)] text-[var(--t3)] flex items-center justify-center transition-all hover:text-[var(--t2)] hover:border-[var(--e2)] hover:bg-[var(--glass)]"
        >
          {sidebarOpen ? <PanelLeftClose size={14} /> : <PanelLeft size={14} />}
        </button>
      </div>
    </aside>
  );
}
