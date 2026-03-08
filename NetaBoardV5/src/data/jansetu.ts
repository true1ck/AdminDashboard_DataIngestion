// ═══ NétaBoard V5.0 — Jan Setu Portal Data + Extended Social Data ═══

// ─── Shikayat (Grievance) Data ───
export const SHK = [
  { id: 'SHK-2026-1247', cat: 'Water Supply', desc: 'No water supply in Ward 12 for 3 days', ward: 'Ward 12', by: 'Ramesh Kumar', dt: '2h ago', urg: 'urgent', st: 'In Progress', dept: 'Jal Vibhag', snt: -.7 },
  { id: 'SHK-2026-1246', cat: 'Road/Pothole', desc: 'Large pothole on MG Road causing accidents', ward: 'Ward 8', by: 'Sunita Devi', dt: '5h ago', urg: 'urgent', st: 'Assigned', dept: 'PWD', snt: -.6 },
  { id: 'SHK-2026-1245', cat: 'Electricity', desc: 'Street lights not working in Mohalla 3', ward: 'Ward 15', by: 'Anonymous', dt: '8h ago', urg: 'routine', st: 'Filed', dept: 'Bijli Vibhag', snt: -.4 },
  { id: 'SHK-2026-1244', cat: 'Sanitation', desc: 'Garbage not collected for 1 week near temple', ward: 'Ward 5', by: 'Prakash Ji', dt: '1d ago', urg: 'urgent', st: 'Resolved', dept: 'Nagar Nigam', snt: -.5 },
  { id: 'SHK-2026-1243', cat: 'Healthcare', desc: 'PHC doctor absent for 5 days', ward: 'Ward 20', by: 'Meera Bai', dt: '1d ago', urg: 'emergency', st: 'Escalated', dept: 'Swasthya Vibhag', snt: -.8 },
  { id: 'SHK-2026-1242', cat: 'Education', desc: 'School roof leaking, children at risk', ward: 'Ward 3', by: 'Rajendra Singh', dt: '2d ago', urg: 'urgent', st: 'In Progress', dept: 'Shiksha Vibhag', snt: -.65 },
  { id: 'SHK-2026-1241', cat: 'Pension', desc: 'Widow pension not received for 3 months', ward: 'Ward 11', by: 'Kamla Devi', dt: '2d ago', urg: 'routine', st: 'Filed', dept: 'Samaj Kalyan', snt: -.55 },
  { id: 'SHK-2026-1240', cat: 'Corruption', desc: 'Ration dealer demanding bribe for BPL card', ward: 'Ward 7', by: 'Anonymous', dt: '3d ago', urg: 'emergency', st: 'Escalated', dept: 'Khadya Vibhag', snt: -.9 },
];

export const SHK_STATS = { filed: 812, resolved: 614, pending: 198, rate: 76, avgDays: 4.2 };

export const SHK_CATEGORIES = [
  { c: 'Water Supply', n: 142, r: 108, ic: '💧', hi: 'जल आपूर्ति' },
  { c: 'Road/Pothole', n: 128, r: 96, ic: '🛣', hi: 'सड़क/गड्ढा' },
  { c: 'Electricity', n: 104, r: 82, ic: '⚡', hi: 'बिजली' },
  { c: 'Sanitation', n: 96, r: 78, ic: '🗑', hi: 'स्वच्छता' },
  { c: 'Healthcare', n: 88, r: 62, ic: '🏥', hi: 'स्वास्थ्य' },
  { c: 'Education', n: 72, r: 58, ic: '📚', hi: 'शिक्षा' },
  { c: 'Pension/Welfare', n: 68, r: 52, ic: '💰', hi: 'पेंशन' },
  { c: 'Corruption', n: 45, r: 28, ic: '⚠', hi: 'भ्रष्टाचार' },
  { c: 'Land/Property', n: 38, r: 32, ic: '🏠', hi: 'भूमि/संपत्ति' },
  { c: 'Other', n: 31, r: 18, ic: '📌', hi: 'अन्य' },
];

