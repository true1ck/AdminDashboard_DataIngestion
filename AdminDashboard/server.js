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

// ══════════════════════════════════════════════
//  DATABASE IMPORT — NetaBoardV5 Prisma DB
// ══════════════════════════════════════════════
let prismaStudioProcess = null;

// Test connection to NetaBoardV5 backend or custom DB
app.post('/api/db/test-connection', async (req, res) => {
    try {
        const { uri, host, port, dbName, user, password, dbType } = req.body;
        const dbUrl = uri || (dbType === 'pg' ? `postgresql://${user}:${password}@${host}:${port}/${dbName}` : '');

        if (!dbUrl) {
            return res.json({ ok: false, error: 'No connection URI or valid credentials provided' });
        }

        // Real connection test
        if (dbUrl.startsWith('file:') || dbType === 'sqlite') {
            const dbPath = dbUrl.replace('file:', '');
            const fullPath = path.resolve(__dirname, '..', 'NetaBoardV5', 'backend', 'prisma', dbPath);
            
            if (!fs.existsSync(fullPath)) {
                return res.json({ ok: false, error: `Database file not found at ${fullPath}` });
            }

            // Test SQLite connection directly
            const sqlite3 = require('sqlite3').verbose();
            await new Promise((resolve, reject) => {
                const tempDb = new sqlite3.Database(fullPath, sqlite3.OPEN_READONLY, (err) => {
                    if (err) return reject(new Error('Failed to open database file: ' + err.message));
                });
                
                // Run a simple query to ensure the file is a valid readable SQLite database
                tempDb.get('SELECT sqlite_version()', (err, row) => {
                    tempDb.close();
                    if (err) return reject(new Error('Failed to read from database: ' + err.message));
                    resolve(true);
                });
            });
            console.log(`[DB Test] Successfully connected to SQLite DB: ${dbPath}`);
        } else {
            // Test network connection (TCP) for PG, Redis, Elasticsearch, Qdrant
            const net = require('net');
            const targetHost = host || 'localhost';
            const targetPort = parseInt(port) || (dbType === 'pg' ? 5432 : dbType === 'redis' ? 6379 : 80);
            
            await new Promise((resolve, reject) => {
                const socket = new net.Socket();
                socket.setTimeout(2500);
                
                socket.on('connect', () => {
                    socket.destroy();
                    console.log(`[DB Test] Successfully reached ${dbType.toUpperCase()} on ${targetHost}:${targetPort}`);
                    resolve(true);
                });
                
                socket.on('timeout', () => {
                    socket.destroy();
                    reject(new Error(`Connection to ${targetHost}:${targetPort} timed out`));
                });
                
                socket.on('error', (err) => {
                    socket.destroy();
                    reject(new Error(`Connection refused to ${targetHost}:${targetPort} (${err.code})`));
                });
                
                socket.connect(targetPort, targetHost);
            });
        }

        // Restart Prisma Studio
        if (prismaStudioProcess) {
            try {
                process.kill(-prismaStudioProcess.pid);
            } catch (e) {
                prismaStudioProcess.kill();
            }
            prismaStudioProcess = null;
            await new Promise(resolve => setTimeout(resolve, 800));
        }

        // Spawn Prisma Studio
        const { spawn } = require('child_process');
        const prismaDir = path.join(__dirname, '..', 'NetaBoardV5', 'backend');
        prismaStudioProcess = spawn('npx', ['prisma', 'studio', '--port', '5555', '--browser', 'none'], {
            cwd: prismaDir,
            shell: true,
            stdio: 'ignore',
            detached: false,
            env: { ...process.env, DATABASE_URL: dbUrl }
        });
        prismaStudioProcess.on('exit', () => { prismaStudioProcess = null; });
        prismaStudioProcess.on('error', () => { prismaStudioProcess = null; });

        await new Promise(resolve => setTimeout(resolve, 3000));

        res.json({ ok: true, prismaStudioUrl: 'http://localhost:5555' });
    } catch (err) {
        res.json({ ok: false, error: `Connection failed: ${err.message}` });
    }
});

