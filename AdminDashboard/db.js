// ═══════════════════════════════════════════════════════════════
//  NetaBoard Admin Dashboard — SQLite Persistence Layer
// ═══════════════════════════════════════════════════════════════
const Database = require('better-sqlite3');
const path = require('path');

const DB_PATH = path.join(__dirname, 'dashboard.db');
const db = new Database(DB_PATH);

// ── Enable WAL mode for better concurrent performance ──
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// ── Create Tables ──────────────────────────────────────────────
db.exec(`
  CREATE TABLE IF NOT EXISTS jobs (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    name        TEXT    NOT NULL,
    icon        TEXT    DEFAULT '📦',
    source_type TEXT    NOT NULL,
    extra_meta  TEXT    DEFAULT '',
    status      TEXT    DEFAULT 'queued',
    progress    INTEGER DEFAULT 0,
    items_processed INTEGER DEFAULT 0,
    total_items INTEGER DEFAULT 100,
    yt_job_id   TEXT,
    error_msg   TEXT,
    created_at  TEXT    DEFAULT (datetime('now')),
    started_at  TEXT,
    done_at     TEXT
  );

  CREATE TABLE IF NOT EXISTS yt_videos (
    vid         TEXT    PRIMARY KEY,
    url         TEXT    NOT NULL,
    title       TEXT,
    channel     TEXT,
    duration    TEXT,
    thumbnail   TEXT,
    status      TEXT    DEFAULT 'staged',
    added_at    TEXT    DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS yt_playlists (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    url         TEXT    NOT NULL,
    name        TEXT,
    count       INTEGER DEFAULT 0,
    videos_json TEXT    DEFAULT '[]',
    status      TEXT    DEFAULT 'staged',
    progress    INTEGER DEFAULT 0,
    added_at    TEXT    DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS settings (
    key         TEXT    PRIMARY KEY,
    value       TEXT,
    updated_at  TEXT    DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS log_entries (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    ts          TEXT    DEFAULT (datetime('now','localtime')),
    level       TEXT    DEFAULT 'info',
    message     TEXT    NOT NULL
  );
`);

// ══════════════════════════════════════════════
//  JOB CRUD
// ══════════════════════════════════════════════
const jobStmts = {
    create: db.prepare(`
    INSERT INTO jobs (name, icon, source_type, extra_meta, status, progress, items_processed, total_items)
    VALUES (@name, @icon, @source_type, @extra_meta, @status, @progress, @items_processed, @total_items)
  `),
    update: db.prepare(`
    UPDATE jobs SET
      status          = COALESCE(@status, status),
      progress        = COALESCE(@progress, progress),
      items_processed = COALESCE(@items_processed, items_processed),
      extra_meta      = COALESCE(@extra_meta, extra_meta),
      yt_job_id       = COALESCE(@yt_job_id, yt_job_id),
      error_msg       = COALESCE(@error_msg, error_msg),
      started_at      = COALESCE(@started_at, started_at),
      done_at         = COALESCE(@done_at, done_at)
    WHERE id = @id
  `),
    getAll: db.prepare(`SELECT * FROM jobs ORDER BY created_at DESC`),
    getById: db.prepare(`SELECT * FROM jobs WHERE id = ?`),
    delete: db.prepare(`DELETE FROM jobs WHERE id = ?`),
    clearDone: db.prepare(`DELETE FROM jobs WHERE status IN ('done', 'failed')`),
};

function createJob(data) {
    const result = jobStmts.create.run({
        name: data.name || 'Unnamed Job',
        icon: data.icon || '📦',
        source_type: data.sourceType || 'unknown',
        extra_meta: data.extraMeta || '',
        status: 'queued',
        progress: 0,
        items_processed: 0,
        total_items: data.totalItems || Math.floor(Math.random() * 800 + 50),
    });
    return jobStmts.getById.get(result.lastInsertRowid);
}

function updateJob(id, data) {
    jobStmts.update.run({
        id,
        status: data.status ?? null,
        progress: data.progress ?? null,
        items_processed: data.itemsProcessed ?? null,
        extra_meta: data.extraMeta ?? null,
        yt_job_id: data.ytJobId ?? null,
        error_msg: data.errorMsg ?? null,
        started_at: data.startedAt ?? null,
        done_at: data.doneAt ?? null,
    });
    return jobStmts.getById.get(id);
}

function getJobs(filter) {
    const all = jobStmts.getAll.all();
    if (!filter || filter === 'all') return all;
    if (filter === 'queued') return all.filter(j => j.status === 'queued' || j.status === 'paused');
    if (filter === 'processing') return all.filter(j => j.status === 'processing');
    if (filter === 'done') return all.filter(j => j.status === 'done' || j.status === 'failed');
    return all;
}