// ─── Vikas Darshak (Development Projects) ───
export const PROJ = [
  { id: 'VK-001', t: '4-Lane Highway (NH-24 Bypass)', dept: 'NHAI/MoRTH', cost: 'Rs 248 Cr', prog: 72, st: 'On Track', dt: 'Dec 2026', cat: 'Roads', ic: '🛣', ward: 'All', sanc: 248, rel: 180, util: 165, rate: 4.2, milestones: [{ m: 'Survey', d: 'Jan 2025', done: true }, { m: 'Land Acq.', d: 'Jun 2025', done: true }, { m: 'Foundation', d: 'Oct 2025', done: true }, { m: 'Paving', d: 'Jun 2026', done: false }, { m: 'Completion', d: 'Dec 2026', done: false }] },
  { id: 'VK-002', t: 'District Hospital Upgrade (200 beds)', dept: 'Health Ministry', cost: 'Rs 85 Cr', prog: 45, st: 'Delayed', dt: 'Mar 2027', cat: 'Healthcare', ic: '🏥', ward: 'Ward 5', sanc: 85, rel: 42, util: 38, rate: 3.8, milestones: [{ m: 'DPR Approved', d: 'Mar 2025', done: true }, { m: 'Contractor', d: 'Jun 2025', done: true }, { m: 'Foundation', d: 'Sep 2025', done: true }, { m: 'Structure', d: 'Mar 2026', done: false }, { m: 'Equip & Open', d: 'Mar 2027', done: false }] },
  { id: 'VK-003', t: 'Smart City Water Pipeline', dept: 'Jal Shakti', cost: 'Rs 120 Cr', prog: 88, st: 'Ahead', dt: 'Sep 2026', cat: 'Water', ic: '💧', ward: 'Ward 1-10', sanc: 120, rel: 110, util: 105, rate: 4.5, milestones: [{ m: 'Survey', d: 'Jan 2025', done: true }, { m: 'Tender', d: 'Apr 2025', done: true }, { m: 'Pipeline', d: 'Dec 2025', done: true }, { m: 'Testing', d: 'Jun 2026', done: true }, { m: 'Commission', d: 'Sep 2026', done: false }] },
  { id: 'VK-004', t: 'ITI Skill Center (500 seats)', dept: 'MSDE', cost: 'Rs 32 Cr', prog: 95, st: 'Near Complete', dt: 'Apr 2026', cat: 'Education', ic: '🏫', ward: 'Ward 14', sanc: 32, rel: 31, util: 30.5, rate: 4.7, milestones: [{ m: 'Land Allot.', d: 'Nov 2024', done: true }, { m: 'Construction', d: 'May 2025', done: true }, { m: 'Equipment', d: 'Nov 2025', done: true }, { m: 'Staff Recruit', d: 'Feb 2026', done: true }, { m: 'Inauguration', d: 'Apr 2026', done: false }] },
  { id: 'VK-005', t: 'Sewage Treatment Plant', dept: 'Namami Gange', cost: 'Rs 65 Cr', prog: 35, st: 'Delayed', dt: 'Jun 2027', cat: 'Sanitation', ic: '🏭', ward: 'Ward 18', sanc: 65, rel: 25, util: 22, rate: 3.2, milestones: [{ m: 'DPR', d: 'Jun 2025', done: true }, { m: 'Tender', d: 'Sep 2025', done: true }, { m: 'Excavation', d: 'Feb 2026', done: false }, { m: 'Construction', d: 'Dec 2026', done: false }, { m: 'Commission', d: 'Jun 2027', done: false }] },
  { id: 'VK-006', t: 'Solar Power Plant (5MW)', dept: 'MNRE', cost: 'Rs 28 Cr', prog: 60, st: 'On Track', dt: 'Nov 2026', cat: 'Energy', ic: '☀', ward: 'Ward 20', sanc: 28, rel: 18, util: 16, rate: 4.0, milestones: [{ m: 'Land', d: 'Apr 2025', done: true }, { m: 'Panels Procure', d: 'Aug 2025', done: true }, { m: 'Installation', d: 'Mar 2026', done: true }, { m: 'Grid Connect', d: 'Aug 2026', done: false }, { m: 'Commission', d: 'Nov 2026', done: false }] },
  { id: 'VK-007', t: 'MPLADS: Community Halls (12)', dept: 'MPLADS', cost: 'Rs 4.8 Cr', prog: 83, st: 'On Track', dt: 'Jul 2026', cat: 'MPLADS', ic: '🏛', ward: 'Multiple', sanc: 4.8, rel: 4.2, util: 3.8, rate: 4.3, milestones: [{ m: 'Sanction', d: 'Jan 2025', done: true }, { m: '6 Halls Done', d: 'Jul 2025', done: true }, { m: '10 Halls Done', d: 'Jan 2026', done: true }, { m: 'All 12', d: 'Jul 2026', done: false }] },
  { id: 'VK-008', t: 'MPLADS: Anganwadi Centers (20)', dept: 'MPLADS', cost: 'Rs 3.2 Cr', prog: 50, st: 'On Track', dt: 'Oct 2026', cat: 'MPLADS', ic: '👶', ward: 'Rural', sanc: 3.2, rel: 1.8, util: 1.6, rate: 4.1, milestones: [{ m: 'Sanction', d: 'Mar 2025', done: true }, { m: '10 Built', d: 'Oct 2025', done: true }, { m: '15 Built', d: 'Apr 2026', done: false }, { m: 'All 20', d: 'Oct 2026', done: false }] },
];

