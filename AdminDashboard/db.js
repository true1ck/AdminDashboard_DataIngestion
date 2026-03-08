// ═══════════════════════════════════════════════════════════════
//  NetaBoard Admin Dashboard — SQLite Persistence Layer
//  Uses sqlite3 (pre-compiled, no native build needed)
// ═══════════════════════════════════════════════════════════════
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const DB_PATH = path.join(__dirname, 'dashboard.db');
const db = new sqlite3.Database(DB_PATH);

// ── Enable WAL mode ──
db.run('PRAGMA journal_mode = WAL');
db.run('PRAGMA foreign_keys = ON');

// ── Run SQL helper (promisified) ──
function run(sql, params = []) {
    return new Promise((resolve, reject) => {
        db.run(sql, params, function (err) {
            if (err) reject(err); else resolve({ lastID: this.lastID, changes: this.changes });
        });
    });
}

function get(sql, params = []) {
    return new Promise((resolve, reject) => {
        db.get(sql, params, (err, row) => { if (err) reject(err); else resolve(row); });
    });
}

function all(sql, params = []) {
    return new Promise((resolve, reject) => {
        db.all(sql, params, (err, rows) => { if (err) reject(err); else resolve(rows); });
    });
}

// ── Create Tables ──
async function initDb() {
    await run(`CREATE TABLE IF NOT EXISTS jobs (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    name          TEXT NOT NULL,
    icon          TEXT DEFAULT '📦',
    source_type   TEXT NOT NULL,
    extra_meta    TEXT DEFAULT '',
    status        TEXT DEFAULT 'queued',
    progress      INTEGER DEFAULT 0,
    items_processed INTEGER DEFAULT 0,
    total_items   INTEGER DEFAULT 100,
    yt_job_id     TEXT,
    error_msg     TEXT,
    created_at    TEXT DEFAULT (datetime('now')),
    started_at    TEXT,
    done_at       TEXT
  )`);

    await run(`CREATE TABLE IF NOT EXISTS yt_videos (
    vid       TEXT PRIMARY KEY,
    url       TEXT NOT NULL,
    title     TEXT,
    channel   TEXT,
    duration  TEXT,
    thumbnail TEXT,
    status    TEXT DEFAULT 'staged',
    added_at  TEXT DEFAULT (datetime('now'))
  )`);

    await run(`CREATE TABLE IF NOT EXISTS yt_playlists (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    url          TEXT NOT NULL,
    name         TEXT,
    count        INTEGER DEFAULT 0,
    videos_json  TEXT DEFAULT '[]',
    status       TEXT DEFAULT 'staged',
    progress     INTEGER DEFAULT 0,
    added_at     TEXT DEFAULT (datetime('now'))
  )`);

    await run(`CREATE TABLE IF NOT EXISTS settings (
    key        TEXT PRIMARY KEY,
    value      TEXT,
    updated_at TEXT DEFAULT (datetime('now'))
  )`);

    await run(`CREATE TABLE IF NOT EXISTS log_entries (
    id       INTEGER PRIMARY KEY AUTOINCREMENT,
    ts       TEXT DEFAULT (datetime('now','localtime')),
    level    TEXT DEFAULT 'info',
    message  TEXT NOT NULL
  )`);

    await run(`CREATE TABLE IF NOT EXISTS saved_queries (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    name          TEXT NOT NULL,
    query         TEXT NOT NULL,
    db_type       TEXT NOT NULL,
    mapping_json  TEXT,
    created_at    TEXT DEFAULT (datetime('now'))
  )`);

    // ── NRI Pre-Processing Pipeline Tables ──
    await run(`CREATE TABLE IF NOT EXISTS nri_files (
    id                INTEGER PRIMARY KEY AUTOINCREMENT,
    filepath          TEXT NOT NULL UNIQUE,
    filename          TEXT NOT NULL,
    folder            TEXT NOT NULL,
    platform          TEXT DEFAULT 'unknown',
    file_size_bytes   INTEGER DEFAULT 0,
    fingerprint       TEXT NOT NULL UNIQUE,
    processing_state  TEXT DEFAULT 'pending',
    relevance_scored  INTEGER DEFAULT 0,
    pillar_scored     INTEGER DEFAULT 0,
    pillars_relevant  INTEGER DEFAULT 0,
    pillars_scored    INTEGER DEFAULT 0,
    avg_relevance     REAL DEFAULT 0,
    avg_score         REAL DEFAULT 0,
    error_msg         TEXT,
    discovered_at     TEXT DEFAULT (datetime('now')),
    queued_at         TEXT,
    started_at        TEXT,
    completed_at      TEXT
  )`);

    await run(`CREATE TABLE IF NOT EXISTS nri_file_scores (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    file_id         INTEGER NOT NULL,
    filepath        TEXT NOT NULL,
    pillar          TEXT NOT NULL,
    relevance_score REAL DEFAULT 0,
    is_relevant     INTEGER DEFAULT 0,
    raw_score       REAL,
    effective_score REAL,
    confidence      REAL,
    evidence        TEXT,
    scored_at       TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (file_id) REFERENCES nri_files(id),
    UNIQUE(file_id, pillar)
  )`);

    await run(`CREATE TABLE IF NOT EXISTS nri_queue (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    file_id         INTEGER NOT NULL UNIQUE,
    filepath        TEXT NOT NULL,
    priority        INTEGER DEFAULT 5,
    status          TEXT DEFAULT 'queued',
    enqueued_at     TEXT DEFAULT (datetime('now')),
    started_at      TEXT,
    completed_at    TEXT,
    error_msg       TEXT,
    FOREIGN KEY (file_id) REFERENCES nri_files(id)
  )`);
}

