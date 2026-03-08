// ═══ NétaBoard V5.0 — AI Engines + Event Bus + Media Pipeline ═══
import { PILLARS, ARC, ALERTS, FEEDBACK, FB_SRC, getNRI } from './index';
import type { ArchetypeKey } from '../types';

// ─── Event Bus ───
type Handler = (payload: Record<string, unknown>, event: BusEvent) => void;
interface BusEvent { id: string; topic: string; payload: Record<string, unknown>; src: string; ts: string; targets: string[] }
class EventBusClass {
  private _L: Record<string, { mod: string; handler: Handler }[]> = {};
  private _log: BusEvent[] = [];
  TOPICS = {
    CRISIS_DETECTED: 'crisis.detected', NRI_CHANGED: 'nri.changed', PILLAR_CHANGED: 'nri.pillar_changed',
    SENTIMENT_SPIKE: 'rep.sentiment_spike', BOOTH_ALERT: 'chunav.booth_alert', ALLIANCE_THREAT: 'alliance.threat',
    VIRAL_CONTENT: 'social.viral', NEGATIVE_TREND: 'social.negative_trend',
    IASCL_CREATED: 'iascl.created', IASCL_DISPATCHED: 'iascl.dispatched', IASCL_CLOSED: 'iascl.closed',
    FEEDBACK_RECEIVED: 'feedback.received', FEEDBACK_ESCALATED: 'feedback.escalated', ELECTION_COUNTDOWN: 'election.countdown',
  };
  emit(topic: string, payload: Record<string, unknown>, src: string): BusEvent {
    const e: BusEvent = { id: 'e' + Date.now(), topic, payload, src, ts: new Date().toISOString(), targets: [] };
    this._log.unshift(e);
    if (this._log.length > 150) this._log.pop();
    (this._L[topic] || []).forEach(({ handler, mod }) => { e.targets.push(mod); try { handler(payload, e); } catch { } });
    return e;
  }
  on(topic: string, mod: string, handler: Handler) { if (!this._L[topic]) this._L[topic] = []; this._L[topic].push({ mod, handler }); }
  getLog() { return this._log; }
  getTopicCount() { return Object.keys(this.TOPICS).length; }
}
export const EB = new EventBusClass();

