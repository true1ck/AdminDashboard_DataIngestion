// ═══ NétaBoard V5.0 Sarvashakti — Type Definitions ═══

export type AppMode = 'bo' | 'pp';

export type BOModule =
  | 'overview' | 'pillars' | 'alerts' | 'analytics'
  | 'chunav' | 'sansad' | 'vikas' | 'jandarbar' | 'samikaran' | 'dal'
  | 'social' | 'pratikriya' | 'ingest' | 'vault'
  | 'arthbal' | 'shield' | 'gathbandhan' | 'planning' | 'settings'
  | 'pipeline';

export type PPModule =
  | 'pp_parichay' | 'pp_shikayat' | 'pp_vani' | 'pp_vikas'
  | 'pp_awaaz' | 'pp_aavedhan' | 'pp_edarbar' | 'pp_sahyogi'
  | 'pp_karyakram' | 'pp_samvad' | 'pp_apatkal';

export type ModuleId = BOModule | PPModule;

export type Pill = string;

export type ArchetypeKey = 'grassroots' | 'technocrat' | 'dynasty' | 'firebrand' | 'silent' | 'satrap' | 'turncoat';

export type AlertSeverity = 'crisis' | 'high' | 'medium' | 'low' | 'info';
export type Urgency = 'tatkal' | 'shighra' | 'samanya';
export type EmotionKey = 'joy' | 'trust' | 'fear' | 'surprise' | 'sadness' | 'anticipation' | 'anger' | 'disgust';

export type IASCLState =
  | 'draft' | 'dispatched' | 'acknowledged' | 'in_progress'
  | 'submitted' | 'under_review' | 'accepted' | 'rejected'
  | 'revision_requested' | 'closed' | 'cancelled';

export type SLATier = 'tatkal' | 'atyavashy' | 'samayik' | 'niyamit';

export interface Pillar {
  k: string;
  l: string;
  i: string;
  w: number;
  c: string;
  inv: number;
}

export interface Constituency {
  const: string;
  party: string;
  state: string;
  type: string;
  eldt: string;
  booth: number;
}

export interface SansadRecord {
  att: number;
  ques: number;
  pvt: number;
  bill: number;
}

export interface Rival {
  n: string;
  nri: number;
  tr: number;
}

export interface PillarScores {
  [key: string]: number;
}

export interface Archetype {
  n: string;
  ic: string;
  tg: string;
  pr: string;
  cn: Constituency;
  dm: PillarScores;
  rv: Rival[];
  san: SansadRecord;
  kpi: Record<string, number | string>;
}

export interface Alert {
  id: string;
  sv: AlertSeverity;
  t: string;
  ds: string;
  ai_txt: string;
  cf: number;
  ic: string;
  tm: string;
}

export interface FeedbackSource {
  id: string;
  l: string;
  i: string;
  c: string;
  cred: number;
}

export interface FeedbackItem {
  id: string;
  text: string;
  src: string;
  snt: number;
  em: EmotionKey;
  pil: string;
  urg: Urgency;
  tm: string;
}

export interface SocialItem {
  id: string;
  pl: string;
  au: string;
  tx: string;
  tm: string;
  snt: number;
  em: EmotionKey;
  lk: number;
  re: number;
}

export interface Notification {
  id: string;
  sev: AlertSeverity;
  tx: string;
  tm: string;
  read: boolean;
  mod: string;
}

export interface Emotion {
  i: string;
  c: string;
}

export interface UrgencyDef {
  l: string;
  c: string;
  h: number;
}

export interface ModuleItem {
  sec?: string;
  k?: ModuleId;
  ic?: string;
  l?: string;
  pills?: Pill[];
}

export interface FISScore {
  score: number;
  vol: number;
  snt: number;
  div: number;
  cred: number;
}

export interface Channel {
  id: string;
  nm: string;
  hi: string;
  ic: string;
  c: string;
  st: 'connected' | 'pending' | 'disconnected' | string;
  hd: string;
  api: string;
  auth: string;
  can: { read: number; reply: number; del: number; dm: number; wh: number };
  stats: { fol: string; items: number; pend: number; resp: number; snt?: number };
  setup?: number | string[];
  notes?: string;
  instances?: any[];
}

export interface Project {
  id: string;
  t: string;
  dept: string;
  cost: string;
  prog: number;
  st: string;
  dt: string;
  cat: string;
  ic: string;
  ward: string;
  sanc: number;
  rel: number;
  util: number;
  rate: number;
  milestones: { m: string; d: string; done: boolean }[];
}

export interface SLADef {
  label: string;
  hi: string;
  hours: number;
  ack_hours: number;
  color: string;
  examples: string;
}

export interface IASCLAction {
  id: string;
  uid: string;
  alert_id: string;
  action_text: string;
  status: IASCLState;
  priority: SLATier | null;
  assignee: string | null;
  criteria: { id: string; text: string; is_mandatory: boolean; is_met: boolean }[];
  criteria_count: number;
  criteria_met_count: number;
  completion_pct: number;
  transitions: { from: string | null; to: string; ts: string }[];
  created_at: string;
}
