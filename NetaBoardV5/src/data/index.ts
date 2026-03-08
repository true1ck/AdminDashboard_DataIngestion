// ═══ NétaBoard V5.0 Sarvashakti — Data Constants ═══
import type {
  Pillar, Archetype, Alert, FeedbackSource, FeedbackItem,
  SocialItem, Notification, ModuleItem, Channel, Project, SLADef,
  Emotion, UrgencyDef, ArchetypeKey, IASCLState,
} from '../types';

// ─── 15 NRI Pillars ───
export const PILLARS: Pillar[] = [
  { k: 'es', l: 'Electoral Strength', i: '🗳️', w: 15, c: '#E63946', inv: 0 },
  { k: 'lp', l: 'Legislative Performance', i: '🏛', w: 12, c: '#059669', inv: 0 },
  { k: 'cd', l: 'Constituency Development', i: '🏗', w: 12, c: '#3B82F6', inv: 0 },
  { k: 'pa', l: 'Public Accessibility', i: '🤝', w: 8, c: '#A855F7', inv: 0 },
  { k: 'cc', l: 'Communication', i: '🎤', w: 7, c: '#F59E0B', inv: 0 },
  { k: 'ps', l: 'Party Standing', i: '⭐', w: 7, c: '#D4AF37', inv: 0 },
  { k: 'mc', l: 'Media Coverage', i: '📺', w: 6, c: '#4CC9F0', inv: 0 },
  { k: 'di', l: 'Digital Influence', i: '📱', w: 6, c: '#EC4899', inv: 0 },
  { k: 'fm', l: 'Financial Muscle', i: '💰', w: 5, c: '#10B981', inv: 0 },
  { k: 'ai', l: 'Alliance Intel', i: '🔗', w: 5, c: '#6366F1', inv: 0 },
  { k: 'ce', l: 'Caste Equation', i: '⚖️', w: 5, c: '#8B5CF6', inv: 0 },
  { k: 'ac', l: 'Anti-Incumbency', i: '📉', w: 4, c: '#EF4444', inv: 1 },
  { k: 'gn', l: 'Grassroots Network', i: '🌱', w: 4, c: '#22C55E', inv: 0 },
  { k: 'ic', l: 'Ideology Consistency', i: '🧭', w: 2, c: '#F97316', inv: 0 },
  { k: 'sc', l: 'Scandal Index', i: '⚠️', w: 2, c: '#DC2626', inv: 1 },
];

// ─── 7 Archetypes ───
export const ARC: Record<ArchetypeKey, Archetype> = {} as any;

// ─── Feedback Sources (13 total including OCR/ASR) ───
export const FB_SRC: FeedbackSource[] = [
  { id: 'jd', l: 'Jan Darbar', i: '🏛', c: '#E63946', cred: .95 },
  { id: 'sm', l: 'Social Media', i: '📱', c: '#A855F7', cred: .65 },
  { id: 'mc', l: 'Media', i: '📺', c: '#4CC9F0', cred: .80 },
  { id: 'pt', l: 'Party Intel', i: '⭐', c: '#D4AF37', cred: .90 },
  { id: 'bw', l: 'Booth Workers', i: '🌱', c: '#22C55E', cred: .85 },
  { id: 'gv', l: 'Government', i: '🏗', c: '#3B82F6', cred: .92 },
  { id: 'ec', l: 'Election Commission', i: '🗳️', c: '#F97316', cred: .98 },
  { id: 'op', l: 'Opposition', i: '⚔️', c: '#EF4444', cred: .55 },
  { id: 'ci', l: 'Civil Society', i: '🤝', c: '#06B6D4', cred: .75 },
  { id: 'js', l: 'Jan Setu Portal', i: '🌐', c: '#8B5CF6', cred: .88 },
  { id: 'ocr', l: 'Print Media (OCR)', i: '📰', c: '#B45309', cred: .85 },
  { id: 'asr_a', l: 'Audio/Radio (ASR)', i: '🎙️', c: '#7C2D12', cred: .78 },
  { id: 'asr_v', l: 'Video Broadcast (ASR)', i: '📹', c: '#4C1D95', cred: .82 },
];

// ─── Feedback Items ───
export const FEEDBACK: FeedbackItem[] = [];

// ─── Alerts ───
export const ALERTS: Alert[] = [];

// ─── Social Feed ───
export const SOCIAL_FEED: SocialItem[] = [];

