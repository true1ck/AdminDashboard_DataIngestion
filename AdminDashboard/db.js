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
};
