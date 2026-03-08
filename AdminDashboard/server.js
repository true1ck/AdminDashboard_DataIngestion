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
const sqlite3 = require('sqlite3').verbose();

const db = require('./db');

const app = express();
const PORT = process.env.ADMIN_PORT || 4000;
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3000';
const WHISPER_URL = process.env.WHISPER_URL || 'http://localhost:8000';
const QWEN_URL = process.env.QWEN_URL || 'http://localhost:5001';
const TWITTER_URL = process.env.TWITTER_URL || 'http://localhost:6060';
const FACEBOOK_URL = process.env.FACEBOOK_URL || 'http://localhost:7070';

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
//  SERVERS MANAGEMENT API
// ══════════════════════════════════════════════
const net = require('net');
const { exec } = require('child_process');

const SERVERS = [
    { id: 'backend', name: 'NetaBoard Backend', port: 3000, type: 'node', path: '../NetaBoardV5/backend', cmd: 'npm install --silent && npm run dev', desc: 'Main Express API connecting DB and React frontend' },
    { id: 'qwen', name: 'ImageToTextQwen', port: 5001, type: 'flask', path: '../ImageToTextQwen/backend', cmd: 'source venv/bin/activate && python3 app.py', desc: 'Offline Qwen Vision OCR engine API' },
    { id: 'whisper', name: 'MediaToTextWhisper', port: 8000, type: 'fastapi', path: '../MediaToTextWhisper/backend', cmd: 'source venv/bin/activate && python3 main.py', desc: 'FastAPI server for local Whisper audio transcription' },
    { id: 'twitter', name: 'TwitterIngestionServer', port: 6060, type: 'flask', path: '../TwitterIngestionServer/backend', cmd: 'source venv/bin/activate && python3 app.py', desc: 'Flask Python microservice for scraping Twitter' },
    { id: 'facebook', name: 'FacebookIngestionServer', port: 7070, type: 'flask', path: '../FacebookIngestionServer/backend', cmd: 'source venv/bin/activate && python3 app.py', desc: 'Flask endpoint wrapping Meta Graph APIs' },
    { id: 'admin', name: 'Admin Dashboard', port: 4000, type: 'node', path: '.', cmd: 'npm install --silent && node server.js', desc: 'Central orchestration dashboard (This node)' },
    { id: 'frontend', name: 'NetaBoard App', port: 5180, type: 'vite', path: '../NetaBoardV5', cmd: 'npm install --silent && npm run dev', desc: 'Vite React user interface application' }
];

function checkPortHost(port, host) {
    return new Promise((resolve) => {
        const socket = new net.Socket();
        socket.setTimeout(800);
        socket.on('connect', () => { socket.destroy(); resolve(true); });
        socket.on('timeout', () => { socket.destroy(); resolve(false); });
        socket.on('error', () => { socket.destroy(); resolve(false); });
        socket.connect(port, host);
    });
}

async function checkPort(port) {
    let isUp = await checkPortHost(port, '127.0.0.1');
    if (!isUp) {
        isUp = await checkPortHost(port, '::1');
    }
    return isUp;
}

function killPort(port) {
    return new Promise((resolve) => {
        exec(`lsof -t -i:${port}`, (err, stdout) => {
            if (stdout) {
                const pid = stdout.trim().split('\\n')[0]; // Safe kill
                exec(`kill -9 ${pid}`, () => resolve(true));
            } else {
                resolve(true);
            }
        });
    });
}

function startServerProcess(srv) {
    return new Promise((resolve) => {
        const absPath = path.resolve(__dirname, srv.path);
        const script = `osascript -e 'tell application "Terminal"' -e 'do script "printf \\"\\\\\\\\033[1m[${srv.name}]\\\\\\\\033[0m\\\\\\\\n\\" && cd \\"${absPath}\\" && ${srv.cmd}"' -e 'activate' -e 'end tell'`;
        exec(script, () => resolve(true));
    });
}

