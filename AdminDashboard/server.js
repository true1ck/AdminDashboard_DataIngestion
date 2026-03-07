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
app.get('/api/state', async (req, res) => {
    try {
        const jobs = await db.getJobs('all');
        const ytVideos = await db.getYtVideos();
        const ytPlaylists = await db.getYtPlaylists();
        const settings = await db.getAllSettings();
        const logs = await db.getRecentLogs();
        res.json({ jobs, ytVideos, ytPlaylists, settings, logs });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ══════════════════════════════════════════════
//  JOBS API
// ══════════════════════════════════════════════
// Create job
app.post('/api/jobs', async (req, res) => {
    try {
        const job = await db.createJob(req.body);
        await db.appendLog('info', `Queued: [${job.source_type.toUpperCase()}] ${job.name}`);
        res.json(job);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// List jobs
app.get('/api/jobs', async (req, res) => {
    try {
        const filter = req.query.filter || 'all';
        res.json(await db.getJobs(filter));
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Update job
app.put('/api/jobs/:id', async (req, res) => {
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

        const job = await db.updateJob(id, body);
        if (!job) return res.status(404).json({ error: 'Job not found' });

        // Auto-log status changes
        if (body.status === 'done') await db.appendLog('ok', `✓ Done: ${job.name}`);
        if (body.status === 'failed') await db.appendLog('err', `Failed: ${job.name} — ${body.errorMsg || 'Unknown error'}`);
        if (body.status === 'processing') await db.appendLog('info', `Started: ${job.name}`);

        res.json(job);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Delete job
app.delete('/api/jobs/:id', async (req, res) => {
    try {
        await db.deleteJob(parseInt(req.params.id));
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Clear done/failed
app.delete('/api/jobs', async (req, res) => {
    try {
        if (req.query.status === 'done') {
            await db.clearDoneJobs();
            res.json({ success: true });
        } else {
            res.status(400).json({ error: 'Specify ?status=done to clear completed jobs' });
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ══════════════════════════════════════════════
//  YOUTUBE VIDEOS & PLAYLISTS API
// ══════════════════════════════════════════════
app.post('/api/yt/videos', async (req, res) => {
    try {
        await db.addYtVideo(req.body);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.put('/api/yt/videos/:vid', async (req, res) => {
    try {
        await db.updateYtVideo(req.params.vid, req.body.status);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/yt/videos/:vid', async (req, res) => {
    try {
        await db.deleteYtVideo(req.params.vid);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/yt/videos', async (req, res) => {
    try {
        await db.clearYtVideos();
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/yt/playlists', async (req, res) => {
    try {
        const pl = await db.addYtPlaylist(req.body);
        res.json(pl);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.put('/api/yt/playlists/:id', async (req, res) => {
    try {
        await db.updateYtPlaylist(parseInt(req.params.id), req.body.status, req.body.progress || 0);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/yt/playlists/:id', async (req, res) => {
    try {
        await db.deleteYtPlaylist(parseInt(req.params.id));
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/yt/playlists', async (req, res) => {
    try {
        await db.clearYtPlaylists();
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ══════════════════════════════════════════════
//  SETTINGS API
// ══════════════════════════════════════════════
app.get('/api/settings', async (req, res) => {
    try {
        res.json(await db.getAllSettings());
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/settings', async (req, res) => {
    try {
        const { key, value } = req.body;
        if (!key) return res.status(400).json({ error: 'key required' });
        await db.saveSetting(key, value);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Save multiple settings at once
app.put('/api/settings', async (req, res) => {
    try {
        const settings = req.body; // { key: value, ... }
        for (const [k, v] of Object.entries(settings)) {
            await db.saveSetting(k, v);
        }
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ══════════════════════════════════════════════
//  LOGS API
// ══════════════════════════════════════════════
app.get('/api/logs', async (req, res) => {
    try {
        res.json(await db.getRecentLogs());
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/logs', async (req, res) => {
    try {
        const { level, message } = req.body;
        await db.appendLog(level || 'info', message || '');
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
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
    try {
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
    } catch (err) {
        res.json({ admin: 'online', backend: 'offline', qwen: 'offline', whisper: 'offline' });
    }
});

// ── Serve index.html for all routes (SPA fallback) ──
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ── Start ──
app.listen(PORT, async () => {
    console.log(`\n╔══════════════════════════════════════════════════╗`);
    console.log(`║  NetaBoard Admin Dashboard                       ║`);
    console.log(`║  http://localhost:${PORT}                           ║`);
    console.log(`╚══════════════════════════════════════════════════╝\n`);
    try {
        await db.appendLog('info', `Admin Dashboard server started on port ${PORT}`);
    } catch (e) { }
});

module.exports = app;
