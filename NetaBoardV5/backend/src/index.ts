import express from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();
const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Health Check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'NetaBoard Backend is running' });
});

// 1. Get Archetypes (Leaders)
app.get('/api/archetypes', async (req, res) => {
    try {
        const archetypes = await prisma.archetype.findMany({
            include: {
                constituency: true,
                pillarScores: true,
                sansadRecord: true,
            }
        });
        res.json(archetypes);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch archetypes' });
    }
});

// 2. Get Jan Darbar Feedback
app.get('/api/feedback', async (req, res) => {
    try {
        const feedback = await prisma.feedback.findMany({
            orderBy: { timestamp: 'desc' }
        });
        res.json(feedback);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch feedback' });
    }
});

// 3. Get Social Inbox Items
app.get('/api/social', async (req, res) => {
    try {
        const socialItems = await prisma.socialItem.findMany({
            orderBy: { timestamp: 'desc' }
        });
        res.json(socialItems);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch social items' });
    }
});

// 4. Get Alerts & Crises
app.get('/api/alerts', async (req, res) => {
    try {
        const alerts = await prisma.alert.findMany({
            orderBy: { timestamp: 'desc' }
        });
        res.json(alerts);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch alerts' });
    }
});

// 5. Get Channels & Integrations
app.get('/api/channels', async (req, res) => {
    try {
        const channels = await prisma.channel.findMany({
            include: { instances: true }
        });
        res.json(channels);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch channels' });
    }
});

// 6. Universal Ingestion Endpoint (From Pipelines)
app.post('/api/ingest', async (req, res) => {
    try {
        const { source, content, author, title, fileName, fileData } = req.body;

        // ── SAVE TO FILE SYSTEM (`DataCollected` folder) ──
        try {
            const dataCollectedDir = path.resolve(process.cwd(), '../../DataCollected');

            // Create a direct folder for the item based on its title or source
            let folderName = (title || source || 'Unknown').replace(/[^a-zA-Z0-9]/g, '_');
            const targetFolder = path.join(dataCollectedDir, folderName);

            if (!fs.existsSync(targetFolder)) {
                fs.mkdirSync(targetFolder, { recursive: true });
            }

            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const fileHeader = `Timestamp: ${new Date().toISOString()}\nSource: ${source}\nAuthor: ${author}\n${'='.repeat(40)}\n\n`;

            // Save extracted text
            const textFilePath = path.join(targetFolder, `extracted_text_${timestamp}.txt`);
            fs.writeFileSync(textFilePath, fileHeader + (content || ''));
            console.log(`[Ingest] Saved text to -> ${textFilePath}`);

            // Save original file if provided
            if (fileData && fileName) {
                const origFilePath = path.join(targetFolder, fileName.replace(/[^a-zA-Z0-9.-]/g, '_'));
                const base64Data = fileData.includes(',') ? fileData.split(',')[1] : fileData;
                fs.writeFileSync(origFilePath, Buffer.from(base64Data, 'base64'));
                console.log(`[Ingest] Saved original file to -> ${origFilePath}`);
            }
        } catch (fsError) {
            console.error('[Ingest] File system save failed: ', fsError);
        }

        // ── SAVE TO DATABASE (SQLite) ──
        const item = await prisma.socialItem.create({
            data: {
                platform: source || 'Pipeline',
                author: author || 'Automated Parser',
                timestamp: new Date(),
                text: content || '',
                sentiment: 0.0,
                emotion: 'neutral',
                likes: Math.floor(Math.random() * 50),
                reposts: 0
            }
        });
        res.json({ success: true, item });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to ingest record' });
    }
});

// ==========================================
// Phase 2 + 3: Job Queue & Proxy Routes
// ==========================================
import axios from 'axios';
import multer from 'multer';

const upload = multer({ dest: 'uploads/' });

// Create a new job
app.post('/api/jobs', async (req, res) => {
    try {
        const { name, sourceType, totalItems } = req.body;
        const job = await prisma.ingestJob.create({
            data: {
                name: name || 'Unnamed Job',
                sourceType: sourceType || 'unknown',
                totalItems: Number(totalItems) || 1,
            }
        });
        res.json(job);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to create job' });
    }
});

// List jobs
app.get('/api/jobs', async (req, res) => {
    try {
        const jobs = await prisma.ingestJob.findMany({
            orderBy: { createdAt: 'desc' },
            take: 50
        });
        res.json(jobs);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch jobs' });
    }
});

// Update an existing job status/progress from frontend
app.put('/api/jobs/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { status, progress, itemsProcessed, logs } = req.body;

        const dataToUpdate: any = {};
        if (status) dataToUpdate.status = status;
        if (progress !== undefined) dataToUpdate.progress = progress;
        if (itemsProcessed !== undefined) dataToUpdate.itemsProcessed = itemsProcessed;
        if (status === 'done' || status === 'failed') dataToUpdate.completedAt = new Date();

        if (logs) {
            const existingJob = await prisma.ingestJob.findUnique({ where: { id } });
            if (existingJob) {
                const currentLogs = JSON.parse(existingJob.logs || '[]');
                currentLogs.push(logs);
                dataToUpdate.logs = JSON.stringify(currentLogs);
            }
        }

        const job = await prisma.ingestJob.update({
            where: { id },
            data: dataToUpdate
        });
        res.json(job);
    } catch (error) {
        res.status(500).json({ error: 'Failed to update job' });
    }
});