// Initialize on load
initDb().catch(console.error);

// ═══════════════════════════════════
//  JOBS
// ═══════════════════════════════════
async function createJob(data) {
    const totalItems = data.totalItems || Math.floor(Math.random() * 800 + 50);
    const { lastID } = await run(
        `INSERT INTO jobs (name, icon, source_type, extra_meta, total_items) VALUES (?,?,?,?,?)`,
        [data.name || 'Job', data.icon || '📦', data.sourceType || 'unknown', data.extraMeta || '', totalItems]
    );
    return get(`SELECT * FROM jobs WHERE id = ?`, [lastID]);
}

async function updateJob(id, data) {
    const sets = [];
    const vals = [];
    if (data.status !== undefined) { sets.push('status = ?'); vals.push(data.status); }
    if (data.progress !== undefined) { sets.push('progress = ?'); vals.push(data.progress); }
    if (data.itemsProcessed !== undefined) { sets.push('items_processed = ?'); vals.push(data.itemsProcessed); }
    if (data.extraMeta !== undefined) { sets.push('extra_meta = ?'); vals.push(data.extraMeta); }
    if (data.ytJobId !== undefined) { sets.push('yt_job_id = ?'); vals.push(data.ytJobId); }
    if (data.errorMsg !== undefined) { sets.push('error_msg = ?'); vals.push(data.errorMsg); }
    if (data.startedAt !== undefined) { sets.push('started_at = ?'); vals.push(data.startedAt); }
    if (data.doneAt !== undefined) { sets.push('done_at = ?'); vals.push(data.doneAt); }
    if (!sets.length) return get(`SELECT * FROM jobs WHERE id = ?`, [id]);
    vals.push(id);
    await run(`UPDATE jobs SET ${sets.join(', ')} WHERE id = ?`, vals);
    return get(`SELECT * FROM jobs WHERE id = ?`, [id]);
}

async function getJobs(filter) {
    const rows = await all(`SELECT * FROM jobs ORDER BY created_at DESC`);
    if (!filter || filter === 'all') return rows;
    if (filter === 'queued') return rows.filter(j => j.status === 'queued' || j.status === 'paused');
    if (filter === 'processing') return rows.filter(j => j.status === 'processing');
    if (filter === 'done') return rows.filter(j => j.status === 'done' || j.status === 'failed');
    return rows;
}

