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
export const ARC: Record<ArchetypeKey, Archetype> = {
  grassroots: {
    n: 'Raj Pratap Singh', ic: '🏛', tg: 'जनसेवक', pr: '#059669',
    cn: { const: 'Gorakhpur', party: 'BJP', state: 'UP', type: 'LS', eldt: '2029-04', booth: 1842 },
    dm: { es: 78, lp: 62, cd: 72, pa: 88, cc: 65, ps: 70, mc: 55, di: 45, fm: 60, ai: 68, ce: 75, ac: 22, gn: 92, ic: 80, sc: 15 },
    rv: [{ n: 'Suresh Yadav', nri: 62, tr: -3 }, { n: 'Meena Devi', nri: 58, tr: 2 }],
    san: { att: 78, ques: 24, pvt: 6, bill: 2 },
    kpi: { rallies: 48, padyatra: '2400km', sabha: 180, grievance: '82%' },
  },
  technocrat: {
    n: 'Dr Vikram Reddy', ic: '💻', tg: 'तकनीकी नेता', pr: '#3B82F6',
    cn: { const: 'Hyderabad', party: 'BRS', state: 'Telangana', type: 'LS', eldt: '2029-04', booth: 2156 },
    dm: { es: 72, lp: 85, cd: 80, pa: 55, cc: 78, ps: 65, mc: 72, di: 82, fm: 75, ai: 62, ce: 55, ac: 18, gn: 48, ic: 85, sc: 10 },
    rv: [{ n: 'Ravi Kumar', nri: 68, tr: 1 }, { n: 'Sita Reddy', nri: 55, tr: -1 }],
    san: { att: 92, ques: 48, pvt: 12, bill: 5 },
    kpi: { it: 12, startups: 28 },
  },
  dynasty: {
    n: 'Arjun Sharma III', ic: '👑', tg: 'खानदानी नेता', pr: '#D4AF37',
    cn: { const: 'Rae Bareli', party: 'INC', state: 'UP', type: 'LS', eldt: '2029-04', booth: 1950 },
    dm: { es: 85, lp: 55, cd: 65, pa: 42, cc: 82, ps: 90, mc: 88, di: 72, fm: 95, ai: 85, ce: 60, ac: 35, gn: 55, ic: 45, sc: 30 },
    rv: [{ n: 'Ram Kishor', nri: 52, tr: 2 }],
    san: { att: 55, ques: 8, pvt: 2, bill: 0 },
    kpi: { legacy: 45 },
  },
  firebrand: {
    n: 'Aarti Kumari', ic: '🔥', tg: 'अग्निवक्ता', pr: '#E63946',
    cn: { const: 'Begusarai', party: 'CPI(ML)', state: 'Bihar', type: 'LS', eldt: '2029-04', booth: 1680 },
    dm: { es: 65, lp: 72, cd: 58, pa: 75, cc: 95, ps: 55, mc: 82, di: 88, fm: 35, ai: 42, ce: 80, ac: 12, gn: 72, ic: 92, sc: 40 },
    rv: [{ n: 'Girish Thakur', nri: 60, tr: 1 }],
    san: { att: 85, ques: 42, pvt: 8, bill: 3 },
    kpi: { protests: 32 },
  },
  silent: {
    n: 'K. Raghunathan', ic: '🧘', tg: 'मौन शक्ति', pr: '#6366F1',
    cn: { const: 'Kanyakumari', party: 'AIADMK', state: 'TN', type: 'LS', eldt: '2029-04', booth: 1540 },
    dm: { es: 72, lp: 90, cd: 88, pa: 65, cc: 35, ps: 75, mc: 30, di: 22, fm: 70, ai: 78, ce: 68, ac: 8, gn: 80, ic: 88, sc: 5 },
    rv: [{ n: 'Sekar P', nri: 65, tr: 2 }],
    san: { att: 95, ques: 56, pvt: 18, bill: 8 },
    kpi: { projects: 24 },
  },
  satrap: {
    n: 'Baldev Singh Chauhan', ic: '⚔️', tg: 'क्षत्रप', pr: '#F97316',
    cn: { const: 'Jamnagar', party: 'BJP', state: 'Gujarat', type: 'LS', eldt: '2029-04', booth: 1920 },
    dm: { es: 88, lp: 48, cd: 70, pa: 50, cc: 72, ps: 82, mc: 65, di: 55, fm: 90, ai: 92, ce: 82, ac: 28, gn: 85, ic: 55, sc: 35 },
    rv: [{ n: 'Ahmed Jr', nri: 55, tr: -1 }],
    san: { att: 45, ques: 6, pvt: 1, bill: 0 },
    kpi: { panchayats: '78%' },
  },
  turncoat: {
    n: 'Manoj Tiwari Redux', ic: '🔄', tg: 'बहुदलीय अनुभव', pr: '#EC4899',
    cn: { const: 'Patna Sahib', party: 'RJD', state: 'Bihar', type: 'LS', eldt: '2029-04', booth: 1780 },
    dm: { es: 58, lp: 42, cd: 45, pa: 60, cc: 70, ps: 35, mc: 78, di: 65, fm: 55, ai: 45, ce: 62, ac: 42, gn: 40, ic: 15, sc: 55 },
    rv: [{ n: 'Vikash Kumar', nri: 52, tr: 3 }],
    san: { att: 62, ques: 14, pvt: 3, bill: 1 },
    kpi: { switches: 3 },
  },
};

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
export const FEEDBACK: FeedbackItem[] = [
  { id: 'fb1', text: 'Road repair in Ward 14 excellent', src: 'bw', snt: .85, em: 'trust', pil: 'cd', urg: 'samanya', tm: '12m ago' },
  { id: 'fb2', text: 'Jan Darbar wait increased to 4 hours', src: 'jd', snt: -.72, em: 'anger', pil: 'pa', urg: 'shighra', tm: '25m ago' },
  { id: 'fb3', text: 'Viral video of MP sleeping in Sansad', src: 'sm', snt: -.88, em: 'disgust', pil: 'lp', urg: 'tatkal', tm: '1h ago' },
  { id: 'fb4', text: 'Strong ground support in housing colonies', src: 'bw', snt: .78, em: 'anticipation', pil: 'gn', urg: 'samanya', tm: '2h ago' },
  { id: 'fb5', text: 'EC notice: unaccounted rally expenditure', src: 'ec', snt: -.65, em: 'fear', pil: 'fm', urg: 'tatkal', tm: '3h ago' },
  { id: 'fb6', text: 'Party high command praises development', src: 'pt', snt: .92, em: 'joy', pil: 'ps', urg: 'samanya', tm: '4h ago' },
  { id: 'fb7', text: 'Opposition releases doctored audio', src: 'op', snt: -.78, em: 'anger', pil: 'sc', urg: 'tatkal', tm: '5h ago' },
  { id: 'fb8', text: 'Civil society endorses education initiative', src: 'ci', snt: .82, em: 'trust', pil: 'cd', urg: 'samanya', tm: '6h ago' },
  { id: 'fb9', text: 'Jan Setu flooded with water complaints', src: 'js', snt: -.60, em: 'sadness', pil: 'pa', urg: 'shighra', tm: '8h ago' },
  { id: 'fb10', text: 'Media interview performance rated excellent', src: 'mc', snt: .88, em: 'trust', pil: 'cc', urg: 'samanya', tm: '10h ago' },
  { id: 'fb11', text: 'Cross-voting allegation in Rajya Sabha', src: 'pt', snt: -.82, em: 'anger', pil: 'ic', urg: 'tatkal', tm: '12h ago' },
  { id: 'fb12', text: 'MPLADS funds utilization at 94%', src: 'gv', snt: .90, em: 'joy', pil: 'cd', urg: 'samanya', tm: '1d ago' },
];