// ─── ALGO_ENGINE ───
export const ALGO_ENGINE = {
  triageAlerts(alerts: typeof ALERTS, ck: ArchetypeKey) {
    const a = ARC[ck] || { dm: {}, cn: {} } as any;
    const sevW: Record<string, number> = { crisis: 100, high: 75, medium: 50, low: 25, info: 10 };
    return alerts.map(al => {
      const pillar = PILLARS.find(p => al.ds?.toLowerCase().includes(p.l.toLowerCase()));
      const pScore = pillar ? (a.dm[pillar.k] || 50) : 50;
      const timeMul = al.tm.includes('m') ? 2 : al.tm.includes('h') ? 1.5 : 1;
      const score = (sevW[al.sv] || 50) * ((100 - pScore) / 100) * timeMul;
      return { ...al, triageScore: Math.round(score), affectedPillar: pillar?.k || 'cd' };
    }).sort((a, b) => b.triageScore - a.triageScore);
  },

  findWeakestPillars(ck: ArchetypeKey, count = 3) {
    const a = ARC[ck] || { dm: {}, cn: {} } as any;
    return PILLARS.map(p => ({
      key: p.k, label: p.l, icon: p.i, score: a.dm[p.k] || 50, weight: p.w,
      weightedGap: (100 - (a.dm[p.k] || 50)) * p.w,
    })).sort((a, b) => b.weightedGap - a.weightedGap).slice(0, count).map(p => ({
      ...p,
      boost: p.score < 30 ? 'Critical intervention needed' : p.score < 50 ? 'Focused improvement required' : p.score < 70 ? 'Optimization opportunities' : 'Maintain and protect',
      actions: BOOST_ACTIONS[p.key] || ['Consult senior leaders', 'Create improvement plan', 'Set targets'],
    }));
  },

  computeWhatIf(scenario: string, ck: ArchetypeKey) {
    const a = ARC[ck] || { dm: {}, cn: { const: 'Const', party: 'Party' } } as any;
    const impacts: Record<string, Record<string, number>> = {
      cross_voting: { lp: -30, ps: -25, ai: -20, es: -15, ic: -10, pbi: -18, weeks: 8 },
      ec_ban: { es: -35, lp: -25, fm: -20, cd: -15, pbi: -22, weeks: 12 },
      viral_scandal: { sc: -25, ps: -20, pa: -15, mc: -12, es: -10, pbi: -15, weeks: 6 },
      mass_rally_success: { es: 25, ps: 20, gn: 15, cc: 12, pa: 8, pbi: 15, weeks: 0 },
      legislative_win: { lp: 25, es: 18, cd: 15, ps: 12, cc: 10, pbi: 14, weeks: 0 },
      alliance_breakthrough: { ai: 20, es: 18, ce: 12, ps: 10, gn: 8, pbi: 10, weeks: 0 },
    };
    const impact = impacts[scenario] || impacts.viral_scandal;
    const pillarImpacts = PILLARS.map(p => {
      const delta = impact[p.k] || Math.round(Math.random() * 6 - 3);
      return { key: p.k, label: p.l, current: a.dm[p.k] || 50, delta, projected: Math.max(0, Math.min(100, (a.dm[p.k] || 50) + delta)) };
    });
    return {
      scenario, pbi_impact: impact.pbi || 0, pillar_impacts: pillarImpacts, recovery_weeks: impact.weeks || 0,
      analysis: `Impact for ${a.cn.const} (${a.cn.party}): ${scenario.replace(/_/g, ' ')} affects NRI by ${(impact.pbi || 0) > 0 ? '+' : ''}${impact.pbi || 0}. ${(impact.weeks || 0) > 0 ? `Recovery: ${impact.weeks} weeks.` : 'Positive trajectory.'}`,
    };
  },

  generateExecutiveSummary(ck: ArchetypeKey) {
    const a = ARC[ck] || { dm: {}, cn: { const: 'Const', party: 'Party' }, n: 'Unknown Leader' } as any;
    const nriVal = getNRI(a);
    const weak = this.findWeakestPillars(ck, 3);
    const strong = PILLARS.map(p => ({ l: p.l, i: p.i, score: a.dm[p.k] || 50 })).sort((a, b) => b.score - a.score).slice(0, 3);
    const pending = ALERTS.length;
    return {
      summary: `${a.n} (${a.cn.party}, ${a.cn.const}) — NRI ${nriVal.toFixed(1)}/100. ${nriVal > 75 ? 'Strong.' : nriVal > 55 ? 'Moderate.' : 'Needs attention.'} ${pending} alerts. Best: ${strong[0].l} (${strong[0].score}). Weakest: ${weak[0].label} (${weak[0].score}).`,
      strengths: strong.map(s => `${s.i} ${s.l}: ${s.score}`),
      weaknesses: weak.map(w => `${w.icon} ${w.label}: ${w.score} — ${w.boost}`),
      actions: weak.slice(0, 2).flatMap(w => w.actions.slice(0, 2)),
    };
  },
};

const BOOST_ACTIONS: Record<string, string[]> = {
  es: ['Door-to-door in weak wards', 'Activate booth cadre', 'Hold Jan Samvad in target areas'],
  lp: ['Increase Sansad attendance to 90%+', 'File 3 PQs on local issues', 'Introduce Private Member Bill'],
  cd: ['Hold weekly Vikas review', 'Fast-track stalled MPLADS', 'Publicize completed works'],
  pa: ['Hold Jan Darbar weekly', 'Resolve Tatkal same-day', 'Publicize resolution stats'],
  cc: ['Daily social media engagement', 'Respond to negativity within 4h', 'Launch positive campaign'],
  ps: ['Submit party compliance reports', 'Attend organizational meetings', 'Mentor junior cadre'],
  mc: ['Track media sentiment daily', 'Counter negative narratives', 'Build journalist relationships'],
  di: ['Increase posting frequency', 'Engage youth influencers', 'Run targeted ad campaigns'],
  fm: ['Diversify funding sources', 'Audit all expenditures', 'Publish transparent reports'],
  ai: ['Attend alliance meetings monthly', 'Resolve seat-sharing', 'Organize joint rallies'],
  ce: ['Engage all caste group leaders', 'Hold inclusive events', 'Address concerns publicly'],
  ac: ['Showcase development record', 'Address voter fatigue', 'New initiative announcements'],
  gn: ['Set quarterly targets', 'Benchmark vs similar MPs', 'Plan re-election early'],
  ic: ['Consistent messaging', 'Avoid flip-flops', 'Clear ideological positioning'],
  sc: ['Proactive crisis response', 'Legal preparedness', 'Fact-check rapid response'],
};

