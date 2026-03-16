"use client";

import React from 'react';
import { CUBEProvider, useCUBE } from './CUBEContext';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';

function LayoutInner({ children }: { children: React.ReactNode }) {
  // We can eventually conditionally render children based on `page` from useCUBE
  return (
    <div id="app" className="flex h-screen overflow-hidden relative">
      <div className="bg-grid"></div>
      <div className="bg-orb1"></div>
      <div className="bg-orb2"></div>

      <Sidebar />

      <div id="main" className="flex flex-col flex-1 overflow-hidden min-w-0 relative z-10 min-h-0">
        <Topbar />
        <div id="page" className="flex-1 overflow-y-auto flex flex-col scrollbar-custom">
          {children}
        </div>
      </div>
    </div>
  );
}

export function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <CUBEProvider>
      <LayoutInner>{children}</LayoutInner>
    </CUBEProvider>
  );
}