// ─── Vani Kendra (Videos, Clips, Speeches) ───
export const VIDS = [
  { id: 'v1', t: 'Sansad Speech: Education Budget 2026', th: '🎬', dur: '42:18', views: '2.4L', likes: '18K', dt: '3 days ago', cat: 'Parliament', lang: 'Hindi' },
  { id: 'v2', t: 'Press Conference: Highway Project Update', th: '🎤', dur: '28:05', views: '1.8L', likes: '12K', dt: '1 week ago', cat: 'Press', lang: 'Hindi' },
  { id: 'v3', t: 'Rally Speech at Vikas Maidan', th: '📢', dur: '55:32', views: '5.2L', likes: '45K', dt: '2 weeks ago', cat: 'Rally', lang: 'Hindi' },
  { id: 'v4', t: 'Interview: NDTV Prime Time', th: '📺', dur: '22:40', views: '3.1L', likes: '22K', dt: '3 weeks ago', cat: 'Interview', lang: 'Hindi/English' },
  { id: 'v5', t: 'Jan Darbar Live Session #42', th: '🏛', dur: '1:15:20', views: '89K', likes: '6.2K', dt: '1 month ago', cat: 'Jan Darbar', lang: 'Hindi' },
  { id: 'v6', t: 'Independence Day Address to Constituency', th: '🇮🇳', dur: '18:45', views: '4.8L', likes: '38K', dt: '6 months ago', cat: 'Address', lang: 'Hindi' },
];

export const CLIPS = [
  { id: 'cl1', src: 'Dainik Jagran', dt: 'Feb 24, 2026', t: 'MP leads demand for new flyover', cat: 'Development' },
  { id: 'cl2', src: 'Amar Ujala', dt: 'Feb 20, 2026', t: 'Jan Darbar resolves 45 grievances in single day', cat: 'Governance' },
  { id: 'cl3', src: 'Times of India', dt: 'Feb 18, 2026', t: 'MP raises question on rural healthcare', cat: 'Parliament' },
  { id: 'cl4', src: 'Hindustan', dt: 'Feb 15, 2026', t: 'Constituency gets Rs 12Cr for road development', cat: 'Development' },
  { id: 'cl5', src: 'India Today', dt: 'Feb 10, 2026', t: 'Young MP among top performers in session', cat: 'Recognition' },
  { id: 'cl6', src: 'The Hindu', dt: 'Feb 5, 2026', t: 'Standing Committee report on education praised', cat: 'Parliament' },
  { id: 'cl7', src: 'NDTV', dt: 'Jan 28, 2026', t: 'MP inaugurates skill center for youth', cat: 'Development' },
  { id: 'cl8', src: 'Rajasthan Patrika', dt: 'Jan 22, 2026', t: 'Alliance partner praises cooperation model', cat: 'Alliance' },
];