// ─── SMART_TEMPLATES ───
export const SMART_TEMPLATES = {
  crisis_protocol: {
    grassroots: {
      crisis: [
        { label: 'Janata Outreach Blitz', desc: 'Immediate Jan Samvad. Personal visit 4h. Deploy booth workers.', conf: 92, urg: 'tatkal', criteria: ['Visit area 4h', 'Public statement', 'Deploy 50 workers', 'Jan Samvad 24h'] },
        { label: 'Party Escalation', desc: 'Brief leadership. Joint response. Alliance support.', conf: 85, urg: 'tatkal', criteria: ['Brief president 2h', 'Spokesperson auth', 'Alliance coord'] },
        { label: 'Development Counter-Narrative', desc: 'Publicize Vikas projects. Release data.', conf: 72, urg: 'atyavashy', criteria: ['Compile dev data', 'Media tour', 'Publish report card'] },
      ],
    },
    technocrat: {
      crisis: [
        { label: 'Data-Driven Rebuttal', desc: 'Evidence-based response. Verified stats.', conf: 90, urg: 'tatkal', criteria: ['Compile data 2h', 'Engage fact-checkers', 'Technical brief'] },
        { label: 'Expert Panel', desc: 'Assemble committee. Preliminary findings.', conf: 82, urg: 'atyavashy', criteria: ['Form panel', 'Issue report', 'Public commitment'] },
      ],
    },
    dynasty: {
      crisis: [
        { label: 'Legacy Protection', desc: 'Invoke heritage. Rally cadre. Family network.', conf: 88, urg: 'tatkal', criteria: ['Org meeting', 'Cadre appeal', 'Family statement'] },
        { label: 'Alliance Solidarity', desc: 'Joint press conference. United front.', conf: 80, urg: 'atyavashy', criteria: ['Call partners', 'Joint presser', 'United campaign'] },
      ],
    },
  },
  response_draft: {
    get(ck: ArchetypeKey, sentiment: number) {
      const tone = sentiment > 0 ? 'positive' : sentiment < 0 ? 'negative' : 'neutral';
      const drafts: Record<string, Record<string, string>> = {
        positive: { grassroots: 'Janata ka ashirwad hi hamari takat hai. Aapke samarthan se vikas aur tez hoga. 🙏', technocrat: 'Thank you for recognizing data-driven governance.', dynasty: 'Your support continues the legacy of service.' },
        negative: { grassroots: 'Aapki chinta hamari zimmedari hai. Main vyaktigat roop se dekhuga. 24 ghante mein sampark.', technocrat: 'We take this seriously. Data-backed resolution plan within 48 hours.', dynasty: 'Noted at highest level. Organizational machinery activated.' },
        neutral: { grassroots: 'Dhanyavaad! Aapka feedback mahatvapoorna hai.', technocrat: 'Thank you. Please share specific details.', dynasty: 'Thank you. Your input strengthens our commitment.' },
      };
      return (drafts[tone] && drafts[tone][ck]) || drafts[tone]?.grassroots || 'Dhanyavaad. Hum aapki seva mein tatpar hain.';
    },
  },
};

