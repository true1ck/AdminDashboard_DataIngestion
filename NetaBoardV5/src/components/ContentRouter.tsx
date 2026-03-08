// ═══ NétaBoard V5.0 — Content Router ═══
// All module rendering extracted from App.tsx. 
// Receives ModuleProps and returns JSX for current module/pill.

import { Fragment, useRef } from 'react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import {
  PILLARS, ARC, FB_SRC, NOTIFS,
  EMOT, URG, SEV_C, PL_C, PILL_LABELS,
  BO_MODULES, PP_MODULES, HERO_SLIDES,
  getNRI, computeFIS,
} from '../data';
import {
  SHK, SHK_STATS, SHK_CATEGORIES, PROJ, VIDS, CLIPS, SPEECHES,
  EVENTS, POLLS, VOICES, PETITIONS, APP_SERVICES,
  DARBAR_SESSIONS, DARBAR_QUEUE, THREADS, EMERGENCY_CONTACTS,
  YT_VIDS, YT_CMTS,
} from '../data/jansetu';
import { EB, ALGO_ENGINE, SMART_TEMPLATES, AI_RESOLVER, AI_AUDIT, PROMPTS_REGISTRY, MEDIA_PIPE, CAL_POSTS } from '../data/engines';
import ShikayatKendra from './pp/ShikayatKendra';
import IngestHub from './ingest/IngestHub';
import VaultBrowser from './ingest/VaultBrowser';
import PipelineMonitor from './pipeline/PipelineMonitor';
import PipelineVisualize from './pipeline/PipelineVisualize';
import PipelineLogs from './pipeline/PipelineLogs';
import { Stat, Tag, ProgressBar } from './shared/Primitives';
import { MotionCard } from './shared/Motion';
import type { ModuleProps, IASCLStateType } from './ModuleProps';
import type { ModuleId } from '../types';
import { useNetaData } from '../context/DataContext';

