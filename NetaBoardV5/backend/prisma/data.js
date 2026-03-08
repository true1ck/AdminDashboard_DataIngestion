"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// ../src/data/index.ts
var index_exports = {};
__export(index_exports, {
  ALERTS: () => ALERTS,
  ARC: () => ARC,
  ARCH_DISPLAY: () => ARCH_DISPLAY,
  BO_MODULES: () => BO_MODULES,
  CHANNELS: () => CHANNELS,
  EMOT: () => EMOT,
  FB_SRC: () => FB_SRC,
  FEEDBACK: () => FEEDBACK,
  HERO_SLIDES: () => HERO_SLIDES,
  IASCL_COLORS: () => IASCL_COLORS,
  IASCL_ICONS: () => IASCL_ICONS,
  IASCL_STATES: () => IASCL_STATES,
  IASCL_TRANSITIONS: () => IASCL_TRANSITIONS,
  NOTIFS: () => NOTIFS,
  PILLARS: () => PILLARS,
  PILL_LABELS: () => PILL_LABELS,
  PL_C: () => PL_C,
  PP_MODULES: () => PP_MODULES,
  SEV_C: () => SEV_C,
  SLA_TIERS: () => SLA_TIERS,
  SOCIAL_FEED: () => SOCIAL_FEED,
  URG: () => URG,
  computeFIS: () => computeFIS,
  getNRI: () => getNRI
});
module.exports = __toCommonJS(index_exports);
var PILLARS = [
  { k: "es", l: "Electoral Strength", i: "\u{1F5F3}\uFE0F", w: 15, c: "#E63946", inv: 0 },
  { k: "lp", l: "Legislative Performance", i: "\u{1F3DB}", w: 12, c: "#059669", inv: 0 },
  { k: "cd", l: "Constituency Development", i: "\u{1F3D7}", w: 12, c: "#3B82F6", inv: 0 },
  { k: "pa", l: "Public Accessibility", i: "\u{1F91D}", w: 8, c: "#A855F7", inv: 0 },
  { k: "cc", l: "Communication", i: "\u{1F3A4}", w: 7, c: "#F59E0B", inv: 0 },
  { k: "ps", l: "Party Standing", i: "\u2B50", w: 7, c: "#D4AF37", inv: 0 },
  { k: "mc", l: "Media Coverage", i: "\u{1F4FA}", w: 6, c: "#4CC9F0", inv: 0 },
  { k: "di", l: "Digital Influence", i: "\u{1F4F1}", w: 6, c: "#EC4899", inv: 0 },
  { k: "fm", l: "Financial Muscle", i: "\u{1F4B0}", w: 5, c: "#10B981", inv: 0 },
  { k: "ai", l: "Alliance Intel", i: "\u{1F517}", w: 5, c: "#6366F1", inv: 0 },
  { k: "ce", l: "Caste Equation", i: "\u2696\uFE0F", w: 5, c: "#8B5CF6", inv: 0 },
  { k: "ac", l: "Anti-Incumbency", i: "\u{1F4C9}", w: 4, c: "#EF4444", inv: 1 },
  { k: "gn", l: "Grassroots Network", i: "\u{1F331}", w: 4, c: "#22C55E", inv: 0 },
  { k: "ic", l: "Ideology Consistency", i: "\u{1F9ED}", w: 2, c: "#F97316", inv: 0 },
  { k: "sc", l: "Scandal Index", i: "\u26A0\uFE0F", w: 2, c: "#DC2626", inv: 1 }
];
var ARC = {
  grassroots: {
    n: "Raj Pratap Singh",
    ic: "\u{1F3DB}",
    tg: "\u091C\u0928\u0938\u0947\u0935\u0915",
    pr: "#059669",
    cn: { const: "Gorakhpur", party: "BJP", state: "UP", type: "LS", eldt: "2029-04", booth: 1842 },
    dm: { es: 78, lp: 62, cd: 72, pa: 88, cc: 65, ps: 70, mc: 55, di: 45, fm: 60, ai: 68, ce: 75, ac: 22, gn: 92, ic: 80, sc: 15 },
    rv: [{ n: "Suresh Yadav", nri: 62, tr: -3 }, { n: "Meena Devi", nri: 58, tr: 2 }],
    san: { att: 78, ques: 24, pvt: 6, bill: 2 },
    kpi: { rallies: 48, padyatra: "2400km", sabha: 180, grievance: "82%" }
  },
  technocrat: {
    n: "Dr Vikram Reddy",
    ic: "\u{1F4BB}",
    tg: "\u0924\u0915\u0928\u0940\u0915\u0940 \u0928\u0947\u0924\u093E",
    pr: "#3B82F6",
    cn: { const: "Hyderabad", party: "BRS", state: "Telangana", type: "LS", eldt: "2029-04", booth: 2156 },
    dm: { es: 72, lp: 85, cd: 80, pa: 55, cc: 78, ps: 65, mc: 72, di: 82, fm: 75, ai: 62, ce: 55, ac: 18, gn: 48, ic: 85, sc: 10 },
    rv: [{ n: "Ravi Kumar", nri: 68, tr: 1 }, { n: "Sita Reddy", nri: 55, tr: -1 }],
    san: { att: 92, ques: 48, pvt: 12, bill: 5 },
    kpi: { it: 12, startups: 28 }
  },
  dynasty: {
    n: "Arjun Sharma III",
    ic: "\u{1F451}",
    tg: "\u0916\u093E\u0928\u0926\u093E\u0928\u0940 \u0928\u0947\u0924\u093E",
    pr: "#D4AF37",
    cn: { const: "Rae Bareli", party: "INC", state: "UP", type: "LS", eldt: "2029-04", booth: 1950 },
    dm: { es: 85, lp: 55, cd: 65, pa: 42, cc: 82, ps: 90, mc: 88, di: 72, fm: 95, ai: 85, ce: 60, ac: 35, gn: 55, ic: 45, sc: 30 },
    rv: [{ n: "Ram Kishor", nri: 52, tr: 2 }],
    san: { att: 55, ques: 8, pvt: 2, bill: 0 },
    kpi: { legacy: 45 }
  },
  firebrand: {
    n: "Aarti Kumari",
    ic: "\u{1F525}",
    tg: "\u0905\u0917\u094D\u0928\u093F\u0935\u0915\u094D\u0924\u093E",
    pr: "#E63946",
    cn: { const: "Begusarai", party: "CPI(ML)", state: "Bihar", type: "LS", eldt: "2029-04", booth: 1680 },
    dm: { es: 65, lp: 72, cd: 58, pa: 75, cc: 95, ps: 55, mc: 82, di: 88, fm: 35, ai: 42, ce: 80, ac: 12, gn: 72, ic: 92, sc: 40 },
    rv: [{ n: "Girish Thakur", nri: 60, tr: 1 }],
    san: { att: 85, ques: 42, pvt: 8, bill: 3 },
    kpi: { protests: 32 }
  },
  silent: {
    n: "K. Raghunathan",
    ic: "\u{1F9D8}",
    tg: "\u092E\u094C\u0928 \u0936\u0915\u094D\u0924\u093F",
    pr: "#6366F1",
    cn: { const: "Kanyakumari", party: "AIADMK", state: "TN", type: "LS", eldt: "2029-04", booth: 1540 },
    dm: { es: 72, lp: 90, cd: 88, pa: 65, cc: 35, ps: 75, mc: 30, di: 22, fm: 70, ai: 78, ce: 68, ac: 8, gn: 80, ic: 88, sc: 5 },
    rv: [{ n: "Sekar P", nri: 65, tr: 2 }],
    san: { att: 95, ques: 56, pvt: 18, bill: 8 },
    kpi: { projects: 24 }
  },
  satrap: {
    n: "Baldev Singh Chauhan",
    ic: "\u2694\uFE0F",
    tg: "\u0915\u094D\u0937\u0924\u094D\u0930\u092A",
    pr: "#F97316",
    cn: { const: "Jamnagar", party: "BJP", state: "Gujarat", type: "LS", eldt: "2029-04", booth: 1920 },
    dm: { es: 88, lp: 48, cd: 70, pa: 50, cc: 72, ps: 82, mc: 65, di: 55, fm: 90, ai: 92, ce: 82, ac: 28, gn: 85, ic: 55, sc: 35 },
    rv: [{ n: "Ahmed Jr", nri: 55, tr: -1 }],
    san: { att: 45, ques: 6, pvt: 1, bill: 0 },
    kpi: { panchayats: "78%" }
  },
  turncoat: {
    n: "Manoj Tiwari Redux",
    ic: "\u{1F504}",
    tg: "\u092C\u0939\u0941\u0926\u0932\u0940\u092F \u0905\u0928\u0941\u092D\u0935",
    pr: "#EC4899",
    cn: { const: "Patna Sahib", party: "RJD", state: "Bihar", type: "LS", eldt: "2029-04", booth: 1780 },
    dm: { es: 58, lp: 42, cd: 45, pa: 60, cc: 70, ps: 35, mc: 78, di: 65, fm: 55, ai: 45, ce: 62, ac: 42, gn: 40, ic: 15, sc: 55 },
    rv: [{ n: "Vikash Kumar", nri: 52, tr: 3 }],
    san: { att: 62, ques: 14, pvt: 3, bill: 1 },
    kpi: { switches: 3 }
  }
};
var FB_SRC = [
  { id: "jd", l: "Jan Darbar", i: "\u{1F3DB}", c: "#E63946", cred: 0.95 },
  { id: "sm", l: "Social Media", i: "\u{1F4F1}", c: "#A855F7", cred: 0.65 },
  { id: "mc", l: "Media", i: "\u{1F4FA}", c: "#4CC9F0", cred: 0.8 },
  { id: "pt", l: "Party Intel", i: "\u2B50", c: "#D4AF37", cred: 0.9 },
  { id: "bw", l: "Booth Workers", i: "\u{1F331}", c: "#22C55E", cred: 0.85 },
  { id: "gv", l: "Government", i: "\u{1F3D7}", c: "#3B82F6", cred: 0.92 },
  { id: "ec", l: "Election Commission", i: "\u{1F5F3}\uFE0F", c: "#F97316", cred: 0.98 },
  { id: "op", l: "Opposition", i: "\u2694\uFE0F", c: "#EF4444", cred: 0.55 },
  { id: "ci", l: "Civil Society", i: "\u{1F91D}", c: "#06B6D4", cred: 0.75 },
  { id: "js", l: "Jan Setu Portal", i: "\u{1F310}", c: "#8B5CF6", cred: 0.88 },
  { id: "ocr", l: "Print Media (OCR)", i: "\u{1F4F0}", c: "#B45309", cred: 0.85 },
  { id: "asr_a", l: "Audio/Radio (ASR)", i: "\u{1F399}\uFE0F", c: "#7C2D12", cred: 0.78 },
  { id: "asr_v", l: "Video Broadcast (ASR)", i: "\u{1F4F9}", c: "#4C1D95", cred: 0.82 }
];
var FEEDBACK = [
  { id: "fb1", text: "Road repair in Ward 14 excellent", src: "bw", snt: 0.85, em: "trust", pil: "cd", urg: "samanya", tm: "12m ago" },
  { id: "fb2", text: "Jan Darbar wait increased to 4 hours", src: "jd", snt: -0.72, em: "anger", pil: "pa", urg: "shighra", tm: "25m ago" },
  { id: "fb3", text: "Viral video of MP sleeping in Sansad", src: "sm", snt: -0.88, em: "disgust", pil: "lp", urg: "tatkal", tm: "1h ago" },
  { id: "fb4", text: "Strong ground support in housing colonies", src: "bw", snt: 0.78, em: "anticipation", pil: "gn", urg: "samanya", tm: "2h ago" },
  { id: "fb5", text: "EC notice: unaccounted rally expenditure", src: "ec", snt: -0.65, em: "fear", pil: "fm", urg: "tatkal", tm: "3h ago" },
  { id: "fb6", text: "Party high command praises development", src: "pt", snt: 0.92, em: "joy", pil: "ps", urg: "samanya", tm: "4h ago" },
  { id: "fb7", text: "Opposition releases doctored audio", src: "op", snt: -0.78, em: "anger", pil: "sc", urg: "tatkal", tm: "5h ago" },
  { id: "fb8", text: "Civil society endorses education initiative", src: "ci", snt: 0.82, em: "trust", pil: "cd", urg: "samanya", tm: "6h ago" },
  { id: "fb9", text: "Jan Setu flooded with water complaints", src: "js", snt: -0.6, em: "sadness", pil: "pa", urg: "shighra", tm: "8h ago" },
  { id: "fb10", text: "Media interview performance rated excellent", src: "mc", snt: 0.88, em: "trust", pil: "cc", urg: "samanya", tm: "10h ago" },
  { id: "fb11", text: "Cross-voting allegation in Rajya Sabha", src: "pt", snt: -0.82, em: "anger", pil: "ic", urg: "tatkal", tm: "12h ago" },
  { id: "fb12", text: "MPLADS funds utilization at 94%", src: "gv", snt: 0.9, em: "joy", pil: "cd", urg: "samanya", tm: "1d ago" }
];
var ALERTS = [
  { id: "a1", sv: "crisis", t: "Viral: MP Sleeping in Parliament", ds: "Video 2M+ views. Opposition amplifying.", ai_txt: "Release clip of active debate participation.", cf: 88, ic: "\u{1F4F9}", tm: "12m ago" },
  { id: "a2", sv: "high", t: "EC Notice: Expenditure Discrepancy", ds: "12L unaccounted in Diwali rally.", ai_txt: "File response with receipts in 48h.", cf: 82, ic: "\u{1F4CB}", tm: "2h ago" },
  { id: "a3", sv: "high", t: "Opposition Deepfake Audio", ds: "Doctored audio alleging corruption.", ai_txt: "File FIR + Satya Raksha verification.", cf: 90, ic: "\u{1F6E1}", tm: "3h ago" },
  { id: "a4", sv: "medium", t: "NRI Dropped 2.1 pts", ds: "Negative coverage of party infighting.", ai_txt: "Schedule 3 positive media interactions.", cf: 75, ic: "\u{1F4CA}", tm: "5h ago" },
  { id: "a5", sv: "medium", t: "Jan Darbar Surge: Water Supply", ds: "38 complaints in 72h about Ward 14.", ai_txt: "Coordinate with Jal Board immediately.", cf: 85, ic: "\u{1F6B0}", tm: "6h ago" },
  { id: "a6", sv: "low", t: "Positive Ground Shift in 12 Booths", ds: "Support up after road construction.", ai_txt: "Door-to-door campaign in adjacent wards.", cf: 72, ic: "\u{1F331}", tm: "8h ago" },
  { id: "a7", sv: "high", t: "Alliance Partner Demanding More Seats", ds: "Junior partner threatening walkout.", ai_txt: "Offer 2 additional MLC seats.", cf: 78, ic: "\u{1F91D}", tm: "4h ago" }
];
var SOCIAL_FEED = [
  { id: "sf1", pl: "youtube", au: "Voter", tx: "Road banvane ke liye dhanyavad!", tm: "10m", snt: 0.92, em: "joy", lk: 245, re: 0 },
  { id: "sf2", pl: "x", au: "@OppositionLeader", tx: "Where is your MP during floods?", tm: "25m", snt: -0.85, em: "anger", lk: 1200, re: 0 },
  { id: "sf3", pl: "facebook", au: "Ward 14 Resident", tx: "No water for 3 days.", tm: "45m", snt: -0.72, em: "anger", lk: 89, re: 0 },
  { id: "sf4", pl: "jan_setu", au: "Ramesh Kumar", tx: "Street light broken 2 months", tm: "1h", snt: -0.55, em: "sadness", lk: 0, re: 0 },
  { id: "sf5", pl: "whatsapp", au: "Booth President W7", tx: "200 new voter registrations", tm: "2h", snt: 0.88, em: "joy", lk: 0, re: 1 },
  { id: "sf6", pl: "instagram", au: "@youth_wing", tx: "Padyatra 12km amazing response!", tm: "3h", snt: 0.82, em: "anticipation", lk: 342, re: 0 },
  { id: "sf7", pl: "party_wa", au: "State Secretary", tx: "High command impressed.", tm: "4h", snt: 0.9, em: "trust", lk: 0, re: 0 },
  { id: "sf8", pl: "booth_reports", au: "Block Pramukh", tx: "Opposition distributing cash Ward 12", tm: "5h", snt: -0.75, em: "fear", lk: 0, re: 0 },
  { id: "sf9", pl: "telegram", au: "Media Coord", tx: "3 newspapers confirmed for inauguration", tm: "6h", snt: 0.78, em: "anticipation", lk: 0, re: 0 },
  { id: "sf10", pl: "newspaper_ocr", au: "Dainik Jagran", tx: "[OCR] MP leads demand for flyover; Rs 248Cr sanctioned", tm: "6h", snt: 0.72, em: "trust", lk: 0, re: 0 },
  { id: "sf11", pl: "audio_asr", au: "AIR Gorakhpur", tx: "[ASR] Radio interview: MP outlines 5-point healthcare plan", tm: "4h", snt: 0.65, em: "anticipation", lk: 0, re: 0 },
  { id: "sf12", pl: "video_asr", au: "Rally Footage", tx: "[ASR+Vision] Vikas Maidan rally. Crowd ~15K.", tm: "1d", snt: 0.82, em: "joy", lk: 0, re: 0 },
  { id: "sf13", pl: "audio_asr", au: "FM Radio City", tx: "[ASR] Caller complains about broken road Ward 8; RJ redirects to Jan Setu.", tm: "8h", snt: -0.48, em: "sadness", lk: 0, re: 0 },
  { id: "sf14", pl: "video_asr", au: "NDTV Debate", tx: "[ASR+Vision] Panel debate: MP defends development record. Body language 78%.", tm: "3h", snt: 0.55, em: "trust", lk: 0, re: 0 },
  { id: "sf15", pl: "newspaper_ocr", au: "Amar Ujala", tx: "[OCR] Opposition alleges misuse of MPLADS funds; MP terms it baseless vendetta.", tm: "5h", snt: -0.62, em: "anger", lk: 0, re: 0 },
  { id: "sf16", pl: "youtube", au: "Analyst", tx: "Best constituency development this decade", tm: "8h", snt: 0.88, em: "trust", lk: 1800, re: 0 }
];
var NOTIFS = [
  { id: "n1", sev: "crisis", tx: "Viral video 2M views in 3h", tm: "12m ago", read: false, mod: "alerts" },
  { id: "n2", sev: "high", tx: "EC notice: 48h deadline", tm: "2h ago", read: false, mod: "alerts" },
  { id: "n3", sev: "high", tx: "Alliance partner threatening walkout", tm: "4h ago", read: false, mod: "alerts" },
  { id: "n4", sev: "medium", tx: "NRI dropped 2.1pts", tm: "5h ago", read: false, mod: "pillars" },
  { id: "n5", sev: "low", tx: "12 booths positive shift", tm: "8h ago", read: true, mod: "overview" },
  { id: "n6", sev: "medium", tx: "38 water complaints this week", tm: "6h ago", read: false, mod: "pratikriya" }
];
var EMOT = {
  joy: { i: "\u{1F60A}", c: "#22C55E" },
  trust: { i: "\u{1F91D}", c: "#3B82F6" },
  fear: { i: "\u{1F628}", c: "#A855F7" },
  surprise: { i: "\u{1F632}", c: "#F59E0B" },
  sadness: { i: "\u{1F622}", c: "#6366F1" },
  anticipation: { i: "\u{1F52E}", c: "#06B6D4" },
  anger: { i: "\u{1F621}", c: "#EF4444" },
  disgust: { i: "\u{1F922}", c: "#DC2626" }
};
var URG = {
  tatkal: { l: "\u0924\u0924\u094D\u0915\u093E\u0932", c: "#EF4444", h: 4 },
  shighra: { l: "\u0936\u0940\u0918\u094D\u0930", c: "#F59E0B", h: 24 },
  samanya: { l: "\u0938\u093E\u092E\u093E\u0928\u094D\u092F", c: "#3B82F6", h: 168 }
};
var SEV_C = {
  crisis: "#E63946",
  high: "#F59E0B",
  medium: "#3B82F6",
  low: "#059669",
  info: "#6B5F8A"
};
var PL_C = {
  youtube: "#FF0000",
  facebook: "#1877F2",
  instagram: "#E4405F",
  x: "#1DA1F2",
  whatsapp: "#25D366",
  telegram: "#26A5E4",
  jan_setu: "#8B5CF6",
  party_wa: "#D4AF37",
  booth_reports: "#22C55E",
  newspaper_ocr: "#B45309",
  audio_asr: "#7C2D12",
  video_asr: "#4C1D95"
};
var PILL_LABELS = {
  dashboard: "\u{1F4CA} Dashboard",
  notifications: "\u{1F514} Notifications",
  deepdive: "\u{1F50D} Deep-Dive",
  feedback_overlay: "\u{1F4E1} Feedback Overlay",
  active: "\u26A1 Active",
  karma: "\u{1F4CB} Karma",
  ai_sug: "\u{1F916} AI",
  lifecycle: "\u{1F504} IASCL",
  dispatch: "\u{1F4E4} Dispatch",
  trends: "\u{1F4C8} Trends",
  sentiment: "\u{1F4CA} Sentiment",
  rivals: "\u2694\uFE0F Rivals",
  booths: "\u{1F5F3}\uFE0F Booths",
  heatmap: "\u{1F525} Heatmap",
  scorecard: "\u{1F4CA} Scorecard",
  attendance: "\u{1F4C5} Attendance",
  projects: "\u{1F3D7} Projects",
  mplads: "\u{1F4B0} MPLADS",
  grievances: "\u{1F4CB} Grievances",
  queue: "\u{1F465} Queue",
  caste_eq: "\u2696\uFE0F Caste",
  coalition: "\u{1F91D} Coalition",
  standing: "\u2B50 Standing",
  cadre: "\u{1F331} Cadre",
  inbox: "\u{1F4AC} Inbox",
  ytstudio: "\u25B6\uFE0F YT Studio",
  channels: "\u{1F517} Channels",
  overview: "\u{1F4CA} Overview",
  feed: "\u{1F4E1} Feed",
  sources: "\u{1F4CC} Sources",
  iascl: "\u26A1 IASCL",
  response: "\u{1F4AC} Response",
  funding: "\u{1F4B0} Funding",
  expenditure: "\u{1F4CB} Expenditure",
  crisis: "\u{1F6A8} Crisis",
  satya: "\u{1F6E1} Satya Raksha",
  alliance_map: "\u{1F5FA} Alliance",
  seats: "\u{1F4BA} Seats",
  calendar: "\u{1F4C5} Calendar",
  content_cal: "\u{1F4DD} Content",
  whatif: "\u{1F52E} What-If",
  profile: "\u{1F464} Profile",
  ai_usage: "\u{1F916} AI Usage",
  export: "\u{1F4E4} Export"
};
var BO_MODULES = [
  { sec: "INTELLIGENCE" },
  { k: "overview", ic: "\u{1F3AF}", l: "Command Centre", pills: ["dashboard", "notifications"] },
  { k: "pillars", ic: "\u{1F4CA}", l: "15 Pillars", pills: ["deepdive", "feedback_overlay"] },
  { k: "alerts", ic: "\u26A1", l: "Alerts & AI", pills: ["active", "karma", "ai_sug", "lifecycle", "dispatch"] },
  { k: "analytics", ic: "\u{1F4C8}", l: "Analytics", pills: ["trends", "sentiment", "rivals"] },
  { sec: "POLITICAL" },
  { k: "chunav", ic: "\u{1F5F3}\uFE0F", l: "Chunav Yantra", pills: ["booths", "heatmap"] },
  { k: "sansad", ic: "\u{1F3DB}", l: "Sansad Meter", pills: ["scorecard", "attendance"] },
  { k: "vikas", ic: "\u{1F3D7}", l: "Vikas Patra", pills: ["projects", "mplads"] },
  { k: "jandarbar", ic: "\u{1F465}", l: "Jan Darbar", pills: ["grievances", "queue"] },
  { k: "samikaran", ic: "\u2696\uFE0F", l: "Samikaran", pills: ["caste_eq", "coalition"] },
  { k: "dal", ic: "\u2B50", l: "Dal Sthiti", pills: ["standing", "cadre"] },
  { sec: "ENGAGEMENT" },
  { k: "social", ic: "\u{1F4AC}", l: "Social Command", pills: ["inbox", "ytstudio", "channels"] },
  { k: "pratikriya", ic: "\u{1F4E1}", l: "Pratikriya FMS", pills: ["overview", "feed", "sources", "iascl", "response"] },
  { sec: "OPERATIONS" },
  { k: "arthbal", ic: "\u{1F4B0}", l: "Arth Bal", pills: ["funding", "expenditure"] },
  { k: "shield", ic: "\u{1F6E1}", l: "Vivad Kavach", pills: ["crisis", "satya"] },
  { k: "gathbandhan", ic: "\u{1F91D}", l: "Gathbandhan", pills: ["alliance_map", "seats"] },
  { k: "planning", ic: "\u{1F4C5}", l: "Planning Hub", pills: ["calendar", "content_cal", "whatif"] },
  { k: "settings", ic: "\u2699", l: "Settings", pills: ["profile", "ai_usage", "export"] }
];
var PP_MODULES = [
  { k: "pp_parichay", ic: "\u{1F3DB}", l: "Parichay", pills: [] },
  { k: "pp_shikayat", ic: "\u{1F4CB}", l: "Shikayat Kendra", pills: [] },
  { k: "pp_vani", ic: "\u{1F3AC}", l: "Vani Kendra", pills: [] },
  { k: "pp_vikas", ic: "\u{1F3D7}", l: "Vikas Darshak", pills: [] },
  { k: "pp_awaaz", ic: "\u{1F4E2}", l: "Jan Awaaz", pills: [] },
  { k: "pp_aavedhan", ic: "\u{1F4DD}", l: "Jan Aavedhan", pills: [] },
  { k: "pp_edarbar", ic: "\u{1F3DB}", l: "E-Jan Darbar", pills: [] },
  { k: "pp_sahyogi", ic: "\u{1F91D}", l: "Sahyogi Dwaar", pills: [] },
  { k: "pp_karyakram", ic: "\u{1F4C5}", l: "Karyakram", pills: [] },
  { k: "pp_samvad", ic: "\u{1F4AC}", l: "Samvad Manch", pills: [] },
  { k: "pp_apatkal", ic: "\u{1F198}", l: "Apatkal Setu", pills: [] }
];
var IASCL_STATES = [
  "draft",
  "dispatched",
  "acknowledged",
  "in_progress",
  "submitted",
  "under_review",
  "accepted",
  "rejected",
  "revision_requested",
  "closed",
  "cancelled"
];
var IASCL_TRANSITIONS = {
  draft: ["dispatched"],
  dispatched: ["acknowledged", "cancelled"],
  acknowledged: ["in_progress", "cancelled"],
  in_progress: ["submitted", "cancelled"],
  submitted: ["under_review"],
  under_review: ["accepted", "rejected", "revision_requested"],
  rejected: ["in_progress"],
  revision_requested: ["in_progress"],
  accepted: ["closed"],
  closed: [],
  cancelled: []
};
var IASCL_COLORS = {
  draft: "#94A3B8",
  dispatched: "#A78BFA",
  acknowledged: "#38BDF8",
  in_progress: "#FBBF24",
  submitted: "#F97316",
  under_review: "#E879F9",
  accepted: "#34D399",
  rejected: "#FB7185",
  revision_requested: "#FB923C",
  closed: "#10B981",
  cancelled: "#9CA3AF"
};
var IASCL_ICONS = {
  draft: "\u{1F4DD}",
  dispatched: "\u{1F4E4}",
  acknowledged: "\u{1F441}",
  in_progress: "\u2699\uFE0F",
  submitted: "\u{1F4EC}",
  under_review: "\u{1F50D}",
  accepted: "\u2705",
  rejected: "\u274C",
  revision_requested: "\u270F\uFE0F",
  closed: "\u{1F3C1}",
  cancelled: "\u{1F6AB}"
};
var SLA_TIERS = {
  tatkal: { label: "Tatkal", hi: "\u0924\u0924\u094D\u0915\u093E\u0932", hours: 4, ack_hours: 0.5, color: "#EF4444", examples: "Viral scandal, deepfake, EC notice" },
  atyavashy: { label: "Atyavashy", hi: "\u0905\u0924\u094D\u092F\u093E\u0935\u0936\u094D\u092F", hours: 24, ack_hours: 2, color: "#F97316", examples: "Negative media cycle, opposition attack" },
  samayik: { label: "Samayik", hi: "\u0938\u093E\u092E\u092F\u093F\u0915", hours: 168, ack_hours: 24, color: "#FBBF24", examples: "Event prep, Jan Darbar backlog" },
  niyamit: { label: "Niyamit", hi: "\u0928\u093F\u092F\u092E\u093F\u0924", hours: 720, ack_hours: 72, color: "#3B82F6", examples: "Monthly NRI review, cadre audit" }
};
function getNRI(a) {
  let s = 0, w = 0;
  PILLARS.forEach((p) => {
    const v = a.dm[p.k] || 50;
    s += (p.inv ? 100 - v : v) * p.w;
    w += p.w;
  });
  return w > 0 ? s / w : 50;
}
function computeFIS(items) {
  if (!items?.length) return { score: 50, vol: 0, snt: 50, div: 0, cred: 0 };
  const vol = Math.min(100, items.length * 8);
  const snt = Math.round(50 + items.reduce((s, f) => s + f.snt, 0) / items.length * 50);
  const srcs = new Set(items.map((f) => f.src));
  const div = Math.min(100, srcs.size * 15);
  const cred = Math.round(items.reduce((s, f) => {
    const src = FB_SRC.find((x) => x.id === f.src);
    return s + (src ? src.cred : 0.5);
  }, 0) / items.length * 100);
  return { score: Math.round(vol * 0.2 + snt * 0.25 + div * 0.15 + cred * 0.2 + 20), vol, snt, div, cred };
}
var ARCH_DISPLAY = {
  grassroots: "Grassroots",
  technocrat: "Technocrat",
  dynasty: "Political Family",
  firebrand: "Firebrand",
  silent: "Silent",
  satrap: "Satrap",
  turncoat: "Multi-Party Exp."
};
var CHANNELS = [
  {
    id: "youtube",
    nm: "YouTube",
    hi: "\u092F\u0942\u091F\u094D\u092F\u0942\u092C",
    ic: "\u25B6\uFE0F",
    c: "#FF0000",
    st: "connected",
    hd: "@MP_Official",
    api: "YouTube Data API v3",
    auth: "OAuth 2.0",
    can: { read: 1, reply: 1, del: 1, dm: 0, wh: 0 },
    stats: { fol: "180K", items: 14200, pend: 38, resp: 94, snt: 0.62 },
    setup: ["Google Cloud Console \u2192 Enable YouTube Data API v3", "Create OAuth 2.0 credentials", "Polling: 15 min", "Quota: 10,000 units/day"],
    notes: "No webhook. Polling only.",
    instances: [{ label: "Main Channel", hd: "@MP_Official", st: "connected", auth: "OAuth 2.0", notes: "Primary official channel", stats: { fol: "180K", items: 14200, pend: 38, resp: 94, snt: 0.62 } }, { label: "Campaign Channel", hd: "@MP_Campaign2029", st: "connected", auth: "OAuth 2.0", notes: "Election campaign content", stats: { fol: "45K", items: 320, pend: 5, resp: 88, snt: 0.72 } }, { label: "Regional (Bhojpuri)", hd: "@MP_Bhojpuri", st: "pending", auth: "OAuth 2.0", notes: "Regional language outreach", stats: { fol: "12K", items: 48, pend: 2, resp: 80, snt: 0.55 } }]
  },
  {
    id: "facebook",
    nm: "Facebook",
    hi: "\u092B\u0947\u0938\u092C\u0941\u0915",
    ic: "\u{1F4D8}",
    c: "#1877F2",
    st: "connected",
    hd: "Official Page",
    api: "Meta Graph API v22",
    auth: "OAuth 2.0",
    can: { read: 1, reply: 1, del: 1, dm: 1, wh: 1 },
    stats: { fol: "450K", items: 4800, pend: 12, resp: 89, snt: 0.55 },
    setup: ["Meta for Developers \u2192 Create App", "Request pages_read_engagement", "App Review (1\u20135 days)"],
    notes: "Full capability. Webhook real-time.",
    instances: [{ label: "Official Page", hd: "Official MP Page", st: "connected", auth: "OAuth 2.0", notes: "Primary Facebook page", stats: { fol: "450K", items: 4800, pend: 12, resp: 89, snt: 0.55 } }, { label: "Constituency Page", hd: "MP Gorakhpur Page", st: "connected", auth: "OAuth 2.0", notes: "Constituency-specific content", stats: { fol: "120K", items: 1200, pend: 6, resp: 85, snt: 0.62 } }]
  },
  {
    id: "instagram",
    nm: "Instagram",
    hi: "\u0907\u0902\u0938\u094D\u091F\u093E\u0917\u094D\u0930\u093E\u092E",
    ic: "\u{1F4F8}",
    c: "#E4405F",
    st: "connected",
    hd: "@mp_official",
    api: "Instagram Graph API",
    auth: "OAuth 2.0",
    can: { read: 1, reply: 1, del: 1, dm: 1, wh: 1 },
    stats: { fol: "320K", items: 3200, pend: 8, resp: 92, snt: 0.68 },
    setup: ["Switch to Business/Creator account", "Link to Facebook Page"],
    notes: "24hr messaging window.",
    instances: [{ label: "Official Account", hd: "@mp_official", st: "connected", auth: "OAuth 2.0", notes: "Primary Instagram", stats: { fol: "320K", items: 3200, pend: 8, resp: 92, snt: 0.68 } }, { label: "Behind the Scenes", hd: "@mp_bts", st: "connected", auth: "OAuth 2.0", notes: "Personal/BTS content", stats: { fol: "78K", items: 480, pend: 2, resp: 90, snt: 0.75 } }]
  },
  {
    id: "whatsapp",
    nm: "WhatsApp",
    hi: "\u0935\u094D\u0939\u093E\u091F\u094D\u0938\u0910\u092A",
    ic: "\u{1F4F1}",
    c: "#25D366",
    st: "connected",
    hd: "+91 Groups",
    api: "WA Business Cloud API",
    auth: "System Token",
    can: { read: 1, reply: 1, del: 0, dm: 1, wh: 1 },
    stats: { fol: "45 Grp", items: 860, pend: 24, resp: 96, snt: 0.78 },
    setup: ["Meta Business Account \u2192 Add WhatsApp", "Register Phone \u2192 Get ID", "1000 free convos/month"],
    notes: "Highest-signal for India.",
    instances: [{ label: "Constituency Helpline", hd: "+91 98XXX 00001", st: "connected", auth: "System Token", notes: "Public helpline number", stats: { fol: "15K", items: 860, pend: 24, resp: 96, snt: 0.78 } }, { label: "Party Core Group", hd: "+91 98XXX 00002", st: "connected", auth: "System Token", notes: "Internal party coordination", stats: { fol: "250", items: 420, pend: 8, resp: 92, snt: 0.65 } }, { label: "Booth Presidents", hd: "+91 98XXX 00003", st: "connected", auth: "System Token", notes: "1842 booth-level workers", stats: { fol: "1842", items: 5600, pend: 42, resp: 72, snt: 0.58 } }, { label: "Youth Wing", hd: "+91 98XXX 00004", st: "pending", auth: "System Token", notes: "Youth wing coordination", stats: { fol: "380", items: 120, pend: 6, resp: 70, snt: 0.6 } }]
  },
  {
    id: "x",
    nm: "X / Twitter",
    hi: "\u090F\u0915\u094D\u0938",
    ic: "\u{1D54F}",
    c: "#1DA1F2",
    st: "pending",
    hd: "@handle",
    api: "X API v2",
    auth: "OAuth 2.0",
    can: { read: 1, reply: 1, del: 1, dm: 1, wh: 0 },
    stats: { fol: "280K", items: 2400, pend: 15, resp: 78, snt: 0.45 },
    setup: ["X Developer Portal \u2192 Create Project", "Subscribe Pro tier", "Polling: 15min"],
    notes: "\u26A0 Pro tier $5K/mo.",
    instances: [{ label: "Official Handle", hd: "@MP_Official", st: "pending", auth: "OAuth 2.0", notes: "Primary X account", stats: { fol: "280K", items: 2400, pend: 15, resp: 78, snt: 0.45 } }, { label: "Hindi Handle", hd: "@MP_Hindi", st: "connected", auth: "OAuth 2.0", notes: "Hindi content account", stats: { fol: "85K", items: 680, pend: 4, resp: 82, snt: 0.52 } }]
  },
  {
    id: "telegram",
    nm: "Telegram",
    hi: "\u091F\u0947\u0932\u0940\u0917\u094D\u0930\u093E\u092E",
    ic: "\u2708\uFE0F",
    c: "#0088CC",
    st: "connected",
    hd: "@N\xE9taBoardBot",
    api: "Telegram Bot API",
    auth: "Bot Token",
    can: { read: 1, reply: 1, del: 1, dm: 1, wh: 1 },
    stats: { fol: "28K", items: 420, pend: 6, resp: 88, snt: 0.6 },
    setup: ["Message @BotFather \u2192 /newbot", "setWebhook \u2192 endpoint URL"],
    notes: "Free. 30 msg/sec.",
    instances: [{ label: "Broadcast Channel", hd: "@MP_Broadcast", st: "connected", auth: "Bot Token", notes: "One-way announcements", stats: { fol: "28K", items: 420, pend: 6, resp: 88, snt: 0.6 } }, { label: "Discussion Group", hd: "@MP_Discussion", st: "connected", auth: "Bot Token", notes: "Two-way citizen chat", stats: { fol: "4.2K", items: 1800, pend: 12, resp: 75, snt: 0.48 } }]
  },
  { id: "jan_setu", nm: "Jan Setu Portal", hi: "\u091C\u0928 \u0938\u0947\u0924\u0941", ic: "\u{1F310}", c: "#7C3AED", st: "connected", hd: "jansetu.netaboard.in", api: "Internal REST", auth: "JWT", can: { read: 1, reply: 1, del: 1, dm: 1, wh: 1 }, stats: { fol: "15K", items: 2400, pend: 18, resp: 86, snt: 0.72 }, setup: ["Auto-integrated with N\xE9taBoard", "No rate limits"], notes: "Full control. No limits.", instances: [] },
  { id: "booth_reports", nm: "Booth Workers", hi: "\u092C\u0942\u0925 \u0915\u093E\u0930\u094D\u092F\u0915\u0930\u094D\u0924\u093E", ic: "\u{1F331}", c: "#22C55E", st: "connected", hd: "1842 Booths", api: "Internal REST", auth: "JWT", can: { read: 1, reply: 1, del: 0, dm: 1, wh: 1 }, stats: { fol: "1842", items: 5600, pend: 42, resp: 72, snt: 0.58 }, setup: ["Linked via Party Cadre Network", "GPS verified submissions"], notes: "Ground intelligence. GPS verified.", instances: [] },
  { id: "newspaper_ocr", nm: "Print Media / OCR", hi: "\u0905\u0916\u092C\u093E\u0930 / OCR", ic: "\u{1F4F0}", c: "#B45309", st: "connected", hd: "12 Publications", api: "Tesseract OCR + Claude Vision", auth: "Internal", can: { read: 1, reply: 0, del: 1, dm: 0, wh: 0 }, stats: { fol: "12", items: 486, pend: 8, resp: 100, snt: 0.42 }, setup: ["Upload scan/photo of newspaper cutting", "OCR: Tesseract 5 + Claude Vision (Hindi/English/Urdu)", "Auto-extract: headline, body, source, date", "NLP: sentiment, entity, pillar mapping"], notes: "Supports Hindi/English/Urdu.", instances: [] },
  { id: "audio_asr", nm: "Audio / Radio ASR", hi: "\u0911\u0921\u093F\u092F\u094B / \u0930\u0947\u0921\u093F\u092F\u094B", ic: "\u{1F399}\uFE0F", c: "#7C2D12", st: "connected", hd: "AIR + Local FM", api: "Whisper ASR + Speaker ID", auth: "Internal", can: { read: 1, reply: 0, del: 1, dm: 0, wh: 0 }, stats: { fol: "6", items: 218, pend: 4, resp: 100, snt: 0.38 }, setup: ["Upload MP3/WAV/OGG audio", "ASR: Whisper Large-v3 (Hindi/English)", "Speaker diarization", "NLP: sentiment per speaker, pillar mapping"], notes: "Hindi, English, Bhojpuri, Awadhi.", instances: [] },
  { id: "video_asr", nm: "Video Broadcast ASR", hi: "\u0935\u0940\u0921\u093F\u092F\u094B \u092A\u094D\u0930\u0938\u093E\u0930\u0923", ic: "\u{1F4F9}", c: "#4C1D95", st: "connected", hd: "TV + Rally Footage", api: "Whisper ASR + YOLO Vision", auth: "Internal", can: { read: 1, reply: 0, del: 1, dm: 0, wh: 0 }, stats: { fol: "8", items: 142, pend: 3, resp: 100, snt: 0.52 }, setup: ["Upload MP4/MKV/AVI video", "ASR: Whisper Large-v3", "Vision: YOLO v8 for face + banner OCR", "Crowd size estimation"], notes: "Face detection + crowd estimation.", instances: [] }
];
var HERO_SLIDES = [
  "https://images.unsplash.com/photo-1532375810709-75b1da00537c?w=400&h=500&fit=crop",
  "https://images.unsplash.com/photo-1524492412937-b28074a5d7da?w=400&h=500&fit=crop",
  "https://images.unsplash.com/photo-1506461883276-594a12b11cf3?w=400&h=500&fit=crop",
  "https://images.unsplash.com/photo-1587474260584-136574528ed5?w=400&h=500&fit=crop",
  "https://images.unsplash.com/photo-1548013146-72479768bada?w=400&h=500&fit=crop",
  "https://images.unsplash.com/photo-1564507592333-c60657eea523?w=400&h=500&fit=crop",
  "https://images.unsplash.com/photo-1514222134-b57cbb8ce073?w=400&h=500&fit=crop",
  "https://images.unsplash.com/photo-1570168007204-dfb528c6958f?w=400&h=500&fit=crop",
  "https://images.unsplash.com/photo-1585135497273-1a86b09fe70e?w=400&h=500&fit=crop",
  "https://images.unsplash.com/photo-1609766418204-94aae0e3d9e5?w=400&h=500&fit=crop"
];
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  ALERTS,
  ARC,
  ARCH_DISPLAY,
  BO_MODULES,
  CHANNELS,
  EMOT,
  FB_SRC,
  FEEDBACK,
  HERO_SLIDES,
  IASCL_COLORS,
  IASCL_ICONS,
  IASCL_STATES,
  IASCL_TRANSITIONS,
  NOTIFS,
  PILLARS,
  PILL_LABELS,
  PL_C,
  PP_MODULES,
  SEV_C,
  SLA_TIERS,
  SOCIAL_FEED,
  URG,
  computeFIS,
  getNRI
});