// ─── AI_AUDIT — Records every AI call ───
export const AI_AUDIT = {
  log: [] as { id: string; tier: number; cached: boolean; success: boolean; latency: number; ts: string }[],
  totalCalls: 0,
  tierUsage: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 } as Record<number, number>,
  record(entry: { id: string; tier: number; cached?: boolean; success?: boolean; latency?: number }) {
    this.log.unshift({ ...entry, cached: entry.cached || false, success: entry.success !== false, latency: entry.latency || 0, ts: new Date().toISOString() });
    this.totalCalls++;
    this.tierUsage[entry.tier] = (this.tierUsage[entry.tier] || 0) + 1;
    if (this.log.length > 200) this.log.pop();
  },
  getCacheHitRate() { const cached = this.log.filter(e => e.cached).length; return this.log.length > 0 ? Math.round(cached / this.log.length * 100) : 0; },
  getAvgLatency() { const withLatency = this.log.filter(e => e.latency > 0); return withLatency.length > 0 ? Math.round(withLatency.reduce((s, e) => s + e.latency, 0) / withLatency.length) : 0; },
};

// ═══ TIER 5: Claude API (Cloud LLM) ═══
export class ClaudeEngine {
  cache = new Map<string, { data: string; ts: number }>();
  private _concurrent = 0;
  private _maxConcurrent = 3;
  private _queue: (() => void)[] = [];

  async call(promptId: string, systemPrompt: string, userPrompt: string, options: { maxTokens?: number; cacheTTL?: number } = {}): Promise<string | null> {
    const { maxTokens = 1000, cacheTTL = 0 } = options;
    const hash = btoa(unescape(encodeURIComponent(promptId + userPrompt.slice(0, 200)))).slice(0, 32);
    if (cacheTTL > 0) {
      const cached = this.cache.get(hash);
      if (cached && Date.now() - cached.ts < cacheTTL * 1000) {
        AI_AUDIT.record({ id: promptId, tier: 5, cached: true });
        return cached.data;
      }
    }
    if (this._concurrent >= this._maxConcurrent) await new Promise<void>(r => this._queue.push(r));
    this._concurrent++;
    const start = Date.now();
    try {
      const r = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: 'claude-sonnet-4-20250514', max_tokens: maxTokens, system: systemPrompt, messages: [{ role: 'user', content: userPrompt }] }),
      });
      if (!r.ok) throw new Error(`API ${r.status}`);
      const d = await r.json();
      const text = d.content?.[0]?.text || null;
      AI_AUDIT.record({ id: promptId, tier: 5, cached: false, success: true, latency: Date.now() - start });
      if (text && cacheTTL > 0) this.cache.set(hash, { data: text, ts: Date.now() });
      return text;
    } catch {
      AI_AUDIT.record({ id: promptId, tier: 5, success: false, latency: Date.now() - start });
      return null;
    } finally {
      this._concurrent--;
      if (this._queue.length) this._queue.shift()!();
    }
  }
}

// ═══ TIER 4: Local LLM (Llama 3.1 8B / Mistral 7B — Apache 2.0) ═══
// Fine-tuned on Indian political domain: Hindi/English sentiment, constituency vocabulary,
// IASCL action drafting, shikayat categorization, booth worker report summarization.
// Runs on: Ollama (dev/MacBook Pro) or vLLM (production GPU server).
export class LocalLLMEngine {
  cache = new Map<string, { data: string; ts: number }>();
  private _endpoint: string;
  private _model: string;

  constructor(endpoint = 'http://localhost:11434/api/generate', model = 'netaboard-political-8b') {
    this._endpoint = endpoint;
    this._model = model;
  }