// ─── Notifications ───
export const NOTIFS: Notification[] = [
  { id: 'n1', sev: 'crisis', tx: 'Viral video 2M views in 3h', tm: '12m ago', read: false, mod: 'alerts' },
  { id: 'n2', sev: 'high', tx: 'EC notice: 48h deadline', tm: '2h ago', read: false, mod: 'alerts' },
  { id: 'n3', sev: 'high', tx: 'Alliance partner threatening walkout', tm: '4h ago', read: false, mod: 'alerts' },
  { id: 'n4', sev: 'medium', tx: 'NRI dropped 2.1pts', tm: '5h ago', read: false, mod: 'pillars' },
  { id: 'n5', sev: 'low', tx: '12 booths positive shift', tm: '8h ago', read: true, mod: 'overview' },
  { id: 'n6', sev: 'medium', tx: '38 water complaints this week', tm: '6h ago', read: false, mod: 'pratikriya' },
];

// ─── Emotions (Plutchik 8-Wheel) ───
export const EMOT: Record<string, Emotion> = {
  joy: { i: '😊', c: '#22C55E' }, trust: { i: '🤝', c: '#3B82F6' },
  fear: { i: '😨', c: '#A855F7' }, surprise: { i: '😲', c: '#F59E0B' },
  sadness: { i: '😢', c: '#6366F1' }, anticipation: { i: '🔮', c: '#06B6D4' },
  anger: { i: '😡', c: '#EF4444' }, disgust: { i: '🤢', c: '#DC2626' },
};

// ─── Urgency Tiers ───
export const URG: Record<string, UrgencyDef> = {
  tatkal: { l: 'तत्काल', c: '#EF4444', h: 4 },
  shighra: { l: 'शीघ्र', c: '#F59E0B', h: 24 },
  samanya: { l: 'सामान्य', c: '#3B82F6', h: 168 },
};

// ─── Severity Colors ───
export const SEV_C: Record<string, string> = {
  crisis: '#E63946', high: '#F59E0B', medium: '#3B82F6', low: '#059669', info: '#6B5F8A',
};

// ─── Platform Colors ───
export const PL_C: Record<string, string> = {
  youtube: '#FF0000', facebook: '#1877F2', instagram: '#E4405F', x: '#1DA1F2',
  whatsapp: '#25D366', telegram: '#26A5E4', jan_setu: '#8B5CF6', party_wa: '#D4AF37',
  booth_reports: '#22C55E', newspaper_ocr: '#B45309', audio_asr: '#7C2D12', video_asr: '#4C1D95',
};

// ─── Pill Labels ───
export const PILL_LABELS: Record<string, string> = {
  dashboard: '📊 Dashboard', notifications: '🔔 Notifications', deepdive: '🔍 Deep-Dive',
  feedback_overlay: '📡 Feedback Overlay', active: '⚡ Active', karma: '📋 Karma',
  ai_sug: '🤖 AI', lifecycle: '🔄 IASCL', dispatch: '📤 Dispatch',
  trends: '📈 Trends', sentiment: '📊 Sentiment', rivals: '⚔️ Rivals',
  booths: '🗳️ Booths', heatmap: '🔥 Heatmap', scorecard: '📊 Scorecard',
  attendance: '📅 Attendance', projects: '🏗 Projects', mplads: '💰 MPLADS',
  grievances: '📋 Grievances', queue: '👥 Queue', caste_eq: '⚖️ Caste',
  coalition: '🤝 Coalition', standing: '⭐ Standing', cadre: '🌱 Cadre',
  inbox: '💬 Inbox', ytstudio: '▶️ YT Studio', channels: '🔗 Channels',
  overview: '📊 Overview', feed: '📡 Feed', sources: '📌 Sources',
  iascl: '⚡ IASCL', response: '💬 Response',
  history: '⏳ History', browser: '📁 Browser', search: '🔍 Search',
  funding: '💰 Funding', expenditure: '📋 Expenditure',
  crisis: '🚨 Crisis', satya: '🛡 Satya Raksha',
  alliance_map: '🗺 Alliance', seats: '💺 Seats',
  calendar: '📅 Calendar', content_cal: '📝 Content', whatif: '🔮 What-If',
  profile: '👤 Profile', ai_usage: '🤖 AI Usage', export: '📤 Export',
};

