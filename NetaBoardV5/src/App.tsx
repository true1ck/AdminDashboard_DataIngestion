import { useState, useCallback, useMemo, useEffect, useRef, lazy, Suspense } from 'react';
import { AnimatePresence } from 'framer-motion';
import type { AppMode, ModuleId, ArchetypeKey } from './types';
import { useIASCL } from './hooks/useIASCL';
import { PageTransition, MotionToast } from './components/shared/Motion';
import ErrorBoundary from './components/shared/ErrorBoundary';
import Sidebar from './components/layout/Sidebar';
import Topbar from './components/layout/Topbar';
const ContentRouter = lazy(() => import('./components/ContentRouter'));
import { useLang } from './context/LangContext';
import type { Lang } from './data/i18n';
import { generatePDFReport } from './utils/exportPDF';
import {
  PILLARS, NOTIFS, SEV_C, PILL_LABELS,
  BO_MODULES, PP_MODULES, HERO_SLIDES, getNRI, computeFIS,
} from './data';
import { EB, AI_RESOLVER } from './data/engines';
import { Tag } from './components/shared/Primitives';

import { DataProvider, useNetaData } from './context/DataContext';

// ═══ MAIN APP ═══
function MainApp() {
  const [mode, setMode] = useState<AppMode>('bo');
  const [curMod, setCurMod] = useState<ModuleId>('overview');
  const [curPill, setCurPill] = useState('dashboard');
  const [ck, setCk] = useState<ArchetypeKey>('grassroots');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [dispatched, setDispatched] = useState<Record<string, boolean>>({});
  const [toasts, setToasts] = useState<{ id: number; msg: string; type: string }[]>([]);
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({});
  const { lang, setLang } = useLang();
  const [drillOpen, setDrillOpen] = useState(false);
  const [drillTitle, setDrillTitle] = useState('');
  const [drillContent, setDrillContent] = useState<{ label: string; value: string; color: string }[]>([]);
  const [exportOpen, setExportOpen] = useState(false);
  const [showAiConsent, setShowAiConsent] = useState(false);
  const [evtPanelOpen, setEvtPanelOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // S1.1 — Live IASCL State Machine
  const iascl = useIASCL();

  // S1.3 — File upload refs
  const ocrFileRef = useRef<HTMLInputElement>(null);
  const asrAudioRef = useRef<HTMLInputElement>(null);
  const asrVideoRef = useRef<HTMLInputElement>(null);

  // S2.2 — Social auto-reply state
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyDraft, setReplyDraft] = useState('');

  // Hero slideshow state
  const [heroSlide, setHeroSlide] = useState(0);
  const heroTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  // DataContext overrides
  const { arc: ARC, feedback: FEEDBACK, alerts: ALERTS, isLoading, error } = useNetaData();

  const a = ARC[ck];
  const nri = useMemo(() => a ? Math.max(0, Math.min(100, getNRI(a))) : 0, [a]);
  const fis = useMemo(() => computeFIS(FEEDBACK), [FEEDBACK]);
  const mods = mode === 'bo' ? BO_MODULES : PP_MODULES;
  const isPP = mode === 'pp';
  const activeAlerts = ALERTS.filter(x => !dispatched[x.id]);

  // Drill-down
  const drillDown = useCallback((type: string) => {
    const items: { label: string; value: string; color: string }[] = [];
    let title = '';
    if (type === 'nri') {
      title = `🎯 NRI Score: ${nri.toFixed(1)} — 15 Pillar Breakdown`;
      PILLARS.forEach(p => { const s = a.dm[p.k] || 50; items.push({ label: `${p.i} ${p.l}`, value: `${s}/100 (Weight: ${p.w}%)`, color: s >= 70 ? 'var(--em)' : s >= 40 ? 'var(--gd)' : 'var(--rd)' }); });
    } else if (type === 'fis') {
      title = `📡 FIS Score: ${fis.score} — Sub-Score Breakdown`;
      [{ n: 'Volume', v: fis.vol }, { n: 'Sentiment', v: fis.snt }, { n: 'Diversity', v: fis.div }, { n: 'Credibility', v: fis.cred }].forEach(s => items.push({ label: s.n, value: `${s.v}/100`, color: s.v >= 70 ? 'var(--em)' : s.v >= 40 ? 'var(--gd)' : 'var(--rd)' }));
    } else if (type === 'alerts') {
      title = `⚡ ${activeAlerts.length} Active Alerts`;
      activeAlerts.forEach(al => items.push({ label: `${al.ic} ${al.t}`, value: `${al.sv.toUpperCase()} · ${al.tm}`, color: SEV_C[al.sv] }));
    } else if (type === 'booths') {
      title = `🗳 ${a.cn.booth} Booths — Ward Breakdown`;
      [{ w: 'Ward 1-5', n: 380, st: 'safe' }, { w: 'Ward 6-10', n: 350, st: 'lean' }, { w: 'Ward 11-15', n: 320, st: 'toss' }, { w: 'Ward 16-20', n: 392, st: 'safe' }, { w: 'Ward 21-25', n: 400, st: 'lean' }].forEach(b => items.push({ label: b.w, value: `${b.n} booths · ${b.st.toUpperCase()}`, color: b.st === 'safe' ? 'var(--em)' : b.st === 'lean' ? 'var(--gd)' : 'var(--rd)' }));
    }
    setDrillTitle(title);
    setDrillContent(items);
    setDrillOpen(true);
  }, [nri, a, fis, activeAlerts]);

  // AI tier detection on mount (probes Claude API — if key present, upgrades to Tier 4)
  useEffect(() => { AI_RESOLVER.detect(); }, []);

  // AI consent
  useEffect(() => {
    if (sessionStorage.getItem('aiConsentDismissed')) return;
    const t = setTimeout(() => setShowAiConsent(true), 3000);
    return () => clearTimeout(t);
  }, []);

  // Hero slideshow auto-advance
  useEffect(() => {
    if (curMod === 'pp_parichay') {
      heroTimer.current = setInterval(() => setHeroSlide(prev => (prev + 1) % HERO_SLIDES.length), 4000);
      return () => { if (heroTimer.current) clearInterval(heroTimer.current); };
    } else {
      if (heroTimer.current) clearInterval(heroTimer.current);
    }
  }, [curMod]);

  const toast = useCallback((msg: string, type = 'info') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, msg, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
  }, []);

  const navTo = useCallback((mod: ModuleId, pill?: string) => {
    setCurMod(mod);
    const allMods = mode === 'bo' ? BO_MODULES : PP_MODULES;
    const m = allMods.find(x => x.k === mod);
    setCurPill(m?.pills?.length ? (pill || m.pills[0]) : '');
  }, [mode]);

  const handleModeSwitch = useCallback((m: AppMode) => {
    setMode(m);
    document.body.classList.toggle('pp-mode', m === 'pp');
    setCurMod(m === 'bo' ? 'overview' : 'pp_parichay');
    setCurPill(m === 'bo' ? 'dashboard' : '');
  }, []);

  // Keyboard shortcuts + S2.3 Event Bus subscriptions
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === 'k') { e.preventDefault(); toast('Search: Focus global search (Ctrl+K)'); }
      if (e.key === 'Escape') { setNotifOpen(false); setDrillOpen(false); setExportOpen(false); setEvtPanelOpen(false); }
    };
    document.addEventListener('keydown', handler);
    // Event Bus subscriptions
    EB.on(EB.TOPICS.CRISIS_DETECTED, 'alerts', (p) => toast(`🚨 Crisis: ${(p as { title?: string }).title || 'detected'}`, 'crisis'));
    EB.on(EB.TOPICS.ALLIANCE_THREAT, 'overview', () => toast('Alliance threat detected!', 'high'));
    EB.on(EB.TOPICS.NRI_CHANGED, 'analytics', (p) => toast(`NRI changed: ${(p as { delta?: number }).delta || 0}`, 'info'));
    EB.on(EB.TOPICS.FEEDBACK_RECEIVED, 'pratikriya', () => toast('New feedback received', 'success'));
    return () => document.removeEventListener('keydown', handler);
  }, [toast]);

  // Support /ingest deep link
  useEffect(() => {
    if (window.location.pathname === '/ingest') {
      setCurMod('ingest');
    }
  }, []);

  if (isLoading) return <div className="h-screen flex items-center justify-center p-8 bg-[var(--bg)]" style={{ fontFamily: 'var(--ff)' }}><div className="nb-card text-center py-12 anim w-full max-w-sm"><div className="text-4xl mb-3">📡</div><div className="text-sm font-bold" style={{ color: 'var(--tx)' }}>Syncing Live Data...</div><div className="text-xs mt-1" style={{ color: 'var(--sub)' }}>Connecting to NetaBoard Backend</div></div></div>;
  if (error) return <div className="h-screen flex items-center justify-center p-8 bg-[var(--bg)]" style={{ color: 'var(--rd)' }}>Error: {error}</div>;
  if (!a) return <div className="h-screen flex items-center justify-center p-8 bg-[var(--bg)]">Archetype missing</div>;

  // ═══ TOPBAR ═══
  // ═══ PILLS ═══
  const renderPills = () => {
    const m = mods.find(x => x.k === curMod);
    if (!m?.pills?.length || m.pills.length <= 1) return null;
    return (
      <div className="flex gap-1.5 mb-4 flex-wrap">
        {m.pills.map(p => (
          <div key={p} onClick={() => setCurPill(p)}
            className={`nb-pill ${curPill === p ? 'nb-pill-active' : ''}`}>
            {PILL_LABELS[p] || p}
          </div>
        ))}
      </div>
    );
  };

  // ═══ NOTIFICATION PANEL ═══
  const renderNotifPanel = () => {
    if (!notifOpen) return null;
    return (
      <div className="fixed top-[56px] right-0 w-[380px] max-h-[calc(100vh-56px)] overflow-y-auto z-[200]"
        style={{ background: 'var(--sf)', borderLeft: '1px solid var(--bd)', boxShadow: '-4px 0 20px rgba(0,0,0,.3)' }}>
        <div className="p-4 flex justify-between items-center" style={{ borderBottom: '1px solid var(--bd)' }}>
          <h3 className="text-sm font-bold" style={{ color: 'var(--tx)' }}>🔔 Notifications</h3>
          <span className="cursor-pointer" style={{ color: 'var(--sub)' }} onClick={() => setNotifOpen(false)}>✕</span>
        </div>
        {NOTIFS.map(n => (
          <div key={n.id} className="px-4 py-3 cursor-pointer transition-colors hover:bg-white/5"
            style={{ borderBottom: '1px solid var(--bd)', borderLeft: n.read ? 'none' : '3px solid var(--am)' }}
            onClick={() => { navTo(n.mod as ModuleId); setNotifOpen(false); }}>
            <Tag bg={SEV_C[n.sev] || '#6B5F8A'}>{n.sev.toUpperCase()}</Tag>
            <span className="text-[10px] float-right" style={{ color: 'var(--mn)' }}>{n.tm}</span>
            <div className="text-xs mt-1" style={{ color: 'var(--sub)' }}>{n.tx}</div>
          </div>
        ))}
      </div>
    );
  };

  // ═══ MAIN RENDER ═══
  return (
    <div className="h-screen overflow-hidden" style={{ fontFamily: 'var(--ff)', background: 'var(--bg)', color: 'var(--tx)' }}>
      {/* S3.2 — Skip Link for Accessibility */}
      <a href="#mainContent" className="absolute -top-10 left-0 z-[10000] px-4 py-2 text-xs font-bold rounded-br-lg focus:top-0 transition-all" style={{ background: '#138808', color: '#fff' }}>
        Skip to main content / मुख्य सामग्री पर जाएं
      </a>
      <Sidebar mode={mode} curMod={curMod} ck={ck} collapsed={sidebarCollapsed} isPP={isPP}
        dispatched={dispatched} collapsedSections={collapsedSections}
        mobileOpen={mobileMenuOpen} onMobileClose={() => setMobileMenuOpen(false)}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} onNav={navTo}
        onArchChange={setCk} onSectionToggle={(sec: string) => setCollapsedSections(p => ({ ...p, [sec]: !p[sec] }))}
        toast={toast} />
      <Topbar mode={mode} curMod={curMod} isPP={isPP} collapsed={sidebarCollapsed}
        nri={nri} fisScore={fis.score} aIcon={a.ic} lang={lang} notifCount={NOTIFS.filter(n => !n.read).length}
        evtPanelOpen={evtPanelOpen}
        onModeSwitch={handleModeSwitch} onNotifToggle={() => setNotifOpen(!notifOpen)}
        onEvtToggle={() => setEvtPanelOpen(!evtPanelOpen)}
        onLangToggle={() => { const next = lang === 'hi' ? 'en' : 'hi'; setLang(next as Lang); toast(next === 'en' ? 'Language: English' : 'भाषा: हिंदी'); }}
        onMobileMenu={() => setMobileMenuOpen(!mobileMenuOpen)} navTo={navTo} toast={toast} />
      {renderNotifPanel()}

      {/* Drill-Down Overlay */}
      {drillOpen && (
        <div className="fixed inset-0 z-[600] flex items-start justify-center pt-16 px-5" style={{ background: 'rgba(0,0,0,.65)' }} onClick={() => setDrillOpen(false)}>
          <div className="rounded-2xl w-full max-w-[720px] max-h-[80vh] overflow-y-auto" style={{ background: 'var(--sf)', border: '1px solid var(--bd)' }} onClick={e => e.stopPropagation()}>
            <div className="p-4 flex justify-between items-center sticky top-0 z-10 rounded-t-2xl" style={{ background: 'var(--sf)', borderBottom: '1px solid var(--bd)' }}>
              <h3 className="text-sm font-bold font-display" style={{ color: 'var(--tx)' }}>{drillTitle}</h3>
              <span className="cursor-pointer text-lg px-2 py-1 rounded-md transition-colors hover:bg-white/5" style={{ color: 'var(--sub)' }} onClick={() => setDrillOpen(false)}>✕</span>
            </div>
            <div className="p-4">
              {drillContent.map((item, i) => (
                <div key={i} className="p-2.5 mb-1.5 rounded-lg text-[11px]" style={{ borderLeft: `4px solid ${item.color}`, background: 'var(--cd)' }}>
                  <div className="flex justify-between"><b style={{ color: 'var(--tx)' }}>{item.label}</b><span style={{ color: item.color }}>{item.value}</span></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Export Modal */}
      {exportOpen && (
        <div className="fixed inset-0 z-[500] flex items-center justify-center" style={{ background: 'rgba(0,0,0,.6)' }} onClick={() => setExportOpen(false)}>
          <div className="rounded-2xl p-6 w-[90%] max-w-[480px]" style={{ background: 'var(--sf)', border: '1px solid var(--bd)' }} onClick={e => e.stopPropagation()}>
            <h2 className="font-display text-lg mb-3.5" style={{ color: 'var(--tx)' }}>📤 Export Report</h2>
            <p className="text-xs mb-3.5" style={{ color: 'var(--sub)' }}>Generate a PDF report.</p>
            {['Current View', 'Weekly NRI Report'].map(opt => (
              <label key={opt} className="flex items-center gap-2 p-2.5 rounded-lg mb-2 cursor-pointer" style={{ background: 'var(--cd)', border: '1px solid var(--bd)' }}>
                <input type="radio" name="rpt" defaultChecked={opt === 'Current View'} /><span className="text-xs" style={{ color: 'var(--tx)' }}>{opt}</span>
              </label>
            ))}
            <div className="flex gap-2 justify-end mt-4">
              <button className="nb-btn" onClick={() => setExportOpen(false)}>Cancel</button>
              <button className="nb-btn nb-btn-primary" onClick={async () => { await generatePDFReport(a, ck); toast('📥 PDF Report generated & downloading!', 'success'); setExportOpen(false); }}>📥 Generate</button>
            </div>
          </div>
        </div>
      )}

      {/* AI Consent Banner */}
      {showAiConsent && AI_RESOLVER.tier >= 3 && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 flex items-center gap-3 px-5 py-3 rounded-xl z-[999] max-w-[600px]" style={{ background: 'var(--sf)', border: '1px solid var(--am)', boxShadow: '0 8px 32px rgba(0,0,0,.4)', animation: 'fadeUp .3s ease' }}>
          <span className="text-xl">🤖</span>
          <div className="flex-1"><div className="text-xs font-semibold" style={{ color: 'var(--tx)' }}>AI-Powered Dashboard Active</div><div className="text-[10px] mt-0.5" style={{ color: 'var(--sub)' }}>NétaBoard uses 4-tier AI for political recommendations. Data stays in session.</div></div>
          <button className="nb-btn nb-btn-primary text-[11px]" onClick={() => { setShowAiConsent(false); sessionStorage.setItem('aiConsentDismissed', 'true'); }}>Got it</button>
        </div>
      )}

      {/* Event Bus Panel */}
      {evtPanelOpen && (
        <div className="fixed top-[56px] right-0 w-[420px] max-h-[calc(100vh-56px)] overflow-y-auto z-[200]" style={{ background: 'var(--sf)', borderLeft: '1px solid var(--bd)', boxShadow: '-4px 0 20px rgba(0,0,0,.3)' }}>
          <div className="p-3 flex justify-between items-center" style={{ borderBottom: '1px solid var(--bd)', background: 'linear-gradient(135deg,rgba(124,58,237,.12),rgba(5,150,105,.06))' }}>
            <h3 className="text-[13px] font-bold" style={{ color: 'var(--am)' }}>🔀 Cross-Module Event Bus</h3>
            <span className="cursor-pointer" style={{ color: 'var(--sub)' }} onClick={() => setEvtPanelOpen(false)}>✕</span>
          </div>
          <div className="p-3 text-center"><div className="text-xl font-bold" style={{ color: 'var(--am)' }}>{EB.getTopicCount()}</div><div className="text-[9px]" style={{ color: 'var(--sub)' }}>Political Topics</div><div className="text-[11px] mt-2" style={{ color: 'var(--gd)' }}>{EB.getLog().length} events</div></div>
          <div className="px-3 pb-3">
            <button className="w-full py-2.5 rounded-lg text-[11px] font-bold text-white cursor-pointer border-none" style={{ background: 'linear-gradient(135deg,var(--am),var(--saf))' }}
              onClick={() => { EB.emit(EB.TOPICS.NEGATIVE_TREND, { platform: 'X' }, 'social'); setTimeout(() => EB.emit(EB.TOPICS.CRISIS_DETECTED, { title: 'Viral video' }, 'shield'), 800); setTimeout(() => EB.emit(EB.TOPICS.ALLIANCE_THREAT, { partner: 'Junior' }, 'gath'), 1600); setTimeout(() => { EB.emit(EB.TOPICS.NRI_CHANGED, { delta: -2.1 }, 'analytics'); toast('Cascade complete: 4 events fired'); setEvtPanelOpen(prev => { return prev; }); }, 2400); }}>
              Simulate Cascade
            </button>
          </div>
          <div className="px-3 max-h-[350px] overflow-y-auto">
            {EB.getLog().slice(0, 20).map((ev, i) => (
              <div key={i} className="text-[10px] mb-1 p-1.5 rounded" style={{ background: 'rgba(124,58,237,.06)', borderLeft: '2px solid var(--am)' }}>
                <span className="font-mono text-[8px]" style={{ color: 'var(--gd)' }}>{ev.topic}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <main id="mainContent" role="main" aria-label="Main Content"
        className="fixed top-[56px] right-0 bottom-0 overflow-y-auto px-4 py-4 md:px-6 md:py-5 transition-all duration-300 max-md:left-0"
        style={{ left: sidebarCollapsed ? 56 : 240 }}>
        {/* Breadcrumb */}
        {curMod !== 'overview' && curMod !== 'pp_parichay' && (() => {
          const curModObj2 = mods.find(x => x.k === curMod);
          let curSec2 = '';
          mods.forEach(m => { if (m.sec) curSec2 = m.sec; if (m.k === curMod) curSec2 = curSec2; });
          return curModObj2?.l ? (
            <nav className="flex items-center gap-1 text-[10px] mb-2 flex-wrap" style={{ color: 'var(--mn)' }} aria-label="Breadcrumb">
              <span className="cursor-pointer transition-colors hover:text-[var(--am)]" onClick={() => navTo(mode === 'bo' ? 'overview' : 'pp_parichay' as ModuleId)}>{mode === 'bo' ? '🎯' : '🏠'}</span>
              <span style={{ color: 'var(--bd)' }}>›</span>
              {curSec2 && mode === 'bo' && <><span style={{ color: 'var(--mn)' }}>{curSec2}</span><span style={{ color: 'var(--bd)' }}>›</span></>}
              <span className="font-semibold" style={{ color: 'var(--tx)' }}>{curModObj2.ic} {curModObj2.l}</span>
              {curPill && <><span style={{ color: 'var(--bd)' }}>›</span><span className="font-semibold" style={{ color: 'var(--tx)' }}>{PILL_LABELS[curPill] || curPill}</span></>}
            </nav>
          ) : null;
        })()}
        {renderPills()}
        <ErrorBoundary fallbackModule={`${curMod}/${curPill}`}>
          <PageTransition id={`${curMod}-${curPill}`}>
            <Suspense fallback={<div className="nb-card text-center py-12 anim"><div className="text-3xl mb-2">⏳</div><div className="text-xs" style={{ color: 'var(--sub)' }}>Loading module...</div></div>}>
              <ContentRouter a={a} ck={ck} nri={nri} fis={fis} isPP={isPP} lang={lang} curPill={curPill} curMod={curMod}
                dispatched={dispatched} setDispatched={setDispatched} toast={toast} navTo={navTo as (mod: string, pill?: string) => void} iascl={iascl} drillDown={drillDown}
                heroSlide={heroSlide} setHeroSlide={setHeroSlide}
                replyingTo={replyingTo} setReplyingTo={setReplyingTo} replyDraft={replyDraft} setReplyDraft={setReplyDraft}
                ocrFileRef={ocrFileRef} asrAudioRef={asrAudioRef} asrVideoRef={asrVideoRef} />
            </Suspense>
          </PageTransition>
        </ErrorBoundary>
      </main>

      {/* Toasts */}
      <div className="fixed bottom-5 right-5 z-[9999] flex flex-col gap-2 max-w-[380px] pointer-events-none">
        <AnimatePresence>
          {toasts.map(t => (
            <MotionToast key={t.id} style={{
              padding: '12px 16px', borderRadius: 10, color: '#fff', fontSize: 12,
              background: t.type === 'success' ? 'var(--em)' : t.type === 'crisis' ? 'var(--rd)' : 'var(--am)',
              boxShadow: '0 4px 24px rgba(0,0,0,.35)', cursor: 'pointer', pointerEvents: 'auto',
              borderLeft: '4px solid rgba(255,255,255,.3)',
            }}>
              <div onClick={() => setToasts(prev => prev.filter(x => x.id !== t.id))}>{t.msg}</div>
            </MotionToast>
          ))}
        </AnimatePresence>
      </div>

      {/* FAB */}
      <button className="fixed bottom-5 right-5 w-14 h-14 rounded-full text-white text-2xl border-none cursor-pointer flex items-center justify-center z-[500] transition-transform hover:scale-110"
        style={{ background: 'linear-gradient(135deg,var(--am),var(--saf))', boxShadow: '0 4px 20px rgba(183,148,246,.4)' }}
        onClick={() => toast('⚡ IASCL Dispatch coming soon')}>⚡</button>

      {/* AI Tier */}
      <div className="fixed bottom-5 left-1/2 -translate-x-1/2 flex gap-1 px-3 py-1 rounded-full z-[998] text-[9px] items-center"
        style={{ background: 'var(--sf)', border: '1px solid var(--bd)' }}>
        {[5, 4, 3, 2, 1].map(t => (
          <span key={t} className="w-1.5 h-1.5 rounded-full transition-all" style={{ background: t <= AI_RESOLVER.tier ? ['', '#94A3B8', '#FBBF24', '#60A5FA', '#A78BFA', '#34D399'][t] : 'var(--bd)', width: t === AI_RESOLVER.tier ? 8 : 6, height: t === AI_RESOLVER.tier ? 8 : 6, boxShadow: t === AI_RESOLVER.tier ? `0 0 6px ${['', '#94A3B8', '#FBBF24', '#60A5FA', '#A78BFA', '#34D399'][t]}` : 'none' }} />
        ))}
        <span className="font-bold ml-1" style={{ color: ['', '#94A3B8', '#FBBF24', '#60A5FA', '#A78BFA', '#34D399'][AI_RESOLVER.tier] }}>{AI_RESOLVER.getTierBadge().t}</span>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <DataProvider>
      <MainApp />
    </DataProvider>
  );
}