  async call(promptId: string, systemPrompt: string, userPrompt: string, options: { maxTokens?: number; cacheTTL?: number } = {}): Promise<string | null> {
    const { maxTokens = 1000, cacheTTL = 0 } = options;
    const hash = btoa(unescape(encodeURIComponent(promptId + userPrompt.slice(0, 200)))).slice(0, 32);
    if (cacheTTL > 0) {
      const cached = this.cache.get(hash);
      if (cached && Date.now() - cached.ts < cacheTTL * 1000) {
        AI_AUDIT.record({ id: promptId, tier: 4, cached: true });
        return cached.data;
      }
    }
    const start = Date.now();
    try {
      // Ollama-compatible API (also works with vLLM, llama.cpp server, LM Studio)
      const r = await fetch(this._endpoint, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: this._model,
          prompt: `${systemPrompt}\n\nUser: ${userPrompt}\n\nAssistant:`,
          stream: false,
          options: { num_predict: maxTokens, temperature: 0.7 },
        }),
      });
      if (!r.ok) throw new Error(`Local LLM ${r.status}`);
      const d = await r.json();
      const text = d.response || d.choices?.[0]?.text || null;
      AI_AUDIT.record({ id: promptId, tier: 4, cached: false, success: true, latency: Date.now() - start });
      if (text && cacheTTL > 0) this.cache.set(hash, { data: text, ts: Date.now() });
      return text;
    } catch {
      AI_AUDIT.record({ id: promptId, tier: 4, success: false, latency: Date.now() - start });
      return null;
    }
  }

  async isAvailable(): Promise<boolean> {
    try {
      const r = await fetch(this._endpoint.replace('/api/generate', '/api/tags'), { method: 'GET' });
      return r.ok;
    } catch { return false; }
  }
}

export const claudeEngine = new ClaudeEngine();
export const localLLM = new LocalLLMEngine();

// ═══ AI_RESOLVER — 5-Tier Cascade Router ═══
// Tier 5: Claude API (cloud) — best quality, highest cost, needs internet
// Tier 4: Local LLM (Llama/Mistral fine-tuned) — good quality, low cost, needs GPU
// Tier 3: Smart Templates — archetype-aware pre-computed responses
// Tier 2: ALGO_ENGINE — rule-based calculations
// Tier 1: Static Fallback — hardcoded defaults
export const AI_RESOLVER = {
  tier: 3 as number,
  tierName: 'SMART' as string,
  detected: false,

  async detect() {
    if (this.detected) return;
    // Probe Tier 5 (Claude API)
    try {
      const r = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: 'claude-sonnet-4-20250514', max_tokens: 10, messages: [{ role: 'user', content: 'Reply OK' }] }),
      });
      if (r.ok) { const d = await r.json(); if (d.content?.[0]) { this.tier = 5; this.tierName = 'CLAUDE'; this.detected = true; return; } }
    } catch { }
    // Probe Tier 4 (Local LLM — Ollama/vLLM)
    try {
      const available = await localLLM.isAvailable();
      if (available) { this.tier = 4; this.tierName = 'LOCAL LLM'; this.detected = true; return; }
    } catch { }
    // Fall to Tier 3
    if (typeof SMART_TEMPLATES !== 'undefined') { this.tier = 3; this.tierName = 'SMART'; }
    else { this.tier = 2; this.tierName = 'ALGO'; }
    this.detected = true;
  },

  async generate(promptId: string, context: Record<string, unknown>, options: { alert?: Record<string, unknown>; feedback?: Record<string, unknown>; scenario?: string } = {}): Promise<{ data: unknown; tier: number; badge: string }> {
    const sys = `You are NétaBoard AI, a political intelligence engine for Indian elected representatives. Archetypes: Grassroots, Technocrat, Dynasty. NRI (0-100) from 15 pillars. IASCL: 10-state lifecycle. SLA: Tatkal(4h), Atyavashy(24h), Samayik(1w), Niyamit(30d). RESPOND ONLY IN VALID JSON.`;
    const usr = JSON.stringify({ promptId, context, options });
    const prompt = PROMPTS_REGISTRY.find(p => p.id === promptId);

    // Tier 5: Claude API
    if (this.tier >= 5 && prompt) {
      const result = await claudeEngine.call(promptId, sys, usr, { maxTokens: prompt.maxTokens || 1000, cacheTTL: prompt.cacheTTL });
      if (result) return { data: result, tier: 5, badge: 'claude' };
    }
    // Tier 4: Local LLM
    if (this.tier >= 4 && prompt) {
      const result = await localLLM.call(promptId, sys, usr, { maxTokens: prompt.maxTokens || 1000, cacheTTL: prompt.cacheTTL });
      if (result) return { data: result, tier: 4, badge: 'local' };
    }
    // Tier 3: Smart Templates
    if (this.tier >= 3) {
      const smart = this._getSmart(promptId, options);
      if (smart) { AI_AUDIT.record({ id: promptId, tier: 3, success: true }); return { data: smart, tier: 3, badge: 'smart' }; }
    }
    // Tier 2: Algorithmic
    if (this.tier >= 2) {
      const algo = this._getAlgo(promptId, options);
      if (algo) { AI_AUDIT.record({ id: promptId, tier: 2, success: true }); return { data: algo, tier: 2, badge: 'algo' }; }
    }
    // Tier 1: Static
    AI_AUDIT.record({ id: promptId, tier: 1, success: true });
    return { data: this._getStatic(promptId, options), tier: 1, badge: 'static' };
  },

  _getSmart(id: string, o: Record<string, unknown>) {
    if (id === 'AI-25') return ALGO_ENGINE.findWeakestPillars('grassroots' as ArchetypeKey, 3);
    if (id === 'AI-26') return ALGO_ENGINE.generateExecutiveSummary('grassroots' as ArchetypeKey);
    if (id === 'AI-14' && o.feedback) return { draft_text: SMART_TEMPLATES.response_draft.get('grassroots' as ArchetypeKey, (o.feedback as { snt: number }).snt), tone: 'empathetic' };
    if (id === 'AI-32' && o.feedback) return { draft_text: SMART_TEMPLATES.response_draft.get('grassroots' as ArchetypeKey, (o.feedback as { snt: number }).snt), tone: 'empathetic' };
    return null;
  },
  _getAlgo(id: string, _o: Record<string, unknown>) {
    if (id === 'AI-25') return ALGO_ENGINE.findWeakestPillars('grassroots' as ArchetypeKey, 3);
    if (id === 'AI-26') return ALGO_ENGINE.generateExecutiveSummary('grassroots' as ArchetypeKey);
    return null;
  },
  _getStatic(_id: string, _o: Record<string, unknown>) {
    return { summary: 'AI analysis loading...', actions: ['Review alerts', 'Check weakest pillars'] };
  },

  getTierBadge() {
    const m: Record<number, { c: string; t: string }> = { 5: { c: 'ai-badge-live', t: '⚡ CLAUDE' }, 4: { c: 'ai-badge-local', t: '🦙 LOCAL LLM' }, 3: { c: 'ai-badge-smart', t: '🧠 SMART' }, 2: { c: 'ai-badge-algo', t: '⚙ ALGO' }, 1: { c: 'ai-badge-static', t: '📋 STATIC' } };
    return m[this.tier] || m[1];
  },
  getTierDots() {
    const c: Record<number, string> = { 5: '#34D399', 4: '#A78BFA', 3: '#60A5FA', 2: '#FBBF24', 1: '#94A3B8' };
    return [5, 4, 3, 2, 1].map(t => ({ level: t, active: t <= this.tier, color: c[t] }));
  },
};