async function deleteJob(id) { await run(`DELETE FROM jobs WHERE id = ?`, [id]); }
async function clearDoneJobs() { await run(`DELETE FROM jobs WHERE status IN ('done','failed')`); }

// ═══════════════════════════════════
//  YOUTUBE
// ═══════════════════════════════════
async function addYtVideo(data) {
    await run(
        `INSERT OR REPLACE INTO yt_videos (vid, url, title, channel, duration, thumbnail, status) VALUES (?,?,?,?,?,?,?)`,
        [data.vid, data.url, data.title || '', data.channel || '', data.duration || '', data.thumbnail || `https://img.youtube.com/vi/${data.vid}/mqdefault.jpg`, 'staged']
    );
}

async function updateYtVideo(vid, status) { await run(`UPDATE yt_videos SET status=? WHERE vid=?`, [status, vid]); }
async function getYtVideos() { return all(`SELECT * FROM yt_videos ORDER BY added_at DESC`); }
async function deleteYtVideo(vid) { await run(`DELETE FROM yt_videos WHERE vid=?`, [vid]); }
async function clearYtVideos() { await run(`DELETE FROM yt_videos`); }

async function addYtPlaylist(data) {
    const { lastID } = await run(
        `INSERT INTO yt_playlists (url, name, count, videos_json) VALUES (?,?,?,?)`,
        [data.url, data.name || 'Playlist', data.count || 0, JSON.stringify(data.videos || [])]
    );
    return get(`SELECT * FROM yt_playlists WHERE id=?`, [lastID]);
}

async function getYtPlaylists() {
    const rows = await all(`SELECT * FROM yt_playlists ORDER BY added_at DESC`);
    return rows.map(p => ({ ...p, videos: JSON.parse(p.videos_json || '[]') }));
}

async function updateYtPlaylist(id, status, progress) {
    await run(`UPDATE yt_playlists SET status=?, progress=? WHERE id=?`, [status, progress || 0, id]);
}
async function deleteYtPlaylist(id) { await run(`DELETE FROM yt_playlists WHERE id=?`, [id]); }
async function clearYtPlaylists() { await run(`DELETE FROM yt_playlists`); }

// ═══════════════════════════════════
//  SETTINGS
// ═══════════════════════════════════
async function saveSetting(key, value) {
    const v = typeof value === 'object' ? JSON.stringify(value) : String(value);
    await run(`INSERT OR REPLACE INTO settings (key, value, updated_at) VALUES (?, ?, datetime('now'))`, [key, v]);
}

async function getSetting(key, defaultValue = null) {
    const row = await get(`SELECT value FROM settings WHERE key=?`, [key]);
    if (!row) return defaultValue;
    try { return JSON.parse(row.value); } catch { return row.value; }
}

async function getAllSettings() {
    const rows = await all(`SELECT key, value FROM settings`);
    const result = {};
    rows.forEach(r => { try { result[r.key] = JSON.parse(r.value); } catch { result[r.key] = r.value; } });
    return result;
}

// ═══════════════════════════════════
//  LOGS
// ═══════════════════════════════════
async function appendLog(level, message) {
    await run(`INSERT INTO log_entries (level, message) VALUES (?, ?)`, [level, message]);
    await run(`DELETE FROM log_entries WHERE id NOT IN (SELECT id FROM log_entries ORDER BY id DESC LIMIT 500)`);
}

async function getRecentLogs() {
    const rows = await all(`SELECT * FROM log_entries ORDER BY id DESC LIMIT 200`);
    return rows.reverse();
}

// ═══════════════════════════════════
//  SAVED QUERIES
// ═══════════════════════════════════
async function createSavedQuery(data) {
    const { lastID } = await run(
        `INSERT INTO saved_queries (name, query, db_type, mapping_json) VALUES (?,?,?,?)`,
        [data.name, data.query, data.dbType, JSON.stringify(data.mapping)]
    );
    return get(`SELECT * FROM saved_queries WHERE id = ?`, [lastID]);
}

async function getSavedQueries() {
    const rows = await all(`SELECT * FROM saved_queries ORDER BY created_at DESC`);
    return rows.map(r => ({ ...r, mapping: JSON.parse(r.mapping_json || '{}') }));
}