// Check Prisma Studio status
app.get('/api/db/prisma-status', async (req, res) => {
    try {
        const r = await fetch('http://localhost:5555', { signal: AbortSignal.timeout(2000) });
        res.json({ running: true });
    } catch (e) {
        res.json({ running: false });
    }
});

// List tables from Prisma schema
app.get('/api/db/tables', (req, res) => {
    try {
        const schemaPath = path.join(__dirname, '..', 'NetaBoardV5', 'backend', 'prisma', 'schema.prisma');
        if (!fs.existsSync(schemaPath)) {
            return res.status(404).json({ error: 'Prisma schema not found' });
        }
        const schema = fs.readFileSync(schemaPath, 'utf8');
        const models = [];
        const regex = /^model\s+(\w+)\s*\{/gm;
        let m;
        while ((m = regex.exec(schema)) !== null) {
            models.push(m[1]);
        }
        res.json({ tables: models });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Query the DB directly using sqlite3
app.post('/api/db/query', async (req, res) => {
    const { table, query, limit, uri, host, port, dbName, user, password, dbType } = req.body;
    if (!table) return res.status(400).json({ error: 'Table name required' });

    const dbUrl = uri || (dbType === 'pg' ? `postgresql://${user}:${password}@${host}:${port}/${dbName}` : '');
    const isSqlite = dbUrl.startsWith('file:') || dbType === 'sqlite' || dbType === 'pg'; // pg fallback since Neta schema is sqlite
    const finalLimit = limit || 20;

    if (isSqlite && dbUrl) {
        const dbPath = dbUrl.replace('file:', '');
        const fullPath = path.resolve(__dirname, '..', 'NetaBoardV5', 'backend', 'prisma', dbPath);
        
        if (!fs.existsSync(fullPath)) {
            return res.json({ ok: false, error: `Database file not found at ${fullPath}` });
        }

        const sqlite3 = require('sqlite3').verbose();
        const tempDb = new sqlite3.Database(fullPath, sqlite3.OPEN_READONLY, (err) => {
            if (err) return res.json({ ok: false, error: 'Cannot open DB: ' + err.message });
        });

        // Use custom query if provided, else simple SELECT
        const sql = query && query.trim() !== '' ? query : `SELECT * FROM ${table} LIMIT ${finalLimit}`;
        console.log(`[DB Query] Executing SQL: ${sql}`);

        tempDb.all(sql, [], (err, rows) => {
            tempDb.close();
            if (err) {
                console.error(`[DB Query] Error: ${err.message}`);
                return res.json({ ok: false, error: `Query failed: ${err.message}` });
            }
            console.log(`[DB Query] Success: ${rows.length} rows returned`);
            res.json({ ok: true, rows: rows, count: rows.length });
        });
    } else {
        // Fallback or non-SQLite database logic
        res.json({ ok: true, rows: [], count: 0, note: `Custom query engine not implemented for ${dbType}. Use Prisma Studio to browse.` });
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
//  SAVED QUERIES API
// ══════════════════════════════════════════════
app.get('/api/db/saved-queries', async (req, res) => {
    try { res.json(await db.getSavedQueries()); }
    catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/db/saved-queries', async (req, res) => {
    try { res.json(await db.createSavedQuery(req.body)); }
    catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete('/api/db/saved-queries/:id', async (req, res) => {
    try {
        await db.deleteSavedQuery(parseInt(req.params.id));
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
    const { dbType, uri, table, query, mapping, tables, batch } = config;
    const state = activeDbImports[jobId];
    const logPrefix = `[Import ${jobId}]`;

    try {
        if (dbType !== 'sqlite') throw new Error(`Only SQLite currently supported for ingestion.`);

        let dbPath = uri.startsWith('file:') ? path.resolve(uri.replace('file:', '')) : path.resolve(uri);
        
        // Robust relative path checking
        if (!fs.existsSync(dbPath)) {
            const relPath1 = path.resolve(__dirname, uri.replace('file:', ''));
            const relPath2 = path.resolve(__dirname, '..', uri.replace('file:', ''));
            const relPath3 = path.resolve(__dirname, '..', 'NetaBoardV5', 'backend', 'prisma', uri.replace('file:', ''));
            
            if (fs.existsSync(relPath1)) dbPath = relPath1;
            else if (fs.existsSync(relPath2)) dbPath = relPath2;
            else if (fs.existsSync(relPath3)) dbPath = relPath3;
            else throw new Error(`Database not found: ${dbPath} (checked project-specific locations)`);
        }

        console.log(`${logPrefix} Connecting to: ${dbPath}`);
        const sourceDb = new sqlite3.Database(dbPath, sqlite3.OPEN_READONLY);
        
        // Descriptive filename generation
        let baseName = "db_import";
        if (tables === 'all') baseName = "Full_DB_Sync";
        else if (batch && batch.length) baseName = `Batch_Import_${batch.length}_Queries`;
        else if (table) baseName = `Table_${table}`;
        else if (query) baseName = `Query_Result`;
        
        const safeName = baseName.replace(/[^a-z0-9_\-]/gi, '_');
        const outputPath = path.join(DATA_COLLECTED_DIR, `${safeName}_${jobId}.txt`);
        const fileStream = fs.createWriteStream(outputPath);

        // 1. Build the list of tasks (table or query)
        let tasks = [];
        if (batch && Array.isArray(batch)) {
            tasks = batch; // [{ name, query, mapping }]
        } else if (tables === 'all') {
            const allTables = await new Promise((res, rej) => {
                sourceDb.all("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE 'prisma_%'", [], (err, rows) => err ? rej(err) : res(rows));
            });
            tasks = allTables.map(t => ({ name: t.name, table: t.name, mapping }));
        } else {
            tasks = [{ name: table || 'Custom Query', table, query, mapping }];
        }

        // 2. Count total rows across all tasks
        let totalRows = 0;
        for (const t of tasks) {
            const countSql = t.query ? `SELECT COUNT(*) as cnt FROM (${t.query})` : `SELECT COUNT(*) as cnt FROM ${t.table}`;
            const count = await new Promise((res, rej) => sourceDb.get(countSql, [], (err, row) => err ? rej(err) : res(row.cnt)));
            t.total = count;
            totalRows += count;
        }
        state.total = totalRows;
        await db.updateJob(jobId, { status: 'processing', progress: 0 });

        // 3. Process sequentially
        let globalIdx = 0;
        fileStream.write(`# Consolidated DB Import Job #${jobId}\n# Date: ${new Date().toISOString()}\n# Source: ${dbPath}\n\n`);

        for (const t of tasks) {
            console.log(`${logPrefix} Processing ${t.name}...`);
            const sql = t.query || `SELECT * FROM ${t.table}`;
            
            fileStream.write(`\n## SECTION: ${t.name}\n`);
            if (t.query) fileStream.write(`### SQL: ${t.query}\n`);
            fileStream.write(`${'='.repeat(20)}\n\n`);
            
            const rows = await new Promise((res, rej) => sourceDb.all(sql, [], (err, rows) => err ? rej(err) : res(rows)));

            for (const row of rows) {
                // Formatting
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

                // Push to NetaBoard
                try {
                    await fetch(`${BACKEND_URL}/api/ingest`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(payload)
                    });
                } catch (e) { console.warn(`${logPrefix} Push error:`, e.message); }

                // Save to file
                fileStream.write(`${'#'.repeat(10)}\n${payload.title}\n${payload.content}\n\n`);

                globalIdx++;
                state.processed = globalIdx;
                state.progress = Math.round((globalIdx / totalRows) * 100);
                
                if (globalIdx % 10 === 0) {
                    await db.updateJob(jobId, { progress: state.progress, itemsProcessed: globalIdx });
                }
                
                // Throttle
                await new Promise(r => setTimeout(r, 10));
            }
        }

        fileStream.end();
        sourceDb.close();
        
        state.status = 'done';
        await db.updateJob(jobId, { status: 'done', progress: 100, itemsProcessed: totalRows });
        console.log(`${logPrefix} Successfully saved to ${outputPath}`);

    } catch (err) {
        state.status = 'failed';
        state.error = err.message;
        throw err;
    }
}

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