// ─── PROMPTS Registry ───
export const PROMPTS_REGISTRY = [
  { id: 'AI-25', name: 'Pillar Weakness Advisor', tier: 4, cacheTTL: 600, maxTokens: 1200 },
  { id: 'AI-26', name: 'Executive NRI Summary', tier: 4, cacheTTL: 300, maxTokens: 1000 },
  { id: 'AI-30', name: 'Chunav Win Probability', tier: 4, cacheTTL: 900, maxTokens: 1200 },
  { id: 'AI-31', name: 'Sansad Optimizer', tier: 4, cacheTTL: 1800, maxTokens: 800 },
  { id: 'AI-32', name: 'Social Auto-Reply', tier: 4, cacheTTL: 300, maxTokens: 400 },
  { id: 'AI-34', name: 'What-If Simulator', tier: 4, cacheTTL: 900, maxTokens: 1200 },
  { id: 'AI-35', name: 'Jan Darbar AI', tier: 4, cacheTTL: 300, maxTokens: 600 },
  { id: 'AI-36', name: 'Samikaran Caste AI', tier: 4, cacheTTL: 1800, maxTokens: 800 },
  { id: 'AI-37', name: 'Shield Crisis AI', tier: 4, cacheTTL: 0, maxTokens: 1000 },
  { id: 'AI-38', name: 'Gathbandhan AI', tier: 4, cacheTTL: 1800, maxTokens: 1000 },
];

