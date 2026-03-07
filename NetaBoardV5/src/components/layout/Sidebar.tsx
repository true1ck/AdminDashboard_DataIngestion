import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { AppMode, ModuleId, ArchetypeKey } from '../../types';
import { BO_MODULES, PP_MODULES, ARCH_DISPLAY } from '../../data';
import { useNetaData } from '../../context/DataContext';

interface Props {
  mode: AppMode; curMod: ModuleId; ck: ArchetypeKey; collapsed: boolean; isPP: boolean;
  dispatched: Record<string, boolean>; collapsedSections: Record<string, boolean>;
  mobileOpen: boolean;
  onToggle: () => void; onNav: (mod: ModuleId) => void; onArchChange: (k: ArchetypeKey) => void;
  onSectionToggle: (sec: string) => void; toast: (msg: string, type?: string) => void;
  onMobileClose: () => void;
}

export default function Sidebar({ mode, curMod, ck, collapsed, isPP, dispatched, collapsedSections, mobileOpen, onToggle, onNav, onArchChange, onSectionToggle, toast, onMobileClose }: Props) {
  const { social: SOCIAL_FEED, alerts: ALERTS, arc: LIVE_ARC } = useNetaData();
  const a = LIVE_ARC[ck];
  const mods = mode === 'bo' ? BO_MODULES : PP_MODULES;
  const activeAlerts = ALERTS.filter(x => !dispatched[x.id]);
  let currentSec = '';

  const handleNav = (mod: ModuleId) => { onNav(mod); onMobileClose(); };

  return (
    <>
      {/* Mobile backdrop */}
      {mobileOpen && (
        <div className="fixed inset-0 bg-black/50 z-[99] md:hidden" onClick={onMobileClose} />
      )}
      <nav className={`fixed left-0 top-0 h-screen flex flex-col z-[100] transition-all duration-300 overflow-hidden
        max-md:w-[280px] max-md:shadow-2xl ${mobileOpen ? 'max-md:translate-x-0' : 'max-md:-translate-x-full'}`}
        role="navigation" aria-label="Main Navigation"
        style={{ width: collapsed ? 56 : 240, background: isPP ? 'linear-gradient(180deg,#28201A,#221B14)' : 'var(--sf)', borderRight: '1px solid var(--bd)' }}>
        <div className="p-4 flex items-center gap-2.5 border-b min-h-[56px]" style={{ borderColor: 'var(--bd)' }}>
          {isPP ? (
            <div className="font-display text-[17px] font-bold text-center leading-tight" style={{ color: 'var(--gd)' }}>Jan Setu<br />Portal<div className="font-deva text-[10px] mt-0.5" style={{ color: 'var(--mn)' }}>जन सेतु पोर्टल</div></div>
          ) : (
            <div className="font-display text-lg whitespace-nowrap overflow-hidden" style={{ color: 'var(--am)' }}><span style={{ color: 'var(--saf)', fontSize: 22 }}>ने</span> {!collapsed && 'NétaBoard'}</div>
          )}
          <div className="ml-auto cursor-pointer flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-md transition-colors hover:bg-white/5" style={{ color: 'var(--sub)' }} onClick={onToggle}>{collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}</div>
        </div>
        {mode === 'bo' && !collapsed && (
          <div className="px-4 py-2.5 border-b" style={{ borderColor: 'var(--bd)' }}>
            <select value={ck} onChange={e => { onArchChange(e.target.value as ArchetypeKey); toast(`🎭 Switched to ${LIVE_ARC[e.target.value as ArchetypeKey].n}`); }} className="w-full bg-transparent border-none text-xs font-semibold cursor-pointer outline-none" style={{ color: 'var(--tx)' }}>
              {(Object.keys(LIVE_ARC) as ArchetypeKey[]).map(k => (<option key={k} value={k} style={{ background: 'var(--sf)' }}>{LIVE_ARC[k].ic} {ARCH_DISPLAY[k]} ({LIVE_ARC[k].tg})</option>))}
            </select>
            <div className="text-[10px] mt-0.5" style={{ color: 'var(--sub)' }}>{a.n} · {a.cn.party} · {a.cn.const}</div>
          </div>
        )}
        <div className="flex-1 overflow-y-auto py-2">
          {mods.map((m, idx) => {
            if (m.sec) { currentSec = m.sec; const isCol = collapsedSections[currentSec]; return (<div key={`s-${idx}`}><div onClick={() => onSectionToggle(currentSec)} className="px-4 py-2 text-[9px] font-bold tracking-[1.5px] uppercase cursor-pointer flex justify-between items-center select-none transition-colors hover:text-[var(--am)]" style={{ color: 'var(--mn)' }} role="heading" aria-level={2} aria-expanded={!isCol}>{!collapsed && currentSec}<span className="text-[8px] transition-transform" style={{ transform: isCol ? 'rotate(-90deg)' : 'none' }}>▼</span></div></div>); }
            if (collapsedSections[currentSec]) return null;
            const isActive = curMod === m.k;
            const badge = m.k === 'alerts' ? activeAlerts.length : m.k === 'social' ? SOCIAL_FEED.filter(s => !s.re).length : 0;
            return (
              <div key={m.k} onClick={() => handleNav(m.k as ModuleId)} tabIndex={0} onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleNav(m.k as ModuleId); } }}
                className={`sb-item ${isActive ? 'active' : ''}`} role="button" aria-label={`${m.l}${badge > 0 ? ` (${badge} pending)` : ''}`} aria-current={isActive ? 'page' : undefined}>
                <span className="text-lg flex-shrink-0 w-6 text-center" aria-hidden="true">{m.ic}</span>
                {!collapsed && (<>
                  <span className="sb-label text-[13px] overflow-hidden" style={{ color: isActive ? 'var(--tx)' : 'var(--sub)' }}>{m.l}</span>
                  {m.k === 'pillars' && <span className="inline-flex items-end gap-px h-3.5 ml-1">{[78, 62, 72, 88, 65, 70, 55, 45].map((v, i) => <span key={i} style={{ width: 2, height: Math.max(1, Math.round(v / 100 * 14)), background: 'var(--am)', borderRadius: 1, opacity: .7 }} />)}</span>}
                  {m.k === 'analytics' && <span className="inline-flex items-end gap-px h-3.5 ml-1">{[60, 64, 68, 65, 72, 74, 76, 78].map((v, i) => <span key={i} style={{ width: 2, height: Math.max(1, Math.round(v / 100 * 14)), background: 'var(--em)', borderRadius: 1, opacity: .7 }} />)}</span>}
                  {m.k === 'social' && <span className="inline-flex items-end gap-px h-3.5 ml-1">{[45, 52, 38, 65, 42, 58, 70, 55].map((v, i) => <span key={i} style={{ width: 2, height: Math.max(1, Math.round(v / 100 * 14)), background: '#A855F7', borderRadius: 1, opacity: .7 }} />)}</span>}
                  {badge > 0 && <span className="ml-auto flex-shrink-0 text-[9px] font-bold px-1.5 py-0.5 rounded-full text-white" style={{ background: 'var(--rd)' }}>{badge}</span>}
                </>)}
              </div>
            );
          })}
        </div>
      </nav>
    </>
  );
}