async function deleteSavedQuery(id) {
    await run(`DELETE FROM saved_queries WHERE id = ?`, [id]);
}

// ═══════════════════════════════════
//  NRI PRE-PROCESSING PIPELINE
// ═══════════════════════════════════

// Compute a simple fingerprint from filepath (deterministic dedup)
function fpHash(filepath) {
    let hash = 0;
    for (let i = 0; i < filepath.length; i++) {
        const c = filepath.charCodeAt(i);
        hash = ((hash << 5) - hash) + c;
        hash |= 0;
    }
    return Math.abs(hash).toString(16).padStart(16, '0');
}

async function nriDiscoverFile(data) {
    const fp = fpHash(data.filepath);
    // Upsert — skip if fingerprint already exists
    const existing = await get(`SELECT id, processing_state FROM nri_files WHERE fingerprint = ?`, [fp]);
    if (existing) return { existing: true, file: existing };
    const { lastID } = await run(
        `INSERT INTO nri_files (filepath, filename, folder, platform, file_size_bytes, fingerprint)
         VALUES (?,?,?,?,?,?)`,
        [data.filepath, data.filename, data.folder || '', data.platform || 'unknown', data.fileSizeBytes || 0, fp]
    );
    return { existing: false, file: await get(`SELECT * FROM nri_files WHERE id=?`, [lastID]) };
}

async function nriGetFiles(filter = 'all') {
    let sql = `SELECT f.*, 
        (SELECT COUNT(*) FROM nri_queue q WHERE q.file_id = f.id AND q.status = 'queued') as in_queue
        FROM nri_files f ORDER BY f.discovered_at DESC`;
    const rows = await all(sql);
    if (filter === 'all') return rows;
    return rows.filter(r => r.processing_state === filter);
}

async function nriUpdateFile(id, data) {
    const sets = [];
    const vals = [];
    ['processing_state', 'relevance_scored', 'pillar_scored', 'pillars_relevant', 'pillars_scored',
        'avg_relevance', 'avg_score', 'error_msg', 'queued_at', 'started_at', 'completed_at'].forEach(k => {
            const dk = k.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
            if (data[dk] !== undefined) { sets.push(`${k} = ?`); vals.push(data[dk]); }
            if (data[k] !== undefined) { sets.push(`${k} = ?`); vals.push(data[k]); }
        });
    if (!sets.length) return get(`SELECT * FROM nri_files WHERE id=?`, [id]);
    vals.push(id);
    await run(`UPDATE nri_files SET ${[...new Set(sets)].join(', ')} WHERE id=?`, vals);
    return get(`SELECT * FROM nri_files WHERE id=?`, [id]);
}

async function nriSaveScore(data) {
    await run(
        `INSERT OR REPLACE INTO nri_file_scores 
         (file_id, filepath, pillar, relevance_score, is_relevant, raw_score, effective_score, confidence, evidence)
         VALUES (?,?,?,?,?,?,?,?,?)`,
        [data.fileId, data.filepath, data.pillar, data.relevanceScore || 0,
        data.isRelevant ? 1 : 0, data.rawScore ?? null, data.effectiveScore ?? null,
        data.confidence ?? null, data.evidence || null]
    );
}

async function nriGetScores(fileId) {
    return all(`SELECT * FROM nri_file_scores WHERE file_id = ? ORDER BY pillar`, [fileId]);
}

async function nriGetAllScores(limit = 500) {
    return all(
        `SELECT s.*, f.filename, f.folder, f.platform, f.processing_state 
         FROM nri_file_scores s JOIN nri_files f ON s.file_id = f.id 
         ORDER BY s.scored_at DESC LIMIT ?`, [limit]);
}

async function nriEnqueue(fileId, filepath, priority = 5) {
    // Prevent duplicate queue entries
    const existing = await get(`SELECT * FROM nri_queue WHERE file_id=?`, [fileId]);
    if (existing) return existing;
    await run(
        `INSERT INTO nri_queue (file_id, filepath, priority) VALUES (?,?,?)`,
        [fileId, filepath, priority]
    );
    await run(`UPDATE nri_files SET queued_at=datetime('now'), processing_state='queued' WHERE id=?`, [fileId]);
    return get(`SELECT * FROM nri_queue WHERE file_id=?`, [fileId]);
}