export const SPEECHES = [
  { id: 'sp1', t: 'Budget Session 2026: Demand for Grants', dt: 'Feb 22, 2026', venue: 'Lok Sabha', dur: '32 min', topic: 'Education & Healthcare', full: 'Maananiya Adhyaksh Mahodaya, main aaj shiksha aur swasthya ke maamle mein apne vichar rakhna chahunga...' },
  { id: 'sp2', t: 'Zero Hour: Railway Safety', dt: 'Feb 15, 2026', venue: 'Lok Sabha', dur: '8 min', topic: 'Railway Infrastructure', full: 'Sir, mere kshetra mein railway crossing par lagatar hadse ho rahe hain...' },
  { id: 'sp3', t: 'Private Member Bill: Farmer Protection', dt: 'Feb 8, 2026', venue: 'Lok Sabha', dur: '45 min', topic: 'Agriculture', full: 'Bharat ek krishi pradhan desh hai. Hamare kisanon ko...' },
];

// ─── Karyakram (Events) ───
export const EVENTS = [
  { t: 'E-Jan Darbar #43', dt: 'Mar 4, 2026', tm: '10:00 AM', loc: 'Online + Jan Setu Portal', cat: 'Darbar', ic: '🏛' },
  { t: 'Constituency Vikas Review', dt: 'Mar 8, 2026', tm: '11:00 AM', loc: 'Circuit House', cat: 'Review', ic: '📊' },
  { t: 'Holi Milan Samaroh', dt: 'Mar 14, 2026', tm: '5:00 PM', loc: 'Community Ground, Ward 1', cat: 'Festival', ic: '🎉' },
  { t: 'Women Empowerment Workshop', dt: 'Mar 18, 2026', tm: '10:00 AM', loc: 'ITI Auditorium', cat: 'Workshop', ic: '👩' },
  { t: 'Blood Donation Camp', dt: 'Mar 22, 2026', tm: '9:00 AM', loc: 'District Hospital', cat: 'Health', ic: '🩸' },
  { t: 'Youth Career Fair', dt: 'Mar 28, 2026', tm: '10:00 AM', loc: 'Sports Stadium', cat: 'Employment', ic: '🎓' },
  { t: 'Sansad Prahari Report Card', dt: 'Apr 2, 2026', tm: '4:00 PM', loc: 'Town Hall', cat: 'Governance', ic: '📝' },
];

// ─── Jan Awaaz (Polls + Voices) ───
export const POLLS = [
  { id: 'pl1', q: 'Which issue needs most attention in our constituency?', opts: [{ t: 'Roads & Infrastructure', v: 3420, pct: 34 }, { t: 'Water Supply', v: 2810, pct: 28 }, { t: 'Healthcare', v: 1960, pct: 20 }, { t: 'Education', v: 1200, pct: 12 }, { t: 'Employment', v: 610, pct: 6 }], total: 10000, st: 'Active', dt: 'Ends in 5 days' },
  { id: 'pl2', q: 'Rate the development work in last 2 years', opts: [{ t: 'Excellent', v: 2800, pct: 28 }, { t: 'Good', v: 3500, pct: 35 }, { t: 'Average', v: 2200, pct: 22 }, { t: 'Poor', v: 1500, pct: 15 }], total: 10000, st: 'Active', dt: 'Ends in 3 days' },
  { id: 'pl3', q: 'Should budget prioritize new hospital or road widening?', opts: [{ t: 'New District Hospital', v: 5600, pct: 56 }, { t: 'NH-24 Road Widening', v: 4400, pct: 44 }], total: 10000, st: 'Closed', dt: 'Ended Feb 15' },
];

export const VOICES = [
  { by: 'Suresh Yadav', ward: 'Ward 8', msg: 'Railway crossing gate timing should be extended during rush hours.', likes: 42, dt: '2h ago', snt: .3 },
  { by: 'Kavita Sharma', ward: 'Ward 14', msg: 'Thank you for the new community hall. Great for functions!', likes: 28, dt: '5h ago', snt: .8 },
  { by: 'Mohammad Irfan', ward: 'Ward 3', msg: 'Street lights installed last month already not working.', likes: 15, dt: '8h ago', snt: -.5 },
  { by: 'Geeta Devi', ward: 'Ward 19', msg: 'Need a girls hostel near the college. Many students travel far.', likes: 67, dt: '1d ago', snt: .2 },
  { by: 'Anonymous', ward: 'Ward 7', msg: 'Ration dealer is corrupt. Please investigate.', likes: 89, dt: '1d ago', snt: -.8 },
];