// ─── Back Office Modules ───
export const BO_MODULES: ModuleItem[] = [
  { sec: 'INTELLIGENCE' },
  { k: 'overview', ic: '🎯', l: 'Command Centre', pills: ['dashboard', 'notifications'] },
  { k: 'pillars', ic: '📊', l: '15 Pillars', pills: ['deepdive', 'feedback_overlay'] },
  { k: 'alerts', ic: '⚡', l: 'Alerts & AI', pills: ['active', 'karma', 'ai_sug', 'lifecycle', 'dispatch'] },
  { k: 'analytics', ic: '📈', l: 'Analytics', pills: ['trends', 'sentiment', 'rivals'] },
  { sec: 'POLITICAL' },
  { k: 'chunav', ic: '🗳️', l: 'Chunav Yantra', pills: ['booths', 'heatmap'] },
  { k: 'sansad', ic: '🏛', l: 'Sansad Meter', pills: ['scorecard', 'attendance'] },
  { k: 'vikas', ic: '🏗', l: 'Vikas Patra', pills: ['projects', 'mplads'] },
  { k: 'jandarbar', ic: '👥', l: 'Jan Darbar', pills: ['grievances', 'queue'] },
  { k: 'samikaran', ic: '⚖️', l: 'Samikaran', pills: ['caste_eq', 'coalition'] },
  { k: 'dal', ic: '⭐', l: 'Dal Sthiti', pills: ['standing', 'cadre'] },
  { sec: 'ENGAGEMENT' },
  { k: 'social', ic: '💬', l: 'Social Command', pills: ['inbox', 'ytstudio', 'channels'] },
  { k: 'pratikriya', ic: '📡', l: 'Pratikriya FMS', pills: ['overview', 'feed', 'sources', 'iascl', 'response'] },
  { k: 'ingest', ic: '📥', l: 'Ingest Hub', pills: ['dashboard', 'history'] },
  { k: 'vault', ic: '🗄️', l: 'Data Vault', pills: ['browser', 'search'] },
  { sec: 'OPERATIONS' },
  { k: 'arthbal', ic: '💰', l: 'Arth Bal', pills: ['funding', 'expenditure'] },
  { k: 'shield', ic: '🛡', l: 'Vivad Kavach', pills: ['crisis', 'satya'] },
  { k: 'gathbandhan', ic: '🤝', l: 'Gathbandhan', pills: ['alliance_map', 'seats'] },
  { k: 'planning', ic: '📅', l: 'Planning Hub', pills: ['calendar', 'content_cal', 'whatif'] },
  { k: 'settings', ic: '⚙', l: 'Settings', pills: ['profile', 'ai_usage', 'export'] },
  { sec: 'PIPELINE' },
  { k: 'pipeline', ic: '🔄', l: 'Pipeline Intel', pills: ['monitor', 'visualize', 'logs'] },
];

// ─── Jan Setu Portal Modules ───
export const PP_MODULES: ModuleItem[] = [
  { k: 'pp_parichay', ic: '🏛', l: 'Parichay', pills: [] },
  { k: 'pp_shikayat', ic: '📋', l: 'Shikayat Kendra', pills: [] },
  { k: 'pp_vani', ic: '🎬', l: 'Vani Kendra', pills: [] },
  { k: 'pp_vikas', ic: '🏗', l: 'Vikas Darshak', pills: [] },
  { k: 'pp_awaaz', ic: '📢', l: 'Jan Awaaz', pills: [] },
  { k: 'pp_aavedhan', ic: '📝', l: 'Jan Aavedhan', pills: [] },
  { k: 'pp_edarbar', ic: '🏛', l: 'E-Jan Darbar', pills: [] },
  { k: 'pp_sahyogi', ic: '🤝', l: 'Sahyogi Dwaar', pills: [] },
  { k: 'pp_karyakram', ic: '📅', l: 'Karyakram', pills: [] },
  { k: 'pp_samvad', ic: '💬', l: 'Samvad Manch', pills: [] },
  { k: 'pp_apatkal', ic: '🆘', l: 'Apatkal Setu', pills: [] },
];

// ─── IASCL State Machine ───
export const IASCL_STATES: IASCLState[] = [
  'draft', 'dispatched', 'acknowledged', 'in_progress',
  'submitted', 'under_review', 'accepted', 'rejected',
  'revision_requested', 'closed', 'cancelled',
];

export const IASCL_TRANSITIONS: Record<string, IASCLState[]> = {
  draft: ['dispatched'],
  dispatched: ['acknowledged', 'cancelled'],
  acknowledged: ['in_progress', 'cancelled'],
  in_progress: ['submitted', 'cancelled'],
  submitted: ['under_review'],
  under_review: ['accepted', 'rejected', 'revision_requested'],
  rejected: ['in_progress'],
  revision_requested: ['in_progress'],
  accepted: ['closed'],
  closed: [],
  cancelled: [],
};

export const IASCL_COLORS: Record<string, string> = {
  draft: '#94A3B8', dispatched: '#A78BFA', acknowledged: '#38BDF8',
  in_progress: '#FBBF24', submitted: '#F97316', under_review: '#E879F9',
  accepted: '#34D399', rejected: '#FB7185', revision_requested: '#FB923C',
  closed: '#10B981', cancelled: '#9CA3AF',
};