async function nriGetQueue(status = 'all') {
    let sql = `SELECT q.*, f.filename, f.folder, f.platform, f.file_size_bytes, f.processing_state
               FROM nri_queue q JOIN nri_files f ON q.file_id = f.id ORDER BY q.priority DESC, q.enqueued_at ASC`;
    const rows = await all(sql);
    if (status === 'all') return rows;
    return rows.filter(r => r.status === status);
}

async function nriUpdateQueue(id, data) {
    const sets = [];
    const vals = [];
    if (data.status !== undefined) { sets.push('status = ?'); vals.push(data.status); }
    if (data.startedAt !== undefined) { sets.push('started_at = ?'); vals.push(data.startedAt); }
    if (data.completedAt !== undefined) { sets.push('completed_at = ?'); vals.push(data.completedAt); }
    if (data.errorMsg !== undefined) { sets.push('error_msg = ?'); vals.push(data.errorMsg); }
    if (!sets.length) return;
    vals.push(id);
    await run(`UPDATE nri_queue SET ${sets.join(', ')} WHERE id=?`, vals);
}

async function nriRemoveFromQueue(fileId) {
    await run(`DELETE FROM nri_queue WHERE file_id=?`, [fileId]);
}

async function nriRemoveScores(fileId) {
    await run(`DELETE FROM nri_file_scores WHERE file_id=?`, [fileId]);
    await run(`UPDATE nri_files SET processing_state='pending', relevance_scored=0, pillar_scored=0, pillars_relevant=0, pillars_scored=0, avg_relevance=0, avg_score=0 WHERE id=?`, [fileId]);
    await run(`DELETE FROM nri_queue WHERE file_id=?`, [fileId]);
}

async function nriGetStats() {
    const total = await get(`SELECT COUNT(*) as cnt FROM nri_files`);
    const pending = await get(`SELECT COUNT(*) as cnt FROM nri_files WHERE processing_state='pending'`);
    const queued = await get(`SELECT COUNT(*) as cnt FROM nri_files WHERE processing_state='queued'`);
    const processing = await get(`SELECT COUNT(*) as cnt FROM nri_files WHERE processing_state='processing'`);
    const done = await get(`SELECT COUNT(*) as cnt FROM nri_files WHERE processing_state='done'`);
    const failed = await get(`SELECT COUNT(*) as cnt FROM nri_files WHERE processing_state='failed'`);
    const scores = await get(`SELECT COUNT(*) as cnt, AVG(effective_score) as avg_score FROM nri_file_scores WHERE is_relevant=1`);
    return {
        total: total.cnt, pending: pending.cnt, queued: queued.cnt,
        processing: processing.cnt, done: done.cnt, failed: failed.cnt,
        totalScores: scores.cnt, avgScore: scores.avg_score ? Math.round(scores.avg_score * 10) / 10 : 0
    };
}

module.exports = {
    // Jobs
    createJob, updateJob, getJobs, deleteJob, clearDoneJobs,
    // YouTube
    addYtVideo, updateYtVideo, getYtVideos, deleteYtVideo, clearYtVideos,
    addYtPlaylist, getYtPlaylists, updateYtPlaylist, deleteYtPlaylist, clearYtPlaylists,
    // Settings
    saveSetting, getSetting, getAllSettings,
    // Logs
    appendLog, getRecentLogs,
    // Saved Queries
    createSavedQuery, getSavedQueries, deleteSavedQuery,
    // NRI Pre-Processing Pipeline
    nriDiscoverFile, nriGetFiles, nriUpdateFile,
    nriSaveScore, nriGetScores, nriGetAllScores,
    nriEnqueue, nriGetQueue, nriUpdateQueue, nriRemoveFromQueue, nriGetStats, nriRemoveScores,
    fpHash,
};