export default function ContentRouter(P: ModuleProps) {
  const curMod = P.curMod;
  const { a, ck, nri, fis, isPP, lang, curPill, dispatched, setDispatched, toast, navTo, iascl, drillDown,
    heroSlide, setHeroSlide, replyingTo, setReplyingTo, replyDraft, setReplyDraft,
    ocrFileRef, asrAudioRef, asrVideoRef } = P;

  const { feedback: FEEDBACK, social: SOCIAL_FEED, alerts: ALERTS, channels: CHANNELS } = useNetaData();
  const activeAlerts = ALERTS.filter(x => !dispatched[x.id]);

  // Computed chart data (was useMemo in App.tsx)
  const radarData = PILLARS.map(p => ({ subject: p.l.split(' ').slice(0, 2).join(' '), score: a.dm[p.k] || 50 }));
  const trendData = [{ m: 'Sep', v: 68.5 }, { m: 'Oct', v: 70.2 }, { m: 'Nov', v: 71.8 }, { m: 'Dec', v: 73.1 }, { m: 'Jan', v: 72.4 }, { m: 'Feb', v: parseFloat(nri.toFixed(1)) }];
  const sentData = Array.from({ length: 30 }, (_, i) => ({ d: `D${i + 1}`, pos: 40 + Math.round(Math.random() * 35), neg: -(5 + Math.round(Math.random() * 15)) }));
  const sansadData = [{ s: 'Budget', att: a.san.att, q: Math.round(a.san.ques * .3) }, { s: 'Monsoon', att: a.san.att - 5, q: Math.round(a.san.ques * .4) }, { s: 'Winter', att: a.san.att + 3, q: Math.round(a.san.ques * .3) }];
  const casteData = [{ name: 'Upper', value: 22, fill: '#D4AF37' }, { name: 'OBC', value: 38, fill: '#F97316' }, { name: 'SC/ST', value: 24, fill: '#8B5CF6' }, { name: 'Muslim', value: 12, fill: '#059669' }, { name: 'Others', value: 4, fill: '#3B82F6' }];
  const fundData = [{ m: 'Sep', v: 42 }, { m: 'Oct', v: 55 }, { m: 'Nov', v: 38 }, { m: 'Dec', v: 72 }, { m: 'Jan', v: 48 }, { m: 'Feb', v: 35 }];
  const emotData = Object.entries(EMOT).map(([k, v]) => { const cnt = FEEDBACK.filter(f => f.em === k).length; return { name: v.i + ' ' + k, value: cnt, fill: v.c }; });


  const renderCommandCentre = () => (
    <>
      <h2 className="nb-section anim">🎯 Command Centre — {a.n} <span className="text-xs font-deva" style={{ color: 'var(--sub)' }}>{a.tg}</span></h2>
      <div className="grid grid-cols-5 gap-3 mb-3.5 grid-responsive anim">
        <Stat n={nri.toFixed(1)} l="NRI Score" color="var(--am)" borderColor="var(--am)" onClick={() => drillDown('nri')} />
        <Stat n={fis.score} l="FIS Score" color="var(--gd)" borderColor="var(--gd)" onClick={() => drillDown('fis')} />
        <Stat n={activeAlerts.length} l="Active Alerts" color="var(--rd)" borderColor="var(--rd)" onClick={() => drillDown('alerts')} />
        <Stat n={a.cn.booth} l="Booths" color="var(--em)" borderColor="var(--em)" onClick={() => drillDown('booths')} />
        <Stat n={`${a.san.att}%`} l="Sansad Att." color="var(--bl)" borderColor="var(--bl)" />
      </div>

      {/* AI Briefing */}
      <div className="nb-card anim" style={{ borderLeft: '4px solid var(--am)', marginBottom: 14 }}>
        <div className="flex justify-between items-center mb-1.5">
          <span className="text-[13px] font-bold" style={{ color: 'var(--tx)' }}>🤖 AI Executive Briefing <span className="text-[9px]" style={{ color: 'var(--mn)' }}>AI-26</span></span>
          <span className="ai-badge ai-badge-smart">🧠 SMART</span>
        </div>
        <p className="text-[11px] leading-relaxed" style={{ color: 'var(--sub)' }}>
          {ALGO_ENGINE.generateExecutiveSummary(ck).summary}
        </p>
      </div>

      {/* Pillars + Alerts Grid */}
      <div className="grid grid-cols-2 gap-3 anim grid-responsive">
        <div className="nb-card" style={{ minHeight: 280 }}>
          <h3 className="text-[13px] font-bold mb-2.5" style={{ color: 'var(--tx)' }}>📊 15-Pillar NRI Radar</h3>
          <ResponsiveContainer width="100%" height={240}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="rgba(124,58,237,.12)" />
              <PolarAngleAxis dataKey="subject" tick={{ fill: '#8B80A8', fontSize: 8 }} />
              <Radar dataKey="score" stroke="#7C3AED" fill="rgba(124,58,237,.15)" fillOpacity={0.6} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
        <div className="nb-card">
          <h3 className="text-[13px] font-bold mb-2.5" style={{ color: 'var(--tx)' }}>⚡ Priority Alerts</h3>
          {activeAlerts.slice(0, 5).map(al => (
            <div key={al.id} className="p-2 mb-1.5 rounded-lg cursor-pointer transition-colors hover:bg-white/5"
              style={{ borderLeft: `4px solid ${SEV_C[al.sv] || 'var(--bl)'}`, background: 'rgba(124,58,237,.04)' }}
              onClick={() => navTo('alerts')}>
              <div className="text-[11px] font-semibold" style={{ color: 'var(--tx)' }}>{al.ic} {al.t}</div>
              <div className="text-[9px] mt-0.5" style={{ color: 'var(--sub)' }}>
                {al.tm} · <span style={{ color: SEV_C[al.sv] }}>{al.sv.toUpperCase()}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Constituency + Rivals + Feedback */}
      <div className="grid grid-cols-3 gap-3 mt-3.5 anim grid-responsive">
        <div className="nb-card">
          <h3 className="text-[13px] font-bold mb-2" style={{ color: 'var(--tx)' }}>🏛 Constituency</h3>
          {[['Constituency', a.cn.const], ['Party', a.cn.party], ['State', a.cn.state], ['Next Election', a.cn.eldt]].map(([k, v]) => (
            <div key={k} className="py-1 flex justify-between text-xs" style={{ borderBottom: '1px solid var(--bd)' }}>
              <span style={{ color: 'var(--sub)' }}>{k}</span>
              <span className="font-semibold" style={{ color: 'var(--tx)' }}>{v}</span>
            </div>
          ))}
        </div>
        <div className="nb-card">
          <h3 className="text-[13px] font-bold mb-2" style={{ color: 'var(--tx)' }}>⚔️ Rival Watch</h3>
          {a.rv.map((r, i) => (
            <div key={i} className="py-1.5 flex justify-between" style={{ borderBottom: '1px solid var(--bd)' }}>
              <span className="text-xs" style={{ color: 'var(--tx)' }}>{r.n}</span>
              <span className="font-mono font-bold" style={{ color: r.nri > nri ? 'var(--rd)' : 'var(--em)' }}>
                {r.nri} <span className="text-[10px]" style={{ color: r.tr > 0 ? 'var(--em)' : 'var(--rd)' }}>{r.tr > 0 ? '↑' : '↓'}{Math.abs(r.tr)}</span>
              </span>
            </div>
          ))}
        </div>
        <div className="nb-card">
          <h3 className="text-[13px] font-bold mb-2" style={{ color: 'var(--tx)' }}>📡 Feedback Pulse</h3>
          {[['Volume', `${fis.vol}/100`], ['Sentiment', `${fis.snt}/100`], ['Diversity', `${fis.div}/100`], ['Credibility', `${fis.cred}/100`]].map(([k, v]) => (
            <div key={k} className="py-0.5 flex justify-between text-xs">
              <span style={{ color: 'var(--sub)' }}>{k}</span>
              <span className="font-semibold" style={{ color: 'var(--tx)' }}>{v}</span>
            </div>
          ))}
        </div>
      </div>
    </>
  );

  // ═══ CONTENT — Alerts Active ═══
  const renderAlertsActive = () => (
    <>
      <h2 className="nb-section anim">⚡ Active Alerts</h2>
      {activeAlerts.map(al => (
        <div key={al.id} className="nb-card anim" style={{ borderLeft: `4px solid ${SEV_C[al.sv]}` }}>
          <div className="flex justify-between items-center">
            <div><span className="text-base">{al.ic}</span> <span className="text-[13px] font-bold" style={{ color: 'var(--tx)' }}>{al.t}</span></div>
            <Tag bg={SEV_C[al.sv] || '#888'}>{al.sv.toUpperCase()}</Tag>
          </div>
          <p className="text-[11px] my-2" style={{ color: 'var(--sub)' }}>{al.ds}</p>
          <div className="p-2 rounded-lg mb-2" style={{ background: 'rgba(124,58,237,.04)', borderLeft: '3px solid var(--am)' }}>
            <div className="text-[9px] font-bold mb-1" style={{ color: 'var(--am)' }}>🤖 AI RECOMMENDATION <span className="ai-badge ai-badge-smart">SMART</span></div>
            <div className="text-[11px]" style={{ color: 'var(--tx)' }}>{al.ai_txt}</div>
            <div className="text-[9px] mt-1" style={{ color: 'var(--mn)' }}>Confidence: {al.cf}%</div>
          </div>
          <div className="flex gap-1.5">
            <button className="nb-btn nb-btn-success" onClick={() => { setDispatched(p => ({ ...p, [al.id]: true })); EB.emit(EB.TOPICS.CRISIS_DETECTED, { title: al.t }, 'alerts'); toast('✅ Alert dispatched', 'success'); }}>Accept & Dispatch</button>
            <button className="nb-btn" onClick={() => toast('Draft editor coming soon')}>Modify</button>
            <button className="nb-btn nb-btn-danger" onClick={() => setDispatched(p => ({ ...p, [al.id]: true }))}>Reject</button>
          </div>
        </div>
      ))}
      {activeAlerts.length === 0 && <div className="nb-card text-center py-8 text-sm" style={{ color: 'var(--sub)' }}>✅ All alerts dispatched!</div>}
    </>
  );

  // ═══ CONTENT — 15 Pillars ═══
  const renderPillarsDeepDive = () => (
    <>
      <h2 className="nb-section anim">🔍 15 Pillars — NRI Deep-Dive</h2>
      <div className="grid grid-cols-3 gap-3 grid-responsive anim">
        {PILLARS.map(p => {
          const s = a.dm[p.k] || 50;
          const col = s >= 70 ? 'var(--em)' : s >= 40 ? 'var(--gd)' : 'var(--rd)';
          return (
            <div key={p.k} className="nb-card">
              <div className="flex justify-between mb-1.5">
                <span className="text-xs font-semibold" style={{ color: 'var(--tx)' }}>{p.i} {p.l}</span>
                <span className="font-mono text-sm font-bold" style={{ color: col }}>{s}</span>
              </div>
              <ProgressBar pct={s} color={col} />
              <div className="text-[9px] mt-1" style={{ color: 'var(--mn)' }}>Weight: {p.w}%{p.inv ? ' · Inverted' : ''}</div>
            </div>
          );
        })}
      </div>
    </>
  );

  // ═══ CONTENT — Social Inbox ═══
  const renderSocialInbox = () => (
    <>
      <h2 className="nb-section anim">💬 Unified Inbox</h2>
      {SOCIAL_FEED.map(s => {
        const sCol = s.snt > .3 ? 'var(--em)' : s.snt < -.3 ? 'var(--rd)' : 'var(--gd)';
        const ec = EMOT[s.em] || { i: '?', c: '#888' };
        return (
          <div key={s.id} className="nb-card anim">
            <div className="flex justify-between items-center flex-wrap gap-1">
              <div className="flex items-center gap-1.5">
                <Tag bg={PL_C[s.pl] || 'var(--am)'}>{s.pl.replace('_', ' ')}</Tag>
                <b className="text-xs" style={{ color: 'var(--tx)' }}>{s.au}</b>
                <span className="text-[10px]" style={{ color: 'var(--mn)' }}>{s.tm}</span>
              </div>
              <span className="text-[10px] font-semibold" style={{ color: sCol }}>{ec.i} {(s.snt * 100).toFixed(0)}%</span>
            </div>
            <p className="text-xs my-1.5" style={{ color: 'var(--sub)' }}>{s.tx}</p>
            <div className="flex gap-1.5">
              <button className="nb-btn nb-btn-primary" onClick={() => { setReplyingTo(replyingTo === s.id ? null : s.id); setReplyDraft(SMART_TEMPLATES.response_draft.get(ck, s.snt)); }}>↩ Reply</button>
              <button className="nb-btn" onClick={() => toast('Liked', 'success')}>❤ Like</button>
              <button className="nb-btn" onClick={() => toast('Pinned')}>📌 Pin</button>
              {s.snt < -.2 && <button className="nb-btn" style={{ borderColor: 'var(--rd)', color: 'var(--rd)' }} onClick={() => navTo('shield')}>⚠ Escalate</button>}
            </div>
            {/* S2.2 — Inline Reply Composer */}
            {replyingTo === s.id && (
              <div className="mt-2 p-2.5 rounded-lg" style={{ background: 'var(--bg)', border: '1px solid var(--am)' }}>
                <div className="text-[9px] font-bold mb-1.5 flex items-center gap-1.5" style={{ color: 'var(--am)' }}>
                  🤖 AI Draft <span className="ai-badge ai-badge-smart">🧠 SMART</span>
                  <span className="text-[8px] font-normal" style={{ color: 'var(--mn)' }}>· Archetype: {ck} · Tone: {s.snt > 0 ? 'positive' : 'empathetic'}</span>
                </div>
                <textarea className="w-full p-2 rounded-md text-[11px] min-h-[60px] resize-y" style={{ background: 'var(--cd)', border: '1px solid var(--bd)', color: 'var(--tx)' }}
                  value={replyDraft} onChange={e => setReplyDraft(e.target.value)} />
                <div className="flex gap-1.5 mt-1.5">
                  <button className="nb-btn nb-btn-success text-[10px]" onClick={() => { toast(`✅ Reply sent on ${s.pl}`, 'success'); setReplyingTo(null); }}>Send</button>
                  <button className="nb-btn text-[10px]" onClick={() => setReplyDraft(SMART_TEMPLATES.response_draft.get(ck, s.snt))}>🔄 Regenerate</button>
                  <button className="nb-btn text-[10px]" onClick={() => setReplyingTo(null)}>Cancel</button>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </>
  );

  // ═══ CONTENT — Pratikriya ═══
  const renderPratikriyaOverview = () => {
    const fbTat = FEEDBACK.filter(f => f.urg === 'tatkal').length;
    const fbPos = FEEDBACK.filter(f => f.snt > 0).length;
    const fbNeg = FEEDBACK.filter(f => f.snt < 0).length;
    return (
      <>
        <h2 className="nb-section anim">📡 Pratikriya — Feedback Management</h2>
        <div className="grid grid-cols-5 gap-3 mb-3.5 grid-responsive anim">
          <Stat n={FEEDBACK.length} l="Total Feedback" color="var(--am)" borderColor="var(--am)" />
          <Stat n={fis.score} l="FIS Score" color="var(--gd)" borderColor="var(--gd)" />
          <Stat n={fbTat} l="तत्काल" color="var(--rd)" borderColor="var(--rd)" />
          <Stat n={fbPos} l="Positive" color="var(--em)" borderColor="var(--em)" />
          <Stat n={fbNeg} l="Negative" color="var(--rd)" borderColor="var(--rd)" />
        </div>
        <div className="grid grid-cols-2 gap-3 grid-responsive anim">
          <div className="nb-card" style={{ minHeight: 250 }}>
            <h3 className="text-[13px] font-bold mb-2" style={{ color: 'var(--tx)' }}>Emotion Distribution (Plutchik 8)</h3>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart><Pie data={Object.entries(EMOT).map(([k, v]) => { const cnt = FEEDBACK.filter(f => f.em === k).length; return { name: `${v.i} ${k}`, value: cnt, fill: v.c }; })} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={40} outerRadius={80} paddingAngle={2}>
                {Object.values(EMOT).map((e, i) => <Cell key={i} fill={e.c} />)}
              </Pie><Tooltip contentStyle={{ background: '#1A1335', border: '1px solid rgba(124,58,237,.2)', borderRadius: 8, fontSize: 10 }} /></PieChart>
            </ResponsiveContainer>
          </div>
          <div className="nb-card" style={{ minHeight: 250 }}>
            <h3 className="text-[13px] font-bold mb-2" style={{ color: 'var(--tx)' }}>Source Credibility</h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={FB_SRC.map(s => ({ name: s.i, cred: Math.round(s.cred * 100), fill: s.c }))} layout="vertical">
                <XAxis type="number" tick={{ fill: '#8B80A8', fontSize: 9 }} /><YAxis type="category" dataKey="name" tick={{ fill: '#8B80A8', fontSize: 11 }} width={30} />
                <Tooltip contentStyle={{ background: '#1A1335', border: '1px solid rgba(124,58,237,.2)', borderRadius: 8, fontSize: 10 }} />
                <Bar dataKey="cred">{FB_SRC.map((s, i) => <Cell key={i} fill={s.c + '99'} />)}</Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </>
    );
  };

  const renderPratikriyaFeed = () => (
    <>
      <h2 className="nb-section anim">📡 Live Feedback Feed</h2>
      {FEEDBACK.map(f => {
        const ec = EMOT[f.em] || { i: '?', c: '#888' };
        const src = FB_SRC.find(s => s.id === f.src) || { l: f.src, i: '?' };
        return (
          <div key={f.id} className="nb-card anim" style={{ borderLeft: `4px solid ${URG[f.urg]?.c || 'var(--bl)'}` }}>
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-1.5">
                <span className="text-base">{ec.i}</span>
                <span className="text-xs font-semibold" style={{ color: 'var(--tx)' }}>{f.text}</span>
              </div>
              <Tag bg={URG[f.urg]?.c || 'var(--bl)'}><span className="font-deva">{URG[f.urg]?.l || f.urg}</span></Tag>
            </div>
            <div className="flex gap-3 mt-1.5 text-[10px]" style={{ color: 'var(--sub)' }}>
              <span>{src.i} {src.l}</span>
              <span>Pillar: {(PILLARS.find(p => p.k === f.pil) || { l: f.pil }).l}</span>
              <span style={{ color: f.snt > 0 ? 'var(--em)' : 'var(--rd)' }}>{f.snt > 0 ? '+' : ''}{f.snt.toFixed(2)}</span>
              <span>{f.tm}</span>
            </div>
          </div>
        );
      })}
    </>
  );

  const renderPratikriyaSources = () => (
    <>
      <h2 className="nb-section anim">📌 {FB_SRC.length} Feedback Sources</h2>
      <div className="grid grid-cols-2 gap-3 grid-responsive anim">
        {FB_SRC.map(s => {
          const cnt = FEEDBACK.filter(f => f.src === s.id).length;
          return (
            <div key={s.id} className="nb-card" style={{ borderLeft: `4px solid ${s.c}` }}>
              <div className="flex justify-between items-center">
                <div><span className="text-lg">{s.i}</span> <span className="text-[13px] font-bold" style={{ color: 'var(--tx)' }}>{s.l}</span></div>
                <span className="font-mono font-bold" style={{ color: 'var(--tx)' }}>{cnt} items</span>
              </div>
              <div className="mt-1.5">
                <div className="flex justify-between text-[10px]" style={{ color: 'var(--sub)' }}>
                  <span>Credibility</span><span style={{ color: 'var(--gd)' }}>{Math.round(s.cred * 100)}%</span>
                </div>
                <ProgressBar pct={s.cred * 100} color={s.c} height={4} />
              </div>
            </div>
          );
        })}
      </div>
    </>
  );

  // ─── Slideshow timer for Parichay hero (uses heroSlide from props) ───
  const heroTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  // Note: useEffect for slideshow is in parent App.tsx

  // ═══ CONTENT — Jan Setu Parichay ═══
  const renderJanSetuHome = () => (
    <>
      {/* Hero — 3-Panel: LEFT slideshow | CENTER name | RIGHT party logo (matches original HTML) */}
      <div className="nb-card anim" style={{ padding: 0, margin: '0 0 12px', overflow: 'hidden', borderRadius: 12 }}>
        <div style={{ display: 'flex', alignItems: 'stretch', minHeight: 155 }}>

          {/* LEFT PANEL: Image Slideshow with Unsplash photos */}
          <div style={{ flex: 1, position: 'relative', overflow: 'hidden', background: 'var(--cd)', borderRight: '1px solid rgba(212,175,55,.1)', minHeight: 155 }}>
            {HERO_SLIDES.map((url, i) => (
              <div key={i} style={{
                position: 'absolute', inset: 0,
                backgroundImage: `url('${url}')`, backgroundSize: 'cover', backgroundPosition: 'center',
                opacity: heroSlide === i ? 1 : 0, transition: 'opacity .8s ease',
              }} />
            ))}
            {/* Slide dots */}
            <div style={{ position: 'absolute', bottom: 6, left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: 4, zIndex: 2 }}>
              {HERO_SLIDES.map((_, i) => (
                <div key={i} onClick={() => setHeroSlide(i)}
                  style={{ width: 6, height: 6, borderRadius: '50%', background: `rgba(212,175,55,${heroSlide === i ? '.9' : '.25'})`, transition: 'all .4s', cursor: 'pointer' }} />
              ))}
            </div>
            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 30, background: 'linear-gradient(transparent,rgba(30,22,16,.6))', pointerEvents: 'none' }} />
          </div>

          {/* CENTER PANEL: Name + Details */}
          <div style={{ flex: 1.6, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '20px 16px', textAlign: 'center', background: 'linear-gradient(135deg,var(--sf),var(--cd),var(--sf))', borderLeft: '1px solid rgba(212,175,55,.08)', borderRight: '1px solid rgba(212,175,55,.08)' }}>
            <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--tx)', fontFamily: 'var(--df)', lineHeight: 1.2, letterSpacing: '-.3px' }}>{a.n}</div>
            <div style={{ fontSize: 14, color: 'var(--gd)', fontWeight: 600, margin: '5px 0', fontFamily: 'var(--df)' }}>सांसद, {a.cn.const}</div>
            <div style={{ fontSize: 11, color: 'var(--mn)', marginBottom: 8 }}>{a.cn.party} · {a.cn.state} · Member of Parliament</div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'center' }}>
              <div style={{ padding: '3px 10px', borderRadius: 6, background: 'rgba(212,175,55,.06)', border: '1px solid rgba(212,175,55,.1)', fontSize: 9, color: 'var(--sub)', fontWeight: 600 }}>🗳 {a.cn.booth} Booths</div>
              <div style={{ padding: '3px 10px', borderRadius: 6, background: 'rgba(212,175,55,.06)', border: '1px solid rgba(212,175,55,.1)', fontSize: 9, color: 'var(--sub)', fontWeight: 600 }}>📅 {a.cn.eldt}</div>
            </div>
          </div>

          {/* RIGHT PANEL: Party Logo placeholder */}
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--cd)', borderLeft: '1px solid rgba(212,175,55,.1)', padding: 16 }}>
            <div style={{ width: '100%', maxWidth: 110, aspectRatio: '3/4', border: '2px dashed rgba(212,175,55,.25)', borderRadius: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'rgba(212,175,55,.02)', gap: 6 }}>
              <div style={{ width: 48, height: 48, borderRadius: 8, background: 'rgba(212,175,55,.06)', border: '1.5px solid rgba(212,175,55,.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontSize: 13, fontWeight: 900, color: 'var(--gd)', fontFamily: 'var(--hf)', letterSpacing: '-.3px' }}>{a.cn.party}</span>
              </div>
              <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--mn)', letterSpacing: '1.5px', fontFamily: 'var(--hf)' }}>PARTY</span>
              <span style={{ fontSize: 8, color: 'rgba(154,138,114,.4)', letterSpacing: '.5px' }}>LOGO</span>
            </div>
          </div>

        </div>
      </div>

      <div className="flex gap-2 flex-wrap mb-3.5 anim">
        {[{ l: '📢 शिकायत दर्ज करें', k: 'pp_shikayat' as ModuleId }, { l: '🏗 विकास ट्रैक करें', k: 'pp_vikas' as ModuleId }, { l: '🆘 आपतकाल SOS', k: 'pp_apatkal' as ModuleId }, { l: '🏛 जन दरबार', k: 'pp_edarbar' as ModuleId }].map(b => (
          <button key={b.k} className="nb-btn flex-1 min-w-[120px] py-2.5 text-[11px] font-semibold" onClick={() => navTo(b.k)}>{b.l}</button>
        ))}
      </div>

      <h3 className="text-[13px] font-bold my-4 pl-3 font-display" style={{ color: 'var(--gd)', borderLeft: '3px solid var(--gd)' }}>🔗 सेवाएं — Services</h3>
      <div className="grid grid-cols-3 gap-3 grid-responsive anim">
        {PP_MODULES.filter(m => m.k !== 'pp_parichay').map(m => (
          <div key={m.k} className="nb-card text-center py-4 cursor-pointer" onClick={() => navTo(m.k as ModuleId)}>
            <div className="text-3xl mb-2">{m.ic}</div>
            <div className="text-xs font-bold" style={{ color: 'var(--tx)' }}>{m.l}</div>
          </div>
        ))}
      </div>

      <h3 className="text-[13px] font-bold my-4 pl-3 font-display" style={{ color: 'var(--gd)', borderLeft: '3px solid var(--gd)' }}>🎯 प्रदर्शन — Performance</h3>
      <div className="grid grid-cols-4 gap-3 grid-responsive anim">
        <Stat n={`${a.san.att}%`} l="संसद उपस्थिति" borderColor="var(--gd)" color="var(--gd)" />
        <Stat n={a.san.ques} l="प्रश्न पूछे" borderColor="var(--am)" color="var(--am)" />
        <Stat n={a.san.bill} l="विधेयक" borderColor="var(--em)" color="var(--em)" />
        <Stat n="94%" l="MPLADS Utilized" borderColor="var(--gd)" color="var(--gd)" />
      </div>
    </>
  );

  // ═══ CONTENT — Generic Fallback ═══
  const renderFallback = () => {
    const modObj = mods.find(x => x.k === curMod);
    return (
      <>
        <h2 className="nb-section anim">{modObj?.ic} {modObj?.l || curMod}</h2>
        <div className="nb-card text-center py-8 anim">
          <div className="text-4xl mb-3">🛠</div>
          <div className="text-[13px]" style={{ color: 'var(--sub)' }}>Module: {curMod} / {curPill}</div>
          <div className="text-[11px] mt-2" style={{ color: 'var(--mn)' }}>Full rendering available in the reference HTML. React port in progress.</div>
          {curMod.startsWith('pp_') && (
            <button className="nb-btn nb-btn-primary mt-3" onClick={() => navTo('overview' as any)}>Back to Back-Office</button>
          )}
        </div>
      </>
    );
  };

  const mods = isPP ? PP_MODULES : BO_MODULES;

  const renderContent = () => {
    if (curMod === 'overview' && curPill === 'dashboard') return renderCommandCentre();
    if (curMod === 'overview' && curPill === 'notifications') return (
      <>
        <h2 className="nb-section anim">🔔 Notifications</h2>
        {NOTIFS.map(n => (
          <div key={n.id} className="nb-card anim cursor-pointer" style={{ borderLeft: `4px solid ${SEV_C[n.sev]}` }} onClick={() => navTo(n.mod as ModuleId)}>
            <div className="flex justify-between"><Tag bg={SEV_C[n.sev] || '#888'}>{n.sev.toUpperCase()}</Tag><span className="text-[10px]" style={{ color: 'var(--mn)' }}>{n.tm}</span></div>
            <div className="text-xs mt-1.5" style={{ color: 'var(--tx)' }}>{n.tx}</div>
          </div>
        ))}
      </>
    );
    if (curMod === 'pillars' && curPill === 'deepdive') return renderPillarsDeepDive();
    if (curMod === 'pillars' && curPill === 'feedback_overlay') {
      // Compute feedback sentiment per pillar
      const fbPillar: Record<string, { pos: number; neg: number; total: number }> = {};
      PILLARS.forEach(p => { fbPillar[p.k] = { pos: 0, neg: 0, total: 0 }; });
      FEEDBACK.forEach(f => { if (fbPillar[f.pil]) { fbPillar[f.pil].total++; if (f.snt > 0.2) fbPillar[f.pil].pos++; else if (f.snt < -0.2) fbPillar[f.pil].neg++; } });
      const fbScores = PILLARS.map(p => { const fb = fbPillar[p.k]; const fbScore = fb.total > 0 ? Math.round((fb.pos / (fb.pos + fb.neg + 0.01)) * 100) : 50; return { ...p, nriScore: a.dm[p.k] || 50, fbScore, pos: fb.pos, neg: fb.neg, total: fb.total, gap: (a.dm[p.k] || 50) - fbScore }; });
      const divergent = fbScores.filter(f => Math.abs(f.gap) > 20).sort((x, y) => Math.abs(y.gap) - Math.abs(x.gap));
      return (<>
        <h2 className="nb-section anim">📡 Feedback Overlay — People's Voice vs NRI</h2>
        <p className="text-[11px] mb-3.5" style={{ color: 'var(--sub)' }}>Overlays real-time public feedback sentiment onto each NRI pillar, revealing gaps between official scores and ground reality.</p>
        <div className="grid grid-cols-4 gap-3 mb-3.5 grid-responsive anim">
          <Stat n={FEEDBACK.length} l="Feedback Items" borderColor="var(--am)" /><Stat n={fbScores.filter(f => f.fbScore > 60).length} l="Positive Pillars" color="var(--em)" borderColor="var(--em)" /><Stat n={fbScores.filter(f => f.fbScore < 40).length} l="Negative Pillars" color="var(--rd)" borderColor="var(--rd)" /><Stat n={Math.round(fbScores.reduce((s, f) => s + Math.abs(f.gap), 0) / fbScores.length)} l="Avg Gap" color="#F59E0B" borderColor="#F59E0B" />
        </div>
        {/* Dual bar: NRI vs Feedback */}
        <div className="nb-card anim">
          <h3 className="text-[13px] font-bold mb-2" style={{ color: 'var(--tx)' }}>📊 NRI Score vs Feedback Sentiment</h3>
          <div className="flex gap-4 mb-2 text-[9px]" style={{ color: 'var(--mn)' }}><span><span className="inline-block w-2.5 h-2.5 rounded-sm mr-1" style={{ background: 'var(--am)' }} />NRI (official)</span><span><span className="inline-block w-2.5 h-2.5 rounded-sm mr-1" style={{ background: '#059669' }} />Feedback (people)</span></div>
          {fbScores.map(f => {
            const gapCol = Math.abs(f.gap) > 20 ? 'var(--rd)' : Math.abs(f.gap) > 10 ? '#F59E0B' : 'var(--em)'; return (
              <div key={f.k} className="py-1" style={{ borderBottom: '1px solid var(--bd)' }}>
                <div className="flex items-center gap-2 mb-1"><span className="w-7 text-sm">{f.i}</span><span className="w-36 text-[11px] font-semibold" style={{ color: 'var(--tx)' }}>{f.l}</span>
                  <div className="flex-1 relative h-5"><div className="absolute top-0 left-0 h-2 rounded-sm opacity-80" style={{ width: `${f.nriScore}%`, background: 'var(--am)' }} /><div className="absolute top-[11px] left-0 h-2 rounded-sm opacity-80" style={{ width: `${f.fbScore}%`, background: '#059669' }} /></div>
                  <div className="w-14 text-right"><span className="font-mono text-[11px]" style={{ color: 'var(--am)' }}>{f.nriScore}</span><span className="text-[9px]" style={{ color: 'var(--mn)' }}> / </span><span className="font-mono text-[11px]" style={{ color: '#059669' }}>{f.fbScore}</span></div>
                  <div className="w-16 text-right text-[9px]" style={{ color: gapCol }}>Gap: {f.gap > 0 ? '+' : ''}{f.gap}</div>
                </div>
              </div>);
          })}
        </div>
        {/* Divergence alerts */}
        {divergent.length > 0 && (<div className="nb-card anim" style={{ border: '2px solid var(--rd)' }}>
          <h3 className="text-[13px] font-bold mb-2" style={{ color: 'var(--tx)' }}>⚠ Divergence Alerts (gap &gt; 20pts)</h3>
          {divergent.map(f => {
            const isOver = f.gap > 0; return (
              <div key={f.k} className="p-2.5 mb-1.5 rounded-lg" style={{ borderLeft: `4px solid ${isOver ? '#F59E0B' : 'var(--rd)'}`, background: 'var(--bg)' }}>
                <div className="flex justify-between items-center"><div><span className="text-sm">{f.i}</span> <b className="text-xs" style={{ color: 'var(--tx)' }}>{f.l}</b></div>
                  <div className="flex gap-1"><Tag bg="var(--am)">NRI: {f.nriScore}</Tag><Tag bg="#059669">FB: {f.fbScore}</Tag><Tag bg={isOver ? '#F59E0B' : 'var(--rd)'}>{isOver ? '⬆ Over' : '⬇ Under'} by {Math.abs(f.gap)}</Tag></div></div>
                <div className="text-[10px] mt-1" style={{ color: 'var(--sub)' }}>{isOver ? 'NRI higher than sentiment. Risk: voter disillusionment.' : 'People rate higher than NRI. Opportunity: communicate achievements.'}</div>
              </div>);
          })}
        </div>)}
      </>);
    }
    if (curMod === 'pillars') return renderPillarsDeepDive();
    if (curMod === 'alerts' && curPill === 'active') return renderAlertsActive();
    if (curMod === 'alerts') return (<><h2 className="nb-section anim">⚡ {PILL_LABELS[curPill] || curPill}</h2>
      {curPill === 'karma' ? FEEDBACK.filter(f => f.urg === 'tatkal' || f.urg === 'shighra').map(f => (
        <div key={f.id} className="nb-card anim" style={{ borderLeft: `4px solid ${URG[f.urg]?.c || 'var(--bl)'}` }}>
          <div className="flex justify-between"><span className="text-[11px] font-semibold" style={{ color: 'var(--tx)' }}>{f.text}</span><Tag bg={URG[f.urg]?.c || 'var(--bl)'}>{URG[f.urg]?.l || f.urg}</Tag></div>
          <div className="text-[9px] mt-1" style={{ color: 'var(--mn)' }}>{f.tm} · {(FB_SRC.find(s => s.id === f.src) || { l: f.src }).l}</div>
        </div>
      )) : curPill === 'ai_sug' ? (<div className="nb-card anim"><h3 className="text-[13px] font-bold mb-2.5" style={{ color: 'var(--tx)' }}>Weakest Pillars — Priority Actions <span className="ai-badge ai-badge-smart">🧠 SMART</span></h3>
        {ALGO_ENGINE.findWeakestPillars(ck, 5).map(p => (
          <div key={p.key} className="p-2.5 mb-2 rounded-lg" style={{ background: 'rgba(124,58,237,.04)', borderLeft: `3px solid ${PILLARS.find(pp => pp.k === p.key)?.c || 'var(--am)'}` }}>
            <div className="flex justify-between"><span className="text-xs font-semibold" style={{ color: 'var(--tx)' }}>{p.icon} {p.label}</span><span className="font-mono font-bold" style={{ color: 'var(--rd)' }}>{p.score}/100</span></div>
            <div className="text-[10px] mt-1" style={{ color: 'var(--sub)' }}>{p.boost}</div>
            <div className="flex gap-1 flex-wrap mt-1.5">{p.actions.map((act, i) => <span key={i} className="text-[8px] px-1.5 py-0.5 rounded" style={{ background: 'var(--bg)', border: '1px solid var(--bd)', color: 'var(--sub)' }}>{act}</span>)}</div>
          </div>
        ))}
      </div>) : curPill === 'lifecycle' ? (<>
        {/* IASCL 10-State Lifecycle */}
        <div className="nb-card anim"><h3 className="text-[13px] font-bold mb-2" style={{ color: 'var(--tx)' }}>10 States · 13 Transitions · 4-Tier SLA</h3>
          <div className="flex flex-wrap gap-1.5 mt-2.5">
            {(['draft', 'dispatched', 'acknowledged', 'in_progress', 'submitted', 'under_review', 'accepted', 'rejected', 'revision_requested', 'closed', 'cancelled'] as const).map(s => {
              const cols: Record<string, string> = { draft: '#94A3B8', dispatched: '#A78BFA', acknowledged: '#38BDF8', in_progress: '#FBBF24', submitted: '#F97316', under_review: '#E879F9', accepted: '#34D399', rejected: '#FB7185', revision_requested: '#FB923C', closed: '#10B981', cancelled: '#9CA3AF' };
              const icons: Record<string, string> = { draft: '📝', dispatched: '📤', acknowledged: '👁', in_progress: '⚙️', submitted: '📬', under_review: '🔍', accepted: '✅', rejected: '❌', revision_requested: '✏️', closed: '🏁', cancelled: '🚫' };
              return <span key={s} className="px-2.5 py-1 rounded-md text-[10px] font-bold flex items-center gap-1" style={{ background: `${cols[s]}22`, color: cols[s], border: `1px solid ${cols[s]}` }}>{icons[s]} {s.replace(/_/g, ' ')}</span>;
            })}
          </div>
          <div className="mt-3 text-[10px]" style={{ color: 'var(--sub)' }}>
            {Object.entries({ draft: ['dispatched'], dispatched: ['acknowledged', 'cancelled'], acknowledged: ['in_progress', 'cancelled'], in_progress: ['submitted', 'cancelled'], submitted: ['under_review'], under_review: ['accepted', 'rejected', 'revision_requested'], rejected: ['in_progress'], revision_requested: ['in_progress'], accepted: ['closed'] }).map(([from, tos]) => (
              <div key={from} className="py-0.5"><span className="font-bold" style={{ color: 'var(--am)' }}>{from}</span> → {tos.map(t => <span key={t} className="text-[9px] px-1.5 py-0.5 mx-0.5 rounded border border-dashed" style={{ borderColor: 'var(--bd)' }}>{t}</span>)}</div>
            ))}
          </div>
        </div>
        {/* SLA Framework */}
        <div className="nb-card anim"><h3 className="text-[13px] font-bold mb-2" style={{ color: 'var(--tx)' }}>4-Tier SLA Framework</h3>
          <div className="grid grid-cols-4 gap-3 grid-responsive">
            {[{ k: 'tatkal', l: 'Tatkal', hi: 'तत्काल', h: 4, ack: 0.5, c: '#EF4444', ex: 'Viral scandal, deepfake, EC notice' }, { k: 'atyavashy', l: 'Atyavashy', hi: 'अत्यावश्य', h: 24, ack: 2, c: '#F97316', ex: 'Negative media cycle, opposition attack' }, { k: 'samayik', l: 'Samayik', hi: 'सामयिक', h: 168, ack: 24, c: '#FBBF24', ex: 'Event prep, Jan Darbar backlog' }, { k: 'niyamit', l: 'Niyamit', hi: 'नियमित', h: 720, ack: 72, c: '#3B82F6', ex: 'Monthly NRI review, cadre audit' }].map(s => (
              <div key={s.k} className="text-center p-2.5 rounded-lg cursor-pointer" style={{ borderColor: s.c, border: `1px solid ${s.c}40` }}>
                <div className="text-[11px] font-bold" style={{ color: s.c }}>{s.l}</div>
                <div className="text-[9px] opacity-70 font-deva">{s.hi}</div>
                <div className="text-[10px] mt-0.5" style={{ color: 'var(--mn)' }}>{s.h}h SLA</div>
                <div className="text-[8px]" style={{ color: 'var(--mn)' }}>Ack: {s.ack}h</div>
                <div className="text-[8px] mt-1" style={{ color: 'var(--sub)' }}>{s.ex}</div>
              </div>
            ))}
          </div>
        </div>
        {/* DB Tables + API */}
        <div className="grid grid-cols-2 gap-3 grid-responsive anim">
          <div className="nb-card"><h3 className="text-[13px] font-bold mb-2" style={{ color: 'var(--tx)' }}>10 Database Tables</h3>
            {[{ t: 'iascl_actions', c: 32 }, { t: 'iascl_transitions', c: 14 }, { t: 'iascl_criteria', c: 12 }, { t: 'iascl_recipients', c: 12 }, { t: 'iascl_responses', c: 14 }, { t: 'iascl_notifications', c: 13 }, { t: 'iascl_attachments', c: 10 }, { t: 'iascl_escalations', c: 11 }, { t: 'iascl_karma_ledger', c: 10 }, { t: 'iascl_ai_suggestions', c: 11 }].map(tb => (
              <div key={tb.t} className="p-1.5 mb-1 rounded-md" style={{ background: 'var(--bg)', border: '1px solid var(--bd)' }}>
                <div className="flex justify-between"><span className="font-mono text-[10px]" style={{ color: 'var(--am)' }}>{tb.t}</span><span className="text-[9px]" style={{ color: 'var(--mn)' }}>{tb.c} cols</span></div>
              </div>
            ))}
          </div>
          <div className="nb-card"><h3 className="text-[13px] font-bold mb-2" style={{ color: 'var(--tx)' }}>11 REST Endpoints</h3>
            {[{ m: 'POST', p: '/api/v1/iascl/dispatch' }, { m: 'GET', p: '/api/v1/iascl/actions' }, { m: 'GET', p: '/api/v1/iascl/actions/{uid}' }, { m: 'PUT', p: '/api/v1/iascl/actions/{uid}/status' }, { m: 'POST', p: '/api/v1/iascl/actions/{uid}/acknowledge' }, { m: 'POST', p: '/api/v1/iascl/actions/{uid}/respond' }, { m: 'PUT', p: '/api/v1/iascl/criteria/{id}' }, { m: 'GET', p: '/api/v1/iascl/stats' }, { m: 'GET', p: '/api/v1/iascl/karma/ledger' }, { m: 'POST', p: '/api/v1/iascl/actions/{uid}/escalate' }, { m: 'GET', p: '/api/v1/iascl/my-actions' }].map(ep => (
              <div key={ep.p} className="py-0.5 flex gap-1.5 text-[10px]" style={{ borderBottom: '1px solid var(--bd)' }}>
                <Tag bg={ep.m === 'POST' ? 'var(--em)' : ep.m === 'PUT' ? '#F59E0B' : 'var(--bl)'}>{ep.m}</Tag>
                <span className="font-mono" style={{ color: 'var(--am)' }}>{ep.p}</span>
              </div>
            ))}
          </div>
        </div>
      </>) : curPill === 'dispatch' ? (<>
        {/* Dispatch Panel — AI suggestions per alert */}
        <div className="nb-card anim"><h3 className="text-[13px] font-bold mb-1" style={{ color: 'var(--tx)' }}>Quick Dispatch — Create New IASCL Action</h3>
          <p className="text-[11px] mb-3" style={{ color: 'var(--sub)' }}>Select an alert → AI generates suggestions with criteria → Dispatch creates IASCL action with SLA.</p>
          {activeAlerts.map(al => {
            const archProto = (SMART_TEMPLATES.crisis_protocol as Record<string, Record<string, { label: string; desc: string; conf: number; urg: string; criteria: string[] }[]>>)[ck]?.[al.sv] || []; const suggs = archProto.length > 0 ? archProto : [{ label: 'Immediate Response', desc: 'Public acknowledgment within 2h.', conf: 92, urg: 'tatkal', criteria: ['Issue statement 2h', 'Assign crisis lead', 'Monitor hourly'] }, { label: 'Strategic Containment', desc: 'Legal + platform action.', conf: 85, urg: 'tatkal', criteria: ['Legal notice 4h', 'Document evidence', 'Platform takedown'] }, { label: 'Stakeholder Outreach', desc: 'Direct contact with affected parties.', conf: 78, urg: 'atyavashy', criteria: ['Contact stakeholders', 'Remediation plan', 'Follow up 24h'] }]; return (
              <div key={al.id} className="p-3 mb-2 rounded-lg" style={{ borderLeft: `4px solid ${SEV_C[al.sv]}`, background: 'var(--bg)' }}>
                <div className="flex justify-between items-center"><span className="text-xs font-bold" style={{ color: 'var(--tx)' }}>{al.ic} {al.t}</span><Tag bg={SEV_C[al.sv]}>{al.sv.toUpperCase()}</Tag></div>
                <div className="text-[10px] my-1.5" style={{ color: 'var(--sub)' }}>{al.ds}</div>
                <div className="text-[9px] font-bold my-1.5" style={{ color: 'var(--am)' }}>🤖 AI SUGGESTIONS ({suggs.length} options)</div>
                {suggs.map((sg, si) => (
                  <div key={si} className="p-2 mb-1 rounded-md transition-colors hover:bg-white/5" style={{ background: 'var(--cd)', border: '1px solid var(--bd)' }}>
                    <div className="flex justify-between"><span className="text-[11px] font-semibold" style={{ color: 'var(--tx)' }}>{sg.label}</span><span className="text-[9px]" style={{ color: 'var(--am)' }}>{sg.conf}% conf</span></div>
                    <div className="text-[9px] my-0.5" style={{ color: 'var(--sub)' }}>{sg.desc}</div>
                    <div className="flex gap-1 flex-wrap my-1">{sg.criteria.map(cr => <span key={cr} className="text-[8px] px-1.5 py-0.5 rounded" style={{ background: 'var(--bg)', border: '1px solid var(--bd)' }}>{cr}</span>)}</div>
                    <div className="text-[8px]" style={{ color: 'var(--mn)' }}>SLA: {sg.urg} · Criteria: {sg.criteria.length}</div>
                    <button className="nb-btn nb-btn-success text-[9px] mt-1" onClick={() => { iascl.dispatchFromAlert(al.id, sg.label, sg.urg, sg.criteria, 'Auto'); setDispatched(p => ({ ...p, [al.id]: true })); EB.emit(EB.TOPICS.IASCL_DISPATCHED, { uid: al.id, label: sg.label }, 'dispatch'); toast(`⚡ IASCL dispatched: ${sg.label}`, 'success'); }}>⚡ Dispatch</button>
                  </div>
                ))}
              </div>);
          })}
        </div>
      </>) : renderFallback()}
    </>);

    // Analytics
    if (curMod === 'analytics') return (<>
      <h2 className="nb-section anim">📈 Analytics — {PILL_LABELS[curPill] || curPill}</h2>
      {curPill === 'rivals' ? (<div className="grid grid-cols-3 gap-3 grid-responsive anim">
        {[{ n: a.n + ' (You)', nri, tr: 0, you: true }, ...a.rv].map((r, i) => (
          <div key={i} className="nb-card text-center" style={{ borderTop: `3px solid ${i === 0 ? 'var(--am)' : 'var(--rd)'}` }}>
            <div className="text-[13px] font-bold" style={{ color: 'var(--tx)' }}>{r.n}</div>
            <div className="font-mono text-3xl font-bold mt-2" style={{ color: i === 0 ? 'var(--am)' : 'var(--sub)' }}>{typeof r.nri === 'number' ? r.nri.toFixed(1) : r.nri}</div>
            <div className="text-[10px]" style={{ color: 'var(--sub)' }}>NRI</div>
          </div>
        ))}
      </div>) : curPill === 'trends' ? (
        <div className="nb-card anim" style={{ minHeight: 300 }}><h3 className="text-[13px] font-bold mb-2" style={{ color: 'var(--tx)' }}>📈 NRI Trend — 6 Month</h3>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={trendData}><XAxis dataKey="m" tick={{ fill: '#8B80A8', fontSize: 10 }} /><YAxis tick={{ fill: '#8B80A8', fontSize: 10 }} domain={[60, 80]} /><Tooltip contentStyle={{ background: '#1A1335', border: '1px solid rgba(124,58,237,.2)', borderRadius: 8 }} /><Line type="monotone" dataKey="v" stroke="#7C3AED" strokeWidth={2} dot={{ fill: '#7C3AED', r: 4 }} /></LineChart>
          </ResponsiveContainer>
        </div>
      ) : curPill === 'sentiment' ? (
        <div className="nb-card anim" style={{ minHeight: 300 }}><h3 className="text-[13px] font-bold mb-2" style={{ color: 'var(--tx)' }}>📊 30-Day Sentiment</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={sentData}><XAxis dataKey="d" tick={{ fill: '#8B80A8', fontSize: 7 }} /><YAxis tick={{ fill: '#8B80A8', fontSize: 9 }} /><Tooltip contentStyle={{ background: '#1A1335', border: '1px solid rgba(124,58,237,.2)', borderRadius: 8 }} /><Bar dataKey="pos" fill="rgba(5,150,105,.6)" stackId="s" /><Bar dataKey="neg" fill="rgba(230,57,70,.6)" stackId="s" /></BarChart>
          </ResponsiveContainer>
        </div>
      ) : renderFallback()}
    </>);

    // Chunav Yantra
    if (curMod === 'chunav') {
      const booths = [{ w: 'Ward 1-5', st: 'safe', c: 'var(--em)', n: 380 }, { w: 'Ward 6-10', st: 'lean', c: 'var(--gd)', n: 350 }, { w: 'Ward 11-15', st: 'toss', c: 'var(--rd)', n: 320 }, { w: 'Ward 16-20', st: 'safe', c: 'var(--em)', n: 392 }, { w: 'Ward 21-25', st: 'lean', c: 'var(--gd)', n: 400 }];
      return (<>
        <h2 className="nb-section anim">🗳️ Chunav Yantra — Booth Intelligence</h2>
        <div className="grid grid-cols-5 gap-3 mb-3.5 grid-responsive anim">
          <Stat n={a.cn.booth} l="Total Booths" borderColor="var(--am)" /><Stat n="78%" l="Turnout Est." borderColor="var(--em)" /><Stat n={a.cn.eldt} l="Next Election" borderColor="var(--bl)" /><Stat n="3" l="Safe Zones" borderColor="var(--em)" /><Stat n="1" l="Toss-up" borderColor="var(--rd)" />
        </div>
        <div className="grid grid-cols-5 gap-3 grid-responsive anim">
          {booths.map((b, i) => (<div key={i} className="nb-card text-center" style={{ borderTop: `3px solid ${b.c}` }}><div className="text-[13px] font-bold" style={{ color: 'var(--tx)' }}>{b.w}</div><div className="text-[11px] font-semibold my-1.5" style={{ color: b.c }}>{b.st.toUpperCase()}</div><div className="text-[10px]" style={{ color: 'var(--sub)' }}>{b.n} booths</div></div>))}
        </div>
      </>);
    }

    if (curMod === 'ingest') return <IngestHub {...P} />;
    if (curMod === 'vault') return <VaultBrowser {...P} />;

    // Sansad Meter
    if (curMod === 'sansad') return (<>
      <h2 className="nb-section anim">🏛 Sansad Meter — Parliament Scorecard</h2>
      <div className="grid grid-cols-4 gap-3 mb-3.5 grid-responsive anim">
        <Stat n={`${a.san.att}%`} l="Attendance" color="var(--em)" borderColor="var(--em)" /><Stat n={a.san.ques} l="Questions Asked" color="var(--bl)" borderColor="var(--bl)" /><Stat n={a.san.pvt} l="Pvt. Bills" color="var(--gd)" borderColor="var(--gd)" /><Stat n={a.san.bill} l="Bills Passed" color="var(--am)" borderColor="var(--am)" />
      </div>
      <div className="nb-card anim" style={{ minHeight: 260 }}><h3 className="text-[13px] font-bold mb-2" style={{ color: 'var(--tx)' }}>Session Comparison</h3>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={sansadData}><XAxis dataKey="s" tick={{ fill: '#8B80A8', fontSize: 10 }} /><YAxis tick={{ fill: '#8B80A8', fontSize: 10 }} /><Tooltip contentStyle={{ background: '#1A1335', border: '1px solid rgba(124,58,237,.2)', borderRadius: 8 }} /><Bar dataKey="att" fill="rgba(5,150,105,.7)" name="Attendance %" /><Bar dataKey="q" fill="rgba(59,130,246,.7)" name="Questions" /></BarChart>
        </ResponsiveContainer>
      </div>
    </>);

    // Vikas Patra
    if (curMod === 'vikas') {
      const projects = [{ n: 'NH-28 Expansion', st: 'On Track', p: 72, b: '180Cr', c: 'var(--em)' }, { n: 'District Hospital', st: 'Delayed', p: 45, b: '95Cr', c: 'var(--rd)' }, { n: 'Smart City Phase 2', st: 'On Track', p: 88, b: '250Cr', c: 'var(--em)' }, { n: 'Industrial Park', st: 'Planning', p: 15, b: '420Cr', c: 'var(--gd)' }, { n: 'Water Treatment', st: 'On Track', p: 60, b: '75Cr', c: 'var(--em)' }];
      return (<>
        <h2 className="nb-section anim">🏗 Vikas Patra — Development Tracker</h2>
        <div className="grid grid-cols-3 gap-3 mb-3.5 grid-responsive anim"><Stat n="94%" l="MPLADS Utilization" borderColor="var(--em)" /><Stat n={projects.length} l="Active Projects" borderColor="var(--bl)" /><Stat n="1020Cr" l="Total Budget" borderColor="var(--gd)" /></div>
        {projects.map((pr, i) => (<div key={i} className="nb-card anim" style={{ borderLeft: `3px solid ${pr.c}` }}><div className="flex justify-between"><span className="text-[13px] font-bold" style={{ color: 'var(--tx)' }}>{pr.n}</span><Tag bg={pr.c}>{pr.st}</Tag></div><div className="mt-2"><ProgressBar pct={pr.p} color={pr.c} /></div><div className="flex justify-between mt-1 text-[10px]" style={{ color: 'var(--sub)' }}><span>Progress: {pr.p}%</span><span>Budget: ₹{pr.b}</span></div></div>))}
      </>);
    }

    // Jan Darbar
    if (curMod === 'jandarbar') {
      const griev = [{ tx: 'Water supply disruption Ward 14', cat: 'Infrastructure', st: 'Open', pr: 'High', dt: '2d ago' }, { tx: 'Street light broken Naya Bazar', cat: 'Civic', st: 'In Progress', pr: 'Medium', dt: '5d ago' }, { tx: 'Ration card correction', cat: 'Welfare', st: 'Resolved', pr: 'Low', dt: '1w ago' }, { tx: 'Pension delay 3 months', cat: 'Welfare', st: 'Open', pr: 'High', dt: '3d ago' }, { tx: 'Illegal construction', cat: 'Legal', st: 'Escalated', pr: 'High', dt: '1d ago' }];
      const stC: Record<string, string> = { Open: 'var(--rd)', 'In Progress': 'var(--gd)', Resolved: 'var(--em)', Escalated: '#F59E0B' };
      return (<>
        <h2 className="nb-section anim">👥 Jan Darbar — Grievance Analytics</h2>
        <div className="grid grid-cols-4 gap-3 mb-3.5 grid-responsive anim"><Stat n={griev.length} l="Total Cases" borderColor="var(--am)" /><Stat n={griev.filter(g => g.st === 'Open').length} l="Open" borderColor="var(--rd)" /><Stat n="82%" l="Resolution Rate" borderColor="var(--em)" /><Stat n="3.2d" l="Avg. Resolution" borderColor="var(--bl)" /></div>
        {griev.map((g, i) => (<div key={i} className="nb-card anim" style={{ borderLeft: `3px solid ${stC[g.st] || 'var(--bl)'}` }}><div className="flex justify-between"><span className="text-xs font-semibold" style={{ color: 'var(--tx)' }}>{g.tx}</span><Tag bg={stC[g.st] || 'var(--bl)'}>{g.st}</Tag></div><div className="text-[10px] mt-1" style={{ color: 'var(--sub)' }}>{g.cat} · Priority: {g.pr} · {g.dt}</div></div>))}
      </>);
    }

    // Samikaran
    if (curMod === 'samikaran') {
      const castes = [{ g: 'Upper Caste', pct: 22, sup: 68, c: '#D4AF37' }, { g: 'OBC', pct: 38, sup: 72, c: '#F97316' }, { g: 'SC/ST', pct: 24, sup: 55, c: '#8B5CF6' }, { g: 'Muslim', pct: 12, sup: 35, c: '#059669' }, { g: 'Others', pct: 4, sup: 60, c: '#3B82F6' }];
      return (<>
        <h2 className="nb-section anim">⚖️ Samikaran — Caste Equation</h2>
        <div className="grid grid-cols-5 gap-3 grid-responsive anim">
          {castes.map((c, i) => (<div key={i} className="nb-card text-center" style={{ borderTop: `3px solid ${c.c}` }}><div className="text-[13px] font-bold" style={{ color: 'var(--tx)' }}>{c.g}</div><div className="font-mono text-[22px] font-bold my-1.5" style={{ color: c.c }}>{c.pct}%</div><div className="text-[10px]" style={{ color: 'var(--sub)' }}>Support: {c.sup}%</div><ProgressBar pct={c.sup} color={c.c} height={4} /></div>))}
        </div>
        <div className="nb-card anim" style={{ minHeight: 250 }}><h3 className="text-[13px] font-bold mb-2" style={{ color: 'var(--tx)' }}>Coalition Math</h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart><Pie data={casteData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80}>{casteData.map((e, i) => <Cell key={i} fill={e.fill} />)}</Pie><Tooltip contentStyle={{ background: '#1A1335', border: '1px solid rgba(124,58,237,.2)', borderRadius: 8, fontSize: 10 }} /></PieChart>
          </ResponsiveContainer>
        </div>
      </>);
    }

    // Dal Sthiti
    if (curMod === 'dal') {
      const party = [{ n: 'High Command Trust', v: 78, c: 'var(--em)' }, { n: 'State Unit Standing', v: 65, c: 'var(--gd)' }, { n: 'Cadre Loyalty', v: 82, c: 'var(--am)' }, { n: 'Ticket Certainty', v: 70, c: 'var(--bl)' }, { n: 'Internal Rivals', v: 35, c: 'var(--rd)' }];
      return (<>
        <h2 className="nb-section anim">⭐ Dal Sthiti — Party Standing</h2>
        {party.map((p, i) => (<div key={i} className="nb-card anim"><div className="flex justify-between mb-1.5"><span className="text-xs font-semibold" style={{ color: 'var(--tx)' }}>{p.n}</span><span className="font-mono font-bold" style={{ color: p.c }}>{p.v}%</span></div><ProgressBar pct={p.v} color={p.c} height={8} /></div>))}
      </>);
    }

    // Social
    if (curMod === 'social' && curPill === 'inbox') return renderSocialInbox();
    if (curMod === 'social') {
      if (curPill === 'channels') {
        // Full Channel Config with OCR/ASR Upload + Multi-Instance
        return (<>
          <h2 className="nb-section anim">🔗 Channel Configuration — 11 Platforms (8 Social + 3 Media AI)</h2>

          {/* OCR/ASR Media Upload Panel */}
          <div className="nb-card anim" style={{ border: '2px solid var(--am)', background: 'linear-gradient(135deg,rgba(124,58,237,.04),rgba(180,83,9,.03))' }}>
            <h3 className="text-[13px] font-bold mb-1.5" style={{ color: 'var(--tx)' }}>📤 Media Upload — OCR & ASR Processing Pipeline</h3>
            <p className="text-[10px] mb-3" style={{ color: 'var(--sub)' }}>Upload newspaper cuttings, audio files, or video broadcasts. Content auto-processed through AI engines and fed into the unified data pipeline.</p>
            <div className="grid grid-cols-3 gap-3 mb-3 grid-responsive">
              {/* OCR Upload */}
              <input ref={ocrFileRef as React.LegacyRef<HTMLInputElement>} type="file" accept="image/*,.pdf" multiple className="hidden" onChange={e => { if (e.target.files?.[0]) { MEDIA_PIPE.processOCR(e.target.files[0].name); toast(`📰 OCR Processing: ${e.target.files[0].name}. Conf: ${Math.floor(Math.random() * 10 + 88)}%`, 'success'); } }} />
              <div className="p-3.5 rounded-lg text-center cursor-pointer transition-colors hover:bg-white/5" style={{ background: 'var(--bg)', border: '2px dashed #B45309' }} onClick={() => ocrFileRef.current?.click()}>
                <div className="text-3xl mb-1.5">📰</div>
                <div className="text-xs font-bold" style={{ color: '#B45309' }}>Newspaper Cuttings</div>
                <div className="text-[9px] mt-1" style={{ color: 'var(--mn)' }}>JPG, PNG, PDF · Max 25MB</div>
                <div className="text-[8px] mt-1.5 px-2 py-1 rounded" style={{ background: 'rgba(180,83,9,.08)', color: 'var(--sub)' }}>Engine: Tesseract 5 + Claude Vision</div>
                <div className="text-[8px] mt-0.5" style={{ color: 'var(--mn)' }}>Hindi · English · Urdu</div>
              </div>
              {/* ASR Audio Upload */}
              <input ref={asrAudioRef as React.LegacyRef<HTMLInputElement>} type="file" accept="audio/*" multiple className="hidden" onChange={e => { if (e.target.files?.[0]) { MEDIA_PIPE.processASR(e.target.files[0].name); toast(`🎤 ASR Processing: ${e.target.files[0].name}. Conf: ${Math.floor(Math.random() * 8 + 86)}%`, 'success'); } }} />
              <div className="p-3.5 rounded-lg text-center cursor-pointer transition-colors hover:bg-white/5" style={{ background: 'var(--bg)', border: '2px dashed #7C2D12' }} onClick={() => asrAudioRef.current?.click()}>
                <div className="text-3xl mb-1.5">🎤</div>
                <div className="text-xs font-bold" style={{ color: '#7C2D12' }}>Audio / Radio Broadcast</div>
                <div className="text-[9px] mt-1" style={{ color: 'var(--mn)' }}>MP3, WAV, OGG, M4A · Max 100MB</div>
                <div className="text-[8px] mt-1.5 px-2 py-1 rounded" style={{ background: 'rgba(124,45,18,.08)', color: 'var(--sub)' }}>Engine: Whisper Large-v3 + Speaker ID</div>
                <div className="text-[8px] mt-0.5" style={{ color: 'var(--mn)' }}>Hindi · English · Bhojpuri · Awadhi</div>
              </div>
              {/* ASR Video Upload */}
              {/* ASR Video Upload */}
              <input ref={asrVideoRef as React.LegacyRef<HTMLInputElement>} type="file" accept="video/*" multiple className="hidden" onChange={e => { if (e.target.files?.[0]) { MEDIA_PIPE.processASR(e.target.files[0].name, true); toast(`📹 Video ASR+Vision: ${e.target.files[0].name}. Conf: ${Math.floor(Math.random() * 8 + 86)}%`, 'success'); } }} />
              <div className="p-3.5 rounded-lg text-center cursor-pointer transition-colors hover:bg-white/5" style={{ background: 'var(--bg)', border: '2px dashed #4C1D95' }} onClick={() => asrVideoRef.current?.click()}>
                <div className="text-3xl mb-1.5">📹</div>
                <div className="text-xs font-bold" style={{ color: '#4C1D95' }}>Video Broadcast</div>
                <div className="text-[9px] mt-1" style={{ color: 'var(--mn)' }}>MP4, MKV, AVI, MOV · Max 500MB</div>
                <div className="text-[8px] mt-1.5 px-2 py-1 rounded" style={{ background: 'rgba(76,29,149,.08)', color: 'var(--sub)' }}>Engine: Whisper-v3 + YOLO v8 Vision</div>
                <div className="text-[8px] mt-0.5" style={{ color: 'var(--mn)' }}>Speech + Face + Banner + Crowd</div>
              </div>
            </div>
            {/* Pipeline visualization */}
            <div className="p-3 rounded-lg" style={{ background: 'var(--bg)', border: '1px solid var(--bd)' }}>
              <div className="text-[10px] font-bold mb-2" style={{ color: 'var(--am)' }}>⚙ Processing Pipeline</div>
              <div className="flex items-center gap-1.5 flex-wrap text-[9px]">
                {[{ l: '📰 Upload', bg: '#B4530922', c: '#B45309' }, { l: '🧠 OCR/ASR Engine', bg: 'rgba(124,58,237,.1)', c: 'var(--am)' }, { l: '🔍 NLP: Sentiment + Entity', bg: 'rgba(59,130,246,.1)', c: '#3B82F6' }, { l: '🎯 Pillar Mapping', bg: 'rgba(245,179,9,.1)', c: '#D97706' }, { l: '📊 Unified Pipeline', bg: 'rgba(5,150,105,.1)', c: 'var(--em)' }].map((s, i) => (
                  <Fragment key={i}>
                    {i > 0 && <span style={{ color: 'var(--mn)' }}>→</span>}
                    <span className="px-2 py-1 rounded font-bold" style={{ background: s.bg, color: s.c }}>{s.l}</span>
                  </Fragment>
                ))}
              </div>
              <div className="flex gap-2 mt-2 flex-wrap text-[8px]" style={{ color: 'var(--mn)' }}>
                {['✔ Social Inbox', '✔ FIS scoring', '✔ NRI pillar impact', '✔ Alerts engine', '✔ IASCL triggers', '✔ Pratikriya FMS', '✔ Trend analysis', '✔ AI Suggestions'].map(t => <span key={t}>{t}</span>)}
              </div>
            </div>
            {/* Processing Log */}
            <div className="mt-3"><div className="text-[10px] font-bold mb-1.5" style={{ color: 'var(--am)' }}>📋 Recent Processing Log</div>
              {MEDIA_PIPE.getRecentLog().map((m, i) => {
                const tc = m.tp === 'OCR' ? '#B45309' : m.tp === 'ASR' ? '#7C2D12' : '#4C1D95'; return (
                  <div key={i} className="py-1 px-2 mb-0.5 rounded-md flex items-center gap-2 flex-wrap text-[10px]" style={{ background: 'var(--bg)', borderLeft: `3px solid ${tc}` }}>
                    <span className="px-1.5 py-0.5 rounded font-bold text-[8px]" style={{ background: `${tc}22`, color: tc }}>{m.tp}</span>
                    <span className="flex-1" style={{ color: 'var(--sub)' }}>{m.s}</span>
                    <span style={{ color: 'var(--mn)' }}>{m.ln}</span>
                    <span style={{ color: 'var(--mn)' }}>Conf: {m.cf}%</span>
                    <span style={{ color: 'var(--mn)' }}>Pillar: {m.pl}</span>
                    <span style={{ color: m.sn > 0 ? 'var(--em)' : 'var(--rd)' }}>Snt: {m.sn > 0 ? '+' : ''}{m.sn}</span>
                    <span style={{ color: 'var(--em)' }}>✅</span>
                  </div>);
              })}
            </div>
          </div>

          {/* Channel Cards with Multi-Instance */}
          {CHANNELS.map(ch => {
            const stCol = ch.st === 'connected' ? 'var(--em)' : ch.st === 'pending' ? 'var(--gd)' : 'var(--mn)';
            return (
              <div key={ch.id} className="nb-card anim">
                <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => toast(`${ch.nm} config expanded`)}>
                  <span className="text-xl">{ch.ic}</span>
                  <div className="flex-1">
                    <div className="text-[13px] font-semibold" style={{ color: 'var(--tx)' }}>{ch.nm} <span className="text-[10px]" style={{ color: 'var(--sub)' }}>({ch.hi})</span></div>
                    <div className="text-[10px]" style={{ color: 'var(--sub)' }}>{ch.api} · {ch.auth}</div>
                  </div>
                  <Tag bg={stCol}>{ch.st.toUpperCase()}</Tag>
                </div>
                {/* Stats */}
                <div className="flex gap-3 mt-2 flex-wrap text-[10px]">
                  <span><b>{ch.stats.fol}</b> <span style={{ color: 'var(--mn)' }}>followers</span></span>
                  <span><b>{ch.stats.items}</b> <span style={{ color: 'var(--mn)' }}>items</span></span>
                  <span style={{ color: ch.stats.pend > 10 ? 'var(--rd)' : 'var(--em)' }}><b>{ch.stats.pend}</b> <span style={{ color: 'var(--mn)' }}>pending</span></span>
                  <span><b>{ch.stats.resp}%</b> <span style={{ color: 'var(--mn)' }}>response</span></span>
                </div>
                {/* Capabilities */}
                <div className="flex gap-1.5 mt-2 flex-wrap">
                  {[{ l: 'Read', k: 'read' }, { l: 'Reply', k: 'reply' }, { l: 'Delete', k: 'del' }, { l: 'DM', k: 'dm' }, { l: 'Webhook', k: 'wh' }].map(cap => (
                    <span key={cap.k} className="text-[10px] px-2 py-0.5 rounded-md" style={{ border: `1px solid ${(ch.can as Record<string, number>)[cap.k] ? 'var(--em)' : 'var(--bd)'}`, color: (ch.can as Record<string, number>)[cap.k] ? 'var(--em)' : 'var(--mn)', background: (ch.can as Record<string, number>)[cap.k] ? 'rgba(5,150,105,.08)' : 'var(--bg)' }}>
                      {cap.l}: {(ch.can as Record<string, number>)[cap.k] ? '✅' : '❌'}
                    </span>
                  ))}
                </div>
                {/* Multi-Instance Panel */}
                {(ch.instances || []).length > 0 && (
                  <div className="mt-3 pt-2.5" style={{ borderTop: '1px solid var(--bd)' }}>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-[11px] font-bold" style={{ color: 'var(--am)' }}>📡 Instances ({(ch.instances || []).length})</span>
                      <button className="nb-btn nb-btn-success text-[9px] py-0.5 px-2" onClick={() => toast(`+ Instance added to ${ch.nm}`, 'success')}>+ Add Instance</button>
                    </div>
                    {(ch.instances || []).map((inst: any, ii: number) => {
                      const iSt = inst.st === 'connected' ? 'var(--em)' : inst.st === 'pending' ? 'var(--gd)' : 'var(--mn)';
                      return (
                        <div key={ii} className="p-2 mb-1 rounded-md" style={{ background: 'var(--bg)', border: '1px solid var(--bd)' }}>
                          <div className="flex justify-between items-center flex-wrap gap-1">
                            <div className="flex items-center gap-1.5">
                              <span className="text-[9px] px-1.5 py-0.5 rounded font-bold" style={{ background: 'rgba(124,58,237,.1)', color: 'var(--am)' }}>#{ii + 1}</span>
                              <b className="text-[11px]" style={{ color: 'var(--tx)' }}>{inst.label}</b>
                              <span className="font-mono text-[10px]" style={{ color: 'var(--mn)' }}>{inst.hd}</span>
                            </div>
                            <Tag bg={iSt}>{inst.st.toUpperCase()}</Tag>
                          </div>
                          <div className="flex gap-2.5 mt-1 text-[9px] flex-wrap" style={{ color: 'var(--mn)' }}>
                            <span>Fol: <b>{inst.stats.fol}</b></span>
                            <span>Items: <b>{inst.stats.items}</b></span>
                            <span style={{ color: inst.stats.pend > 10 ? 'var(--rd)' : 'var(--em)' }}>Pend: <b>{inst.stats.pend}</b></span>
                            <span>Resp: <b>{inst.stats.resp}%</b></span>
                          </div>
                          {inst.notes && <div className="text-[8px] mt-0.5" style={{ color: 'var(--sub)' }}>ℹ {inst.notes}</div>}
                        </div>
                      );
                    })}
                    <div className="mt-1.5 p-1.5 rounded text-[9px]" style={{ background: 'rgba(124,58,237,.04)', color: 'var(--am)' }}>
                      📊 Aggregate: {(ch.instances || []).length} instances · {(ch.instances || []).filter((i: any) => i.st === 'connected').length} connected · {(ch.instances || []).reduce((s: number, i: any) => s + i.stats.items, 0)} total items · {(ch.instances || []).reduce((s: number, i: any) => s + i.stats.pend, 0)} pending
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </>);
      }
      return (<>
        <h2 className="nb-section anim">💬 Social Command — {PILL_LABELS[curPill] || curPill}</h2>
        {curPill === 'ytstudio' ? (<>
          <div className="grid grid-cols-2 gap-3 grid-responsive anim">
            <div className="nb-card"><h3 className="text-[13px] font-bold mb-2" style={{ color: 'var(--tx)' }}>Recent Videos</h3>
              {YT_VIDS.map((v, i) => (<div key={i} className="flex gap-2.5 py-2" style={{ borderBottom: '1px solid var(--bd)' }}>
                <div className="w-20 h-11 rounded flex items-center justify-center" style={{ background: '#000' }}><span className="text-xs text-white px-1.5 py-0.5 rounded" style={{ background: 'rgba(255,0,0,.85)' }}>▶</span></div>
                <div className="flex-1"><div className="text-xs font-semibold" style={{ color: 'var(--tx)' }}>{v.t}</div><div className="text-[10px] mt-0.5" style={{ color: 'var(--sub)' }}>{v.v} views · {v.lk} likes · {v.cm} comments</div><div className="text-[9px]" style={{ color: 'var(--mn)' }}>📅 {v.pub} · {v.dur}</div></div>
              </div>))}
            </div>
            <div className="nb-card"><h3 className="text-[13px] font-bold mb-2" style={{ color: 'var(--tx)' }}>Comments ({YT_CMTS.filter(c => !c.re).length} pending)</h3>
              {YT_CMTS.map(c => {
                const sCol = c.snt > .3 ? 'var(--em)' : c.snt < -.3 ? 'var(--rd)' : 'var(--gd)'; return (
                  <div key={c.id} className="nb-card" style={{ padding: 8, marginBottom: 4 }}><div className="flex justify-between"><b className="text-[11px]" style={{ color: 'var(--tx)' }}>{c.au}</b><span className="text-[10px]" style={{ color: sCol }}>{c.em} {(c.snt * 100).toFixed(0)}%</span></div>
                    {YT_VIDS[c.vid] && <div className="text-[9px] my-0.5" style={{ color: 'var(--mn)' }}>▶ on: <span style={{ color: 'var(--am)' }}>{YT_VIDS[c.vid].t}</span></div>}
                    <div className="text-[11px]" style={{ color: 'var(--sub)' }}>{c.tx}</div>
                    <div className="flex gap-1.5 mt-1"><button className="nb-btn nb-btn-primary text-[10px]" onClick={() => { setReplyingTo(replyingTo === c.id ? null : c.id); setReplyDraft(SMART_TEMPLATES.response_draft.get(ck, c.snt)); }}>↩ Reply</button><button className="nb-btn text-[10px]">❤</button><button className="nb-btn text-[10px]">📌</button></div>
                    {replyingTo === c.id && (
                      <div className="mt-1.5 p-2 rounded-md" style={{ background: 'var(--bg)', border: '1px solid var(--am)' }}>
                        <div className="text-[9px] font-bold mb-1" style={{ color: 'var(--am)' }}>🤖 AI Draft</div>
                        <textarea className="w-full p-1.5 rounded text-[10px] min-h-[40px] resize-y" style={{ background: 'var(--cd)', border: '1px solid var(--bd)', color: 'var(--tx)' }} value={replyDraft} onChange={e => setReplyDraft(e.target.value)} />
                        <div className="flex gap-1 mt-1"><button className="nb-btn nb-btn-success text-[9px]" onClick={() => { toast('✅ YT reply sent', 'success'); setReplyingTo(null); }}>Send</button><button className="nb-btn text-[9px]" onClick={() => setReplyDraft(SMART_TEMPLATES.response_draft.get(ck, c.snt))}>🔄</button><button className="nb-btn text-[9px]" onClick={() => setReplyingTo(null)}>✕</button></div>
                      </div>
                    )}
                  </div>);
              })}
            </div>
          </div>
        </>) : renderFallback()}
      </>);
    }

    // Pratikriya
    if (curMod === 'pratikriya' && curPill === 'overview') return renderPratikriyaOverview();
    if (curMod === 'pratikriya' && curPill === 'feed') return renderPratikriyaFeed();
    if (curMod === 'pratikriya' && curPill === 'sources') return renderPratikriyaSources();
    if (curMod === 'pratikriya' && curPill === 'iascl') {
      // S1.1 — Live IASCL with interactive transitions using hook
      const COLS: Record<string, string> = { draft: '#94A3B8', dispatched: '#A78BFA', acknowledged: '#38BDF8', in_progress: '#FBBF24', submitted: '#F97316', under_review: '#E879F9', accepted: '#34D399', rejected: '#FB7185', revision_requested: '#FB923C', closed: '#10B981', cancelled: '#9CA3AF' };
      const ICONS: Record<string, string> = { draft: '📝', dispatched: '📤', acknowledged: '👁', in_progress: '⚙️', submitted: '📬', under_review: '🔍', accepted: '✅', rejected: '❌', revision_requested: '✏️', closed: '🏁', cancelled: '🚫' };
      return (<>
        <h2 className="nb-section anim">⚡ IASCL Lifecycle — Live 10-State Machine</h2>
        <div className="grid grid-cols-4 gap-3 mb-3.5 grid-responsive anim">
          <Stat n={iascl.stats.total} l="Total Actions" borderColor="var(--am)" /><Stat n={iascl.stats.active} l="Active" color="var(--gd)" borderColor="var(--gd)" /><Stat n={iascl.stats.closed} l="Closed" color="var(--em)" borderColor="var(--em)" /><Stat n={iascl.stats.breached} l="SLA Breached" color="var(--rd)" borderColor="var(--rd)" />
        </div>
        {/* Live actions with WORKING transition buttons */}
        <div className="nb-card anim"><h3 className="text-[13px] font-bold mb-2" style={{ color: 'var(--tx)' }}>Live IASCL Actions ({iascl.actions.length})</h3>
          {iascl.actions.map(ac => (
            <div key={ac.id} className="p-2.5 mb-2 rounded-lg" style={{ borderLeft: `4px solid ${COLS[ac.status] || '#888'}`, background: 'var(--bg)' }}>
              <div className="flex justify-between items-center flex-wrap gap-1">
                <div><span className="font-mono text-[10px]" style={{ color: 'var(--am)' }}>{ac.uid}</span> <b className="text-[11px]" style={{ color: 'var(--tx)' }}>{ac.action_text}</b></div>
                <span className="px-2 py-0.5 rounded-md text-[9px] font-bold" style={{ background: `${COLS[ac.status] || '#888'}22`, color: COLS[ac.status] || '#888', border: `1px solid ${COLS[ac.status] || '#888'}` }}>{ICONS[ac.status] || '?'} {ac.status.replace(/_/g, ' ')}</span>
              </div>
              <div className="flex gap-3 mt-1 text-[9px]" style={{ color: 'var(--mn)' }}><span>Priority: {ac.priority || '—'}</span><span>Assignee: {ac.assignee || '—'}</span><span>Criteria: {ac.criteria_met_count}/{ac.criteria_count} ({ac.completion_pct}%)</span></div>
              {/* Clickable criteria checkboxes */}
              {ac.criteria.length > 0 && (
                <div className="mt-1.5">{ac.criteria.map(c => (
                  <div key={c.id} className="flex items-center gap-1.5 text-[10px] py-0.5 cursor-pointer" onClick={() => iascl.verifyCriterion(ac.id, c.id, !c.is_met)}>
                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 text-[9px] ${c.is_met ? 'text-white' : ''}`} style={{ borderColor: c.is_met ? 'var(--em)' : 'var(--mn)', background: c.is_met ? 'var(--em)' : 'transparent' }}>{c.is_met ? '✔' : ''}</div>
                    <span style={{ textDecoration: c.is_met ? 'line-through' : 'none', opacity: c.is_met ? .6 : 1, color: 'var(--tx)' }}>{c.text}{c.is_mandatory && <span className="text-[8px] ml-1" style={{ color: 'var(--rd)' }}>*req</span>}</span>
                  </div>
                ))}</div>
              )}
              {/* WORKING transition buttons */}
              {iascl.getValidTransitions(ac.status as IASCLStateType).length > 0 && (
                <div className="flex gap-1.5 mt-2 flex-wrap">
                  {iascl.getValidTransitions(ac.status as IASCLStateType).map(ns => (
                    <button key={ns} className={`nb-btn text-[9px] ${ns === 'accepted' || ns === 'closed' ? 'nb-btn-success' : ns === 'cancelled' || ns === 'rejected' ? 'nb-btn-danger' : ''}`}
                      onClick={() => {
                        const meta: Record<string, unknown> = {};
                        if (ns === 'cancelled') meta.reason = 'Cancelled by user from dashboard';
                        if (ns === 'closed') { meta.outcome = 'Resolved'; }
                        if (ns === 'dispatched') { meta.assignee = 'Self'; meta.action_text = ac.action_text; }
                        iascl.transition(ac.id, ns, meta);
                        EB.emit(ns === 'closed' ? EB.TOPICS.IASCL_CLOSED : EB.TOPICS.IASCL_DISPATCHED, { uid: ac.uid, to: ns }, 'iascl');
                        toast(`→ ${ns.replace(/_/g, ' ')}`, 'success');
                      }}>
                      → {ns.replace(/_/g, ' ')}
                    </button>
                  ))}
                </div>
              )}
              {/* Audit trail */}
              <div className="mt-2 pt-1.5" style={{ borderTop: '1px solid var(--bd)' }}>
                <div className="text-[9px] font-bold" style={{ color: 'var(--am)' }}>Audit Trail ({ac.transitions.length})</div>
                {ac.transitions.map((tr, i) => (
                  <div key={i} className="text-[9px] py-0.5" style={{ color: 'var(--mn)' }}>{tr.from || '∅'} → <span style={{ color: COLS[tr.to] || '#888' }}>{tr.to}</span> · {tr.by} · {new Date(tr.ts).toLocaleTimeString()}</div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </>);
    }
    if (curMod === 'pratikriya' && curPill === 'response') {
      return (<>
        <h2 className="nb-section anim">💬 Response Console <span className="ai-badge ai-badge-smart">🧠 SMART</span></h2>
        <div className="nb-card anim"><h3 className="text-[13px] font-bold mb-1" style={{ color: 'var(--tx)' }}>AI-Powered Response Drafts</h3>
          <p className="text-[11px] mb-3" style={{ color: 'var(--sub)' }}>Negative feedback items with auto-generated response templates via 4-Tier AI.</p>
          {FEEDBACK.filter(f => f.snt < 0).slice(0, 4).map(f => (
            <div key={f.id} className="p-2.5 mb-2 rounded-lg" style={{ background: 'var(--bg)', borderLeft: '3px solid var(--rd)' }}>
              <div className="text-[11px] font-semibold" style={{ color: 'var(--tx)' }}>{f.text}</div>
              <div className="text-[9px] my-1" style={{ color: 'var(--mn)' }}>{f.tm} · {(FB_SRC.find(s => s.id === f.src) || { l: f.src }).l}</div>
              <div className="p-2 rounded-md mt-1.5" style={{ background: 'var(--cd)', borderLeft: '2px solid var(--am)' }}>
                <div className="text-[9px] font-bold" style={{ color: 'var(--am)' }}>AI DRAFT <span className="ai-badge ai-badge-smart">SMART</span></div>
                <div className="text-[11px] mt-1" style={{ color: 'var(--tx)' }}>{SMART_TEMPLATES.response_draft.get(ck, f.snt)}</div>
              </div>
              <div className="flex gap-1.5 mt-2"><button className="nb-btn nb-btn-success text-[10px]">Send</button><button className="nb-btn text-[10px]">Edit</button><button className="nb-btn text-[10px]">Regenerate</button></div>
            </div>
          ))}
        </div>
      </>);
    }
    if (curMod === 'pratikriya') return renderFallback();

    // Arth Bal
    if (curMod === 'arthbal') {
      const funds = [{ s: 'MPLADS', a: '5.0Cr', u: '94%', c: 'var(--em)' }, { s: 'Party Fund', a: '2.8Cr', u: '67%', c: 'var(--gd)' }, { s: 'Corporate', a: '1.5Cr', u: '45%', c: 'var(--bl)' }, { s: 'Personal', a: '0.8Cr', u: '88%', c: 'var(--am)' }];
      return (<>
        <h2 className="nb-section anim">💰 Arth Bal — Financial Muscle</h2>
        <div className="grid grid-cols-4 gap-3 mb-3.5 grid-responsive anim">
          {funds.map((f, i) => (<div key={i} className="nb-card text-center" style={{ borderTop: `3px solid ${f.c}` }}><div className="text-xs font-bold" style={{ color: 'var(--tx)' }}>{f.s}</div><div className="font-mono text-xl font-bold my-1.5" style={{ color: 'var(--tx)' }}>₹{f.a}</div><div className="text-[10px]" style={{ color: 'var(--sub)' }}>Utilized: {f.u}</div></div>))}
        </div>
        <div className="nb-card anim" style={{ minHeight: 260 }}><h3 className="text-[13px] font-bold mb-2" style={{ color: 'var(--tx)' }}>Monthly Expenditure Trend (Lakhs)</h3>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={fundData}><XAxis dataKey="m" tick={{ fill: '#8B80A8', fontSize: 10 }} /><YAxis tick={{ fill: '#8B80A8', fontSize: 10 }} /><Tooltip contentStyle={{ background: '#1A1335', border: '1px solid rgba(124,58,237,.2)', borderRadius: 8 }} /><Line type="monotone" dataKey="v" stroke="#D4AF37" strokeWidth={2} fill="rgba(212,175,55,.1)" dot={{ fill: '#D4AF37', r: 3 }} /></LineChart>
          </ResponsiveContainer>
        </div>
      </>);
    }

    // Vivad Kavach
    if (curMod === 'shield') {
      const crises = [{ t: 'Deepfake Audio', sv: 'High', st: 'Active', dt: '3h ago', resp: 'FIR filed', c: 'var(--rd)' }, { t: 'Rally Expenditure Notice', sv: 'High', st: 'Responding', dt: '2h ago', resp: 'Documentation prep', c: '#F59E0B' }, { t: 'Opposition Allegations', sv: 'Medium', st: 'Monitoring', dt: '1d ago', resp: 'Fact-check published', c: 'var(--gd)' }];
      return (<>
        <h2 className="nb-section anim">🛡 Vivad Kavach — Controversy Shield</h2>
        {crises.map((cr, i) => (<div key={i} className="nb-card anim" style={{ borderLeft: `4px solid ${cr.c}` }}><div className="flex justify-between items-center"><span className="text-[13px] font-bold" style={{ color: 'var(--tx)' }}>🛡 {cr.t}</span><Tag bg={cr.c}>{cr.sv} · {cr.st}</Tag></div><div className="text-[11px] my-1.5" style={{ color: 'var(--sub)' }}>Response: {cr.resp}</div><div className="text-[10px]" style={{ color: 'var(--mn)' }}>{cr.dt}</div></div>))}
      </>);
    }

    // Gathbandhan
    if (curMod === 'gathbandhan') {
      const allies = [{ n: 'Junior Partner A', seats: 12, trust: 72, st: 'Stable', c: 'var(--em)' }, { n: 'Regional Ally B', seats: 8, trust: 45, st: 'Strained', c: 'var(--rd)' }, { n: 'Support Party C', seats: 5, trust: 80, st: 'Strong', c: 'var(--am)' }, { n: 'Independent Group', seats: 3, trust: 55, st: 'Neutral', c: 'var(--gd)' }];
      return (<>
        <h2 className="nb-section anim">🤝 Gathbandhan — Alliance Map</h2>
        <div className="grid grid-cols-4 gap-3 mb-3.5 grid-responsive anim"><Stat n={allies.reduce((s, a) => s + a.seats, 0)} l="Alliance Seats" borderColor="var(--am)" /><Stat n="72%" l="Avg Trust" borderColor="var(--em)" /><Stat n={allies.length} l="Partners" borderColor="var(--bl)" /><Stat n="1" l="At Risk" borderColor="var(--rd)" /></div>
        {allies.map((al, i) => (<div key={i} className="nb-card anim" style={{ borderLeft: `4px solid ${al.c}` }}><div className="flex justify-between items-center"><div><span className="text-[13px] font-bold" style={{ color: 'var(--tx)' }}>{al.n}</span> <span className="text-[10px]" style={{ color: 'var(--sub)' }}>{al.seats} seats</span></div><Tag bg={al.c}>{al.st}</Tag></div><div className="mt-1.5 text-[10px]" style={{ color: 'var(--sub)' }}>Trust: {al.trust}%</div><ProgressBar pct={al.trust} color={al.c} height={4} /></div>))}
      </>);
    }

    // Planning
    if (curMod === 'planning') {
      if (curPill === 'whatif') {
        const scenarios = [
          { s: 'cross_voting', label: 'Cross-voting in Parliament', c: 'var(--rd)' },
          { s: 'mass_rally_success', label: 'Mass rally success', c: 'var(--em)' },
          { s: 'viral_scandal', label: 'Major scandal breaks', c: 'var(--rd)' },
          { s: 'legislative_win', label: 'Legislative win', c: 'var(--em)' },
          { s: 'alliance_breakthrough', label: 'Alliance breakthrough', c: 'var(--em)' },
        ];
        return (<><h2 className="nb-section anim">🔮 What-If Simulator</h2><div className="nb-card anim">
          <p className="text-[11px] mb-3" style={{ color: 'var(--sub)' }}>Simulate political scenarios and their NRI pillar impact.</p>
          {scenarios.map((sc, i) => {
            const result = ALGO_ENGINE.computeWhatIf(sc.s, ck); return (
              <div key={i} className="p-2.5 mb-2 rounded-lg" style={{ background: 'rgba(124,58,237,.04)', borderLeft: `3px solid ${sc.c}` }}>
                <div className="flex justify-between"><span className="text-xs font-semibold" style={{ color: 'var(--tx)' }}>{sc.label}</span><span className="font-mono font-bold" style={{ color: sc.c }}>{(result.pbi_impact > 0 ? '+' : '')}{result.pbi_impact} NRI</span></div>
                <div className="text-[10px] mt-1" style={{ color: 'var(--sub)' }}>{result.analysis}</div>
                {result.recovery_weeks > 0 && <div className="text-[9px] mt-0.5" style={{ color: 'var(--rd)' }}>Recovery: {result.recovery_weeks} weeks</div>}
                <div className="flex gap-1 flex-wrap mt-1.5">{result.pillar_impacts.filter(p => Math.abs(p.delta) > 5).slice(0, 4).map(p => <span key={p.key} className="text-[8px] px-1.5 py-0.5 rounded font-mono" style={{ background: 'var(--bg)', border: '1px solid var(--bd)', color: p.delta > 0 ? 'var(--em)' : 'var(--rd)' }}>{p.label.split(' ')[0]}: {p.delta > 0 ? '+' : ''}{p.delta}</span>)}</div>
              </div>);
          })}
        </div></>);
      }
      const calPosts = [{ dt: 3, ch: 'youtube', tx: 'Rally highlight reel', st: 'scheduled', c: '#FF0000' }, { dt: 5, ch: 'instagram', tx: 'Vikas Yatra photos', st: 'draft', c: '#E4405F' }, { dt: 7, ch: 'facebook', tx: 'Jan Darbar announcement', st: 'scheduled', c: '#1877F2' }, { dt: 10, ch: 'x', tx: '100 days thread', st: 'review', c: '#000' }, { dt: 15, ch: 'telegram', tx: 'Weekly digest', st: 'scheduled', c: '#26A5E4' }];
      if (curPill === 'content_cal') {
        return (<><h2 className="nb-section anim">📝 Content Calendar</h2><div className="nb-card anim"><h3 className="text-[13px] font-bold mb-2" style={{ color: 'var(--tx)' }}>Monthly Content Grid</h3>
          <div className="grid grid-cols-4 gap-3 grid-responsive mt-3">
            {['Week 1', 'Week 2', 'Week 3', 'Week 4'].map((w, i) => (
              <div key={w} className="p-2.5 rounded-lg" style={{ background: 'var(--bg)', border: '1px solid var(--bd)' }}>
                <div className="text-[11px] font-bold mb-2" style={{ color: 'var(--tx)' }}>{w}</div>
                {CAL_POSTS.filter(p => p.dt > i * 7 && p.dt <= (i + 1) * 7).map((p, j) => (
                  <div key={j} className="text-[9px] py-0.5 px-1.5 mb-0.5 rounded" style={{ background: `${p.c}22`, borderLeft: `2px solid ${p.c}`, color: 'var(--sub)' }}>{p.tx}</div>
                ))}
              </div>
            ))}
          </div>
        </div></>);
      }
      return (<><h2 className="nb-section anim">📅 Planning Hub — Calendar</h2><div className="nb-card anim">{calPosts.map((p, i) => (<div key={i} className="p-2 mb-1.5 rounded-lg" style={{ borderLeft: `3px solid ${p.c}`, background: 'rgba(124,58,237,.04)' }}><div className="flex justify-between"><span className="text-xs font-semibold" style={{ color: 'var(--tx)' }}>Day {p.dt}: {p.tx}</span><Tag bg={p.st === 'scheduled' ? 'var(--em)' : p.st === 'draft' ? 'var(--gd)' : 'var(--bl)'}>{p.st}</Tag></div><div className="text-[10px] mt-0.5" style={{ color: 'var(--sub)' }}>Channel: {p.ch}</div></div>))}</div></>);
    }

    // Settings
    if (curMod === 'settings') {
      if (curPill === 'profile') return (<><h2 className="nb-section anim">👤 Profile Settings</h2><div className="nb-card anim flex gap-4 items-center"><div className="w-16 h-16 rounded-full flex items-center justify-center text-3xl" style={{ background: 'var(--am)' }}>{a.ic}</div><div><div className="text-base font-bold" style={{ color: 'var(--tx)' }}>{a.n}</div><div className="text-xs" style={{ color: 'var(--sub)' }}>{a.tg} · {a.cn.party} · {a.cn.const}</div><div className="text-[11px] mt-1" style={{ color: 'var(--mn)' }}>NRI: {nri.toFixed(1)} · FIS: {fis.score}</div></div></div></>);
      if (curPill === 'ai_usage') return (<><h2 className="nb-section anim">🤖 AI Usage — 5-Tier Architecture</h2><div className="grid grid-cols-5 gap-3 grid-responsive anim">{[{ t: 'Tier 5', n: 'Claude API', d: 'Cloud LLM · Best quality', c: '#34D399' }, { t: 'Tier 4', n: 'Local LLM', d: 'Llama/Mistral fine-tuned', c: '#A78BFA' }, { t: 'Tier 3', n: 'Smart Templates', d: 'Archetype-aware', c: '#60A5FA' }, { t: 'Tier 2', n: 'Algorithmic', d: 'Rule-based', c: '#FBBF24' }, { t: 'Tier 1', n: 'Static', d: 'Fallback', c: '#94A3B8' }].map(tier => (<div key={tier.t} className="nb-card text-center" style={{ borderTop: `3px solid ${tier.c}` }}><div className="text-[11px] font-bold" style={{ color: tier.c }}>{tier.t}</div><div className="text-xs font-semibold my-1" style={{ color: 'var(--tx)' }}>{tier.n}</div><div className="text-[9px]" style={{ color: 'var(--sub)' }}>{tier.d}</div></div>))}</div>
        <div className="nb-card anim"><h3 className="text-[13px] font-bold mb-2" style={{ color: 'var(--tx)' }}>📋 Prompt Registry ({PROMPTS_REGISTRY.length} prompts)</h3>
          {PROMPTS_REGISTRY.map(p => (<div key={p.id} className="flex justify-between py-1 text-[10px]" style={{ borderBottom: '1px solid var(--bd)' }}><span className="font-mono" style={{ color: 'var(--am)' }}>{p.id}</span><span style={{ color: 'var(--tx)' }}>{p.name}</span><span style={{ color: 'var(--mn)' }}>TTL: {p.cacheTTL}s</span></div>))}
        </div>
        <div className="nb-card anim"><h3 className="text-[13px] font-bold mb-2" style={{ color: 'var(--tx)' }}>Current Tier: {AI_RESOLVER.tierName}</h3>
          <div className="flex gap-1.5 items-center">{AI_RESOLVER.getTierDots().map((d, i) => (<span key={i} className="w-2 h-2 rounded-full" style={{ background: d.active ? d.color : 'var(--bd)', boxShadow: d.level === AI_RESOLVER.tier ? `0 0 6px ${d.color}` : 'none' }} />))}<span className="text-[9px] font-bold ml-1" style={{ color: AI_RESOLVER.getTierBadge().c === 'ai-badge-smart' ? '#60A5FA' : '#94A3B8' }}>{AI_RESOLVER.getTierBadge().t}</span></div>
        </div>
        {/* AI_AUDIT Stats */}
        <div className="nb-card anim"><h3 className="text-[13px] font-bold mb-2" style={{ color: 'var(--tx)' }}>📊 AI Audit Log</h3>
          <div className="grid grid-cols-5 gap-3 mb-3 grid-responsive">
            <div className="text-center p-2 rounded-lg" style={{ background: 'var(--bg)' }}><div className="font-mono text-lg font-bold" style={{ color: 'var(--am)' }}>{AI_AUDIT.totalCalls}</div><div className="text-[9px]" style={{ color: 'var(--mn)' }}>Total Calls</div></div>
            <div className="text-center p-2 rounded-lg" style={{ background: 'var(--bg)' }}><div className="font-mono text-lg font-bold" style={{ color: '#34D399' }}>{AI_AUDIT.tierUsage[5]}</div><div className="text-[9px]" style={{ color: 'var(--mn)' }}>Tier 5 (Claude)</div></div>
            <div className="text-center p-2 rounded-lg" style={{ background: 'var(--bg)' }}><div className="font-mono text-lg font-bold" style={{ color: '#A78BFA' }}>{AI_AUDIT.tierUsage[4]}</div><div className="text-[9px]" style={{ color: 'var(--mn)' }}>Tier 4 (Local)</div></div>
            <div className="text-center p-2 rounded-lg" style={{ background: 'var(--bg)' }}><div className="font-mono text-lg font-bold" style={{ color: '#60A5FA' }}>{AI_AUDIT.tierUsage[3]}</div><div className="text-[9px]" style={{ color: 'var(--mn)' }}>Tier 3 (Smart)</div></div>
            <div className="text-center p-2 rounded-lg" style={{ background: 'var(--bg)' }}><div className="font-mono text-lg font-bold" style={{ color: '#FBBF24' }}>{AI_AUDIT.tierUsage[2] + AI_AUDIT.tierUsage[1]}</div><div className="text-[9px]" style={{ color: 'var(--mn)' }}>Tier 2+1</div></div>
          </div>
          <div className="flex gap-4 text-[10px]" style={{ color: 'var(--sub)' }}>
            <span>Cache Hit Rate: <b style={{ color: 'var(--em)' }}>{AI_AUDIT.getCacheHitRate()}%</b></span>
            <span>Avg Latency: <b style={{ color: 'var(--am)' }}>{AI_AUDIT.getAvgLatency()}ms</b></span>
          </div>
        </div>
      </>);
      return (<><h2 className="nb-section anim">📤 Export & Reports</h2><div className="nb-card anim"><div className="grid grid-cols-2 gap-3 grid-responsive">{[{ t: 'Weekly NRI Report', d: 'PDF with 15-pillar breakdown' }, { t: 'Feedback Digest', d: 'All sources, IASCL status' }, { t: 'Sansad Performance', d: 'Attendance, questions, bills' }, { t: 'Campaign Analytics', d: 'Social reach, sentiment trends' }].map(r => (<div key={r.t} className="p-3 rounded-lg" style={{ background: 'var(--bg)', border: '1px solid var(--bd)' }}><div className="text-xs font-bold" style={{ color: 'var(--tx)' }}>{r.t}</div><div className="text-[10px] my-1" style={{ color: 'var(--sub)' }}>{r.d}</div><button className="nb-btn nb-btn-primary text-[10px] mt-1.5" onClick={() => toast(`Generating ${r.t}...`)}>Generate</button></div>))}</div></div></>);
    }

    // ═══ JAN SETU MODULES — Full Renderers ═══
    if (curMod === 'pp_parichay') return renderJanSetuHome();

    // Shikayat Kendra — Grievance Center
    // Shikayat Kendra — Full 5-Step Wizard (S1.2)
    if (curMod === 'pp_shikayat') {
      return <ShikayatKendra lang={lang} onToast={toast} />;
    }

    // Vani Kendra — Videos, Clips, Speeches
    if (curMod === 'pp_vani') {
      return (<>
        <h2 className="nb-section anim">🎬 वाणी केंद्र — Vani Kendra</h2>
        <h3 className="text-[13px] font-bold mb-2 mt-3" style={{ color: 'var(--tx)' }}>🎥 Video Gallery ({VIDS.length})</h3>
        <div className="grid grid-cols-3 gap-3 grid-responsive anim">
          {VIDS.map(v => (<div key={v.id} className="nb-card overflow-hidden cursor-pointer">
            <div className="h-28 rounded-lg mb-2 flex items-center justify-center relative" style={{ background: 'linear-gradient(135deg,rgba(124,58,237,.15),rgba(5,150,105,.1))' }}>
              <span className="text-5xl opacity-60">{v.th}</span>
              <span className="absolute bottom-1.5 right-2 text-[9px] px-1.5 py-0.5 rounded text-white" style={{ background: 'rgba(0,0,0,.7)' }}>{v.dur}</span>
              <span className="absolute top-1.5 left-2 text-[8px] px-1.5 py-0.5 rounded text-white" style={{ background: 'var(--am)' }}>{v.cat}</span>
            </div>
            <div className="text-[11px] font-bold leading-tight mb-1" style={{ color: 'var(--tx)' }}>{v.t}</div>
            <div className="flex justify-between text-[9px]" style={{ color: 'var(--mn)' }}><span>👁 {v.views}</span><span>❤ {v.likes}</span><span>{v.dt}</span></div>
          </div>))}
        </div>
        <h3 className="text-[13px] font-bold mb-2 mt-4" style={{ color: 'var(--tx)' }}>📰 Paper Clippings ({CLIPS.length})</h3>
        <div className="grid grid-cols-2 gap-3 grid-responsive anim">
          {CLIPS.map(c => (<div key={c.id} className="nb-card" style={{ borderLeft: '4px solid var(--am)' }}>
            <div className="flex gap-2.5"><div className="w-12 h-12 rounded-lg flex items-center justify-center text-2xl flex-shrink-0" style={{ background: 'rgba(124,58,237,.06)' }}>📰</div>
              <div><div className="text-xs font-bold leading-tight" style={{ color: 'var(--tx)' }}>{c.t}</div><div className="text-[9px] mt-1" style={{ color: 'var(--mn)' }}><span className="font-bold" style={{ color: 'var(--am)' }}>{c.src}</span> · {c.dt} · <Tag bg="rgba(124,58,237,.1)" color="var(--am)">{c.cat}</Tag></div></div>
            </div>
          </div>))}
        </div>
        <h3 className="text-[13px] font-bold mb-2 mt-4" style={{ color: 'var(--tx)' }}>🎬 Speeches — Parliamentary Record ({SPEECHES.length})</h3>
        {SPEECHES.map(sp => (<div key={sp.id} className="nb-card anim">
          <div className="flex justify-between items-center flex-wrap gap-1"><div className="text-[13px] font-bold" style={{ color: 'var(--tx)' }}>{sp.t}</div><Tag bg="var(--am)">{sp.venue}</Tag></div>
          <div className="text-[9px] mt-1.5 flex gap-2.5" style={{ color: 'var(--mn)' }}><span>📅 {sp.dt}</span><span>⏱ {sp.dur}</span><span>📌 {sp.topic}</span></div>
          <div className="text-[11px] mt-2 p-2.5 rounded-md italic leading-relaxed" style={{ color: 'var(--sub)', background: 'var(--bg)', borderLeft: '3px solid var(--am)' }}>"{sp.full.slice(0, 200)}..."</div>
          <button className="nb-btn mt-2 text-[10px]" onClick={() => toast('Full speech PDF downloading...')}>📥 Download Full Speech</button>
        </div>))}
      </>);
    }

    // Vikas Darshak — Development Tracker with milestones + financial transparency
    if (curMod === 'pp_vikas') {
      const stProg: Record<string, string> = { 'On Track': '#059669', Ahead: '#7C3AED', Delayed: '#DC2626', 'Near Complete': '#2563EB' };
      const totalSanc = PROJ.reduce((s, p) => s + p.sanc, 0);
      const totalRel = PROJ.reduce((s, p) => s + p.rel, 0);
      const totalUtil = PROJ.reduce((s, p) => s + p.util, 0);
      return (<>
        <h2 className="nb-section anim">🏗 विकास दर्शक — Vikas Darshak</h2>
        <div className="grid grid-cols-4 gap-3 mb-3.5 grid-responsive anim">
          <Stat n={PROJ.length} l="प्रोजेक्ट (Active)" color="var(--am)" borderColor="var(--am)" />
          <Stat n={`₹${Math.round(totalSanc)}Cr`} l="कुल निवेश (Total)" color="var(--em)" borderColor="var(--em)" />
          <Stat n={`${Math.round(PROJ.reduce((s, p) => s + p.prog, 0) / PROJ.length)}%`} l="औसत प्रगति (Avg)" color="var(--gd)" borderColor="var(--gd)" />
          <Stat n={PROJ.filter(p => p.st === 'Delayed').length} l="विलंबित (Delayed)" color="var(--rd)" borderColor="var(--rd)" />
        </div>
        {/* Financial Transparency */}
        <div className="nb-card anim">
          <h3 className="text-[13px] font-bold mb-2" style={{ color: 'var(--tx)' }}>💰 वित्तीय पारदर्शिता — Financial Transparency (₹ Crore)</h3>
          <div className="grid grid-cols-3 gap-3 mb-2.5">
            {[{ l: 'स्वीकृत (Sanctioned)', v: totalSanc, c: 'var(--am)' }, { l: 'जारी (Released)', v: totalRel, c: 'var(--gd)', pct: Math.round(totalRel / totalSanc * 100) }, { l: 'उपयोग (Utilized)', v: totalUtil, c: 'var(--em)', pct: Math.round(totalUtil / totalRel * 100) }].map(f => (
              <div key={f.l} className="text-center p-2.5 rounded-lg" style={{ background: 'var(--bg)', border: '1px solid var(--bd)' }}>
                <div className="font-mono text-lg font-bold" style={{ color: f.c }}>₹{f.v.toFixed(1)}</div>
                <div className="text-[9px]" style={{ color: 'var(--mn)' }}>{f.l} {f.pct ? <span style={{ color: 'var(--em)' }}>{f.pct}%</span> : ''}</div>
              </div>
            ))}
          </div>
          {PROJ.map(p => {
            const relP = Math.round(p.rel / p.sanc * 100); const utilP = Math.round(p.util / p.sanc * 100); return (
              <div key={p.id} className="flex items-center gap-1.5 py-0.5 text-[9px]"><span className="w-3.5">{p.ic}</span><span className="w-36 truncate" style={{ color: 'var(--tx)' }}>{p.t}</span>
                <div className="flex-1 h-2 rounded relative" style={{ background: 'rgba(212,175,55,.04)' }}><div className="absolute h-full rounded" style={{ width: `${relP}%`, background: 'rgba(212,175,55,.15)' }} /><div className="absolute h-full rounded" style={{ width: `${utilP}%`, background: '#059669' }} /></div>
                <span className="w-14 text-right font-mono" style={{ color: 'var(--tx)' }}>₹{p.sanc}Cr</span></div>);
          })}
        </div>
        {/* S3.4: Constituency Project Map */}
        <div className="nb-card anim" role="region" aria-label="Constituency Project Map">
          <h3 className="text-[13px] font-bold mb-2" style={{ color: 'var(--tx)' }}>🗺 क्षेत्र मानचित्र — Constituency Map</h3>
          <div className="relative rounded-lg overflow-hidden" style={{ height: 200, background: 'linear-gradient(135deg,rgba(5,150,105,.04),rgba(212,175,55,.04))', border: '1px solid var(--bd)' }}>
            <svg viewBox="0 0 400 200" style={{ width: '100%', height: '100%' }}>
              <path d="M50,30 C80,20 120,35 160,25 C200,15 240,40 280,30 C320,20 360,45 380,35 L380,170 C340,180 300,165 260,175 C220,185 180,160 140,170 C100,180 60,165 30,175 L30,40 Z" fill="rgba(5,150,105,.15)" stroke="rgba(212,175,55,.4)" strokeWidth="1.5" opacity="0.4" />
              <text x="200" y="100" textAnchor="middle" fontSize="12" fill="var(--tx)" fontWeight="600">{a.cn.const} Constituency</text>
              {PROJ.map((p, i) => {
                const locs = [[80, 60], [150, 80], [240, 50], [320, 70], [100, 140], [200, 130], [290, 150], [170, 160]]; const [x, y] = locs[i % locs.length]; return (
                  <g key={p.id}><circle cx={x} cy={y} r="8" fill={stProg[p.st] || '#6B7280'} stroke="#fff" strokeWidth="2" opacity="0.9"><title>{p.t} ({p.prog}%)</title></circle><text x={x} y={y + 3} textAnchor="middle" fontSize="7" fill="#fff" fontWeight="700">{p.prog}</text></g>
                );
              })}
            </svg>
            <div className="absolute bottom-1.5 right-2 flex gap-1.5 text-[7px] px-2 py-1 rounded" style={{ background: 'var(--cd)' }}>
              {Object.entries(stProg).map(([st, c]) => <span key={st}><span className="inline-block w-1.5 h-1.5 rounded-full align-middle mr-0.5" style={{ background: c }} />{st}</span>)}
            </div>
          </div>
        </div>
        {/* Project Cards with Milestones */}
        {PROJ.map(p => {
          const col = stProg[p.st] || '#6B7280'; const stars = Array(5).fill(0).map((_, i) => i < Math.round(p.rate) ? '★' : '☆').join(''); return (
            <div key={p.id} className="nb-card anim" style={{ borderLeft: `4px solid ${col}` }}>
              <div className="flex justify-between items-center flex-wrap gap-1"><div><span className="text-base">{p.ic}</span> <b className="text-xs" style={{ color: 'var(--tx)' }}>{p.t}</b></div><div className="flex gap-1"><Tag bg={`${col}18`} color={col}>{p.st}</Tag><Tag bg="rgba(124,58,237,.1)" color="var(--am)">{p.cat}</Tag></div></div>
              <div className="text-[9px] mt-1 flex gap-2 flex-wrap" style={{ color: 'var(--mn)' }}><span>🆔 {p.id}</span><span>🏢 {p.dept}</span><span>📍 {p.ward}</span><span>📅 Target: {p.dt}</span></div>
              <div className="flex items-center gap-2 my-1.5"><div className="flex-1"><ProgressBar pct={p.prog} color={col} height={10} /></div><span className="font-mono text-sm font-bold" style={{ color: col }}>{p.prog}%</span></div>
              <div className="grid grid-cols-2 gap-2 mt-2">
                <div className="p-2 rounded-md" style={{ background: 'var(--bg)', border: '1px solid var(--bd)' }}><div className="text-[9px] font-bold mb-1" style={{ color: 'var(--tx)' }}>💰 Fund Flow</div>
                  {[['Sanctioned', `₹${p.sanc}`], ['Released', `₹${p.rel} (${Math.round(p.rel / p.sanc * 100)}%)`], ['Utilized', `₹${p.util} (${Math.round(p.util / p.sanc * 100)}%)`]].map(([k, v]) => (<div key={k} className="flex justify-between text-[9px]"><span style={{ color: 'var(--mn)' }}>{k}</span><b style={{ color: 'var(--tx)' }}>{v}</b></div>))}
                </div>
                <div className="p-2 rounded-md" style={{ background: 'var(--bg)', border: '1px solid var(--bd)' }}><div className="text-[9px] font-bold mb-1" style={{ color: 'var(--tx)' }}>⭐ Citizen Rating</div>
                  <div><span style={{ color: '#F59E0B' }}>{stars}</span> <span className="font-bold text-[11px]" style={{ color: '#F59E0B' }}>{p.rate.toFixed(1)}</span></div>
                </div>
              </div>
              {/* Milestones timeline */}
              <div className="mt-2 p-2 rounded-md" style={{ background: 'var(--bg)', border: '1px solid var(--bd)' }}>
                <div className="text-[9px] font-bold mb-1.5" style={{ color: 'var(--tx)' }}>📈 Timeline</div>
                <div className="flex items-center gap-0 overflow-x-auto">
                  {p.milestones.map((ms, mi) => (<Fragment key={mi}>
                    <div className="text-center min-w-[60px] flex-shrink-0"><div className="w-4 h-4 rounded-full mx-auto flex items-center justify-center text-[8px] text-white" style={{ background: ms.done ? '#059669' : '#D1D5DB' }}>{ms.done ? '✔' : mi + 1}</div><div className="text-[8px] font-semibold mt-0.5" style={{ color: ms.done ? '#059669' : '#9CA3AF' }}>{ms.m}</div><div className="text-[7px]" style={{ color: 'var(--mn)' }}>{ms.d}</div></div>
                    {mi < p.milestones.length - 1 && <div className="flex-1 h-0.5 min-w-[10px] -mx-0.5" style={{ background: ms.done ? '#059669' : '#E5E7EB' }} />}
                  </Fragment>))}
                </div>
              </div>
            </div>);
        })}
      </>);
    }

    // Jan Awaaz — Polls + Public Voices
    if (curMod === 'pp_awaaz') {
      return (<>
        <h2 className="nb-section anim">📢 जन आवाज़ — Jan Awaaz</h2>
        <h3 className="text-[13px] font-bold mb-2" style={{ color: 'var(--tx)' }}>📊 Active Polls & Surveys</h3>
        {POLLS.map(p => (<div key={p.id} className="nb-card anim">
          <div className="flex justify-between items-center"><div className="text-[13px] font-bold" style={{ color: 'var(--tx)' }}>{p.q}</div><Tag bg={p.st === 'Active' ? 'var(--em)' : 'var(--mn)'}>{p.st}</Tag></div>
          <div className="text-[9px] my-2" style={{ color: 'var(--mn)' }}>{p.total.toLocaleString()} votes · {p.dt}</div>
          {p.opts.map(o => (<div key={o.t} className="mb-1.5"><div className="flex justify-between text-[10px] mb-0.5"><span style={{ color: 'var(--tx)' }}>{o.t}</span><span className="font-bold">{o.pct}%</span></div><ProgressBar pct={o.pct} color="var(--am)" height={6} /></div>))}
        </div>))}
        <h3 className="text-[13px] font-bold mb-2 mt-4" style={{ color: 'var(--tx)' }}>🗣 Public Voices</h3>
        {VOICES.map((v, i) => (<div key={i} className="nb-card anim" style={{ borderLeft: `3px solid ${v.snt > 0 ? 'var(--em)' : v.snt < -.3 ? 'var(--rd)' : '#FBBF24'}` }}>
          <div className="text-xs leading-relaxed" style={{ color: 'var(--tx)' }}>"{v.msg}"</div>
          <div className="text-[9px] mt-1.5 flex gap-2.5" style={{ color: 'var(--mn)' }}><span>👤 {v.by}</span><span>📍 {v.ward}</span><span>❤ {v.likes}</span><span>{v.dt}</span></div>
        </div>))}
      </>);
    }

    // Jan Aavedhan — Petitions + Services
    if (curMod === 'pp_aavedhan') {
      return (<>
        <h2 className="nb-section anim">📝 जन आवेदन — Jan Aavedhan</h2>
        <h3 className="text-[13px] font-bold mb-2" style={{ color: 'var(--tx)' }}>✋ Active Petitions</h3>
        {PETITIONS.map(p => {
          const pct = Math.min(100, Math.round(p.sigs / p.goal * 100)); return (
            <div key={p.id} className="nb-card anim"><div className="flex justify-between items-center"><div className="text-xs font-bold" style={{ color: 'var(--tx)' }}>{p.t}</div><Tag bg={p.st === 'Goal Met' ? 'var(--em)' : p.st === 'Trending' ? 'var(--am)' : '#FBBF24'}>{p.st}</Tag></div>
              <div className="text-[9px] my-1.5" style={{ color: 'var(--mn)' }}>By: {p.by} · {p.dt} · {p.cat}</div>
              <div className="flex items-center gap-2"><div className="flex-1"><ProgressBar pct={pct} color={pct >= 100 ? 'var(--em)' : 'var(--am)'} height={8} /></div><span className="font-mono text-[11px] font-bold">{p.sigs.toLocaleString()}/{p.goal.toLocaleString()}</span></div>
              <button className="nb-btn mt-2 text-[10px]" onClick={() => toast(`Signed! Total: ${p.sigs + 1}`, 'success')}>✍ Sign Petition</button>
            </div>);
        })}
        <h3 className="text-[13px] font-bold mb-2 mt-4" style={{ color: 'var(--tx)' }}>📄 Apply for Services</h3>
        <div className="grid grid-cols-3 gap-3 grid-responsive anim">
          {APP_SERVICES.map(ap => (<div key={ap.t} className="nb-card text-center cursor-pointer" onClick={() => toast(`Application form for ${ap.t} opening...`)}>
            <div className="text-3xl mb-1.5">{ap.ic}</div><div className="text-xs font-bold" style={{ color: 'var(--tx)' }}>{ap.t}</div>
            <div className="text-[9px] mt-1" style={{ color: 'var(--mn)' }}>{ap.forms} filed · Avg: {ap.avg}</div>
          </div>))}
        </div>
      </>);
    }

    // E-Jan Darbar — Virtual Town Hall
    if (curMod === 'pp_edarbar') {
      const totalCases = DARBAR_SESSIONS.reduce((s, d) => s + d.cases, 0);
      const totalResolved = DARBAR_SESSIONS.reduce((s, d) => s + d.resolved, 0);
      const nextDarbar = DARBAR_SESSIONS[0].next;
      return (<>
        <h2 className="nb-section anim">🏛 E-जन दरबार — Virtual Town Hall</h2>
        {/* Next Darbar */}
        <div className="nb-card anim text-center py-5 relative" style={{ background: 'linear-gradient(135deg,rgba(124,58,237,.08),rgba(5,150,105,.04))', border: '2px solid rgba(124,58,237,.2)' }}>
          <div className="absolute top-2 right-3 flex items-center gap-1"><span className="w-2 h-2 rounded-full animate-pulse" style={{ background: '#DC2626' }} /><span className="text-[9px] font-bold" style={{ color: '#DC2626' }}>OFFLINE — Next: {nextDarbar}</span></div>
          <div className="text-3xl mb-1">🏛</div>
          <div className="text-base font-bold" style={{ color: 'var(--am)' }}>अगला E-जन दरबार: {nextDarbar}</div>
          <div className="text-[11px] mt-1" style={{ color: 'var(--mn)' }}>Every Tuesday 10:00 AM · Live on YouTube + Jan Setu</div>
          <div className="flex gap-3 justify-center mt-3">
            {[{ n: DARBAR_SESSIONS.length, l: 'Darbars Held' }, { n: totalCases, l: 'Total Cases' }, { n: `${Math.round(totalResolved / totalCases * 100)}%`, l: 'Resolved' }].map(s => (
              <div key={s.l} className="px-3 py-1.5 rounded-md" style={{ background: 'var(--cd)' }}><b className="font-mono" style={{ color: 'var(--am)' }}>{s.n}</b> <span className="text-[10px]" style={{ color: 'var(--sub)' }}>{s.l}</span></div>
            ))}
          </div>
        </div>
        {/* Past Sessions with outcomes */}
        {DARBAR_SESSIONS.map(d => (<div key={d.id} className="nb-card anim">
          <div className="flex justify-between items-center"><div className="text-xs font-bold" style={{ color: 'var(--tx)' }}>{d.t}</div><Tag bg="var(--em)">{d.st}</Tag></div>
          <div className="text-[9px] mt-1 flex gap-2.5" style={{ color: 'var(--mn)' }}><span>📅 {d.dt}</span><span>⏱ {d.dur}</span><span>📋 {d.cases} cases</span><span style={{ color: 'var(--em)' }}>✅ {d.resolved} resolved</span></div>
          {d.outcomes.map((o, i) => (<div key={i} className="mt-1.5 p-2 rounded-md" style={{ background: 'var(--bg)', borderLeft: `3px solid ${o.status === 'Resolved' ? 'var(--em)' : 'var(--gd)'}` }}>
            <div className="text-[10px]"><b style={{ color: 'var(--tx)' }}>{o.q}</b> <span style={{ color: 'var(--mn)' }}>— {o.by}</span></div>
            <div className="text-[9px] mt-0.5" style={{ color: 'var(--sub)' }}>Commitment: {o.commit}</div>
            <Tag bg={o.status === 'Resolved' ? 'var(--em)' : o.status === 'In Progress' ? 'var(--gd)' : '#FBBF24'}>{o.status}</Tag>
          </div>))}
        </div>))}
        {/* Queue */}
        <div className="nb-card anim"><h3 className="text-[13px] font-bold mb-2" style={{ color: 'var(--tx)' }}>👥 Current Queue</h3>
          {DARBAR_QUEUE.map(q => (<div key={q.tk} className="p-2 mb-1 rounded-md" style={{ background: 'var(--bg)', border: '1px solid var(--bd)' }}>
            <div className="flex justify-between text-[10px]"><b style={{ color: 'var(--tx)' }}>{q.tk} — {q.name}</b><Tag bg={q.pri === 'High' ? 'var(--rd)' : q.pri === 'Medium' ? 'var(--gd)' : 'var(--mn)'}>{q.pri}</Tag></div>
            <div className="text-[9px]" style={{ color: 'var(--sub)' }}>{q.issue} · {q.cat} · Wait: {q.wait}</div>
          </div>))}
        </div>
      </>);
    }

    // Sahyogi Dwaar — Volunteer
    if (curMod === 'pp_sahyogi') {
      return (<>
        <h2 className="nb-section anim">🤝 सहयोगी द्वार — Sahyogi Dwaar</h2>
        <div className="grid grid-cols-3 gap-3 mb-3.5 grid-responsive anim"><Stat n="1,842+" l="Active Volunteers" borderColor="var(--em)" /><Stat n="25" l="Wards Covered" borderColor="var(--am)" /><Stat n="48" l="Events This Year" borderColor="var(--gd)" /></div>
        <div className="nb-card anim"><h3 className="text-[13px] font-bold mb-2" style={{ color: 'var(--tx)' }}>📝 Register as Volunteer</h3>
          {['Name *', 'Mobile *', 'Ward', 'Skills/Interest'].map(f => (<div key={f} className="mb-2"><label className="text-[10px] block mb-0.5" style={{ color: 'var(--tx)' }}>{f}</label><input className="w-full p-2 rounded-md text-[11px]" style={{ background: 'var(--bg)', border: '1px solid var(--bd)', color: 'var(--tx)' }} placeholder={f.replace(' *', '')} /></div>))}
          <button className="nb-btn nb-btn-success w-full mt-2" onClick={() => toast('✅ Registration submitted!', 'success')}>Register / पंजीकरण करें</button>
        </div>
        <div className="grid grid-cols-3 gap-3 mt-3.5 grid-responsive anim">
          {[{ n: 'PA / OSD', r: 'Office Coordinator', ic: '💼' }, { n: 'Media Advisor', r: 'Communications', ic: '📰' }, { n: 'Legal Advisor', r: 'Legal & Compliance', ic: '⚖' }, { n: 'District Coordinator', r: 'Ground Ops', ic: '🗺' }, { n: 'Social Media Head', r: 'Digital Strategy', ic: '📱' }, { n: 'Booth Prabhari', r: '1842 Booths', ic: '🗳' }].map(t => (
            <div key={t.n} className="nb-card text-center py-3.5"><div className="text-2xl mb-1.5">{t.ic}</div><div className="text-[11px] font-bold" style={{ color: 'var(--tx)' }}>{t.n}</div><div className="text-[9px]" style={{ color: 'var(--mn)' }}>{t.r}</div></div>
          ))}
        </div>
      </>);
    }

    // Karyakram — Events
    if (curMod === 'pp_karyakram') {
      return (<>
        <h2 className="nb-section anim">📅 कार्यक्रम — Karyakram</h2>
        <div className="flex gap-2 overflow-x-auto pb-1 anim">
          {EVENTS.map((e, i) => (<div key={i} className="min-w-[160px] p-3 rounded-xl flex-shrink-0 nb-card cursor-pointer">
            <div className="text-xl mb-1">{e.ic}</div><div className="text-[11px] font-bold" style={{ color: 'var(--tx)' }}>{e.t}</div>
            <div className="text-[9px] font-semibold mt-0.5" style={{ color: 'var(--gd)' }}>{e.dt} · {e.tm}</div>
            <div className="text-[9px]" style={{ color: 'var(--mn)' }}>{e.loc}</div>
          </div>))}
        </div>
        {/* Detailed list */}
        {EVENTS.map((e, i) => (<div key={`d-${i}`} className="nb-card anim" style={{ borderLeft: '3px solid var(--am)' }}>
          <div className="flex justify-between items-center"><div><span className="text-base">{e.ic}</span> <b className="text-xs" style={{ color: 'var(--tx)' }}>{e.t}</b></div><Tag bg="var(--am)">{e.cat}</Tag></div>
          <div className="text-[10px] mt-1 flex gap-2.5" style={{ color: 'var(--mn)' }}><span>📅 {e.dt}</span><span>⏰ {e.tm}</span><span>📍 {e.loc}</span></div>
        </div>))}
      </>);
    }

    // Samvad Manch — Forum + Chat
    if (curMod === 'pp_samvad') {
      return (<>
        <h2 className="nb-section anim">💬 संवाद मंच — Samvad Manch</h2>
        <div className="nb-card anim" style={{ border: '2px solid var(--am)' }}>
          <h3 className="text-[13px] font-bold mb-1.5" style={{ color: 'var(--tx)' }}>💬 Live Community Chat</h3>
          <div className="h-44 overflow-y-auto rounded-lg p-2.5 mb-2" style={{ background: 'var(--bg)' }}>
            <div className="p-1.5 px-2.5 mb-1 rounded-lg rounded-bl-none max-w-[75%] text-[11px]" style={{ background: 'rgba(124,58,237,.08)' }}><b className="text-[9px]" style={{ color: 'var(--am)' }}>Moderator</b><br />Welcome to Samvad Manch! Respectful discussion only. 🙏</div>
            <div className="p-1.5 px-2.5 mb-1 rounded-lg rounded-br-none max-w-[75%] ml-auto text-[11px]" style={{ background: 'rgba(5,150,105,.08)' }}><b className="text-[9px]" style={{ color: 'var(--em)' }}>Rajesh_W8</b><br />Highway ka kaam kab tak hoga? Bahut dhool hai.</div>
            <div className="p-1.5 px-2.5 mb-1 rounded-lg rounded-bl-none max-w-[75%] text-[11px]" style={{ background: 'rgba(124,58,237,.08)' }}><b className="text-[9px]" style={{ color: 'var(--am)' }}>MP Office</b><br />Dec 2026 deadline hai. 72% complete ho chuka hai.</div>
          </div>
          <div className="flex gap-1.5"><input className="flex-1 p-2 rounded-lg text-[11px]" style={{ background: 'var(--bg)', border: '1px solid var(--bd)', color: 'var(--tx)' }} placeholder="Join the discussion..." /><button className="nb-btn nb-btn-success" onClick={() => toast('Message sent')}>📨</button></div>
        </div>
        <h3 className="text-[13px] font-bold mb-2 mt-4" style={{ color: 'var(--tx)' }}>🔥 Discussion Threads ({THREADS.length})</h3>
        {THREADS.map(t => (<div key={t.id} className="nb-card anim cursor-pointer" style={{ borderLeft: `3px solid ${t.hot ? 'var(--rd)' : 'var(--bd)'}` }}>
          <div className="flex justify-between items-center"><div className="text-xs font-bold flex-1" style={{ color: 'var(--tx)' }}>{t.t}{t.hot && <span className="text-[8px] font-bold ml-1" style={{ color: 'var(--rd)' }}>🔥 HOT</span>}</div><Tag bg="rgba(124,58,237,.1)" color="var(--am)">{t.cat}</Tag></div>
          <div className="text-[9px] mt-1 flex gap-2.5" style={{ color: 'var(--mn)' }}><span>👤 {t.by}</span><span>💬 {t.replies} replies</span><span>👁 {t.views} views</span><span>{t.dt}</span></div>
        </div>))}
      </>);
    }

    // Apatkal Setu — Emergency SOS
    if (curMod === 'pp_apatkal') {
      return (<>
        <h2 className="nb-section anim">🆘 आपतकाल सेतु — Emergency</h2>
        <div className="nb-card anim text-center py-6" style={{ border: '2px solid var(--rd)', background: 'linear-gradient(135deg,rgba(239,68,68,.08),rgba(245,158,11,.04))' }}>
          <div className="text-4xl mb-1.5">🆘</div><div className="text-base font-bold" style={{ color: 'var(--rd)' }}>Emergency? Press SOS</div>
          <button className="nb-btn nb-btn-danger mt-2 text-sm px-8 py-2.5" onClick={() => toast('SOS Alert sent! Location shared.', 'success')}>SOS — Send Alert Now</button>
          <div className="text-[9px] mt-1.5" style={{ color: 'var(--mn)' }}>Your GPS location will be shared with nearest response team</div>
        </div>
        <div className="grid grid-cols-4 gap-3 mt-3.5 grid-responsive anim">
          {EMERGENCY_CONTACTS.map((e, i) => (<div key={i} className="nb-card text-center" style={{ borderTop: `3px solid ${e.c}` }}>
            <div className="text-3xl mb-1">{e.ic}</div><div className="text-xs font-bold" style={{ color: 'var(--tx)' }}>{e.t}</div>
            <div className="font-mono text-sm font-bold mt-1" style={{ color: e.c }}>{e.num}</div>
          </div>))}
        </div>
        <div className="nb-card anim"><h3 className="text-[13px] font-bold mb-2" style={{ color: 'var(--tx)' }}>📍 Geo-Tagged Distress Reports</h3>
          {[{ t: 'Waterlogging at NH-24 underpass', loc: 'Ward 8, MG Road', dt: '1h ago', st: 'Team dispatched', sev: 'High' }, { t: 'Tree fell on power line', loc: 'Ward 12, Mohalla 3', dt: '3h ago', st: 'Resolved', sev: 'Critical' }, { t: 'Road accident near railway crossing', loc: 'Ward 5, GT Road', dt: '6h ago', st: 'Resolved', sev: 'Critical' }].map((r, i) => (
            <div key={i} className="p-2 mb-1 rounded-md text-[10px]" style={{ borderLeft: `3px solid ${r.sev === 'Critical' ? 'var(--rd)' : '#F59E0B'}`, background: 'var(--bg)' }}>
              <div className="flex justify-between"><b style={{ color: 'var(--tx)' }}>{r.t}</b><span style={{ color: r.st === 'Resolved' ? 'var(--em)' : '#F59E0B' }}>{r.st}</span></div>
              <div className="mt-0.5" style={{ color: 'var(--mn)' }}>📍 {r.loc} · {r.dt}</div>
            </div>
          ))}
        </div>
      </>);
    }

    return renderFallback();
  };

  // ── Pipeline Intel module ──────────────────────────────────────────────────
  const renderPipeline = () => {
    return (
      <>
        <h2 className="nb-section anim">🔄 Pipeline Intel</h2>
        <div className="anim" style={{ minHeight: '70vh' }}>
          {curPill === 'monitor' && <PipelineMonitor />}
          {curPill === 'visualize' && <PipelineVisualize />}
          {curPill === 'logs' && <PipelineLogs />}
          {!curPill && <PipelineMonitor />}
        </div>
      </>
    );
  };

  if (curMod === 'pipeline') return renderPipeline();

  return renderContent();
}
