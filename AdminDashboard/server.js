// ═══════════════════════════════════════════════════════════════
//  NetaBoard Admin Dashboard Server — Port 4000
// ═══════════════════════════════════════════════════════════════
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const multer = require('multer');
const fetch = require('node-fetch');
const FormData = require('form-data');
const fs = require('fs');

const db = require('./db');

const app = express();
const PORT = process.env.ADMIN_PORT || 4000;
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3000';
const WHISPER_URL = process.env.WHISPER_URL || 'http://localhost:8000';
const QWEN_URL = process.env.QWEN_URL || 'http://localhost:5001';

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true }));

// Uploads directory
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
const upload = multer({ dest: uploadsDir });

// Serve static dashboard files
app.use(express.static(path.join(__dirname, 'public')));

// ══════════════════════════════════════════════
//  HEALTH CHECK
// ══════════════════════════════════════════════
app.get('/api/health', (req, res) => {
    res.json({ ok: true, service: 'NetaBoard Admin Dashboard', port: PORT });
});

// ══════════════════════════════════════════════
//  FULL STATE RESTORE (on page load)
// ══════════════════════════════════════════════
app.get('/api/state', (req, res) => {
    try {
        const jobs = db.getJobs('all');
        const ytVideos = db.getYtVideos();
        const ytPlaylists = db.getYtPlaylists();
        const settings = db.getAllSettings();
        const logs = db.getRecentLogs();
        res.json({ jobs, ytVideos, ytPlaylists, settings, logs });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ══════════════════════════════════════════════
//  JOBS API
// ══════════════════════════════════════════════
// Create job
app.post('/api/jobs', (req, res) => {
    try {
        const job = db.createJob(req.body);
        db.appendLog('info', `Queued: [${job.source_type.toUpperCase()}] ${job.name}`);
        res.json(job);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// List jobs
app.get('/api/jobs', (req, res) => {
    const filter = req.query.filter || 'all';
    res.json(db.getJobs(filter));
});

// Update job
app.put('/api/jobs/:id', (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const body = req.body;

        // Auto-set timestamps
        if (body.status === 'processing' && !body.startedAt) {
            body.startedAt = new Date().toISOString();
        }
        if ((body.status === 'done' || body.status === 'failed') && !body.doneAt) {
            body.doneAt = new Date().toISOString();
        }

        const job = db.updateJob(id, body);
        if (!job) return res.status(404).json({ error: 'Job not found' });

        // Auto-log status changes
        if (body.status === 'done') db.appendLog('ok', `✓ Done: ${job.name}`);
        if (body.status === 'failed') db.appendLog('err', `Failed: ${job.name} — ${body.errorMsg || 'Unknown error'}`);
        if (body.status === 'processing') db.appendLog('info', `Started: ${job.name}`);

        res.json(job);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Delete job
app.delete('/api/jobs/:id', (req, res) => {
    db.deleteJob(parseInt(req.params.id));
    res.json({ success: true });
});

// Clear done/failed
app.delete('/api/jobs', (req, res) => {
    if (req.query.status === 'done') {
        db.clearDoneJobs();
        res.json({ success: true });
    } else {
        res.status(400).json({ error: 'Specify ?status=done to clear completed jobs' });
    }
});

// ══════════════════════════════════════════════
//  YOUTUBE VIDEOS & PLAYLISTS API
// ══════════════════════════════════════════════
app.post('/api/yt/videos', (req, res) => {
    try {
        db.addYtVideo(req.body);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.put('/api/yt/videos/:vid', (req, res) => {
    db.updateYtVideo(req.params.vid, req.body.status);
    res.json({ success: true });
});

app.delete('/api/yt/videos/:vid', (req, res) => {
    db.deleteYtVideo(req.params.vid);
    res.json({ success: true });
});

app.delete('/api/yt/videos', (req, res) => {
    db.clearYtVideos();
    res.json({ success: true });
});

app.post('/api/yt/playlists', (req, res) => {
    try {
        const pl = db.addYtPlaylist(req.body);
        res.json(pl);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.put('/api/yt/playlists/:id', (req, res) => {
    db.updateYtPlaylist(parseInt(req.params.id), req.body.status, req.body.progress || 0);
    res.json({ success: true });
});

app.delete('/api/yt/playlists/:id', (req, res) => {
    db.deleteYtPlaylist(parseInt(req.params.id));
    res.json({ success: true });
});

app.delete('/api/yt/playlists', (req, res) => {
    db.clearYtPlaylists();
    res.json({ success: true });
});

// ══════════════════════════════════════════════
//  SETTINGS API
// ══════════════════════════════════════════════
app.get('/api/settings', (req, res) => {
    res.json(db.getAllSettings());
});

app.post('/api/settings', (req, res) => {
    const { key, value } = req.body;
    if (!key) return res.status(400).json({ error: 'key required' });
    db.saveSetting(key, value);
    res.json({ success: true });
});

// Save multiple settings at once
app.put('/api/settings', (req, res) => {
    const settings = req.body; // { key: value, ... }
    Object.entries(settings).forEach(([k, v]) => db.saveSetting(k, v));
    res.json({ success: true });
});

// ══════════════════════════════════════════════
//  LOGS API
// ══════════════════════════════════════════════
app.get('/api/logs', (req, res) => {
    res.json(db.getRecentLogs());
});

app.post('/api/logs', (req, res) => {
    const { level, message } = req.body;
    db.appendLog(level || 'info', message || '');
    res.json({ success: true });
});

// ══════════════════════════════════════════════
//  PROXY ENDPOINTS → AI SERVICES
// ══════════════════════════════════════════════

// Proxy: YouTube info from Whisper backend
app.post('/api/proxy/yt/info', async (req, res) => {
    try {
        const r = await fetch(`${WHISPER_URL}/api/youtube/info`, {
            method: 'POST',
            body: JSON.stringify(req.body),
            headers: { 'Content-Type': 'application/json' }
        });
        const data = await r.json();
        if (!r.ok) return res.status(r.status).json(data);
        res.json(data);
    } catch (err) {
        res.status(502).json({ error: 'Whisper backend unreachable', detail: err.message });
    }
});

// Proxy: YouTube playlist from Whisper backend
app.post('/api/proxy/yt/playlist', async (req, res) => {
    try {
        const r = await fetch(`${WHISPER_URL}/api/youtube/playlist`, {
            method: 'POST',
            body: JSON.stringify(req.body),
            headers: { 'Content-Type': 'application/json' }
        });
        const data = await r.json();
        if (!r.ok) return res.status(r.status).json(data);
        res.json(data);
    } catch (err) {
        res.status(502).json({ error: 'Whisper backend unreachable', detail: err.message });
    }
});

// Proxy: Queue YouTube for transcription
app.post('/api/proxy/yt/queue', async (req, res) => {
    try {
        const r = await fetch(`${WHISPER_URL}/api/youtube/queue`, {
            method: 'POST',
            body: JSON.stringify(req.body),
            headers: { 'Content-Type': 'application/json' }
        });
        const data = await r.json();
        if (!r.ok) return res.status(r.status).json(data);
        res.json(data);
    } catch (err) {
        res.status(502).json({ error: 'Whisper backend unreachable', detail: err.message });
    }
});

// Proxy: Get YouTube job status from Whisper backend
app.get('/api/proxy/yt/jobs/:jobId', async (req, res) => {
    try {
        const r = await fetch(`${WHISPER_URL}/api/jobs/${req.params.jobId}`);
        const data = await r.json();
        res.json(data);
    } catch (err) {
        res.status(502).json({ error: 'Whisper backend unreachable', detail: err.message });
    }
});

// Proxy: Analyze image via Qwen
app.post('/api/proxy/image', upload.single('image'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ error: 'No image uploaded' });
        const fd = new FormData();
        fd.append('image', fs.createReadStream(req.file.path), req.file.originalname);
        fd.append('prompt', req.body.prompt || 'Extract all text and describe the visual content.');

        const r = await fetch(`${QWEN_URL}/api/analyze`, { method: 'POST', body: fd, headers: fd.getHeaders() });
        const data = await r.json();

        fs.unlink(req.file.path, () => { });

        if (!r.ok) return res.status(r.status).json(data);
        res.json(data);
    } catch (err) {
        if (req.file) fs.unlink(req.file.path, () => { });
        res.status(502).json({ error: 'Qwen backend unreachable', detail: err.message });
    }
});

// Proxy: Analyze PDF via PyMuPDF
app.post('/api/proxy/pdf', upload.single('pdf'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ error: 'No PDF uploaded' });
        const fd = new FormData();
        fd.append('pdf', fs.createReadStream(req.file.path), req.file.originalname);

        const r = await fetch(`${QWEN_URL}/api/analyze-pdf`, { method: 'POST', body: fd, headers: fd.getHeaders() });
        const data = await r.json();

        fs.unlink(req.file.path, () => { });

        if (!r.ok) return res.status(r.status).json(data);
        res.json(data);
    } catch (err) {
        if (req.file) fs.unlink(req.file.path, () => { });
        res.status(502).json({ error: 'PyMuPDF/Qwen backend unreachable', detail: err.message });
    }
});

// Proxy: Save to NetaBoard DB via main backend
app.post('/api/proxy/ingest', async (req, res) => {
    try {
        const r = await fetch(`${BACKEND_URL}/api/ingest`, {
            method: 'POST',
            body: JSON.stringify(req.body),
            headers: { 'Content-Type': 'application/json' }
        });
        const data = await r.json();
        res.status(r.status).json(data);
    } catch (err) {
        res.status(502).json({ error: 'NetaBoard backend unreachable', detail: err.message });
    }
});

// Proxy: Service health check aggregator
app.get('/api/proxy/health', async (req, res) => {
    const checks = await Promise.allSettled([
        fetch(`${BACKEND_URL}/api/health`, { signal: AbortSignal.timeout(2000) }),
        fetch(`${QWEN_URL}/api/health`, { signal: AbortSignal.timeout(2000) }),
        fetch(`${WHISPER_URL}/api/health`, { signal: AbortSignal.timeout(2000) }),
    ]);
    res.json({
        admin: 'online',
        backend: checks[0].status === 'fulfilled' && checks[0].value.ok ? 'online' : 'offline',
        qwen: checks[1].status === 'fulfilled' && checks[1].value.ok ? 'online' : 'offline',
        whisper: checks[2].status === 'fulfilled' && checks[2].value.ok ? 'online' : 'offline',
    });
});

// ── Serve index.html for all routes (SPA fallback) ──
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ── Start ──
app.listen(PORT, () => {
    console.log(`\n╔══════════════════════════════════════════════════╗`);
    console.log(`║  NetaBoard Admin Dashboard                       ║`);
    console.log(`║  http://localhost:${PORT}                           ║`);
    console.log(`╚══════════════════════════════════════════════════╝\n`);
    db.appendLog('info', `Admin Dashboard server started on port ${PORT}`);
});

module.exports = app;