function deleteJob(id) {
    jobStmts.delete.run(id);
}

function clearDoneJobs() {
    jobStmts.clearDone.run();
}

// ══════════════════════════════════════════════
//  YOUTUBE VIDEOS & PLAYLISTS
// ══════════════════════════════════════════════
const ytStmts = {
    addVideo: db.prepare(`
    INSERT OR REPLACE INTO yt_videos (vid, url, title, channel, duration, thumbnail, status)
    VALUES (@vid, @url, @title, @channel, @duration, @thumbnail, @status)
  `),
    getVideos: db.prepare(`SELECT * FROM yt_videos ORDER BY added_at DESC`),
    updateVideo: db.prepare(`UPDATE yt_videos SET status = @status WHERE vid = @vid`),
    deleteVideo: db.prepare(`DELETE FROM yt_videos WHERE vid = ?`),
    clearVideos: db.prepare(`DELETE FROM yt_videos`),

    addPlaylist: db.prepare(`
    INSERT INTO yt_playlists (url, name, count, videos_json, status)
    VALUES (@url, @name, @count, @videos_json, 'staged')
  `),
    getPlaylists: db.prepare(`SELECT * FROM yt_playlists ORDER BY added_at DESC`),
    updatePlaylist: db.prepare(`UPDATE yt_playlists SET status = @status, progress = @progress WHERE id = @id`),
    deletePlaylist: db.prepare(`DELETE FROM yt_playlists WHERE id = ?`),
    clearPlaylists: db.prepare(`DELETE FROM yt_playlists`),
};

function addYtVideo(data) {
    ytStmts.addVideo.run({
        vid: data.vid,
        url: data.url,
        title: data.title || '',
        channel: data.channel || '',
        duration: data.duration || '',
        thumbnail: data.thumbnail || `https://img.youtube.com/vi/${data.vid}/mqdefault.jpg`,
        status: 'staged',
    });
}

function updateYtVideo(vid, status) {
    ytStmts.updateVideo.run({ vid, status });
}

function getYtVideos() {
    return ytStmts.getVideos.all();
}

function deleteYtVideo(vid) {
    ytStmts.deleteVideo.run(vid);
}

function clearYtVideos() {
    ytStmts.clearVideos.run();
}

function addYtPlaylist(data) {
    const result = ytStmts.addPlaylist.run({
        url: data.url,
        name: data.name || 'Playlist',
        count: data.count || 0,
        videos_json: JSON.stringify(data.videos || []),
    });
    return ytStmts.getPlaylists.all().find(p => p.id === result.lastInsertRowid);
}

function getYtPlaylists() {
    return ytStmts.getPlaylists.all().map(p => ({
        ...p,
        videos: JSON.parse(p.videos_json || '[]')
    }));
}

function updateYtPlaylist(id, status, progress) {
    ytStmts.updatePlaylist.run({ id, status, progress });
}

function deleteYtPlaylist(id) {
    ytStmts.deletePlaylist.run(id);
}

function clearYtPlaylists() {
    ytStmts.clearPlaylists.run();
}

// ══════════════════════════════════════════════
//  SETTINGS
// ══════════════════════════════════════════════
const settingsStmts = {
    set: db.prepare(`INSERT OR REPLACE INTO settings (key, value, updated_at) VALUES (?, ?, datetime('now'))`),
    get: db.prepare(`SELECT value FROM settings WHERE key = ?`),
    getAll: db.prepare(`SELECT key, value FROM settings`),
};

function saveSetting(key, value) {
    settingsStmts.set.run(key, typeof value === 'object' ? JSON.stringify(value) : String(value));
}

function getSetting(key, defaultValue = null) {
    const row = settingsStmts.get.get(key);
    if (!row) return defaultValue;
    try { return JSON.parse(row.value); } catch { return row.value; }
}

function getAllSettings() {
    const rows = settingsStmts.getAll.all();
    const result = {};
    rows.forEach(r => {
        try { result[r.key] = JSON.parse(r.value); } catch { result[r.key] = r.value; }
    });
    return result;
}

// ══════════════════════════════════════════════
//  LOGS
// ══════════════════════════════════════════════
const logStmts = {
    add: db.prepare(`INSERT INTO log_entries (level, message) VALUES (?, ?)`),
    getRecent: db.prepare(`SELECT * FROM log_entries ORDER BY id DESC LIMIT 200`),
    cleanup: db.prepare(`DELETE FROM log_entries WHERE id NOT IN (SELECT id FROM log_entries ORDER BY id DESC LIMIT 500)`),
};

function appendLog(level, message) {
    logStmts.add.run(level, message);
    // Keep only last 500 entries
    logStmts.cleanup.run();
}

function getRecentLogs() {
    return logStmts.getRecent.all().reverse(); // oldest first
}

module.exports = {
    db,
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