// ─── Alerts ───
export const ALERTS: Alert[] = [
  { id: 'a1', sv: 'crisis', t: 'Viral: MP Sleeping in Parliament', ds: 'Video 2M+ views. Opposition amplifying.', ai_txt: 'Release clip of active debate participation.', cf: 88, ic: '📹', tm: '12m ago' },
  { id: 'a2', sv: 'high', t: 'EC Notice: Expenditure Discrepancy', ds: '12L unaccounted in Diwali rally.', ai_txt: 'File response with receipts in 48h.', cf: 82, ic: '📋', tm: '2h ago' },
  { id: 'a3', sv: 'high', t: 'Opposition Deepfake Audio', ds: 'Doctored audio alleging corruption.', ai_txt: 'File FIR + Satya Raksha verification.', cf: 90, ic: '🛡', tm: '3h ago' },
  { id: 'a4', sv: 'medium', t: 'NRI Dropped 2.1 pts', ds: 'Negative coverage of party infighting.', ai_txt: 'Schedule 3 positive media interactions.', cf: 75, ic: '📊', tm: '5h ago' },
  { id: 'a5', sv: 'medium', t: 'Jan Darbar Surge: Water Supply', ds: '38 complaints in 72h about Ward 14.', ai_txt: 'Coordinate with Jal Board immediately.', cf: 85, ic: '🚰', tm: '6h ago' },
  { id: 'a6', sv: 'low', t: 'Positive Ground Shift in 12 Booths', ds: 'Support up after road construction.', ai_txt: 'Door-to-door campaign in adjacent wards.', cf: 72, ic: '🌱', tm: '8h ago' },
  { id: 'a7', sv: 'high', t: 'Alliance Partner Demanding More Seats', ds: 'Junior partner threatening walkout.', ai_txt: 'Offer 2 additional MLC seats.', cf: 78, ic: '🤝', tm: '4h ago' },
];