app.delete('/api/jobs/:id', async (req, res) => {
    try {
        await prisma.ingestJob.delete({ where: { id: req.params.id } });
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete job' });
    }
});

// Proxy to PyMuPDF and Qwen
app.post('/api/proxy/analyze', upload.single('file'), async (req, res) => {
    try {
        const file = req.file;
        const isPdf = req.body.isPdf === 'true';
        const url = isPdf ? 'http://localhost:5001/api/analyze-pdf' : 'http://localhost:5001/api/analyze';

        if (!file) {
            return res.status(400).json({ error: 'No file provided' });
        }

        const FormData = require('form-data');
        const formData = new FormData();
        const fileKey = isPdf ? 'pdf' : 'image';
        formData.append(fileKey, fs.createReadStream(file.path), file.originalname);
        if (!isPdf && req.body.prompt) {
            formData.append('prompt', req.body.prompt);
        }

        const config = { headers: { ...formData.getHeaders() } };
        const response = await axios.post(url, formData, config);

        // Clean up temp file
        fs.unlinkSync(file.path);

        res.json(response.data);
    } catch (error: any) {
        if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
        res.status(error.response?.status || 500).json(error.response?.data || { error: 'Proxy error' });
    }
});

// Proxy to YouTube/Whisper endpoints
app.post('/api/proxy/youtube/:action', async (req, res) => {
    try {
        const { action } = req.params;
        const url = `http://localhost:8000/api/youtube/${action}`;
        const response = await axios.post(url, req.body);
        res.json(response.data);
    } catch (error: any) {
        res.status(error.response?.status || 500).json(error.response?.data || { error: 'Proxy error' });
    }
});

app.get('/api/proxy/jobs/:id', async (req, res) => {
    try {
        const response = await axios.get(`http://localhost:8000/api/jobs/${req.params.id}`);
        res.json(response.data);
    } catch (error: any) {
        res.status(error.response?.status || 500).json(error.response?.data || { error: 'Proxy error' });
    }
});

// Phase 5: Health Check All
app.get('/api/health/all', async (req, res) => {
    const statuses: any = { backend: 'online', frontend: 'online', qwen: 'offline', whisper: 'offline' };
    try {
        await axios.get('http://localhost:5001/api/health', { timeout: 2000 });
        statuses.qwen = 'online';
    } catch (e) { }
    try {
        await axios.get('http://localhost:8000/api/health', { timeout: 2000 });
        statuses.whisper = 'online';
    } catch (e) { }
    res.json(statuses);
});

// ==========================================
// Phase 4: Data Vault Explorer
// ==========================================
app.get('/api/vault', (req, res) => {
    try {
        const dataCollectedDir = path.resolve(process.cwd(), '../../DataCollected');
        if (!fs.existsSync(dataCollectedDir)) return res.json([]);

        const folders = fs.readdirSync(dataCollectedDir, { withFileTypes: true })
            .filter(dirent => dirent.isDirectory())
            .map(dirent => {
                const folderPath = path.join(dataCollectedDir, dirent.name);
                const files = fs.readdirSync(folderPath);
                return {
                    name: dirent.name,
                    fileCount: files.length,
                    timestamp: fs.statSync(folderPath).mtime
                };
            });
        res.json(folders.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()));
    } catch (e) {
        res.status(500).json({ error: 'Vault access error' });
    }
});

app.get('/api/vault/:folder', (req, res) => {
    try {
        const folderPath = path.resolve(process.cwd(), '../../DataCollected', req.params.folder);
        if (!fs.existsSync(folderPath)) return res.status(404).json({ error: 'Not found' });

        const files = fs.readdirSync(folderPath)
            .filter(file => !file.startsWith('.'))
            .map(file => {
                const stat = fs.statSync(path.join(folderPath, file));
                return {
                    name: file,
                    size: stat.size,
                    timestamp: stat.mtime
                };
            });
        res.json(files);
    } catch (e) {
        res.status(500).json({ error: 'Vault access error' });
    }
});

app.get('/api/vault/:folder/:file', (req, res) => {
    try {
        const filePath = path.resolve(process.cwd(), '../../DataCollected', req.params.folder, req.params.file);
        if (!fs.existsSync(filePath)) return res.status(404).json({ error: 'Not found' });

        if (filePath.endsWith('.txt')) {
            const content = fs.readFileSync(filePath, 'utf-8');
            res.send(content);
        } else {
            res.download(filePath);
        }
    } catch (e) {
        res.status(500).json({ error: 'Vault access error' });
    }
});

app.delete('/api/vault/:folder', (req, res) => {
    try {
        const folderPath = path.resolve(process.cwd(), '../../DataCollected', req.params.folder);
        if (fs.existsSync(folderPath)) {
            fs.rmSync(folderPath, { recursive: true, force: true });
        }
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ error: 'Failed to delete' });
    }
});

// Start Server
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
