import { useState, useEffect } from 'react';
import axios from 'axios';
import { ModuleProps } from '../ModuleProps';
import { ProgressBar, Tag } from '../shared/Primitives';

const API_BASE = 'http://localhost:3000/api';

interface Job {
    id: string;
    name: string;
    sourceType: string;
    status: string;
    progress: number;
    itemsProcessed: number;
    totalItems: number;
    createdAt: string;
    error?: string;
}

export default function IngestHub({ toast, curPill }: ModuleProps) {
    const [jobs, setJobs] = useState<Job[]>([]);
    const [isUploading, setIsUploading] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [ytUrl, setYtUrl] = useState('');
    const [scrapeUrl, setScrapeUrl] = useState('');

    // Poll for jobs every 2 seconds
    useEffect(() => {
        const fetchJobs = async () => {
            try {
                const res = await axios.get(`${API_BASE}/jobs`);
                setJobs(res.data || []);
            } catch (err) {
                console.error('Failed to fetch jobs', err);
            }
        };

        fetchJobs();
        const timer = setInterval(fetchJobs, 2000);
        return () => clearInterval(timer);
    }, []);

    const handleFileUpload = async (type: 'pdf' | 'image') => {
        if (!selectedFile) return;
        setIsUploading(true);
        let jobId = '';
        try {
            const jobRes = await axios.post(`${API_BASE}/jobs`, {
                name: selectedFile.name,
                sourceType: type,
                totalItems: 1
            });
            jobId = jobRes.data.id;
            toast(`Job Queued: ${selectedFile.name}`, 'info');

            await axios.put(`${API_BASE}/jobs/${jobId}`, { status: 'processing', progress: 20 });

            const formData = new FormData();
            formData.append('file', selectedFile);
            formData.append('isPdf', type === 'pdf' ? 'true' : 'false');

            const analyzeRes = await axios.post(`${API_BASE}/proxy/analyze`, formData);
            await axios.put(`${API_BASE}/jobs/${jobId}`, { progress: 80 });

            const reader = new FileReader();
            const base64Promise = new Promise<string>((resolve) => {
                reader.onload = (e) => resolve(e.target?.result as string);
                reader.readAsDataURL(selectedFile);
            });
            const fileData = await base64Promise;

            await axios.post(`${API_BASE}/ingest`, {
                source: type === 'pdf' ? 'PDF Documents' : 'Image Board',
                title: selectedFile.name,
                fileName: selectedFile.name,
                fileData: fileData,
                content: analyzeRes.data.result,
                author: 'System Extractor'
            });

            await axios.put(`${API_BASE}/jobs/${jobId}`, {
                status: 'done',
                progress: 100,
                itemsProcessed: 1,
                logs: 'Transcription saved to NetaBoard DB'
            });

            toast(`✓ Ingestion Done: ${selectedFile.name}`, 'success');
        } catch (err: any) {
            console.error(err);
            const errMsg = err.response?.data?.error || err.message;
            toast(`Failed: ${errMsg}`, 'error');
            if (jobId) await axios.put(`${API_BASE}/jobs/${jobId}`, { status: 'failed', error: errMsg });
        } finally {
            setIsUploading(false);
            setSelectedFile(null);
        }
    };

    const handleYoutubeSubmit = async () => {
        if (!ytUrl) return;
        try {
            toast('Fetching YouTube metadata...', 'info');
            const infoRes = await axios.post(`${API_BASE}/proxy/youtube/info`, { url: ytUrl });
            const meta = infoRes.data;

            const jobRes = await axios.post(`${API_BASE}/jobs`, {
                name: meta.title,
                sourceType: 'youtube',
                totalItems: 1
            });
            const jobId = jobRes.data.id;

            const whisperJobRes = await axios.post(`${API_BASE}/proxy/youtube/queue`, { url: ytUrl });
            const whisperJobId = whisperJobRes.data.job_id;

            toast(`✓ YouTube Queued: ${meta.title}`, 'success');
            setYtUrl('');
            pollWhisperJob(jobId, whisperJobId);
        } catch (err: any) {
            toast(`YouTube Error: ${err.message}`, 'error');
        }
    };

    const handleScrapeSubmit = async () => {
        if (!scrapeUrl) return;
        let jobId = '';
        try {
            const jobRes = await axios.post(`${API_BASE}/jobs`, {
                name: scrapeUrl.split('/').pop() || scrapeUrl,
                sourceType: 'url_scrape',
                totalItems: 1
            });
            jobId = jobRes.data.id;
            toast(`URL Scrape Queued: ${scrapeUrl}`, 'info');

            // Simulation for now
            setTimeout(async () => {
                await axios.put(`${API_BASE}/jobs/${jobId}`, { status: 'processing', progress: 50 });
                setTimeout(async () => {
                    await axios.post(`${API_BASE}/ingest`, {
                        source: 'URL Scraping',
                        title: scrapeUrl,
                        content: "Scraped content from " + scrapeUrl + " (Simulated)",
                        author: 'URL Crawler'
                    });
                    await axios.put(`${API_BASE}/jobs/${jobId}`, { status: 'done', progress: 100 });
                    toast(`✓ Scrape Finished: ${scrapeUrl}`, 'success');
                }, 3000);
            }, 1000);

            setScrapeUrl('');
        } catch (err: any) {
            toast(`Scrape Error: ${err.message}`, 'error');
        }
    };

    const pollWhisperJob = async (localJobId: string, whisperJobId: string) => {
        const timer = setInterval(async () => {
            try {
                const res = await axios.get(`${API_BASE}/proxy/jobs/${whisperJobId}`);
                const data = res.data;
                await axios.put(`${API_BASE}/jobs/${localJobId}`, {
                    progress: data.progress,
                    status: data.status === 'done' ? 'done' : data.status === 'failed' ? 'failed' : 'processing'
                });
                if (data.status === 'done') {
                    clearInterval(timer);
                    const transcript = data.result.segments.map((s: any) => s.text).join(' ');
                    await axios.post(`${API_BASE}/ingest`, {
                        source: 'YouTube Transcript',
                        title: jobs.find(j => j.id === localJobId)?.name || 'YouTube Video',
                        content: transcript,
                        author: 'Whisper Pipeline'
                    });
                } else if (data.status === 'failed') clearInterval(timer);
            } catch (e) { clearInterval(timer); }
        }, 3000);
    };

    if (curPill === 'history') {
        return (
            <div className="anim">
                <h2 className="nb-section">⏳ Ingestion History</h2>
                <div className="nb-card overflow-x-auto">
                    <table className="w-full text-xs text-left">
                        <thead className="text-sub border-b border-bd">
                            <tr>
                                <th className="py-2">Date</th>
                                <th className="py-2">Source</th>
                                <th className="py-2">Name</th>
                                <th className="py-2">Status</th>
                                <th className="py-2">Progress</th>
                            </tr>
                        </thead>
                        <tbody>
                            {jobs.map(j => (
                                <tr key={j.id} className="border-b border-bd/50 hover:bg-white/5 transition-colors">
                                    <td className="py-3 text-mn">{new Date(j.createdAt).toLocaleString()}</td>
                                    <td className="py-3"><Tag bg="var(--bl)">{j.sourceType.toUpperCase()}</Tag></td>
                                    <td className="py-3 text-tx font-semibold">{j.name}</td>
                                    <td className="py-3">
                                        <span style={{ color: j.status === 'done' ? 'var(--em)' : j.status === 'failed' ? 'var(--rd)' : 'var(--am)' }}>
                                            {j.status.toUpperCase()}
                                        </span>
                                    </td>
                                    <td className="py-3 w-32">
                                        <ProgressBar pct={j.progress} color={j.status === 'failed' ? 'var(--rd)' : 'var(--am)'} height={4} />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        );
    }

    return (
        <div className="anim">
            <h2 className="nb-section">📥 Ingest Hub</h2>

            <div className="grid grid-cols-2 gap-4 grid-responsive">
                <div className="flex flex-col gap-4">
                    <div className="nb-card">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-sm font-bold">📤 Upload Files</h3>
                            <Tag bg="var(--am)">Multi-format</Tag>
                        </div>
                        <div className="border-2 border-dashed border-bd rounded-xl p-8 text-center bg-sf hover:bg-cd transition-colors cursor-pointer group"
                            onClick={() => document.getElementById('fileInp')?.click()}>
                            <div className="text-4xl mb-2 group-hover:scale-110 transition-transform">📄</div>
                            <div className="text-xs text-sub group-hover:text-tx transition-colors">
                                {selectedFile ? selectedFile.name : 'Drop PDF or Image here'}
                            </div>
                            <div className="text-[10px] text-mn mt-1">PDF · PNG · JPG · DOCX</div>
                            <input id="fileInp" type="file" className="hidden"
                                onChange={(e) => setSelectedFile(e.target.files?.[0] || null)} />
                        </div>
                        <div className="grid grid-cols-2 gap-2 mt-4">
                            <button className="nb-btn nb-btn-primary" disabled={!selectedFile || isUploading} onClick={() => handleFileUpload('pdf')}>
                                {isUploading ? '⌛ Processing...' : 'Ingest as PDF'}
                            </button>
                            <button className="nb-btn nb-btn-primary" disabled={!selectedFile || isUploading} onClick={() => handleFileUpload('image')}>
                                {isUploading ? '⌛ Processing...' : 'Ingest as Image'}
                            </button>
                        </div>
                    </div>

                    <div className="nb-card">
                        <h3 className="text-sm font-bold mb-4">📺 YouTube Ingestion</h3>
                        <div className="flex gap-2">
                            <input type="text" className="nb-btn flex-1 text-left px-3 text-xs" placeholder="Paste YouTube Link..."
                                value={ytUrl} onChange={e => setYtUrl(e.target.value)} />
                            <button className="nb-btn nb-btn-primary" onClick={handleYoutubeSubmit}>Queue</button>
                        </div>
                        <p className="text-[10px] text-mn mt-2">Transcribed via Whisper Large-v3 with Speaker Diarization.</p>
                    </div>

                    <div className="nb-card">
                        <h3 className="text-sm font-bold mb-4">🌐 URL Scraping</h3>
                        <div className="flex gap-2">
                            <input type="text" className="nb-btn flex-1 text-left px-3 text-xs" placeholder="Paste Article/Blog URL..."
                                value={scrapeUrl} onChange={e => setScrapeUrl(e.target.value)} />
                            <button className="nb-btn nb-btn-primary" onClick={handleScrapeSubmit}>Scrape</button>
                        </div>
                        <p className="text-[10px] text-mn mt-2">Extracts clean text from news articles and blogs via backend crawler.</p>
                    </div>
                </div>

                <div className="nb-card h-[600px] overflow-hidden flex flex-col">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-sm font-bold">⚡ Ingestion Queue</h3>
                        <button className="text-[10px] text-am hover:underline" onClick={() => axios.get(`${API_BASE}/jobs`)}>Refresh</button>
                    </div>
                    <div className="flex-1 overflow-y-auto pr-2 space-y-3 custom-scrollbar">
                        {jobs.filter(j => j.status !== 'done' && j.status !== 'failed').map(j => (
                            <div key={j.id} className="p-3 rounded-lg bg-sf/50 border border-bd border-l-4" style={{ borderLeftColor: 'var(--am)' }}>
                                <div className="flex justify-between items-center mb-1">
                                    <div className="text-xs font-bold text-tx truncate pr-2">{j.name}</div>
                                    <Tag bg="var(--am)">{j.status.toUpperCase()}</Tag>
                                </div>
                                <ProgressBar pct={j.progress} color="var(--am)" height={4} />
                                <div className="flex justify-between mt-1.5 text-[9px] text-mn">
                                    <span>{j.sourceType}</span>
                                    <span>{j.progress}% Complete</span>
                                </div>
                            </div>
                        ))}
                        {jobs.filter(j => j.status === 'done' || j.status === 'failed').slice(0, 10).map(j => (
                            <div key={j.id} className="p-3 rounded-lg bg-sf/30 border border-bd/30 opacity-70">
                                <div className="flex justify-between items-center mb-1">
                                    <div className="text-xs font-medium text-sub truncate pr-2">{j.name}</div>
                                    <Tag bg={j.status === 'done' ? 'var(--em)' : 'var(--rd)'}>{j.status.toUpperCase()}</Tag>
                                </div>
                                {j.status === 'failed' && <div className="text-[9px] text-rd mt-1 italic">{j.error}</div>}
                            </div>
                        ))}
                        {jobs.length === 0 && <div className="h-full flex flex-col items-center justify-center text-mn"><div className="text-4xl mb-2">🍹</div><div className="text-xs">No active jobs</div></div>}
                    </div>
                </div>
            </div>
        </div>
    );
}