export const IASCL_ICONS: Record<string, string> = {
  draft: '📝', dispatched: '📤', acknowledged: '👁', in_progress: '⚙️',
  submitted: '📬', under_review: '🔍', accepted: '✅', rejected: '❌',
  revision_requested: '✏️', closed: '🏁', cancelled: '🚫',
};

// ─── SLA Tiers ───
export const SLA_TIERS: Record<string, SLADef> = {
  tatkal: { label: 'Tatkal', hi: 'तत्काल', hours: 4, ack_hours: 0.5, color: '#EF4444', examples: 'Viral scandal, deepfake, EC notice' },
  atyavashy: { label: 'Atyavashy', hi: 'अत्यावश्य', hours: 24, ack_hours: 2, color: '#F97316', examples: 'Negative media cycle, opposition attack' },
  samayik: { label: 'Samayik', hi: 'सामयिक', hours: 168, ack_hours: 24, color: '#FBBF24', examples: 'Event prep, Jan Darbar backlog' },
  niyamit: { label: 'Niyamit', hi: 'नियमित', hours: 720, ack_hours: 72, color: '#3B82F6', examples: 'Monthly NRI review, cadre audit' },
};

// ─── Helper: NRI Calculation ───
export function getNRI(a: Archetype): number {
  let s = 0, w = 0;
  PILLARS.forEach(p => {
    const v = a.dm[p.k] || 50;
    s += (p.inv ? 100 - v : v) * p.w;
    w += p.w;
  });
  return w > 0 ? s / w : 50;
}

// ─── Helper: FIS Calculation ───
export function computeFIS(items: FeedbackItem[]): { score: number; vol: number; snt: number; div: number; cred: number } {
  if (!items?.length) return { score: 50, vol: 0, snt: 50, div: 0, cred: 0 };
  const vol = Math.min(100, items.length * 8);
  const snt = Math.round(50 + items.reduce((s, f) => s + f.snt, 0) / items.length * 50);
  const srcs = new Set(items.map(f => f.src));
  const div = Math.min(100, srcs.size * 15);
  const cred = Math.round(items.reduce((s, f) => {
    const src = FB_SRC.find(x => x.id === f.src);
    return s + (src ? src.cred : .5);
  }, 0) / items.length * 100);
  return { score: Math.round(vol * .2 + snt * .25 + div * .15 + cred * .2 + 20), vol, snt, div, cred };
}

// ─── Archetype Display Names ───
export const ARCH_DISPLAY: Record<ArchetypeKey, string> = {
  grassroots: 'Grassroots', technocrat: 'Technocrat', dynasty: 'Political Family',
  firebrand: 'Firebrand', silent: 'Silent', satrap: 'Satrap', turncoat: 'Multi-Party Exp.',
};

// ─── Channel Instance Type ───
export interface ChannelInstance {
  label: string; hd: string; st: 'connected' | 'pending' | 'disconnected';
  auth: string; notes: string;
  stats: { fol: string; items: number; pend: number; resp: number; snt: number };
}

export interface ChannelDef {
  id: string; nm: string; hi: string; ic: string; c: string;
  st: 'connected' | 'pending' | 'disconnected';
  hd: string; api: string; auth: string; notes: string;
  can: { read: number; reply: number; del: number; dm: number; wh: number };
  stats: { fol: string; items: number; pend: number; resp: number; snt: number };
  setup: string[];
  instances: ChannelInstance[];
}

// ─── 11 Channels with Multi-Instance Data ───
export const CHANNELS: ChannelDef[] = [];

// ─── Hero Slideshow Images (10 Unsplash URLs from original HTML) ───
export const HERO_SLIDES = [
  'https://images.unsplash.com/photo-1532375810709-75b1da00537c?w=400&h=500&fit=crop',
  'https://images.unsplash.com/photo-1524492412937-b28074a5d7da?w=400&h=500&fit=crop',
  'https://images.unsplash.com/photo-1506461883276-594a12b11cf3?w=400&h=500&fit=crop',
  'https://images.unsplash.com/photo-1587474260584-136574528ed5?w=400&h=500&fit=crop',
  'https://images.unsplash.com/photo-1548013146-72479768bada?w=400&h=500&fit=crop',
  'https://images.unsplash.com/photo-1564507592333-c60657eea523?w=400&h=500&fit=crop',
  'https://images.unsplash.com/photo-1514222134-b57cbb8ce073?w=400&h=500&fit=crop',
  'https://images.unsplash.com/photo-1570168007204-dfb528c6958f?w=400&h=500&fit=crop',
  'https://images.unsplash.com/photo-1585135497273-1a86b09fe70e?w=400&h=500&fit=crop',
  'https://images.unsplash.com/photo-1609766418204-94aae0e3d9e5?w=400&h=500&fit=crop',
];