app.get('/api/servers', async (req, res) => {
    const statusPromises = SERVERS.map(async (s) => {
        const isUp = await checkPort(s.port);
        return { ...s, status: isUp ? 'online' : 'offline' };
    });
    const results = await Promise.all(statusPromises);
    res.json({ servers: results });
});

app.post('/api/servers/:id/control', async (req, res) => {
    try {
        const srv = SERVERS.find(s => s.id === req.params.id);
        if (!srv) return res.status(404).json({ error: 'Server not found' });

        const action = req.body.action;

        if (action === 'stop' || action === 'restart') {
            await killPort(srv.port);
            if (action === 'stop') await new Promise(r => setTimeout(r, 500));
        }

        if (action === 'start' || action === 'restart') {
            if (srv.id !== 'admin' || action === 'start') {
                await startServerProcess(srv);
            }
        }

        res.json({ success: true, server: req.params.id, action });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

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
        if (req.body.strategy) fd.append('strategy', req.body.strategy);

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

// Proxy: Twitter Ingestion Processor
app.post('/api/proxy/twitter-ingest', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ error: 'No dataset uploaded' });
        const fd = new FormData();
        fd.append('file', fs.createReadStream(req.file.path), req.file.originalname);
        if (req.body.meta) fd.append('meta', req.body.meta);

        const r = await fetch(`${TWITTER_URL}/api/process-twitter`, {
            method: 'POST',
            body: fd,
            headers: fd.getHeaders()
        });
        const data = await r.json();

        fs.unlink(req.file.path, () => { });

        if (!r.ok) return res.status(r.status).json(data);
        res.json(data);
    } catch (err) {
        if (req.file) fs.unlink(req.file.path, () => { });
        res.status(502).json({ error: 'Twitter Ingestion Server unreachable', detail: err.message });
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

// Write scraped results to local DataCollected folder
app.post('/api/save_local_file', async (req, res) => {
    try {
        const { folder, filename, content } = req.body;
        if (!folder || !filename) {
            return res.status(400).json({ error: 'Missing folder or filename' });
        }

        // DataCollected is located one level up from AdminDashboard
        const targetDir = path.join(__dirname, '..', 'DataCollected', folder);

        if (!fs.existsSync(targetDir)) {
            fs.mkdirSync(targetDir, { recursive: true });
        }

        const targetFile = path.join(targetDir, filename);
        fs.writeFileSync(targetFile, content, 'utf8');

        res.json({ success: true, path: targetFile });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// List DataCollected contents
app.get('/api/fs/datacollected', async (req, res) => {
    try {
        const rootDir = path.join(__dirname, '..', 'DataCollected');
        if (!fs.existsSync(rootDir)) {
            return res.json({ files: [] });
        }

        const filesList = [];

        function scanDir(dir, relPath = '') {
            try {
                const entries = fs.readdirSync(dir, { withFileTypes: true });
                for (const entry of entries) {
                    if (entry.name.startsWith('.')) continue; // skip hidden

                    const fullPath = path.join(dir, entry.name);
                    const itemRelPath = path.join(relPath, entry.name);

                    if (entry.isDirectory()) {
                        scanDir(fullPath, itemRelPath);
                    } else if (entry.isFile()) {
                        const stats = fs.statSync(fullPath);
                        filesList.push({
                            name: entry.name,
                            path: itemRelPath,
                            size: stats.size,
                            modified: stats.mtime
                        });
                    }
                }
            } catch (e) { }
        }

        scanDir(rootDir);
        res.json({ files: filesList });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Read file from DataCollected
app.get('/api/fs/datacollected/file', async (req, res) => {
    try {
        const filePath = req.query.path;
        if (!filePath) return res.status(400).json({ error: 'Missing path' });

        const rootDir = path.join(__dirname, '..', 'DataCollected');
        const targetPath = path.join(rootDir, filePath);

        // Security check - prevent escaping directory
        if (!targetPath.startsWith(path.resolve(rootDir))) {
            return res.status(403).json({ error: 'Access denied' });
        }

        if (!fs.existsSync(targetPath)) {
            return res.status(404).json({ error: 'File not found' });
        }

        // Return raw file contents
        const content = fs.readFileSync(targetPath, 'utf8');
        res.send(content);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Helper function for proxying requests with file uploads
async function proxyRequest(req, res, targetUrl, targetPath) {
    try {
        const fd = new FormData();
        if (req.file) {
            fd.append('file', fs.createReadStream(req.file.path), req.file.originalname);
        }
        // Append other body fields
        for (const key in req.body) {
            if (key !== 'file') { // 'file' is handled by req.file
                fd.append(key, req.body[key]);
            }
        }

        const r = await fetch(`${targetUrl}${targetPath}`, {
            method: req.method,
            body: fd,
            headers: fd.getHeaders()
        });
        const data = await r.json();

        if (req.file) fs.unlink(req.file.path, () => { });

        if (!r.ok) return res.status(r.status).json(data);
        res.json(data);
    } catch (err) {
        if (req.file) fs.unlink(req.file.path, () => { });
        res.status(502).json({ error: `${targetUrl} backend unreachable`, detail: err.message });
    }
}

// Proxy: Twitter Ingestion Processor (refactored to use proxyRequest)
app.all('/api/proxy/twitter-ingest', upload.single('file'), (req, res) => {
    proxyRequest(req, res, TWITTER_URL, '/api/process-twitter');
});

// Proxy: Facebook Ingestion Processor
app.all('/api/proxy/facebook-ingest', upload.single('file'), (req, res) => {
    proxyRequest(req, res, FACEBOOK_URL, '/api/process-facebook');
});


// List discovered tables
app.get('/api/db/tables', (req, res) => {
    res.json({ tables: knownTables });
});

let knownTables = [];

async function fetchKnownTables(client) {
    const tableRes = await client.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_type = 'BASE TABLE'
        ORDER BY table_name
    `);
    const tables = tableRes.rows.map(r => r.table_name);
    knownTables = tables;
    return tables;
}

function autoQuotePgQuery(sql, tables = []) {
    if (!sql) return sql;
    let modified = sql;
    const targetList = tables.length > 0 ? tables : knownTables;

    targetList.forEach(tableName => {
        const regex = new RegExp(`(?<!["'\\w])${tableName}(?!["'\\w])`, 'gi');
        modified = modified.replace(regex, `"${tableName}"`);
    });
    return modified;
}

// Query the DB directly
app.post('/api/db/query', async (req, res) => {
    const { table, query, limit, host, port, dbName, user, password } = req.body;
    if (!table && !query) return res.status(400).json({ error: 'Table name or query required' });

    const dbUrl = `postgresql://${user}:${password}@${host}:${port}/${dbName}`;
    const finalLimit = limit || 20;

    const { Client } = require('pg');
    const client = new Client({ connectionString: dbUrl });

    try {
        await client.connect();

        // Ensure we have table metadata for quoting
        if (knownTables.length === 0) {
            console.log("[DB Query] knownTables empty, performing quick introspection...");
            await fetchKnownTables(client);
        }

        let sql = query && query.trim() !== '' ? query : `SELECT * FROM "${table}" LIMIT ${finalLimit}`;
        if (query && query.trim() !== '') {
            sql = autoQuotePgQuery(sql);
        }

        console.log(`[DB Query] Executing Postgres: ${sql}`);

        const dbRes = await client.query(sql);
        await client.end();
        res.json({ ok: true, rows: dbRes.rows, count: dbRes.rowCount });
    } catch (err) {
        console.error(`[DB Query] Error: ${err.message}`);
        res.json({ ok: false, error: `Postgres query failed: ${err.message}` });
        try { await client.end(); } catch (e) { }
    }
});

let prismaStudioProcess = null;

// Test connection and introspect tables
app.post('/api/db/test-connection', async (req, res) => {
    const { host, port, dbName, user, password } = req.body;
    const dbUrl = `postgresql://${user}:${password}@${host}:${port}/${dbName}`;

    const { Client } = require('pg');
    const client = new Client({ connectionString: dbUrl });

    try {
        await client.connect();
        const tables = await fetchKnownTables(client);
        await client.end();

        // ── OPTIONAL: Launch Prisma Studio if in NetaBoard environment ──
        let prismaStudioUrl = null;
        const prismaDir = path.join(__dirname, '..', 'NetaBoardV5', 'backend');
        if (fs.existsSync(prismaDir)) {
            console.log(`[DB Test] Prisma environment detected at ${prismaDir}. Attempting to launch Studio...`);

            // Kill existing
            if (prismaStudioProcess) {
                try { process.kill(-prismaStudioProcess.pid); } catch (e) { prismaStudioProcess.kill(); }
                prismaStudioProcess = null;
                await new Promise(r => setTimeout(r, 800));
            }

            // Spawn
            const { spawn } = require('child_process');
            prismaStudioProcess = spawn('npx', ['prisma', 'studio', '--port', '5555', '--browser', 'none'], {
                cwd: prismaDir,
                shell: true,
                stdio: 'ignore',
                detached: false,
                env: { ...process.env, DATABASE_URL: dbUrl }
            });
            prismaStudioProcess.on('exit', () => { prismaStudioProcess = null; });
            prismaStudioProcess.on('error', () => { prismaStudioProcess = null; });

            // Give it a moment to boot
            await new Promise(r => setTimeout(r, 2000));
            prismaStudioUrl = 'http://localhost:5555';
        }

        res.json({
            ok: true,
            tables: knownTables,
            prismaStudioUrl,
            message: `Connected successfully. Discovered ${knownTables.length} tables.${prismaStudioUrl ? ' Prisma Studio ready.' : ''}`
        });
    } catch (err) {
        console.error(`[DB Test] Error: ${err.message}`);
        res.json({ ok: false, error: err.message });
        try { await client.end(); } catch (e) { }
    }
});

// Check Prisma Studio status
app.get('/api/db/prisma-status', async (req, res) => {
    if (!prismaStudioProcess) return res.json({ running: false });
    try {
        const r = await fetch('http://localhost:5555', { signal: AbortSignal.timeout(1000) });
        res.json({ running: r.ok });
    } catch (e) {
        res.json({ running: false });
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

const DATA_COLLECTED_DIR = path.join(__dirname, '..', 'DataCollected', 'database');
if (!fs.existsSync(DATA_COLLECTED_DIR)) fs.mkdirSync(DATA_COLLECTED_DIR, { recursive: true });

// ══════════════════════════════════════════════
//  SAVED QUERIES API (In-Memory Session Storage)
// ══════════════════════════════════════════════
let sessionSavedQueries = [];
let nextQueryId = 1;

app.get('/api/db/saved-queries', async (req, res) => {
    try {
        res.json(sessionSavedQueries);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/db/saved-queries', async (req, res) => {
    try {
        const newQuery = {
            ...req.body,
            id: nextQueryId++,
            created_at: new Date().toISOString()
        };
        sessionSavedQueries.unshift(newQuery);
        res.json(newQuery);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete('/api/db/saved-queries/:id', async (req, res) => {
    try {
        const idToDelete = parseInt(req.params.id);
        sessionSavedQueries = sessionSavedQueries.filter(q => q.id !== idToDelete);
        res.json({ ok: true });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// ══════════════════════════════════════════════
//  DATABASE IMPORT ENGINE (Phase 2)
// ══════════════════════════════════════════════
const activeDbImports = {};

app.post('/api/db/import', async (req, res) => {
    try {
        const { jobId, config } = req.body;
        if (!jobId || !config) return res.status(400).json({ error: 'Missing jobId or config' });

        activeDbImports[jobId] = { status: 'running', progress: 0, processed: 0, total: 0 };

        runImport(jobId, config).catch(err => {
            console.error(`[Import ${jobId}] Critical:`, err);
            db.updateJob(jobId, { status: 'failed', errorMsg: err.message });
            if (activeDbImports[jobId]) {
                activeDbImports[jobId].status = 'failed';
                activeDbImports[jobId].error = err.message;
            }
        });

        res.json({ ok: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/db/import/status/:jobId', (req, res) => {
    res.json(activeDbImports[req.params.jobId] || { status: 'unknown' });
});

async function runImport(jobId, config) {
    const { dbType, uri, table, query, mapping, tables, batch, host, port, dbName, user, pass } = config;
    const state = activeDbImports[jobId];
    const logPrefix = `[Import ${jobId}]`;

    try {
        let pClient;

        const { Client } = require('pg');
        const connectionString = `postgresql://${user}:${pass}@${host}:${port}/${dbName}?schema=public`;
        console.log(`${logPrefix} Connecting to Postgres: ${connectionString.replace(/:([^@:]+)@/, ':****@')}`);
        pClient = new Client({ connectionString });
        await pClient.connect();

        // Descriptive filename generation
        let baseName = "db_import";
        if (tables === 'all') baseName = "Full_DB_Sync";
        else if (batch && batch.length) baseName = `Batch_Import_${batch.length}_Queries`;
        else if (table) baseName = `Table_${table}`;
        else if (query) baseName = `Query_Result`;

        const safeName = baseName.replace(/[^a-z0-9_\-]/gi, '_');
        const outputPath = path.join(DATA_COLLECTED_DIR, `${safeName}_${jobId}.txt`);
        const fileStream = fs.createWriteStream(outputPath);

        // 1. Build the list of tasks
        let tasks = [];
        if (batch && Array.isArray(batch)) {
            tasks = batch;
        } else if (tables === 'all') {
            const res = await pClient.query("SELECT table_name FROM information_schema.tables WHERE table_schema='public' AND table_type='BASE TABLE'");
            tasks = res.rows.map(t => ({ name: t.table_name, table: t.table_name, mapping }));
        } else {
            tasks = [{ name: table || 'Custom Query', table, query, mapping }];
        }

        // 2. Count total rows
        let totalRows = 0;
        for (const t of tasks) {
            const tableName = t.table ? `"${t.table}"` : null;
            let countSql = t.query ? `SELECT COUNT(*) as cnt FROM (${t.query}) as sub` : `SELECT COUNT(*) as cnt FROM ${tableName}`;

            countSql = autoQuotePgQuery(countSql);

            const res = await pClient.query(countSql);
            const count = parseInt(res.rows[0].cnt);
            t.total = count;
            totalRows += count;
        }
        state.total = totalRows;
        await db.updateJob(jobId, { status: 'processing', progress: 0 });

        // 3. Process sequentially
        let globalIdx = 0;
        fileStream.write(`# Consolidated DB Import Job #${jobId}\n# Date: ${new Date().toISOString()}\n# Source: ${dbType.toUpperCase()}\n\n`);

        for (const t of tasks) {
            const tableName = t.table ? `"${t.table}"` : null;
            let sql = t.query || `SELECT * FROM ${tableName}`;

            sql = autoQuotePgQuery(sql);

            fileStream.write(`\n## SECTION: ${t.name}\n`);
            if (t.query) fileStream.write(`### SQL: ${t.query}\n`);
            fileStream.write(`${'='.repeat(20)}\n\n`);

            const res = await pClient.query(sql);
            const rows = res.rows;

            for (const row of rows) {
                const contentBlock = Object.entries(row)
                    .map(([k, v]) => `- **${k}**: ${v}`)
                    .join('\n');

                const payload = {
                    source: `DB_IMPORT:${t.name}`,
                    title: `${t.name} — Entry #${globalIdx + 1}`,
                    content: `### Row Details\n${contentBlock}`,
                    author: t.mapping && row[t.mapping.author] ? String(row[t.mapping.author]) : 'DB Import',
                    timestamp: t.mapping && row[t.mapping.time] ? new Date(row[t.mapping.time]).toISOString() : new Date().toISOString()
                };

                try {
                    const targetIngestUrl = config.ingestUrl || `${BACKEND_URL}/api/ingest`;
                    await fetch(targetIngestUrl, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ ...payload, skipFileSave: true })
                    });
                } catch (e) { console.warn(`${logPrefix} Push error:`, e.message); }

                fileStream.write(`${'#'.repeat(10)}\n${payload.title}\n${payload.content}\n\n`);

                globalIdx++;
                state.processed = globalIdx;
                state.progress = Math.round((globalIdx / totalRows) * 100);

                if (globalIdx % 10 === 0) {
                    await db.updateJob(jobId, { progress: state.progress, itemsProcessed: globalIdx });
                }
            }
        }

        fileStream.end();
        if (pClient) await pClient.end();

        state.status = 'done';
        await db.updateJob(jobId, { status: 'done', progress: 100, itemsProcessed: totalRows });
        console.log(`${logPrefix} Successfully saved to ${outputPath}`);

    } catch (err) {
        state.status = 'failed';
        state.error = err.message;
        throw err;
    }
}

// ═══════════════════════════════════════════════════════════════
//  MYDATABASE API — Direct SQLite query engine for the MyDB tab
// ═══════════════════════════════════════════════════════════════
const MYDB_PATH = path.join(__dirname, '..', 'NetaBoardV5', 'backend', 'prisma', 'dev.db');

function getMyDb() {
    try {
        const Database = require('better-sqlite3');
        return new Database(MYDB_PATH, { readonly: false });
    } catch (e) {
        return null;
    }
}

// List all tables with row counts
app.get('/api/mydb/tables', (req, res) => {
    const db = getMyDb();
    if (!db) return res.status(500).json({ error: 'better-sqlite3 not available. Run: cd AdminDashboard && npm install better-sqlite3' });
    try {
        const tables = db.prepare(`SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name`).all();
        const result = tables.map(t => {
            try {
                const row = db.prepare(`SELECT COUNT(*) as cnt FROM "${t.name}"`).get();
                return { name: t.name, count: row.cnt };
            } catch (_) { return { name: t.name, count: '?' }; }
        });
        db.close();
        res.json({ tables: result });
    } catch (e) {
        db.close();
        res.status(500).json({ error: e.message });
    }
});

// Run arbitrary SQL query
app.post('/api/mydb/query', (req, res) => {
    const { sql } = req.body || {};
    if (!sql || typeof sql !== 'string') return res.status(400).json({ error: 'sql is required' });
    // Block dangerous statements
    const upper = sql.trim().toUpperCase();
    if (/^\s*(DROP|TRUNCATE|ATTACH|DETACH|PRAGMA\s+key)\b/.test(upper)) {
        return res.status(403).json({ error: 'DROP, TRUNCATE, ATTACH and PRAGMA key are not allowed.' });
    }
    const db = getMyDb();
    if (!db) return res.status(500).json({ error: 'better-sqlite3 not available. Run: cd AdminDashboard && npm install better-sqlite3' });
    try {
        const start = Date.now();
        let rows;
        if (/^\s*(SELECT|EXPLAIN|WITH)\b/i.test(sql)) {
            rows = db.prepare(sql).all();
        } else {
            const info = db.prepare(sql).run();
            rows = [{ affected_rows: info.changes, last_insert_id: info.lastInsertRowid }];
        }
        const ms = Date.now() - start;
        db.close();
        res.json({ rows, ms, count: rows.length });
    } catch (e) {
        db.close();
        res.status(400).json({ error: e.message });
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
