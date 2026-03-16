"use client";

import React, { createContext, useContext, useState, ReactNode } from 'react';

type Page = 'dashboard' | 'log' | 'audit' | 'integrity' | 'network' | 'settings';

interface CUBEState {
  page: Page;
  setPage: (page: Page) => void;
  sidebarOpen: boolean;
  setSidebarOpen: (o: boolean) => void;
  searchQ: string;
  setSearchQ: (q: string) => void;
  streamActive: boolean;
  setStreamActive: (a: boolean) => void;
  soundOn: boolean;
  setSoundOn: (s: boolean) => void;
  theme: 'light' | 'dark';
  setTheme: (t: 'light' | 'dark') => void;
  metrics: {
    confirmedDecisions: number;
    pendingDecisions: number;
    tps: number;
    activeNodes: number;
    trustScore: number;
    uptime: number;
    failedDecisions: number;
    walletAddress: string | null;
  };
  setMetrics: (m: any) => void; 
}

const CUBEContext = createContext<CUBEState | undefined>(undefined);

export function CUBEProvider({ children }: { children: ReactNode }) {
  const [page, setPage] = useState<Page>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [searchQ, setSearchQ] = useState('');
  const [streamActive, setStreamActive] = useState(true);
  const [soundOn, setSoundOn] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  const [metrics, setMetrics] = useState({
    confirmedDecisions: 39120,
    pendingDecisions: 3241,
    tps: 142,
    activeNodes: 6,
    trustScore: 91,
    uptime: 99.82,
    failedDecisions: 456,
    walletAddress: null
  });

  return (
    <CUBEContext.Provider value={{
      page, setPage,
      sidebarOpen, setSidebarOpen,
      searchQ, setSearchQ,
      streamActive, setStreamActive,
      soundOn, setSoundOn,
      theme, setTheme,
      metrics, setMetrics
    }}>
      {children}
    </CUBEContext.Provider>
  );
}

export function useCUBE() {
  const context = useContext(CUBEContext);
  if (context === undefined) {
    throw new Error('useCUBE must be used within a CUBEProvider');
  }
  return context;
}