// ─── Jan Aavedhan (Petitions + Services) ───
export const PETITIONS = [
  { id: 'PET-2026-042', t: 'Demand for new primary school in Ward 18', sigs: 1247, goal: 2000, by: 'Ward 18 Parents Association', dt: 'Feb 20, 2026', st: 'Trending', cat: 'Education' },
  { id: 'PET-2026-041', t: 'Install CCTV cameras in market area', sigs: 890, goal: 1000, by: 'Vyapar Mandal', dt: 'Feb 15, 2026', st: 'Near Goal', cat: 'Safety' },
  { id: 'PET-2026-038', t: 'Weekly haat market on Saturdays', sigs: 2100, goal: 2000, by: 'Kisan Sangh', dt: 'Feb 1, 2026', st: 'Goal Met', cat: 'Commerce' },
  { id: 'PET-2026-035', t: 'Ban on loudspeaker after 10pm', sigs: 560, goal: 1500, by: 'Resident Welfare Assn.', dt: 'Jan 22, 2026', st: 'Active', cat: 'Quality of Life' },
];

export const APP_SERVICES = [
  { t: 'Birth/Death Certificate', forms: 245, avg: '3 days', ic: '📄' },
  { t: 'Income Certificate', forms: 189, avg: '5 days', ic: '💳' },
  { t: 'Caste Certificate', forms: 167, avg: '7 days', ic: '📜' },
  { t: 'Recommendation Letter', forms: 92, avg: '2 days', ic: '✍' },
  { t: 'MPLADS Application', forms: 45, avg: '15 days', ic: '🏗' },
];

// ─── E-Jan Darbar (Sessions + Queue) ───
export const DARBAR_SESSIONS = [
  { id: 'JD-42', t: 'Weekly Jan Darbar #42', dt: 'Feb 25, 2026', cases: 45, resolved: 38, dur: '3h 20m', st: 'Completed', next: 'Mar 4, 2026', outcomes: [{ q: 'Water supply Ward 12', by: 'Ramesh Kumar', commit: 'Jal Vibhag directed to restore within 48h', status: 'Resolved' }, { q: 'PHC doctor absent Ward 20', by: 'Meera Bai', commit: 'Show-cause notice issued to CMO', status: 'In Progress' }, { q: 'Road repair MG Road', by: 'Sunita Devi', commit: 'PWD sanctioned Rs 12L for repair', status: 'Work Started' }] },
  { id: 'JD-41', t: "Special Women's Darbar", dt: 'Feb 18, 2026', cases: 28, resolved: 25, dur: '2h 45m', st: 'Completed', next: '', outcomes: [{ q: 'Girls hostel near college', by: 'Geeta Devi', commit: 'DPR to be prepared for MPLADS funding', status: 'Under Review' }] },
  { id: 'JD-40', t: 'Youth Employment Darbar', dt: 'Feb 11, 2026', cases: 52, resolved: 41, dur: '4h 10m', st: 'Completed', next: '', outcomes: [{ q: 'ITI placement drive', by: 'Youth Wing', commit: 'Tie-up with 5 companies for campus recruitment', status: 'Resolved' }] },
];

export const DARBAR_QUEUE = [
  { tk: 'Q-001', name: 'Smt. Kamla Devi', issue: 'Widow pension not received 3 months', cat: 'Welfare', wait: '12 min', pri: 'High' },
  { tk: 'Q-002', name: 'Shri Rajendra', issue: 'Land dispute with government plot', cat: 'Revenue', wait: '8 min', pri: 'Medium' },
  { tk: 'Q-003', name: 'Mohd. Aslam', issue: 'Shop licence renewal stuck', cat: 'Municipal', wait: '5 min', pri: 'Low' },
];

