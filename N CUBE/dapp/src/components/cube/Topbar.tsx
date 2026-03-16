"use client";

import React, { useEffect, useState } from 'react';
import { useCUBE } from './CUBEContext';
import { Search, Wifi, WifiOff, Bell, Zap, X, Copy, Moon, Sun } from './Icons';

export function Topbar() {
  const { theme, setTheme, metrics, streamActive, setStreamActive, soundOn, setSoundOn } = useCUBE();
  const [time, setTime] = useState('');
  const [date, setDate] = useState('');

  useEffect(() => {
    const update = () => {
      const now = new Date();
      setTime(now.toLocaleTimeString('en-US',{hour:'2-digit',minute:'2-digit',second:'2-digit',hour12:false}));
      setDate(now.toLocaleDateString('en-US',{weekday:'short',month:'short',day:'numeric'}).toUpperCase());
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, []);

  const toggleTheme = () => {
    const newMode = theme === 'light' ? 'dark' : 'light';
    setTheme(newMode);
    if (newMode === 'light') document.body.classList.add('light');
    else document.body.classList.remove('light');
  };

  return (
    <header className="h-[56px] flex items-center justify-between px-4 border-b border-[var(--e1)] bg-[rgba(8,14,30,0.92)] backdrop-blur-[16px] shrink-0 z-10 relative gap-2.5 transition-colors">
      <div className="flex items-center gap-2 flex-1 min-w-0">
        <div className="flex items-center gap-1.5 bg-[var(--glass)] border border-[var(--e1)] rounded-lg py-1.5 px-2.5 text-[13px] text-[var(--t3)] shrink-0 min-w-0 flex-[0_0_200px]">
          <Search size={12} strokeWidth={2} />
          <input
            id="search-input"
            placeholder="Search… (Ctrl+K)"
            autoComplete="off"
            className="bg-transparent border-none outline-none text-[var(--t1)] text-[12px] w-full font-[var(--ff-b)] min-w-0"
          />
          <kbd className="font-[var(--ff-m)] text-[9px] text-[var(--t4)] border border-[var(--e1)] rounded px-1 shrink-0">⌃K</kbd>
        </div>
        <div className="shrink-0 flex flex-col justify-center">
          <span className="font-[var(--ff-m)] text-[11px] font-semibold text-[var(--t1)] tracking-[0.04em] leading-[1.2]">{time}</span>
          <span className="font-[var(--ff-m)] text-[9px] text-[var(--t3)] tracking-[0.05em]">{date}</span>
        </div>
      </div>

      <div className="flex items-center gap-1.5 shrink-0">
        <div className="flex items-center gap-1.5 py-1 px-2.5 rounded-full bg-[rgba(16,185,129,0.08)] border border-[rgba(16,185,129,0.25)]">
          <div className="w-1.5 h-1.5 rounded-full bg-[var(--go)] animate-[livePulse_1.5s_ease-in-out_infinite]"></div>
          <span className="font-[var(--ff-m)] text-[10px] font-semibold text-[var(--go)] tracking-[0.1em]">LIVE</span>
        </div>
        <div className="flex items-center gap-1 py-1 px-2 rounded-lg border border-[var(--e1)] bg-[var(--glass)] font-[var(--ff-m)] text-[11px]">
          <span className="text-[var(--go)]">{metrics.confirmedDecisions.toLocaleString()}</span>
          <span className="text-[var(--t4)]">/</span>
          <span className="text-[var(--warn)]">{metrics.pendingDecisions}</span>
          <span className="text-[var(--t3)] text-[9px] ml-0.5 font-[var(--ff-b)]">on-chain</span>
        </div>

        <button
          onClick={() => setStreamActive(!streamActive)}
          className={`w-[30px] h-[30px] rounded-[7px] border transition-all shrink-0 flex items-center justify-center ${
            streamActive 
              ? 'bg-[rgba(16,185,129,.07)] border-[rgba(16,185,129,.3)] text-[var(--go)]' 
              : 'bg-[var(--glass)] border-[var(--e1)] text-[var(--t3)]'
          }`}
          title="Toggle stream"
        >
          {streamActive ? <Wifi size={13} /> : <WifiOff size={13} />}
        </button>

        <div className="relative">
          <button className="w-[30px] h-[30px] rounded-[7px] border border-[var(--e1)] bg-[var(--glass)] flex items-center justify-center text-[var(--t2)] hover:border-[var(--e2)] hover:text-[var(--t1)] transition-all shrink-0">
            <Bell size={13} />
            {/* Notification Dot */}
            <span className="absolute top-[5px] right-[5px] w-1.5 h-1.5 rounded-full bg-[var(--vio)] border-[1.5px] border-[#080E1E]"></span>
          </button>
        </div>

        <button
          onClick={() => setSoundOn(!soundOn)}
          className={`w-[30px] h-[30px] rounded-[7px] border transition-all shrink-0 flex items-center justify-center ${
            soundOn 
              ? 'bg-[rgba(139,92,246,0.1)] border-[rgba(139,92,246,0.4)] text-[var(--vio2)]' 
              : 'bg-[var(--glass)] border-[var(--e1)] text-[var(--t2)] hover:border-[var(--e2)]'
          }`}
          title={soundOn ? "Sound: ON" : "Sound: OFF"}
        >
          {soundOn ? <Zap size={14} /> : <X size={13} />} {/* Zap is standin for sound on */}
        </button>

        <button
          onClick={toggleTheme}
          className="w-[30px] h-[30px] rounded-[7px] border border-[var(--e1)] bg-[var(--glass)] flex items-center justify-center text-[var(--t2)] hover:border-[var(--e2)] hover:text-[var(--t1)] transition-all shrink-0"
          title="Toggle theme"
        >
          {theme === 'light' ? <Moon size={13} /> : <Sun size={13} />}
        </button>

        <div className="w-[30px] h-[30px] rounded-full bg-gradient-to-br from-[#8B5CF6] to-[#22D3EE] flex items-center justify-center text-[10px] font-bold cursor-pointer shadow-[0_0_20px_rgba(139,92,246,0.45)] shrink-0 ml-1">
          OP
        </div>
      </div>
    </header>
  );
}