// ─── MEDIA_PIPE (OCR/ASR Processing Simulation) ───
export const MEDIA_PIPE = {
  log: [] as { id: string; type: string; engine: string; file: string; status: string; conf: number; pillar: string; sentiment: number; ts: string }[],

  processOCR(fileName: string): { id: string; status: string } {
    const id = 'ocr_' + Date.now();
    const entry = { id, type: 'OCR', engine: 'Tesseract5+ClaudeVision', file: fileName, status: 'completed', conf: Math.floor(Math.random() * 10 + 88), pillar: ['cd', 'mc', 'pa', 'es', 'ce'][Math.floor(Math.random() * 5)], sentiment: Math.round((Math.random() * 1.6 - .8) * 100) / 100, ts: new Date().toISOString() };
    this.log.unshift(entry);
    EB.emit(EB.TOPICS.FEEDBACK_RECEIVED, { source: 'newspaper_ocr', item: entry }, 'MEDIA_PIPE');
    return { id, status: 'completed' };
  },

  processASR(fileName: string, isVideo = false): { id: string; status: string } {
    const id = 'asr_' + Date.now();
    const entry = { id, type: isVideo ? 'ASR+Vision' : 'ASR', engine: isVideo ? 'Whisper-v3+YOLOv8' : 'Whisper-v3', file: fileName, status: 'completed', conf: Math.floor(Math.random() * 8 + 86), pillar: ['mc', 'pa', 'cd', 'es', 'lp'][Math.floor(Math.random() * 5)], sentiment: Math.round((Math.random() * 1.6 - .8) * 100) / 100, ts: new Date().toISOString() };
    this.log.unshift(entry);
    EB.emit(EB.TOPICS.FEEDBACK_RECEIVED, { source: isVideo ? 'video_asr' : 'audio_asr', item: entry }, 'MEDIA_PIPE');
    return { id, status: 'completed' };
  },

  getRecentLog() {
    return [
      { tp: 'OCR', s: 'Dainik Jagran scan', dt: '28 Feb 09:14', cf: 94, ln: 'Hindi', pl: 'cd', sn: .72 },
      { tp: 'OCR', s: 'Amar Ujala clipping', dt: '28 Feb 08:30', cf: 91, ln: 'Hindi', pl: 'mc', sn: -.62 },
      { tp: 'ASR', s: 'AIR Gorakhpur interview', dt: '27 Feb 18:42', cf: 92, ln: 'Hindi', pl: 'pa', sn: .65 },
      { tp: 'ASR', s: 'FM Radio City caller', dt: '27 Feb 14:15', cf: 88, ln: 'Hi/En', pl: 'cd', sn: -.48 },
      { tp: 'ASR+V', s: 'NDTV Panel debate', dt: '27 Feb 22:40', cf: 90, ln: 'Hi/En', pl: 'mc', sn: .55 },
      { tp: 'ASR+V', s: 'Vikas Maidan rally', dt: '26 Feb 16:32', cf: 87, ln: 'Hindi', pl: 'es', sn: .82 },
    ];
  },
};

// ─── Calendar Posts (Content Calendar) ───
export const CAL_POSTS = [
  { dt: 3, ch: 'youtube', tx: 'Rally highlight reel', st: 'scheduled', c: '#FF0000' },
  { dt: 5, ch: 'instagram', tx: 'Vikas Yatra photos', st: 'draft', c: '#E4405F' },
  { dt: 7, ch: 'facebook', tx: 'Jan Darbar announcement', st: 'scheduled', c: '#1877F2' },
  { dt: 10, ch: 'x', tx: '100 days thread', st: 'review', c: '#000' },
  { dt: 15, ch: 'telegram', tx: 'Weekly digest', st: 'scheduled', c: '#26A5E4' },
  { dt: 20, ch: 'youtube', tx: 'Jan Darbar LIVE', st: 'scheduled', c: '#FF0000' },
];
