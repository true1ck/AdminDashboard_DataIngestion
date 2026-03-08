import { Bell, Search, Menu } from 'lucide-react';
import type { AppMode, ModuleId } from '../../types';
import { PILL_LABELS, BO_MODULES, PP_MODULES } from '../../data';
import { EB } from '../../data/engines';
import ServiceStatusBar from './ServiceStatusBar';

interface Props {
  mode: AppMode; curMod: ModuleId; isPP: boolean; collapsed: boolean;
  nri: number; fisScore: number; aIcon: string;
  lang: string; notifCount: number; evtPanelOpen: boolean;
  onModeSwitch: (m: AppMode) => void; onNotifToggle: () => void;
  onEvtToggle: () => void; onLangToggle: () => void;
  onMobileMenu: () => void; navTo: (mod: ModuleId) => void;
  toast: (msg: string, type?: string) => void;
}

export default function Topbar({ mode, curMod, isPP, collapsed, nri, fisScore, aIcon, lang, notifCount, evtPanelOpen, onModeSwitch, onNotifToggle, onEvtToggle, onLangToggle, onMobileMenu, navTo, toast }: Props) {
  const mods = mode === 'bo' ? BO_MODULES : PP_MODULES;
  const curModObj = mods.find(x => x.k === curMod);

  return (
    <header className="fixed right-0 h-[56px] flex items-center px-3 md:px-5 gap-2 md:gap-4 z-[90] transition-all duration-300 max-md:!left-0"
      role="banner" aria-label="Dashboard Header"
      style={{ left: collapsed ? 56 : 240, background: isPP ? 'linear-gradient(90deg,#28201A,#2E2518,#28201A)' : 'var(--sf)', borderBottom: '1px solid var(--bd)' }}>
      <div className="cursor-pointer md:hidden" style={{ color: 'var(--sub)' }} onClick={onMobileMenu}><Menu size={22} /></div>
      <div className="font-display text-[15px] whitespace-nowrap" style={{ color: 'var(--tx)' }}>{curModObj?.l || 'NetaBoard'}</div>
      {/* Global Search */}
      <div className="flex-1 max-w-[360px] relative hidden md:block">
        <input type="text" placeholder="Search modules... (Ctrl+K)" className="w-full py-2 pl-8 pr-3 rounded-lg text-xs outline-none transition-colors" style={{ background: 'var(--cd)', border: '1px solid var(--bd)', color: 'var(--tx)' }}
          onChange={e => { const q = e.target.value.toLowerCase(); if (!q) return; const m = mods.find(x => x.l?.toLowerCase().includes(q)); if (m?.k) navTo(m.k as ModuleId); }} />
        <span className="absolute left-2.5 top-1/2 -translate-y-1/2" style={{ color: 'var(--mn)' }}><Search size={14} /></span>
      </div>
      <ServiceStatusBar />
      <div className="flex-1" />
      {/* Mode Toggle */}
      <div className="flex rounded-lg overflow-hidden flex-shrink-0" style={{ background: 'var(--cd)', border: '1px solid var(--bd)' }}>
        {(['bo', 'pp'] as AppMode[]).map(m => (
          <div key={m} onClick={() => onModeSwitch(m)} className="px-3.5 py-1.5 text-[11px] font-semibold cursor-pointer transition-all"
            style={{ color: mode === m ? '#fff' : 'var(--sub)', background: mode === m ? (isPP && m === 'pp' ? 'var(--gd)' : 'var(--am)') : 'transparent', borderRadius: mode === m ? 6 : 0 }}>
            {m === 'bo' ? 'Back Office' : 'जन सेतु'}
          </div>
        ))}
      </div>
      {/* NRI & FIS */}
      {mode === 'bo' && (<>
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg" style={{ background: 'var(--cd)' }}><span className="text-[10px]" style={{ color: 'var(--sub)' }}>NRI</span><span className="font-mono text-[15px] font-bold" style={{ color: 'var(--am)' }}>{nri.toFixed(1)}</span></div>
        <div className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px]" style={{ background: 'var(--cd)' }}><span style={{ color: 'var(--sub)' }}>FIS</span><span className="font-mono font-bold" style={{ color: 'var(--gd)' }}>{fisScore}</span></div>
      </>)}
      {/* Event Bus Bell */}
      {mode === 'bo' && (
        <div className="relative cursor-pointer text-[15px] p-1.5" onClick={onEvtToggle} title="Event Bus">🔀<div className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full text-[8px] font-bold flex items-center justify-center text-white" style={{ background: 'var(--am)' }}>{EB.getLog().length}</div></div>
      )}
      {/* Lang Toggle */}
      <div className="cursor-pointer text-[11px] font-bold px-2 py-1 rounded-md" style={{ border: '1px solid var(--bd)', color: 'var(--tx)' }} onClick={onLangToggle}>हि/En</div>
      {/* Notifications */}
      <div className="relative cursor-pointer p-1.5" onClick={onNotifToggle}><Bell size={20} style={{ color: 'var(--sub)' }} /><div className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full text-[8px] font-bold flex items-center justify-center text-white" style={{ background: 'var(--rd)' }}>{notifCount}</div></div>
      {mode === 'bo' && <div className="w-8 h-8 rounded-full flex items-center justify-center text-base cursor-pointer" style={{ background: 'var(--am)' }}>{aIcon}</div>}
    </header>
  );
}