// ─── Samvad Manch (Forum Threads) ───
export const THREADS = [
  { id: 'th1', t: 'When will NH-24 bypass be completed?', by: 'Rajesh_Ward8', replies: 24, views: 342, dt: '2h ago', hot: true, cat: 'Development' },
  { id: 'th2', t: 'PHC needs more doctors - petition support needed', by: 'MedinAction', replies: 18, views: 215, dt: '5h ago', hot: true, cat: 'Healthcare' },
  { id: 'th3', t: 'Appreciation: New park in Ward 5 is beautiful!', by: 'GreenWard5', replies: 12, views: 178, dt: '8h ago', hot: false, cat: 'Appreciation' },
  { id: 'th4', t: 'Street light complaint - still no action after 2 weeks', by: 'Sunita_Mohalla3', replies: 31, views: 456, dt: '1d ago', hot: true, cat: 'Complaint' },
  { id: 'th5', t: 'Can we get a skill training center for women?', by: 'NariShakti', replies: 15, views: 198, dt: '1d ago', hot: false, cat: 'Suggestion' },
  { id: 'th6', t: 'Water bill overcharging - is anyone else affected?', by: 'Anonymous', replies: 42, views: 890, dt: '2d ago', hot: true, cat: 'Utility' },
  { id: 'th7', t: 'Rally was great but traffic management was poor', by: 'CommutorPain', replies: 8, views: 124, dt: '3d ago', hot: false, cat: 'Feedback' },
];

// ─── Apatkal Setu (Emergency Contacts) ───
export const EMERGENCY_CONTACTS = [
  { t: 'Police', num: '100', ic: '🚔', c: '#E63946' },
  { t: 'Ambulance', num: '108', ic: '🚑', c: '#059669' },
  { t: 'Fire', num: '101', ic: '🚒', c: '#F59E0B' },
  { t: 'Women Helpline', num: '1091', ic: '👩', c: '#E879F9' },
  { t: 'Child Helpline', num: '1098', ic: '👶', c: '#60A5FA' },
  { t: 'Disaster Mgmt', num: '1078', ic: '⚠', c: '#F97316' },
  { t: 'MP Helpline', num: '1800-XXX-XXXX', ic: '📞', c: '#7C3AED' },
  { t: 'Jan Setu SOS', num: 'SMS to 56789', ic: '🆘', c: '#E63946' },
];

// ─── YouTube Studio Data ───
export const YT_VIDS = [
  { t: 'Vikas Yatra: 100 Days', v: '1.2M', lk: '42K', cm: 890, dur: '18:42', pub: '3d ago' },
  { t: 'Sansad: Farmers Bill Speech', v: '2.8M', lk: '85K', cm: 2100, dur: '22:15', pub: '1w ago' },
  { t: 'Jan Darbar LIVE', v: '480K', lk: '18K', cm: 560, dur: '1:24:08', pub: '2w ago' },
  { t: 'Rally: Gorakhpur Mahotsav', v: '3.5M', lk: '120K', cm: 3200, dur: '28:30', pub: '1mo ago' },
];

export const YT_CMTS = [
  { id: 'yc1', au: 'Voter123', tx: 'Gorakhpur needs better hospitals', snt: -.42, em: '😢', vid: 0, re: 0 },
  { id: 'yc2', au: 'PriyaVerma', tx: 'Best MP ever! Road work amazing.', snt: .88, em: '😊', vid: 0, re: 0 },
  { id: 'yc3', au: 'OppoFan', tx: 'All talk no action. Where is flyover?', snt: -.75, em: '😡', vid: 1, re: 0 },
  { id: 'yc4', au: 'Ramesh_BJP', tx: 'Parliament speech excellent sir 🙏', snt: .90, em: '🤝', vid: 1, re: 1 },
  { id: 'yc5', au: 'NewsWatch', tx: 'Interesting stance on farmers bill', snt: .45, em: '🔮', vid: 1, re: 0 },
  { id: 'yc6', au: 'Ward14Res', tx: 'Sir water problem STILL not solved', snt: -.80, em: '😡', vid: 2, re: 0 },
  { id: 'yc7', au: 'YouthWing', tx: 'Rally energy incredible. Jai ho!', snt: .92, em: '😊', vid: 3, re: 1 },
  { id: 'yc8', au: 'Analyst_IN', tx: 'Most consistent dev record in UP', snt: .85, em: '🤝', vid: 3, re: 0 },
];

// ─── Sentiment Timeline (30 days) ───
export const SENT_TL = Array.from({ length: 30 }, (_, i) => ({
  day: i + 1,
  score: 55 + Math.round(Math.random() * 30),
  pos: 40 + Math.round(Math.random() * 35),
  neg: 5 + Math.round(Math.random() * 15),
}));