// ─── Social Feed ───
export const SOCIAL_FEED: SocialItem[] = [
  { id: 'sf1', pl: 'youtube', au: 'Voter', tx: 'Road banvane ke liye dhanyavad!', tm: '10m', snt: .92, em: 'joy', lk: 245, re: 0 },
  { id: 'sf2', pl: 'x', au: '@OppositionLeader', tx: 'Where is your MP during floods?', tm: '25m', snt: -.85, em: 'anger', lk: 1200, re: 0 },
  { id: 'sf3', pl: 'facebook', au: 'Ward 14 Resident', tx: 'No water for 3 days.', tm: '45m', snt: -.72, em: 'anger', lk: 89, re: 0 },
  { id: 'sf4', pl: 'jan_setu', au: 'Ramesh Kumar', tx: 'Street light broken 2 months', tm: '1h', snt: -.55, em: 'sadness', lk: 0, re: 0 },
  { id: 'sf5', pl: 'whatsapp', au: 'Booth President W7', tx: '200 new voter registrations', tm: '2h', snt: .88, em: 'joy', lk: 0, re: 1 },
  { id: 'sf6', pl: 'instagram', au: '@youth_wing', tx: 'Padyatra 12km amazing response!', tm: '3h', snt: .82, em: 'anticipation', lk: 342, re: 0 },
  { id: 'sf7', pl: 'party_wa', au: 'State Secretary', tx: 'High command impressed.', tm: '4h', snt: .90, em: 'trust', lk: 0, re: 0 },
  { id: 'sf8', pl: 'booth_reports', au: 'Block Pramukh', tx: 'Opposition distributing cash Ward 12', tm: '5h', snt: -.75, em: 'fear', lk: 0, re: 0 },
  { id: 'sf9', pl: 'telegram', au: 'Media Coord', tx: '3 newspapers confirmed for inauguration', tm: '6h', snt: .78, em: 'anticipation', lk: 0, re: 0 },
  { id: 'sf10', pl: 'newspaper_ocr', au: 'Dainik Jagran', tx: '[OCR] MP leads demand for flyover; Rs 248Cr sanctioned', tm: '6h', snt: .72, em: 'trust', lk: 0, re: 0 },
  { id: 'sf11', pl: 'audio_asr', au: 'AIR Gorakhpur', tx: '[ASR] Radio interview: MP outlines 5-point healthcare plan', tm: '4h', snt: .65, em: 'anticipation', lk: 0, re: 0 },
  { id: 'sf12', pl: 'video_asr', au: 'Rally Footage', tx: '[ASR+Vision] Vikas Maidan rally. Crowd ~15K.', tm: '1d', snt: .82, em: 'joy', lk: 0, re: 0 },
  { id: 'sf13', pl: 'audio_asr', au: 'FM Radio City', tx: '[ASR] Caller complains about broken road Ward 8; RJ redirects to Jan Setu.', tm: '8h', snt: -.48, em: 'sadness', lk: 0, re: 0 },
  { id: 'sf14', pl: 'video_asr', au: 'NDTV Debate', tx: '[ASR+Vision] Panel debate: MP defends development record. Body language 78%.', tm: '3h', snt: .55, em: 'trust', lk: 0, re: 0 },
  { id: 'sf15', pl: 'newspaper_ocr', au: 'Amar Ujala', tx: '[OCR] Opposition alleges misuse of MPLADS funds; MP terms it baseless vendetta.', tm: '5h', snt: -.62, em: 'anger', lk: 0, re: 0 },
  { id: 'sf16', pl: 'youtube', au: 'Analyst', tx: 'Best constituency development this decade', tm: '8h', snt: .88, em: 'trust', lk: 1800, re: 0 },
];

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
  { sec: 'OPERATIONS' },
  { k: 'arthbal', ic: '💰', l: 'Arth Bal', pills: ['funding', 'expenditure'] },
  { k: 'shield', ic: '🛡', l: 'Vivad Kavach', pills: ['crisis', 'satya'] },
  { k: 'gathbandhan', ic: '🤝', l: 'Gathbandhan', pills: ['alliance_map', 'seats'] },
  { k: 'planning', ic: '📅', l: 'Planning Hub', pills: ['calendar', 'content_cal', 'whatif'] },
  { k: 'settings', ic: '⚙', l: 'Settings', pills: ['profile', 'ai_usage', 'export'] },
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
export const CHANNELS: ChannelDef[] = [
  { id: 'youtube', nm: 'YouTube', hi: 'यूट्यूब', ic: '▶️', c: '#FF0000', st: 'connected', hd: '@MP_Official', api: 'YouTube Data API v3', auth: 'OAuth 2.0', can: { read: 1, reply: 1, del: 1, dm: 0, wh: 0 }, stats: { fol: '180K', items: 14200, pend: 38, resp: 94, snt: .62 }, setup: ['Google Cloud Console → Enable YouTube Data API v3', 'Create OAuth 2.0 credentials', 'Polling: 15 min', 'Quota: 10,000 units/day'], notes: 'No webhook. Polling only.',
    instances: [{ label: 'Main Channel', hd: '@MP_Official', st: 'connected', auth: 'OAuth 2.0', notes: 'Primary official channel', stats: { fol: '180K', items: 14200, pend: 38, resp: 94, snt: .62 } }, { label: 'Campaign Channel', hd: '@MP_Campaign2029', st: 'connected', auth: 'OAuth 2.0', notes: 'Election campaign content', stats: { fol: '45K', items: 320, pend: 5, resp: 88, snt: .72 } }, { label: 'Regional (Bhojpuri)', hd: '@MP_Bhojpuri', st: 'pending', auth: 'OAuth 2.0', notes: 'Regional language outreach', stats: { fol: '12K', items: 48, pend: 2, resp: 80, snt: .55 } }] },
  { id: 'facebook', nm: 'Facebook', hi: 'फेसबुक', ic: '📘', c: '#1877F2', st: 'connected', hd: 'Official Page', api: 'Meta Graph API v22', auth: 'OAuth 2.0', can: { read: 1, reply: 1, del: 1, dm: 1, wh: 1 }, stats: { fol: '450K', items: 4800, pend: 12, resp: 89, snt: .55 }, setup: ['Meta for Developers → Create App', 'Request pages_read_engagement', 'App Review (1–5 days)'], notes: 'Full capability. Webhook real-time.',
    instances: [{ label: 'Official Page', hd: 'Official MP Page', st: 'connected', auth: 'OAuth 2.0', notes: 'Primary Facebook page', stats: { fol: '450K', items: 4800, pend: 12, resp: 89, snt: .55 } }, { label: 'Constituency Page', hd: 'MP Gorakhpur Page', st: 'connected', auth: 'OAuth 2.0', notes: 'Constituency-specific content', stats: { fol: '120K', items: 1200, pend: 6, resp: 85, snt: .62 } }] },
  { id: 'instagram', nm: 'Instagram', hi: 'इंस्टाग्राम', ic: '📸', c: '#E4405F', st: 'connected', hd: '@mp_official', api: 'Instagram Graph API', auth: 'OAuth 2.0', can: { read: 1, reply: 1, del: 1, dm: 1, wh: 1 }, stats: { fol: '320K', items: 3200, pend: 8, resp: 92, snt: .68 }, setup: ['Switch to Business/Creator account', 'Link to Facebook Page'], notes: '24hr messaging window.',
    instances: [{ label: 'Official Account', hd: '@mp_official', st: 'connected', auth: 'OAuth 2.0', notes: 'Primary Instagram', stats: { fol: '320K', items: 3200, pend: 8, resp: 92, snt: .68 } }, { label: 'Behind the Scenes', hd: '@mp_bts', st: 'connected', auth: 'OAuth 2.0', notes: 'Personal/BTS content', stats: { fol: '78K', items: 480, pend: 2, resp: 90, snt: .75 } }] },
  { id: 'whatsapp', nm: 'WhatsApp', hi: 'व्हाट्सऐप', ic: '📱', c: '#25D366', st: 'connected', hd: '+91 Groups', api: 'WA Business Cloud API', auth: 'System Token', can: { read: 1, reply: 1, del: 0, dm: 1, wh: 1 }, stats: { fol: '45 Grp', items: 860, pend: 24, resp: 96, snt: .78 }, setup: ['Meta Business Account → Add WhatsApp', 'Register Phone → Get ID', '1000 free convos/month'], notes: 'Highest-signal for India.',
    instances: [{ label: 'Constituency Helpline', hd: '+91 98XXX 00001', st: 'connected', auth: 'System Token', notes: 'Public helpline number', stats: { fol: '15K', items: 860, pend: 24, resp: 96, snt: .78 } }, { label: 'Party Core Group', hd: '+91 98XXX 00002', st: 'connected', auth: 'System Token', notes: 'Internal party coordination', stats: { fol: '250', items: 420, pend: 8, resp: 92, snt: .65 } }, { label: 'Booth Presidents', hd: '+91 98XXX 00003', st: 'connected', auth: 'System Token', notes: '1842 booth-level workers', stats: { fol: '1842', items: 5600, pend: 42, resp: 72, snt: .58 } }, { label: 'Youth Wing', hd: '+91 98XXX 00004', st: 'pending', auth: 'System Token', notes: 'Youth wing coordination', stats: { fol: '380', items: 120, pend: 6, resp: 70, snt: .60 } }] },
  { id: 'x', nm: 'X / Twitter', hi: 'एक्स', ic: '𝕏', c: '#1DA1F2', st: 'pending', hd: '@handle', api: 'X API v2', auth: 'OAuth 2.0', can: { read: 1, reply: 1, del: 1, dm: 1, wh: 0 }, stats: { fol: '280K', items: 2400, pend: 15, resp: 78, snt: .45 }, setup: ['X Developer Portal → Create Project', 'Subscribe Pro tier', 'Polling: 15min'], notes: '⚠ Pro tier $5K/mo.',
    instances: [{ label: 'Official Handle', hd: '@MP_Official', st: 'pending', auth: 'OAuth 2.0', notes: 'Primary X account', stats: { fol: '280K', items: 2400, pend: 15, resp: 78, snt: .45 } }, { label: 'Hindi Handle', hd: '@MP_Hindi', st: 'connected', auth: 'OAuth 2.0', notes: 'Hindi content account', stats: { fol: '85K', items: 680, pend: 4, resp: 82, snt: .52 } }] },
  { id: 'telegram', nm: 'Telegram', hi: 'टेलीग्राम', ic: '✈️', c: '#0088CC', st: 'connected', hd: '@NétaBoardBot', api: 'Telegram Bot API', auth: 'Bot Token', can: { read: 1, reply: 1, del: 1, dm: 1, wh: 1 }, stats: { fol: '28K', items: 420, pend: 6, resp: 88, snt: .60 }, setup: ['Message @BotFather → /newbot', 'setWebhook → endpoint URL'], notes: 'Free. 30 msg/sec.',
    instances: [{ label: 'Broadcast Channel', hd: '@MP_Broadcast', st: 'connected', auth: 'Bot Token', notes: 'One-way announcements', stats: { fol: '28K', items: 420, pend: 6, resp: 88, snt: .60 } }, { label: 'Discussion Group', hd: '@MP_Discussion', st: 'connected', auth: 'Bot Token', notes: 'Two-way citizen chat', stats: { fol: '4.2K', items: 1800, pend: 12, resp: 75, snt: .48 } }] },
  { id: 'jan_setu', nm: 'Jan Setu Portal', hi: 'जन सेतु', ic: '🌐', c: '#7C3AED', st: 'connected', hd: 'jansetu.netaboard.in', api: 'Internal REST', auth: 'JWT', can: { read: 1, reply: 1, del: 1, dm: 1, wh: 1 }, stats: { fol: '15K', items: 2400, pend: 18, resp: 86, snt: .72 }, setup: ['Auto-integrated with NétaBoard', 'No rate limits'], notes: 'Full control. No limits.', instances: [] },
  { id: 'booth_reports', nm: 'Booth Workers', hi: 'बूथ कार्यकर्ता', ic: '🌱', c: '#22C55E', st: 'connected', hd: '1842 Booths', api: 'Internal REST', auth: 'JWT', can: { read: 1, reply: 1, del: 0, dm: 1, wh: 1 }, stats: { fol: '1842', items: 5600, pend: 42, resp: 72, snt: .58 }, setup: ['Linked via Party Cadre Network', 'GPS verified submissions'], notes: 'Ground intelligence. GPS verified.', instances: [] },
  { id: 'newspaper_ocr', nm: 'Print Media / OCR', hi: 'अखबार / OCR', ic: '📰', c: '#B45309', st: 'connected', hd: '12 Publications', api: 'Tesseract OCR + Claude Vision', auth: 'Internal', can: { read: 1, reply: 0, del: 1, dm: 0, wh: 0 }, stats: { fol: '12', items: 486, pend: 8, resp: 100, snt: .42 }, setup: ['Upload scan/photo of newspaper cutting', 'OCR: Tesseract 5 + Claude Vision (Hindi/English/Urdu)', 'Auto-extract: headline, body, source, date', 'NLP: sentiment, entity, pillar mapping'], notes: 'Supports Hindi/English/Urdu.', instances: [] },
  { id: 'audio_asr', nm: 'Audio / Radio ASR', hi: 'ऑडियो / रेडियो', ic: '🎙️', c: '#7C2D12', st: 'connected', hd: 'AIR + Local FM', api: 'Whisper ASR + Speaker ID', auth: 'Internal', can: { read: 1, reply: 0, del: 1, dm: 0, wh: 0 }, stats: { fol: '6', items: 218, pend: 4, resp: 100, snt: .38 }, setup: ['Upload MP3/WAV/OGG audio', 'ASR: Whisper Large-v3 (Hindi/English)', 'Speaker diarization', 'NLP: sentiment per speaker, pillar mapping'], notes: 'Hindi, English, Bhojpuri, Awadhi.', instances: [] },
  { id: 'video_asr', nm: 'Video Broadcast ASR', hi: 'वीडियो प्रसारण', ic: '📹', c: '#4C1D95', st: 'connected', hd: 'TV + Rally Footage', api: 'Whisper ASR + YOLO Vision', auth: 'Internal', can: { read: 1, reply: 0, del: 1, dm: 0, wh: 0 }, stats: { fol: '8', items: 142, pend: 3, resp: 100, snt: .52 }, setup: ['Upload MP4/MKV/AVI video', 'ASR: Whisper Large-v3', 'Vision: YOLO v8 for face + banner OCR', 'Crowd size estimation'], notes: 'Face detection + crowd estimation.', instances: [] },
];

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
