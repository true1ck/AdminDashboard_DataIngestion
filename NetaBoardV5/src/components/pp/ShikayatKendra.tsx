// ═══ S1.2 — Shikayat Kendra with 5-Step Wizard ═══
import { useState, useRef } from 'react';
import { SHK, SHK_STATS, SHK_CATEGORIES } from '../../data/jansetu';
import { LABELS, type Lang } from '../../data/i18n';

interface Props { lang: Lang; onToast: (msg: string, type?: string) => void }

const URG_C: Record<string, string> = { emergency: 'var(--rd)', urgent: 'var(--gd)', routine: 'var(--mn)' };
const ST_C: Record<string, string> = { Filed: '#94A3B8', Assigned: '#60A5FA', 'In Progress': '#FBBF24', Escalated: 'var(--rd)', Resolved: 'var(--em)' };

export default function ShikayatKendra({ lang, onToast }: Props) {
  const L = (k: string) => LABELS[lang]?.[k] || LABELS.hi[k] || k;
  const [wiz, setWiz] = useState({ step: 1, cat: '', ward: '', desc: '', urg: 'routine', anon: false });
  const fileRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<string[]>([]);

  const next = () => setWiz(w => ({ ...w, step: Math.min(5, w.step + 1) }));
  const prev = () => setWiz(w => ({ ...w, step: Math.max(1, w.step - 1) }));

  const submit = () => {
    const id = `SHK-2026-${Math.floor(Math.random() * 9000 + 1000)}`;
    onToast(`✅ ${lang === 'hi' ? 'शिकायत दर्ज! ID: ' : 'Complaint Filed! ID: '}${id}. SMS updates enabled.`, 'success');
    setWiz({ step: 1, cat: '', ward: '', desc: '', urg: 'routine', anon: false });
    setFiles([]);
  };

  return (
    <>
      <h2 className="nb-section anim" role="heading" aria-level={1}>📋 {L('shikayat')}</h2>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3 mb-3.5 grid-responsive anim" role="region" aria-label="Grievance Statistics">
        {[{ n: SHK_STATS.filed, l: `${L('filed')} (YTD)`, c: 'var(--gd)' }, { n: SHK_STATS.resolved, l: L('resolved'), c: 'var(--em)' }, { n: SHK_STATS.pending, l: L('pending'), c: 'var(--rd)' }, { n: `${SHK_STATS.avgDays}d`, l: 'Avg Resolution', c: 'var(--am)' }].map(s => (
          <div key={s.l} className="nb-stat" style={{ borderTop: `3px solid ${s.c}` }}>
            <div className="font-mono text-[22px] font-bold" style={{ color: s.c }}>{s.n}</div>
            <div className="text-[10px] mt-1" style={{ color: 'var(--sub)' }}>{s.l}</div>
          </div>
        ))}
      </div>

      {/* SLA Timeline */}
      <div className="nb-card anim" style={{ background: 'linear-gradient(90deg,rgba(212,175,55,.04),rgba(5,150,105,.04))' }} role="region" aria-label="SLA Timeline">
        <div className="text-[11px] font-bold mb-1.5" style={{ color: 'var(--tx)' }}>⏱ {L('sla_title')}</div>
        <div className="flex gap-2 flex-wrap">
          {[{ l: `${L('sla_emergency')} (Emergency)`, t: '4 hours', c: 'var(--rd)' }, { l: `${L('sla_urgent')} (Urgent)`, t: '24 hours', c: 'var(--gd)' }, { l: `${L('sla_routine')} (Routine)`, t: '7 days', c: 'var(--am)' }, { l: `${L('sla_scheduled')} (Scheduled)`, t: '30 days', c: 'var(--mn)' }].map(s => (
            <div key={s.l} className="flex-1 min-w-[100px] p-1.5 rounded-md text-center" style={{ border: `1px solid ${s.c}20`, background: `${s.c}08` }}>
              <div className="font-mono text-sm font-bold" style={{ color: s.c }}>{s.t}</div>
              <div className="text-[8px] mt-0.5" style={{ color: s.c }}>{s.l}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 grid-responsive anim">
        {/* LEFT: Wizard */}
        <div className="nb-card" role="form" aria-label="Grievance Filing Wizard">
          <h3 className="text-[13px] font-bold mb-2" style={{ color: 'var(--tx)' }}>📝 {L('file_complaint')}</h3>

          {/* Progress bar */}
          <div className="flex gap-1 mb-3.5">
            {[L('step1'), L('step2'), L('step3'), L('step4'), L('step5')].map((s, i) => {
              const step = i + 1; const active = wiz.step === step; const done = wiz.step > step;
              return (
                <div key={i} className="flex-1 text-center" aria-label={`Step ${step}: ${s}`}>
                  <div className="h-1 rounded-sm mb-1" style={{ background: done ? 'var(--em)' : active ? 'var(--gd)' : 'rgba(212,175,55,.12)' }} />
                  <div className="text-[8px]" style={{ color: active ? 'var(--gd)' : done ? 'var(--em)' : 'var(--mn)', fontWeight: active ? 700 : 400 }}>{done ? '✔ ' : ''}{s}</div>
                </div>
              );
            })}
          </div>

          {/* Step 1: Category */}
          {wiz.step === 1 && (
            <>
              <div className="text-[13px] font-bold mb-2" style={{ color: 'var(--tx)' }}>{L('step1')}</div>
              <div className="text-[10px] mb-2.5" style={{ color: 'var(--mn)' }}>{lang === 'hi' ? 'किस विषय पर शिकायत है? एक चुनें।' : 'What is your complaint about? Select one.'}</div>
              <div className="grid grid-cols-2 gap-1.5">
                {SHK_CATEGORIES.map(c => {
                  const sel = wiz.cat === c.c;
                  return (
                    <div key={c.c} role="button" tabIndex={0} aria-pressed={sel}
                      className="p-2.5 rounded-lg cursor-pointer text-center transition-all"
                      style={{ border: `2px solid ${sel ? 'var(--gd)' : 'var(--bd)'}`, background: sel ? 'rgba(212,175,55,.08)' : 'var(--cd)' }}
                      onClick={() => setWiz(w => ({ ...w, cat: c.c }))}
                      onKeyDown={e => { if (e.key === 'Enter') setWiz(w => ({ ...w, cat: c.c })); }}>
                      <div className="text-xl">{c.ic}</div>
                      <div className="text-[11px] font-bold" style={{ color: 'var(--tx)' }}>{c.hi}</div>
                      <div className="text-[9px]" style={{ color: 'var(--mn)' }}>{c.c}</div>
                    </div>
                  );
                })}
              </div>
              {wiz.cat ? <button className="nb-btn nb-btn-success w-full mt-3" onClick={next}>{L('next')} →</button>
                : <div className="text-[10px] text-center mt-2.5" style={{ color: 'var(--mn)' }}>{lang === 'hi' ? '↑ कृपया एक श्रेणी चुनें' : '↑ Please select a category'}</div>}
            </>
          )}

          {/* Step 2: Ward */}
          {wiz.step === 2 && (
            <>
              <div className="text-[13px] font-bold mb-2" style={{ color: 'var(--tx)' }}>{L('step2')} — {wiz.cat}</div>
              <div className="grid grid-cols-4 gap-1">
                {Array.from({ length: 20 }, (_, i) => {
                  const w = `Ward ${i + 1}`; const sel = wiz.ward === w;
                  return (
                    <div key={w} role="button" tabIndex={0} aria-pressed={sel}
                      className="p-2 rounded-md cursor-pointer text-center text-[11px] transition-all"
                      style={{ border: `2px solid ${sel ? 'var(--gd)' : 'var(--bd)'}`, background: sel ? 'rgba(212,175,55,.08)' : 'var(--cd)', color: sel ? 'var(--gd)' : 'var(--sub)', fontWeight: sel ? 700 : 400 }}
                      onClick={() => setWiz(prev => ({ ...prev, ward: w }))}
                      onKeyDown={e => { if (e.key === 'Enter') setWiz(prev => ({ ...prev, ward: w })); }}>
                      {w}
                    </div>
                  );
                })}
              </div>
              <div className="flex gap-2 mt-3">
                <button className="nb-btn" onClick={prev}>← {L('prev')}</button>
                {wiz.ward && <button className="nb-btn nb-btn-success flex-1" onClick={next}>{L('next')} →</button>}
              </div>
            </>
          )}

          {/* Step 3: Describe */}
          {wiz.step === 3 && (
            <>
              <div className="text-[13px] font-bold mb-2" style={{ color: 'var(--tx)' }}>{L('step3')} — {wiz.cat}, {wiz.ward}</div>
              <textarea className="w-full p-2.5 rounded-lg text-xs min-h-[100px] resize-y"
                style={{ background: 'var(--bg)', border: '2px solid var(--bd)', color: 'var(--tx)' }}
                placeholder={lang === 'hi' ? 'क्या समस्या है? कब से है? कितने लोग प्रभावित हैं?' : 'What is the problem? Since when? How many people affected?'}
                value={wiz.desc} onChange={e => setWiz(w => ({ ...w, desc: e.target.value }))}
                aria-label={L('description')} />
              <div className="mt-2.5">
                <div className="text-[10px] font-semibold mb-1.5" style={{ color: 'var(--tx)' }}>{L('urgency')}</div>
                <div className="flex gap-2">
                  {[{ v: 'routine', l: lang === 'hi' ? 'सामान्य (Routine)' : 'Routine', c: 'var(--mn)' }, { v: 'urgent', l: lang === 'hi' ? 'तुरंत (Urgent)' : 'Urgent', c: 'var(--gd)' }, { v: 'emergency', l: lang === 'hi' ? 'आपातकाल (Emergency)' : 'Emergency', c: 'var(--rd)' }].map(u => {
                    const sel = wiz.urg === u.v;
                    return (
                      <div key={u.v} role="button" tabIndex={0} aria-pressed={sel}
                        className="flex-1 p-2 rounded-md cursor-pointer text-center text-[10px] transition-all"
                        style={{ border: `2px solid ${sel ? u.c : 'var(--bd)'}`, background: sel ? `${u.c}10` : 'var(--cd)', color: sel ? u.c : 'var(--sub)', fontWeight: sel ? 700 : 400 }}
                        onClick={() => setWiz(w => ({ ...w, urg: u.v }))}
                        onKeyDown={e => { if (e.key === 'Enter') setWiz(w => ({ ...w, urg: u.v })); }}>
                        {u.l}
                      </div>
                    );
                  })}
                </div>
              </div>
              <label className="flex items-center gap-1.5 text-[10px] mt-2.5 cursor-pointer" style={{ color: 'var(--mn)' }}>
                <input type="checkbox" checked={wiz.anon} onChange={e => setWiz(w => ({ ...w, anon: e.target.checked }))} />
                🔒 {L('anonymous')}
              </label>
              <div className="flex gap-2 mt-3">
                <button className="nb-btn" onClick={prev}>← {L('prev')}</button>
                <button className="nb-btn nb-btn-success flex-1" onClick={next}>{L('next')} →</button>
              </div>
            </>
          )}

          {/* Step 4: Upload */}
          {wiz.step === 4 && (
            <>
              <div className="text-[13px] font-bold mb-2" style={{ color: 'var(--tx)' }}>{L('step4')}</div>
              <input ref={fileRef} type="file" accept="image/*,.pdf" multiple className="hidden"
                onChange={e => { if (e.target.files) setFiles(Array.from(e.target.files).map(f => f.name)); }} />
              <div className="p-8 rounded-lg text-center cursor-pointer transition-colors hover:border-[var(--gd)]"
                style={{ border: '2px dashed rgba(212,175,55,.2)', background: 'var(--cd)' }}
                onClick={() => fileRef.current?.click()}>
                <div className="text-3xl mb-2 opacity-70">📷</div>
                <div className="text-[11px] font-semibold" style={{ color: 'var(--tx)' }}>{lang === 'hi' ? 'फोटो खींचें या अपलोड करें' : 'Take photo or upload'}</div>
                <div className="text-[9px] mt-1" style={{ color: 'var(--mn)' }}>JPG, PNG, PDF · Max 10MB · Up to 5 files</div>
              </div>
              {files.length > 0 && (
                <div className="mt-2 text-[10px]" style={{ color: 'var(--em)' }}>
                  ✅ {files.length} file(s) selected: {files.join(', ')}
                </div>
              )}
              <div className="flex gap-2 mt-3">
                <button className="nb-btn" onClick={prev}>← {L('prev')}</button>
                <button className="nb-btn nb-btn-success flex-1" onClick={next}>{L('next')} → {L('step5')}</button>
              </div>
            </>
          )}

          {/* Step 5: Review */}
          {wiz.step === 5 && (
            <>
              <div className="text-[13px] font-bold mb-2" style={{ color: 'var(--tx)' }}>✅ {L('step5')}</div>
              <div className="p-3.5 rounded-lg mb-3" style={{ background: 'rgba(212,175,55,.04)', border: '1px solid var(--bd)' }}>
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div><span style={{ color: 'var(--mn)' }}>{L('category')}:</span> <b>{wiz.cat || '—'}</b></div>
                  <div><span style={{ color: 'var(--mn)' }}>{L('ward')}:</span> <b>{wiz.ward || '—'}</b></div>
                  <div className="col-span-2"><span style={{ color: 'var(--mn)' }}>{L('description')}:</span> <b>{wiz.desc || (lang === 'hi' ? 'विवरण नहीं दिया' : 'No description')}</b></div>
                  <div><span style={{ color: 'var(--mn)' }}>{L('urgency')}:</span> <b style={{ color: URG_C[wiz.urg] || 'var(--mn)' }}>{wiz.urg.toUpperCase()}</b></div>
                  <div><span style={{ color: 'var(--mn)' }}>{L('anonymous')}:</span> <b>{wiz.anon ? '✔ Yes' : 'No'}</b></div>
                  {files.length > 0 && <div className="col-span-2"><span style={{ color: 'var(--mn)' }}>📎 Files:</span> <b>{files.length} attached</b></div>}
                </div>
              </div>
              <div className="p-2.5 rounded-lg mb-3 text-[10px]" style={{ background: 'rgba(212,175,55,.04)', border: '1px solid rgba(212,175,55,.15)', color: 'var(--gd)' }}>
                ⏱ <b>Expected Timeline:</b> {wiz.urg === 'emergency' ? '4 hours (Tatkal SLA)' : wiz.urg === 'urgent' ? '24 hours (Shighra SLA)' : '7 days (Samanya SLA)'} — You will receive SMS updates.
              </div>
              <div className="flex gap-2">
                <button className="nb-btn" onClick={prev}>← {L('prev')}</button>
                <button className="nb-btn nb-btn-success flex-1 text-[13px] py-2.5" onClick={submit}>📤 {L('submit')} / जमा करें</button>
              </div>
            </>
          )}
        </div>

        {/* RIGHT: Track + Categories */}
        <div className="nb-card" role="region" aria-label="Track and Statistics">
          <h3 className="text-[13px] font-bold mb-2" style={{ color: 'var(--tx)' }}>🔍 {L('track')}</h3>
          <div className="mb-3.5">
            <input className="w-full p-2.5 rounded-lg text-xs" style={{ background: 'var(--cd)', border: '2px solid var(--bd)', color: 'var(--tx)' }}
              placeholder="Enter ID: SHK-2026-XXXX" aria-label="Grievance tracking ID" />
            <button className="nb-btn nb-btn-primary w-full mt-1.5" onClick={() => onToast(lang === 'hi' ? 'स्थिति: In Progress. Dept: PWD. ETA: 3 days.' : 'Status: In Progress. Dept: PWD. ETA: 3 days.')}>
              🔍 {L('track')}
            </button>
          </div>

          <h3 className="text-[13px] font-bold mb-2" style={{ color: 'var(--tx)' }}>📊 {L('category')} Breakdown</h3>
          {SHK_CATEGORIES.map(c => {
            const pct = Math.round(c.r / c.n * 100);
            return (
              <div key={c.c} className="flex items-center gap-1.5 py-0.5 text-[10px]">
                <span className="w-4">{c.ic}</span>
                <span className="flex-1" style={{ color: 'var(--tx)' }}>{c.hi} <span style={{ color: 'var(--mn)' }}>({c.c})</span></span>
                <span className="font-bold w-7 text-right" style={{ color: 'var(--tx)' }}>{c.n}</span>
                <div className="flex-1 h-1 rounded-sm overflow-hidden" style={{ background: 'rgba(212,175,55,.04)' }} role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
                  <div className="h-full rounded-sm" style={{ width: `${pct}%`, background: 'var(--em)' }} />
                </div>
                <span className="w-8 text-right font-bold" style={{ color: 'var(--em)' }}>{pct}%</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent Grievances */}
      <div className="nb-card anim" role="region" aria-label="Recent Grievances">
        <h3 className="text-[13px] font-bold mb-2" style={{ color: 'var(--tx)' }}>⚡ Recent ({SHK.length})</h3>
        {SHK.map(s => (
          <div key={s.id} className="p-2 mb-1 rounded-lg" style={{ borderLeft: `4px solid ${ST_C[s.st] || 'var(--bd)'}`, background: 'rgba(124,58,237,.03)' }} role="article" aria-label={`Grievance ${s.id}`}>
            <div className="flex justify-between items-center flex-wrap gap-1">
              <div><span className="font-mono text-[9px]" style={{ color: 'var(--am)' }}>{s.id}</span> <b className="text-[11px]" style={{ color: 'var(--tx)' }}>{s.cat}</b></div>
              <div className="flex gap-1">
                <span className="nb-tag" style={{ background: URG_C[s.urg] || 'var(--mn)', color: '#fff' }}>{s.urg.toUpperCase()}</span>
                <span className="nb-tag" style={{ background: `${ST_C[s.st] || 'var(--mn)'}22`, color: ST_C[s.st] || 'var(--mn)' }}>{s.st}</span>
              </div>
            </div>
            <div className="text-[10px] mt-0.5" style={{ color: 'var(--sub)' }}>{s.desc}</div>
            <div className="text-[9px] mt-0.5 flex gap-2.5 flex-wrap" style={{ color: 'var(--mn)' }}>
              <span>📍 {s.ward}</span><span>👤 {s.by}</span><span>🏢 {s.dept}</span><span>⏰ {s.dt}</span>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
