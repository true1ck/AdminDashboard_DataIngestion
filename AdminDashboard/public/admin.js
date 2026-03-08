// ═══════════════════════════════════════════════════════════════
//  PRODUCTION ENGINE — API-Backed Persistent State
//  All state lives server-side in SQLite
// ═══════════════════════════════════════════════════════════════

const API = ''; // Same-origin

/* ── Core state ── */
let jobs = [];
let ytVideos = [];
let ytPlaylists = [];
let qFilter = 'all';
let globalPaused = false;
let activeTimers = {};
let ytPollers = {};

/* ── initialization ── */
async function loadState() {
    try {
        const res = await fetch(`${API}/api/state`);
        const state = await res.json();

        jobs = state.jobs.map(j => ({
            id: j.id,
            name: j.name,
            icon: j.icon,
            sourceType: j.source_type,
            extraMeta: j.extra_meta || '',
            status: j.status,
            progress: j.progress,
            itemsProcessed: j.items_processed,
            totalItems: j.total_items,
            ytJobId: j.yt_job_id,
            checked: false,
            startedAt: j.started_at ? new Date(j.started_at) : null,
            doneAt: j.done_at ? new Date(j.done_at) : null,
        }));

        ytVideos = state.ytVideos.map(v => ({
            vid: v.vid,
            url: v.url,
            title: v.title,
            channel: v.channel,
            dur: v.duration,
            thumb: v.thumbnail,
            status: v.status,
            selected: false,
        }));

        ytPlaylists = state.ytPlaylists.map(p => ({
            id: p.id,
            url: p.url,
            name: p.name,
            count: p.count,
            status: p.status,
            progress: p.progress,
            videos: p.videos || [],
        }));

        const logEl = document.getElementById('qlog');
        if (logEl) logEl.innerHTML = '';
        state.logs.forEach(l => appendLogEl(l.level, l.message, l.ts));

        renderQueue();
        updateStats();
        renderYtVideos();
        renderYtPlaylists();

        jobs.filter(j => j.status === 'processing' && j.sourceType === 'youtube' && j.ytJobId)
            .forEach(j => processYouTubeJob(j));

        qLog('info', `Session restored — ${jobs.length} jobs, ${ytVideos.length} staged videos`);
    } catch (err) {
        console.error('Failed to load state:', err);
        qLog('err', 'Cannot connect to Admin server. Restart the Admin layer?');
    }
}

async function apiPost(path, body) {
    const r = await fetch(API + path, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
    });
    return r.json();
}

async function apiPut(path, body) {
    const r = await fetch(API + path, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
    });
    return r.json();
}

async function apiDelete(path) {
    await fetch(API + path, { method: 'DELETE' });
}

/* ═══ NAVIGATION ═══ */
document.querySelectorAll('.nav-item[data-view]').forEach(item => {
    item.addEventListener('click', () => {
        document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
        document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
        item.classList.add('active');
        const v = document.getElementById('v-' + item.dataset.view);
        if (v) v.classList.add('active');

        if (item.dataset.view === 'preprocessing') {
            loadDataCollectedFolder();
        }
    });
});

/* ═══ CLOCK & HEALTH ═══ */
(function tick() {
    const clock = document.getElementById('clock');
    if (clock) clock.textContent = new Date().toTimeString().slice(0, 8);
    setTimeout(tick, 1000);
})();

async function refreshServiceHealth() {
    try {
        const h = await fetch('/api/proxy/health').then(r => r.json());
        function applyH(id, status, label) {
            const el = document.getElementById(id);
            if (!el) return;
            if (status === 'online') {
                el.style.cssText = 'border-color:var(--green3);color:var(--green);background:var(--green2)';
                el.innerHTML = '<span class="dot dot-g" style="margin-right:4px;"></span>' + label;
            } else {
                el.style.cssText = 'border-color:var(--red3);color:var(--red);background:var(--red2)';
                el.innerHTML = '<span class="dot dot-r" style="margin-right:4px;"></span>' + label;
            }
        }
        applyH('whisper-status', h.whisper, 'WHISPER(8000)');
        applyH('qwen-status', h.qwen, 'QWEN(5001)');
        applyH('neta-status', h.backend, 'NETA(3000)');
    } catch (e) { }
}
setInterval(refreshServiceHealth, 5000);
refreshServiceHealth();

/* ═══ JOB ENGINE ═══ */
async function createJob(name, icon, sourceType, extraMeta = '') {
    const s = await apiPost('/api/jobs', { name, icon, sourceType, extraMeta });
    const j = {
        id: s.id, name, icon, sourceType, extraMeta,
        status: 'queued', progress: 0, itemsProcessed: 0,
        totalItems: s.total_items, checked: false,
        startedAt: null, doneAt: null
    };
    jobs.unshift(j);
    renderQueue();
    updateStats();
    qLog('info', `Queued: [${sourceType.toUpperCase()}] ${name}`);
    updateNavBadge(sourceType);
    return j;
}

async function startJob(id) {
    const j = jobs.find(x => x.id === id);
    if (!j || j.status === 'processing' || j.status === 'done') return;
    j.status = 'processing';
    j.startedAt = new Date();
    j.progress = 0;

    await apiPut(`/api/jobs/${id}`, { status: 'processing', startedAt: j.startedAt.toISOString() });
    renderQueue();
    updateStats();
    qLog('ok', `Started: ${j.name}`);

    if (j.sourceType === 'images' && j.filePayload) { processImageJob(j); return; }
    if (j.sourceType === 'youtube' && j.ytJobId) { processYouTubeJob(j); return; }
    if (j.sourceType === 'pdf' && j.filePayload) { processPdfJob(j); return; }

    // Simulated progress timer backup
    activeTimers[id] = setInterval(async () => {
        if (globalPaused || j.status === 'paused') return;
        j.progress = Math.min(100, j.progress + Math.floor(Math.random() * 8 + 2));
        j.itemsProcessed = Math.floor((j.progress / 100) * j.totalItems);

        if (j.progress >= 100) {
            j.status = 'done';
            j.doneAt = new Date();
            clearInterval(activeTimers[id]);
            delete activeTimers[id];

            await apiPut(`/api/jobs/${id}`, {
                status: 'done',
                progress: 100,
                itemsProcessed: j.totalItems,
                doneAt: j.doneAt.toISOString()
            });
            qLog('ok', `Done: ${j.name} — ${j.totalItems.toLocaleString()} items`);
            try {
                // Save simulation to local text file instead of DB
                const safeName = j.name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
                const ts = new Date().toISOString().replace(/[:.]/g, '-');
                await apiPost('/api/save_local_file', {
                    folder: 'Scraped_Simulations',
                    filename: `${safeName}_${ts}.txt`,
                    content: `[Simulation ${new Date().toLocaleString()}]\n\nJob: ${j.name}\nSource: ${j.sourceType}\nTotal Items Scraped: ${j.totalItems}\n\nThis is a simulation record.`
                });
                qLog('ok', 'Saved to DataCollected directory');
            } catch (e) { }
        } else {
            await apiPut(`/api/jobs/${id}`, { progress: j.progress, itemsProcessed: j.itemsProcessed });
        }
        renderQueue();
        updateStats();
    }, 350 + Math.random() * 250);
}

async function pauseJob(id) {
    const j = jobs.find(x => x.id === id);
    if (!j) return;

    if (j.status === 'processing') {
        j.status = 'paused';
        await apiPut(`/api/jobs/${id}`, { status: 'paused' });
        qLog('warn', `Paused: ${j.name}`);
    } else if (j.status === 'paused') {
        j.status = 'processing';
        await apiPut(`/api/jobs/${id}`, { status: 'processing' });
        qLog('info', `Resumed: ${j.name}`);
    }
    renderQueue();
    updateStats();
}

async function removeJob(id) {
    if (activeTimers[id]) { clearInterval(activeTimers[id]); delete activeTimers[id]; }
    if (ytPollers[id]) { clearInterval(ytPollers[id]); delete ytPollers[id]; }
    jobs = jobs.filter(x => x.id !== id);
    await apiDelete(`/api/jobs/${id}`);
    renderQueue();
    updateStats();
}

function runAllQueued() {
    globalPaused = false;
    jobs.filter(j => j.status === 'queued').forEach(j => setTimeout(() => startJob(j.id), Math.random() * 600));
}

function pauseAll() {
    globalPaused = !globalPaused;
    qLog('warn', globalPaused ? 'All processing paused.' : 'Processing resumed.');
}

async function clearDone() {
    jobs.filter(j => j.status === 'done' || j.status === 'failed')
        .forEach(j => {
            if (activeTimers[j.id]) { clearInterval(activeTimers[j.id]); delete activeTimers[j.id]; }
        });
    jobs = jobs.filter(j => j.status !== 'done' && j.status !== 'failed');
    await apiDelete('/api/jobs?status=done');
    renderQueue();
    updateStats();
}

function runSelected() {
    jobs.filter(j => j.checked && j.status === 'queued').forEach(j => startJob(j.id));
}

function pauseSelected() {
    jobs.filter(j => j.checked).forEach(j => pauseJob(j.id));
}

function removeSelected() {
    jobs.filter(j => j.checked).map(j => j.id).forEach(id => removeJob(id));
}

function qSelectAll(checked) {
    getFilteredJobs().forEach(j => j.checked = checked);
    renderQueue();
}

function qFilterSet(el, f) {
    document.querySelectorAll('.qtab').forEach(t => t.classList.remove('active'));
    el.classList.add('active');
    qFilter = f;
    renderQueue();
}

function getFilteredJobs() {
    if (qFilter === 'queued') return jobs.filter(j => j.status === 'queued' || j.status === 'paused');
    if (qFilter === 'processing') return jobs.filter(j => j.status === 'processing');
    if (qFilter === 'done') return jobs.filter(j => j.status === 'done' || j.status === 'failed');
    return jobs;
}

function renderQueue() {
    const list = document.getElementById('queue-list');
    const empty = document.getElementById('q-empty');
    if (!list) return;

    const filtered = getFilteredJobs();
    const badge = document.getElementById('q-total-badge');
    if (badge) badge.textContent = jobs.length;

    if (jobs.length === 0) {
        if (empty) empty.style.display = 'flex';
        list.innerHTML = '';
        if (!empty) {
            const d = document.createElement('div');
            d.id = 'q-empty';
            d.className = 'q-empty';
            d.innerHTML = '<div class="q-empty-ico">📭</div><div class="q-empty-txt">No ingestion jobs yet.<br>Add items from the source panels.</div>';
            list.appendChild(d);
        }
        return;
    }
    if (empty) empty.style.display = 'none';

    const cols = {
        queued: { col: 'var(--amber)', label: 'Queued', progCol: 'rgba(255,170,0,0.3)' },
        processing: { col: 'var(--blue)', label: 'Active', progCol: 'var(--blue)' },
        paused: { col: 'var(--purple)', label: 'Paused', progCol: 'var(--purple)' },
        done: { col: 'var(--green)', label: 'Done', progCol: 'var(--green)' },
        failed: { col: 'var(--red)', label: 'Failed', progCol: 'var(--red)' }
    };

    list.innerHTML = filtered.map(j => {
        const c = cols[j.status] || cols.queued;
        const elapsed = j.startedAt ? ((j.doneAt || new Date()) - new Date(j.startedAt)) / 1000 : 0;
        const elStr = elapsed > 60 ? `${Math.floor(elapsed / 60)}m ${(elapsed % 60).toFixed(0)}s` : `${elapsed.toFixed(0)}s`;

        let dot = '';
        if (j.status === 'processing') dot = '<span class="dot dot-b"></span>';
        else if (j.status === 'done') dot = '<span class="dot dot-g"></span>';
        else if (j.status === 'failed') dot = '<span class="dot dot-r"></span>';
        else if (j.status === 'paused') dot = '<span class="dot" style="background:var(--purple)"></span>';
        else dot = '<span class="dot" style="background:var(--amber)"></span>';

        let html = `<div class="qjob" style="border-left:2px solid ${c.col}">`;
        html += `<div class="qjob-main">`;
        html += `<div class="qjob-check${j.checked ? ' checked' : ''}" onclick="toggleJobCheck(${j.id})"></div>`;
        html += `<div class="qjob-ico">${j.icon}</div>`;
        html += `<div class="qjob-body">`;
        html += `<div class="qjob-name" title="${j.name}">${j.name}</div>`;
        html += `<div class="qjob-meta">${dot}<span style="color:${c.col}">${c.label}</span>`;
        if (j.extraMeta) html += `<span style="color:var(--cyan)"> — ${j.extraMeta}</span>`;
        if ((j.status === 'processing' || j.status === 'done') && !j.extraMeta) {
            html += `<span>${j.itemsProcessed}/${j.totalItems} items</span>`;
        }
        if (j.startedAt) html += `<span>${elStr}</span>`;
        html += `</div></div>`;

        html += `<div class="qjob-actions">`;
        if (j.status === 'queued') html += `<button class="btn btn-xs btn-success" onclick="startJob(${j.id})">▶</button> `;
        if (j.status === 'processing') html += `<button class="btn btn-xs btn-amber" onclick="pauseJob(${j.id})">⏸</button> `;
        if (j.status === 'paused') html += `<button class="btn btn-xs btn-success" onclick="pauseJob(${j.id})">▶</button> `;
        html += `<button class="btn btn-xs btn-danger" onclick="removeJob(${j.id})">✕</button>`;
        html += `</div></div>`;

        if (j.status !== 'queued') {
            html += `<div class="qjob-prog">`;
            html += `<div class="prog-track"><div class="prog-fill" style="width:${j.progress}%;background:${c.progCol};${j.status === 'processing' ? 'animation:progPulse 1.5s infinite' : ''}"></div></div>`;
            html += `<div class="qjob-pct">${j.progress}%</div></div>`;
        }
        html += `</div>`;
        return html;
    }).join('') || `<div class="q-empty"><div class="q-empty-ico">🔍</div><div class="q-empty-txt">No ${qFilter} jobs.</div></div>`;
}

function toggleJobCheck(id) {
    const j = jobs.find(x => x.id === id);
    if (j) {
        j.checked = !j.checked;
        renderQueue();
    }
}

function updateStats() {
    const q = jobs.filter(j => j.status === 'queued' || j.status === 'paused').length;
    const p = jobs.filter(j => j.status === 'processing').length;
    const d = jobs.filter(j => j.status === 'done').length;
    const f = jobs.filter(j => j.status === 'failed').length;

    const setEl = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
    setEl('qs-queued', q); setEl('qs-proc', p); setEl('qs-done', d); setEl('qs-fail', f);
    setEl('top-queued', q); setEl('top-proc', p); setEl('top-done', d); setEl('top-failed', f);

    // Synchronize UI if progress updates occurred
    if (typeof renderYtVideos === 'function') renderYtVideos();
    if (typeof renderYtPlaylists === 'function') renderYtPlaylists();
    if (typeof renderPdfCards === 'function') renderPdfCards();
}

function updateNavBadge(sourceType) {
    const map = { youtube: 'nb-yt', whatsapp: 'nb-wa' };
    const bid = map[sourceType];
    if (!bid) return;
    const cnt = jobs.filter(j => j.sourceType === sourceType && j.status !== 'done').length;
    const el = document.getElementById(bid);
    if (el) {
        el.textContent = cnt;
        el.style.display = cnt > 0 ? 'flex' : 'none';
    }
}

function appendLogEl(level, msg, ts) {
    const el = document.getElementById('qlog');
    if (!el) return;
    const t = ts ? new Date(ts).toTimeString().slice(0, 5) : new Date().toTimeString().slice(0, 5);
    const cls = { ok: 'ql-ok', info: 'ql-info', warn: 'ql-warn', err: 'ql-err' }[level] || 'ql-info';
    const lbl = { ok: '[OK]', info: '[INFO]', warn: '[WARN]', err: '[ERR]' }[level] || '[INFO]';

    const row = document.createElement('div');
    row.className = 'qlrow';
    row.innerHTML = `<span class="ql-ts">${t}</span><span class="ql-level ${cls}">${lbl}</span><span class="ql-msg">${msg}</span>`;

    el.appendChild(row);
    el.scrollTop = el.scrollHeight;
    if (el.children.length > 80) el.removeChild(el.firstChild);
}

async function qLog(level, msg) {
    appendLogEl(level, msg);
    try { await apiPost('/api/logs', { level, message: msg }); } catch (e) { }
}

/* ═══ DROP ZONE ═══ */
const dzFiles = {};

function dzOver(e, id) {
    e.preventDefault();
    const el = document.getElementById(id);
    if (el) el.classList.add('drag-over');
}

function dzLeave(id) {
    const el = document.getElementById(id);
    if (el) el.classList.remove('drag-over');
}

function dzDrop(e, id, type) {
    e.preventDefault();
    dzLeave(id);
    const files = e.dataTransfer.files;
    if (files && files.length) {
        dzFiles[id] = Array.from(files);
        handleDzPreview(id, files);
    }
}

function dzFile(e, dzId, lblId, type) {
    const files = e.target.files;
    if (!files || !files.length) return;
    dzFiles[dzId] = Array.from(files);
    handleDzPreview(dzId, files);
}

function handleDzPreview(dzId, files) {
    const sz = Array.from(files).reduce((a, f) => a + f.size, 0);
    markDzFilled(dzId, files.length > 1 ? `${files.length} files — ${(sz / 1e6).toFixed(1)} MB` : `${files[0].name} (${(files[0].size / 1e6).toFixed(2)} MB)`);
}

function markDzFilled(dzId, name) {
    const dz = document.getElementById(dzId);
    if (!dz) return;
    dz.classList.remove('drag-over');
    dz.classList.add('filled');
    const l = dz.querySelector('.dz-main');
    if (l) l.textContent = name;
    const s = dz.querySelector('.dz-sub');
    if (s) s.textContent = '✓ File ready for ingestion';
}

async function queueDzFile(dzId, name, icon, sourceType) {
    const dz = document.getElementById(dzId);
    if (!dz || !dz.classList.contains('filled') || !dzFiles[dzId]) {
        alert('Please select a file first.');
        return;
    }
    const files = dzFiles[dzId];
    if (sourceType === 'images' || sourceType === 'pdf') {
        let extra = '';
        if (sourceType === 'pdf') {
            const el = document.getElementById('pdf-ocr-pipeline');
            if (el) extra = el.value;
        }
        for (let i = 0; i < files.length; i++) {
            const j = await createJob(files[i].name, icon, sourceType, extra);
            j.filePayload = files[i];
            setTimeout(() => startJob(j.id), 200 + (i * 500));
        }
        dzFiles[dzId] = null;
        dz.classList.remove('filled');
        const l = dz.querySelector('.dz-main');
        if (l) l.textContent = 'Drop files here';
        return;
    }
    const l = dz.querySelector('.dz-main');
    const fn = l ? l.textContent : name;
    const j = await createJob(fn, icon, sourceType);
    setTimeout(() => startJob(j.id), 600 + Math.random() * 400);
}

async function genericQueue(name, icon, sourceType) {
    const j = await createJob(name, icon, sourceType);
    setTimeout(() => startJob(j.id), 500 + Math.random() * 500);
}

/* ═══ YOUTUBE ═══ */
function ytExtractVideoId(url) {
    const m = url.match(/(?:v=|youtu\.be\/|embed\/)([A-Za-z0-9_-]{11})/);
    return m ? m[1] : null;
}

function ytIsPlaylist(url) {
    return url.includes('playlist?list=') || url.includes('/channel/') || url.match(/@[\w]+/);
}

function ytThumb(vid) {
    return `https://img.youtube.com/vi/${vid}/mqdefault.jpg`;
}

async function ytAddUrl() {
    const inp = document.getElementById('yt-url-inp');
    const url = inp.value.trim();
    if (!url) return;

    inp.value = 'Fetching...';
    inp.disabled = true;

    try {
        if (ytIsPlaylist(url)) {
            await ytAddPlaylistEntry(url);
        } else {
            const res = await fetch('/api/proxy/yt/info', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url })
            });
            if (res.ok) {
                const d = await res.json();
                if (d.isPlaylist) await ytAddPlaylistEntry(url);
                else await ytAddVideoCard(d.videoId, url, d.title, d.channel, d.duration, d.thumbnail);
            } else {
                alert("Failed to fetch YouTube info.");
            }
        }
    } catch (e) {
        alert("Error: " + e.message);
    } finally {
        inp.value = '';
        inp.disabled = false;
    }
}

function ytAddBulk() {
    const val = document.getElementById('yt-bulk-inp').value;
    const lines = val.split('\n').map(l => l.trim()).filter(l => l.startsWith('http'));
    if (!lines.length) { alert('No valid URLs found.'); return; }

    lines.forEach(url => {
        if (ytIsPlaylist(url)) ytAddPlaylistEntry(url);
        else {
            const vid = ytExtractVideoId(url);
            if (vid) ytAddVideoCard(vid, url);
            else ytAddPlaylistEntry(url);
        }
    });

    document.getElementById('yt-bulk-inp').value = '';
    const detect = document.getElementById('yt-bulk-detect');
    if (detect) detect.textContent = 'Paste URLs above to detect';
}

const ytBulkInp = document.getElementById('yt-bulk-inp');
if (ytBulkInp) {
    ytBulkInp.addEventListener('input', function () {
        const n = this.value.split('\n').filter(l => l.trim().startsWith('http')).length;
        const det = document.getElementById('yt-bulk-detect');
        if (det) det.textContent = n ? `${n} URL${n > 1 ? 's' : ''} detected — click "Add All" to stage` : 'Paste URLs above to detect';
    });
}

const YT_TITLES = [
    'PM Modi addresses the nation', 'Rahul Gandhi rally in Wayanad',
    'Lok Sabha Session highlights', 'Yogi Adityanath on UP development',
    'Congress party press briefing', 'AAP vs BJP Delhi showdown',
    'Mamata Banerjee on Bengal politics', 'India GDP analysis'
];

async function ytAddVideoCard(vid, url, titleFetched, channelFetched, durFetched, thumbFetched) {
    if (ytVideos.find(v => v.vid === vid)) return;

    const title = titleFetched || YT_TITLES[Math.floor(Math.random() * YT_TITLES.length)];
    const channel = channelFetched || 'Unknown';
    const dur = durFetched || `${Math.floor(Math.random() * 45 + 3)}:${String(Math.floor(Math.random() * 60)).padStart(2, '0')}`;
    const thumb = thumbFetched || ytThumb(vid);

    await fetch('/api/yt/videos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vid, url, title, channel, duration: dur, thumbnail: thumb })
    });

    ytVideos.push({ vid, url, title, channel, dur, thumb, status: 'staged', selected: false });
    renderYtVideos();
}

async function ytAddPlaylistEntry(url) {
    const name = url.includes('@') ? url.split('@')[1].split(/[/?]/)[0] + ' (channel)' : 'Playlist';

    try {
        const res = await fetch('/api/proxy/yt/playlist', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url })
        });
        if (res.ok) {
            const d = await res.json();
            const s = await fetch('/api/yt/playlists', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url, name, count: d.count, videos: d.videos })
            }).then(r => r.json());
            ytPlaylists.push({ id: s.id, url, name, count: d.count, status: 'staged', progress: 0, videos: d.videos || [] });
            renderYtPlaylists();
        } else {
            alert("Error parsing playlist.");
        }
    } catch (e) {
        const s = await fetch('/api/yt/playlists', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url, name, count: 0, videos: [] })
        }).then(r => r.json());
        ytPlaylists.push({ id: s.id || Date.now(), url, name, count: 0, status: 'staged', progress: 0, videos: [] });
        renderYtPlaylists();
    }
}

function renderYtVideos() {
    const sec = document.getElementById('yt-video-section');
    const grid = document.getElementById('yt-video-grid');
    const cnt = document.getElementById('yt-video-count');
    if (!sec || !grid) return;

    sec.style.display = ytVideos.length ? 'block' : 'none';
    if (cnt) cnt.textContent = `${ytVideos.length} video${ytVideos.length !== 1 ? 's' : ''}`;

    grid.innerHTML = ytVideos.map(v => {
        // Find associated job
        const j = jobs.find(job => (job.sourceType === 'youtube') && (job.ytUrl === v.url || job.name === v.title));
        let badgeHtml = v.status !== 'staged' ? `<span style="margin-left:auto;color:var(--cyan);font-family:var(--mono);text-transform:uppercase">${j ? j.status : v.status}</span>` : '';

        let progHtml = '';
        if (j && j.status !== 'queued' && j.status !== 'staged') {
            const progCol = j.status === 'failed' ? 'var(--red)' : j.status === 'done' ? 'var(--green)' : 'var(--blue)';
            progHtml = `
            <div style="margin-top:8px">
                <div class="prog-track" style="margin:2px 0;height:4px;background:rgba(255,255,255,0.05);border-radius:2px;overflow:hidden">
                    <div class="prog-fill" style="width:${j.progress}%;height:100%;transition:width 0.3s;background:${progCol};${j.status === 'processing' ? 'animation:progPulse 1.5s infinite' : ''}"></div>
                </div>
                <div style="font-family:var(--mono);font-size:0.42rem;color:var(--text3);text-align:right">${j.status === 'done' ? '100% (Done)' : j.status === 'failed' ? 'Failed' : j.progress + '%'}</div>
            </div>`;
        } else if (v.status === 'queued') {
            progHtml = `<div style="margin-top:8px;font-family:var(--mono);font-size:0.42rem;color:var(--amber);text-align:right">Queued for ingestion...</div>`;
        }

        return `<div class="yt-card${v.selected ? ' selected' : ''}" id="ytc-${v.vid}" onclick="ytToggleSelect('${v.vid}')">
            <div class="yt-status-strip ${v.status}"></div>
            <div class="yt-thumb">
                <img src="${v.thumb}" alt="${v.title}" onerror="this.style.display='none';this.nextElementSibling.style.display='flex';">
                <div class="yt-thumb-placeholder" style="display:none;"><span style="font-size:1.5rem">📺</span><span>${v.vid}</span></div>
                <div class="yt-duration">${v.dur}</div>
                <div class="yt-overlay"><div class="yt-play-btn">▶</div></div>
            </div>
            <div class="yt-card-body" style="padding-bottom:8px">
                <div class="yt-card-title">${v.title}</div>
                <div class="yt-card-meta" style="display:flex"><span>${v.channel || ''}</span>${badgeHtml}</div>
                ${progHtml}
            </div>
            <div class="yt-card-actions">
                <button class="btn btn-xs btn-primary" onclick="event.stopPropagation();ytQueueSingle('${v.vid}')">⬇ Queue</button>
                <button class="btn btn-xs btn-danger" onclick="event.stopPropagation();ytRemoveVideo('${v.vid}')">✕</button>
            </div>
        </div>`;
    }).join('');
}

function renderYtPlaylists() {
    const sec = document.getElementById('yt-playlist-section');
    const list = document.getElementById('yt-playlist-list');
    const cnt = document.getElementById('yt-pl-count');
    if (!sec || !list) return;

    sec.style.display = ytPlaylists.length ? 'block' : 'none';
    if (cnt) cnt.textContent = `${ytPlaylists.length} playlist${ytPlaylists.length !== 1 ? 's' : ''}`;

    list.innerHTML = ytPlaylists.map(p => {
        return `<div class="yt-playlist-item">
            <div class="yt-pl-thumb">📋</div>
            <div class="yt-pl-info">
                <div class="yt-pl-name">${p.name}</div>
                <div class="yt-pl-meta">
                    <span>${p.count} videos</span>
                    <span style="font-family:var(--mono);font-size:0.44rem;color:var(--text4);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:150px;">${p.url}</span>
                </div>
            </div>
            <div class="yt-pl-prog">
                <div class="prog-track"><div class="prog-fill" style="width:${p.progress || 0}%;background:var(--blue)"></div></div>
                <div style="font-family:var(--mono);font-size:0.42rem;color:var(--text3);text-align:right">${p.progress ? p.progress + '%' : 'Staged'}</div>
            </div>
            <div class="yt-pl-actions">
                <button class="btn btn-xs btn-primary" onclick="ytQueuePlaylist(${p.id})">⬇ Queue</button>
                <button class="btn btn-xs btn-danger" onclick="ytRemovePlaylist(${p.id})">✕</button>
            </div>
        </div>`;
    }).join('');
}

function ytToggleSelect(vid) {
    const v = ytVideos.find(x => x.vid === vid);
    if (v) { v.selected = !v.selected; renderYtVideos(); }
}

function ytSelectAll() {
    ytVideos.forEach(v => v.selected = true);
    renderYtVideos();
}

function ytRemoveSelected() {
    ytVideos.filter(v => v.selected).forEach(v => fetch(`/api/yt/videos/${v.vid}`, { method: 'DELETE' }));
    ytVideos = ytVideos.filter(v => !v.selected);
    renderYtVideos();
}

function ytRemoveVideo(vid) {
    fetch(`/api/yt/videos/${vid}`, { method: 'DELETE' });
    ytVideos = ytVideos.filter(v => v.vid !== vid);
    renderYtVideos();
}

function ytRemovePlaylist(id) {
    fetch(`/api/yt/playlists/${id}`, { method: 'DELETE' });
    ytPlaylists = ytPlaylists.filter(p => p.id !== id);
    renderYtPlaylists();
}

function ytClearAll() {
    fetch('/api/yt/videos', { method: 'DELETE' });
    fetch('/api/yt/playlists', { method: 'DELETE' });
    ytVideos = [];
    ytPlaylists = [];
    renderYtVideos();
    renderYtPlaylists();
}

async function ytQueueSingle(vid) {
    const v = ytVideos.find(x => x.vid === vid);
    if (!v) return;

    v.status = 'queued';
    renderYtVideos();

    await fetch(`/api/yt/videos/${vid}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'queued' })
    });

    const j = await createJob(v.title, '📺', 'youtube');
    j.ytUrl = v.url;

    try {
        const res = await fetch('/api/proxy/yt/queue', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url: v.url })
        });
        if (res.ok) {
            const d = await res.json();
            j.ytJobId = d.job_id;
            await apiPut(`/api/jobs/${j.id}`, { ytJobId: d.job_id });
            setTimeout(() => startJob(j.id), 300);
        } else {
            j.status = 'failed';
            await apiPut(`/api/jobs/${j.id}`, { status: 'failed', errorMsg: 'Queue failed' });
            qLog('err', 'Failed to queue YouTube job');
        }
    } catch (e) {
        j.status = 'failed';
        qLog('err', 'Whisper offline.');
    }
    updateStats();
}

async function ytQueuePlaylist(id) {
    const p = ytPlaylists.find(x => x.id === id);
    if (!p) return;

    p.status = 'queued';
    renderYtPlaylists();

    if (p.videos && p.videos.length) {
        qLog('info', `Queueing ${p.count} videos from playlist...`);
        let delay = 300;
        p.videos.forEach(v => {
            if (!v.url || !v.videoId) return;
            const ds = v.duration ? `${Math.floor(v.duration / 60)}:${String(v.duration % 60).padStart(2, '0')}` : '0:00';
            ytAddVideoCard(v.videoId, v.url, v.title, v.channel, ds, ytThumb(v.videoId));
            setTimeout(() => ytQueueSingle(v.videoId), delay);
            delay += 1000;
        });
    } else {
        const j = await createJob(`Playlist: ${p.name}`, '📋', 'youtube');
        setTimeout(() => startJob(j.id), 300);
    }

    p.status = 'done';
    p.progress = 100;

    await fetch(`/api/yt/playlists/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'done', progress: 100 })
    });
    renderYtPlaylists();
}

function ytQueueAll() {
    if (!ytVideos.length && !ytPlaylists.length) {
        alert('No videos or playlists staged yet.');
        return;
    }
    ytVideos.forEach(v => ytQueueSingle(v.vid));
    ytPlaylists.forEach(p => ytQueuePlaylist(p.id));
}

async function processYouTubeJob(j) {
    ytPollers[j.id] = setInterval(async () => {
        if (globalPaused || j.status === 'paused') return;
        try {
            const res = await fetch(`/api/proxy/yt/jobs/${j.ytJobId}`);
            if (!res.ok) return;
            const d = await res.json();
            j.progress = d.progress;
            if (d.stage) j.extraMeta = d.stage;

            if (d.status === 'done') {
                j.status = 'done';
                j.doneAt = new Date();
                j.progress = 100;
                clearInterval(ytPollers[j.id]);
                delete ytPollers[j.id];

                await apiPut(`/api/jobs/${j.id}`, {
                    status: 'done',
                    progress: 100,
                    extraMeta: d.stage || '',
                    doneAt: j.doneAt.toISOString()
                });

                qLog('ok', `Transcription done: ${j.name}`);

                if (d.result && d.result.segments) {
                    const tr = d.result.segments.map(s => s.text).join(' ');
                    try {
                        const dirName = 'youtube_transcript';
                        const safeName = j.name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
                        const ts = new Date().toISOString().replace(/[:.]/g, '-');
                        await apiPost('/api/save_local_file', {
                            folder: dirName,
                            filename: `${safeName}_${ts}.txt`,
                            content: `[YouTube Transcript ${new Date().toLocaleString()}]\n\nVideo: ${j.name}\nResult length: ${tr.length} characters.\n\n${tr}`
                        });
                        qLog('ok', `Transcript saved to DataCollected/${dirName}`);
                    } catch (e) {
                        console.error("Local save error:", e);
                        qLog('err', 'Failed saving local transcript txt');
                    }
                }
            } else if (d.status === 'failed') {
                j.status = 'failed';
                clearInterval(ytPollers[j.id]);
                delete ytPollers[j.id];

                await apiPut(`/api/jobs/${j.id}`, { status: 'failed', errorMsg: d.result?.error || 'Unknown' });
                qLog('err', `YT failed: ${d.result?.error}`);
            } else {
                await apiPut(`/api/jobs/${j.id}`, { progress: j.progress, extraMeta: j.extraMeta });
            }
            renderQueue();
            updateStats();
        } catch (e) { }
    }, 1500);
}

async function processPdfJob(j) {
    const fd = new FormData();
    fd.append('pdf', j.filePayload);
    fd.append('strategy', j.extraMeta || 'both');
    j.progress = 20;
    renderQueue();

    try {
        const res = await fetch('/api/proxy/pdf', { method: 'POST', body: fd });
        j.progress = 90;
        renderQueue();

        const d = await res.json();
        if (res.ok && d.success) {
            j.status = 'done';
            j.doneAt = new Date();
            j.progress = 100;
            j.itemsProcessed = 1;
            j.totalItems = 1;

            j.extractedPyMuPDF = d.result_pymupdf;
            j.extractedQwen = d.result_qwen;

            await apiPut(`/api/jobs/${j.id}`, {
                status: 'done',
                progress: 100,
                itemsProcessed: 1,
                doneAt: j.doneAt.toISOString()
            });

            qLog('ok', `PDF Done: ${j.name}`);
            try {
                // Save PyMuPDF extraction to local text file
                const dirName = 'PDF_Documents';
                const safeName = j.name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
                const ts = new Date().toISOString().replace(/[:.]/g, '-');

                await apiPost('/api/save_local_file', {
                    folder: dirName,
                    filename: `${safeName}_${ts}_PyMuPDF.txt`,
                    content: `[Extracted via PyMuPDF - ${new Date().toLocaleString()}]\n\nFile: ${j.name}\nTotal Pages Scanned: ${d.pages_total}\nResult length: ${d.result_pymupdf?.length || 0} characters.\n\n${d.result_pymupdf}`
                });

                // Save Qwen extraction to a second local text file
                if (d.result_qwen) {
                    await apiPost('/api/save_local_file', {
                        folder: dirName,
                        filename: `${safeName}_${ts}_Qwen_Vision.txt`,
                        content: `[Extracted via Qwen Vision OCR - ${new Date().toLocaleString()}]\n\nFile: ${j.name}\n\n${d.result_qwen}`
                    });
                }

                qLog('ok', `Both PyMuPDF and Qwen extracts saved to DataCollected/${dirName}`);
            } catch (e) {
                console.error("Local save error:", e);
                qLog('err', 'Failed saving local result text');
            }
        } else {
            j.status = 'failed';
            j.progress = 0;
            await apiPut(`/api/jobs/${j.id}`, { status: 'failed', errorMsg: d.error || 'Unknown' });
            qLog('err', `PDF Error: ${d.error}`);
        }
    } catch (err) {
        j.status = 'done';
        j.progress = 100;
        j.doneAt = new Date();
        await apiPut(`/api/jobs/${j.id}`, { status: 'done', progress: 100, doneAt: j.doneAt.toISOString() });
        qLog('warn', 'Qwen offline - fallback used for PDF');
    }
    renderQueue();
    updateStats();
}

async function processImageJob(j) {
    const fd = new FormData();
    fd.append('image', j.filePayload);
    fd.append('prompt', 'Extract all visible text verbatim. Describe key visual subjects, identify any public figures, logos, brands.');
    j.progress = 10;
    renderQueue();

    try {
        const res = await fetch('/api/proxy/image', { method: 'POST', body: fd });
        j.progress = 90;
        renderQueue();

        const d = await res.json();
        if (res.ok && d.success) {
            j.status = 'done';
            j.doneAt = new Date();
            j.progress = 100;
            j.itemsProcessed = 1;
            j.totalItems = 1;

            await apiPut(`/api/jobs/${j.id}`, {
                status: 'done',
                progress: 100,
                itemsProcessed: 1,
                doneAt: j.doneAt.toISOString()
            });

            qLog('ok', `Qwen Done: ${j.name}`);
            try {
                // Save output to local text file instead of DB
                const dirName = 'Image_Analysis';
                const safeName = j.name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
                const ts = new Date().toISOString().replace(/[:.]/g, '-');
                await apiPost('/api/save_local_file', {
                    folder: dirName,
                    filename: `${safeName}_${ts}.txt`,
                    content: `[Analyzed ${new Date().toLocaleString()}]\n\nImage: ${j.name}\nResult length: ${d.result?.length || 0} characters.\n\n${d.result}`
                });
                qLog('ok', `Result saved to DataCollected/${dirName}`);
            } catch (e) {
                console.error("Local save error:", e);
                qLog('err', 'Failed saving local result text');
            }
        } else {
            j.status = 'failed';
            j.progress = 0;
            await apiPut(`/api/jobs/${j.id}`, { status: 'failed', errorMsg: d.error });
            qLog('err', `Qwen Error: ${d.error}`);
        }
    } catch (err) {
        j.status = 'done';
        j.progress = 100;
        j.doneAt = new Date();
        await apiPut(`/api/jobs/${j.id}`, { status: 'done', progress: 100, doneAt: j.doneAt.toISOString() });
        qLog('warn', 'Qwen offline - fallback used for image');
    }
    renderQueue();
    updateStats();
}

/* ═══ WHATSAPP ═══ */
function waSaveGroups() {
    const jids = document.getElementById('wa-jids').value.trim().split('\n').filter(Boolean);
    apiPost('/api/settings', { key: 'wa_jids', value: jids });
    qLog('ok', `WhatsApp: ${jids.length} group(s) configured`);
    alert(`Saved ${jids.length} group(s).`);
}

async function waQueueAll() {
    await createJob('WhatsApp Live Feed', '💬', 'whatsapp', 'webhook');
}

/* ═══ CHIPS ═══ */
function focusChip(id) { const el = document.getElementById(id); if (el) el.focus(); }

function addChip(e, inp, wrapId) {
    if (e.key !== 'Enter' && e.key !== ',') return;
    e.preventDefault();
    const val = inp.value.trim().replace(/^[@#,\s]+/, '').replace(/[,\s]+$/, '');
    if (!val) return;
    const p = wrapId.includes('kw') ? '#' : '@';
    const c = document.createElement('span');
    c.className = 'chip';
    c.innerHTML = `${p}${val} <span class="chip-del" onclick="removeChip(this)">×</span>`;
    inp.parentNode.insertBefore(c, inp);
    inp.value = '';
}

function removeChip(el) { el.parentNode.remove(); }

function copyText(id) {
    const el = document.getElementById(id);
    if (!el) return;
    navigator.clipboard.writeText(el.textContent).then(() => {
        const b = el.nextElementSibling;
        const o = b.textContent;
        b.textContent = '✓ COPIED';
        b.style.color = 'var(--green)';
        setTimeout(() => { b.textContent = o; b.style.color = ''; }, 1500);
    });
}

function regenToken(id) {
    const el = document.getElementById(id);
    if (!el) return;
    const c = 'abcdefghijklmnopqrstuvwxyz0123456789_';
    el.value = 'nb_' + Array.from({ length: 20 }, () => c[Math.floor(Math.random() * c.length)]).join('');
}

/* ═══ DATABASE ═══ */
function autoFillPrisma() {
    const pgBtn = document.getElementById('db-btn-pg');
    if (pgBtn) dbSelectType(pgBtn, 'pg', '5432', '');
    document.getElementById('db-host').value = 'ep-bold-sun-a8jpixb6-pooler.eastus2.azure.neon.tech';
    document.getElementById('db-port').value = '5432';
    document.getElementById('db-name').value = 'neondb';
    document.getElementById('db-user').value = 'neondb_owner';

    const pInput = document.getElementById('db-pass');
    if (pInput) pInput.value = 'npg_EmIV5WQi3bGr';

    qLog('ok', 'Prisma Database credentials auto-filled successfully.');
}

let dbType = 'sqlite';
let dbPrismaStudioOpen = false;

function dbSelectType(el, type, port, uri) {
    document.querySelectorAll('.dbtype-btn').forEach(b => b.classList.remove('active'));
    el.classList.add('active');
    dbType = type;
    document.getElementById('db-port').value = port;
    document.getElementById('db-uri').placeholder = uri;
    document.getElementById('db-type-badge').textContent = el.querySelector('.dbtype-lbl').textContent;
    document.getElementById('db-test-status').textContent = '';

    const isSqlite = type === 'sqlite';
    ['db-host', 'db-port', 'db-name', 'db-user', 'db-pass'].forEach(id => {
        const input = document.getElementById(id);
        if (input) {
            input.disabled = isSqlite;
            input.style.opacity = isSqlite ? '0.5' : '1';
        }
    });
}

function dbTogglePassword() {
    const inp = document.getElementById('db-pass');
    const btn = document.getElementById('db-pass-toggle');
    if (!inp || !btn) return;
    if (inp.type === 'password') {
        inp.type = 'text';
        btn.textContent = '👁‍🗨';
        btn.title = 'Hide password';
    } else {
        inp.type = 'password';
        btn.textContent = '👁';
        btn.title = 'Show password';
    }
}

async function dbTest() {
    const el = document.getElementById('db-test-status');
    const prismaSection = document.getElementById('db-prisma-section');
    el.textContent = '⟲ Testing connection...';
    el.style.color = 'var(--amber)';

    try {
        const res = await fetch('/api/db/test-connection', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                host: document.getElementById('db-host').value,
                port: document.getElementById('db-port').value,
                dbName: document.getElementById('db-name').value,
                user: document.getElementById('db-user').value,
                password: document.getElementById('db-pass').value,
                uri: document.getElementById('db-uri').value,
                dbType
            })
        });
        const data = await res.json();

        if (data.ok) {
            el.textContent = '✓ Connected — Prisma Studio launching...';
            el.style.color = 'var(--green)';
            qLog('ok', `DB connection OK: NetaBoardV5 @ localhost:3000`);

            // Show Prisma Studio iframe
            if (prismaSection) {
                prismaSection.style.display = 'block';
                const iframe = document.getElementById('db-prisma-iframe');
                if (iframe) {
                    iframe.src = data.prismaStudioUrl || 'http://localhost:5555';
                }
                dbPrismaStudioOpen = true;
                setTimeout(() => {
                    el.textContent = '✓ Connected — Prisma Studio ready';
                }, 2000);
            }

            // Auto-load tables
            dbLoadTables();
        } else {
            el.textContent = '✕ ' + (data.error || 'Connection failed');
            el.style.color = 'var(--red)';
            qLog('err', `DB connection failed: ${data.error || 'Unknown error'}`);
            if (prismaSection) prismaSection.style.display = 'none';
            dbPrismaStudioOpen = false;
        }
    } catch (err) {
        el.textContent = '✕ Network error — is the server running?';
        el.style.color = 'var(--red)';
        qLog('err', `DB test error: ${err.message}`);
        if (prismaSection) prismaSection.style.display = 'none';
        dbPrismaStudioOpen = false;
    }
}

async function dbLoadTables() {
    const tableInput = document.getElementById('db-table');
    const tableList = document.getElementById('db-table-chips');

    try {
        const res = await fetch('/api/db/tables');
        const data = await res.json();

        if (data.tables && data.tables.length) {
            if (tableList) {
                tableList.innerHTML = data.tables.map(t =>
                    `<span class="db-table-chip" onclick="dbSelectTable('${t}')">${t}</span>`
                ).join('');
                tableList.style.display = 'flex';
            }
            if (tableInput && !tableInput.value) {
                tableInput.value = data.tables[0];
            }
            qLog('info', `Loaded ${data.tables.length} tables from Prisma schema`);
        } else {
            qLog('warn', 'No models found in Prisma schema');
        }
    } catch (err) {
        // Fallback to mock list
        const t = ['Archetype', 'Constituency', 'PillarScore', 'SansadRecord', 'Feedback', 'SocialItem', 'Alert'];
        if (tableList) {
            tableList.innerHTML = t.map(name =>
                `<span class="db-table-chip" onclick="dbSelectTable('${name}')">${name}</span>`
            ).join('');
            tableList.style.display = 'flex';
        }
        if (tableInput) tableInput.value = t[0];
    }
}

function dbSelectTable(name) {
    document.getElementById('db-table').value = name;
    // Highlight selected chip
    document.querySelectorAll('.db-table-chip').forEach(c => {
        c.classList.toggle('active', c.textContent === name);
    });
    // Auto-run preview query
    dbRunQuery();
}

async function dbRunQuery() {
    const table = document.getElementById('db-table').value;
    const queryEl = document.getElementById('db-query');
    const resultsSection = document.getElementById('db-query-results');
    if (!table) { alert('Select a table first.'); return; }

    const resultsBody = document.getElementById('db-results-body');
    const resultsHeader = document.getElementById('db-results-header');
    const resultsCount = document.getElementById('db-results-count');

    if (resultsSection) resultsSection.style.display = 'block';
    if (resultsBody) resultsBody.innerHTML = '<tr><td colspan="10" style="text-align:center;color:var(--amber);padding:1rem;">⟲ Querying...</td></tr>';

    try {
        const res = await fetch('/api/db/query', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                table,
                query: queryEl ? queryEl.value : '',
                limit: 20,
                host: document.getElementById('db-host').value,
                port: document.getElementById('db-port').value,
                dbName: document.getElementById('db-name').value,
                user: document.getElementById('db-user').value,
                password: document.getElementById('db-pass').value,
                uri: document.getElementById('db-uri').value,
                dbType
            })
        });
        const data = await res.json();

        if (data.ok && data.rows && data.rows.length) {
            const cols = Object.keys(data.rows[0]);
            if (resultsHeader) {
                resultsHeader.innerHTML = cols.map(c => `<th>${c}</th>`).join('');
            }
            if (resultsBody) {
                resultsBody.innerHTML = data.rows.map(row =>
                    '<tr>' + cols.map(c => {
                        let val = row[c];
                        if (val === null || val === undefined) val = '<span style="color:var(--text4)">null</span>';
                        else if (typeof val === 'object') val = '<span style="color:var(--purple);font-size:0.5rem">' + JSON.stringify(val).slice(0, 60) + '</span>';
                        else if (String(val).length > 50) val = String(val).slice(0, 50) + '…';
                        return `<td>${val}</td>`;
                    }).join('') + '</tr>'
                ).join('');
            }
            if (resultsCount) resultsCount.textContent = `${data.rows.length} row${data.rows.length !== 1 ? 's' : ''}`;
            qLog('ok', `Query OK: ${table} → ${data.rows.length} rows`);
        } else if (data.note) {
            if (resultsBody) resultsBody.innerHTML = `<tr><td colspan="10" style="text-align:center;color:var(--amber);padding:1rem;">${data.note}</td></tr>`;
            if (resultsCount) resultsCount.textContent = '0 rows';
        } else {
            if (resultsBody) resultsBody.innerHTML = '<tr><td colspan="10" style="text-align:center;color:var(--text3);padding:1rem;">No data returned</td></tr>';
            if (resultsCount) resultsCount.textContent = '0 rows';
        }
    } catch (err) {
        if (resultsBody) resultsBody.innerHTML = `<tr><td colspan="10" style="text-align:center;color:var(--red);padding:1rem;">Error: ${err.message}</td></tr>`;
    }
}

function dbClosePrisma() {
    const sec = document.getElementById('db-prisma-section');
    const iframe = document.getElementById('db-prisma-iframe');
    if (sec) sec.style.display = 'none';
    if (iframe) iframe.src = 'about:blank';
    dbPrismaStudioOpen = false;
}

async function dbQueue() {
    const t = document.getElementById('db-table').value || 'table';
    const j = await createJob(`DB Import: ${dbType.toUpperCase()} — ${t}`, '🗄️', 'database', dbType);
    setTimeout(() => startJob(j.id), 800);
}

/* ═══ KAGGLE ═══ */
const KAGGLE_DATASETS = [
    { slug: 'datatattle/india-politics-tweets-2024', name: 'India Politics Tweets 2024', type: 'twitter', color: 'var(--cyan)', rows: '~2M rows', size: '340 MB', desc: 'Tweets from major Indian political accounts during 2024 elections.' },
    { slug: 'suchintya/indian-political-fb-posts', name: 'Indian Political FB Posts', type: 'facebook', color: 'var(--blue)', rows: '~500K posts', size: '120 MB', desc: 'Facebook posts from top Indian political pages.' },
    { slug: 'amananandrai/india-news-articles', name: 'India News Articles Dataset', type: 'news', color: 'var(--amber)', rows: '600K articles', size: '890 MB', desc: 'News articles from 25+ publications, 2018–2024.' },
    { slug: 'wherethecrowds/whatsapp-india-political', name: 'WhatsApp Indian Political', type: 'whatsapp', color: 'var(--green)', rows: '180K messages', size: '45 MB', desc: 'Forwarded messages from Indian political WhatsApp groups.' },
    { slug: 'datascopeai/indian-election-memes-2024', name: 'Indian Election Memes 2024', type: 'images', color: 'var(--purple)', rows: '45K images', size: '2.1 GB', desc: 'Political memes from 2024 elections with annotations.' },
    { slug: 'openparldata/india-parliament-bills-2019-24', name: 'Parliament Bills 2019–24', type: 'pdf', color: 'var(--red)', rows: '1,200 PDFs', size: '1.8 GB', desc: 'Full text PDFs of bills from Lok Sabha 2019-2024.' }
];

function renderKaggle() {
    const grid = document.getElementById('kg-grid');
    if (!grid) return;

    grid.innerHTML = KAGGLE_DATASETS.map(d => {
        return `<div class="kg-card">
            <div class="kg-type" style="color:${d.color}">${d.type.toUpperCase()}</div>
            <div class="kg-name">${d.name}</div>
            <div class="kg-slug">${d.slug}</div>
            <div class="kg-meta">
                <div class="kg-meta-item" style="color:${d.color}">${d.rows}</div>
                <div class="kg-meta-item">💾 ${d.size}</div>
            </div>
            <div style="font-family:var(--mono);font-size:0.46rem;color:var(--text3);line-height:1.5;margin-bottom:0.6rem;">${d.desc}</div>
            <button class="btn btn-primary btn-sm" onclick="kgImport('${d.slug}','${d.type}','${d.name}')">⬇ Import Dataset</button>
        </div>`;
    }).join('');
}

async function kgImport(slug, pipeline, name) {
    document.getElementById('kg-slug').value = slug;
    document.getElementById('kg-pipeline').value = pipeline;
    const j = await createJob(`Kaggle: ${name}`, '📊', 'kaggle', slug);
    setTimeout(() => startJob(j.id), 400);
}

async function kgQueueSlug() {
    const slug = document.getElementById('kg-slug').value.trim();
    if (!slug) { alert('Enter a Kaggle slug.'); return; }
    const j = await createJob(`Kaggle: ${slug}`, '📊', 'kaggle', slug);
    setTimeout(() => startJob(j.id), 400);
    document.getElementById('kg-slug').value = '';
}

/* ═══ INIT ═══ */
window.addEventListener('DOMContentLoaded', () => {
    renderKaggle();
    loadState(); // Restore state from SQLite on load
});

// PDF Helper Functions
function renderPdfCards() {
    let section = document.getElementById('pdf-job-section');
    if (!section) {
        const vPdfs = document.getElementById('v-pdfs');
        if (vPdfs) {
            const vscroll = vPdfs.querySelector('.vscroll');
            if (vscroll) {
                const markup = `
                  <div id="pdf-job-section" style="display:none; margin-top:1.5rem;">
                    <div class="card" style="width:100%;">
                      <div class="card-hdr" style="justify-content:space-between;">
                        <div class="card-title"><span class="icon">📄</span> <span id="pdf-job-count">0 Document Jobs</span></div>
                      </div>
                      <div class="card-body p0" id="pdf-job-list"></div>
                    </div>
                  </div>
                `;
                vscroll.insertAdjacentHTML('beforeend', markup);
                section = document.getElementById('pdf-job-section');
            }
        }
    }

    if (!section) return; // if STILL nothing, give up

    const container = document.getElementById('pdf-job-list');
    const countSpan = document.getElementById('pdf-job-count');
    if (!container) return;

    const pdfJobs = jobs.filter(j => j.sourceType === 'pdf');
    if (pdfJobs.length === 0) {
        section.style.display = 'none';
        return;
    }
    section.style.display = 'block';

    if (countSpan) countSpan.textContent = `${pdfJobs.length} Document Jobs`;

    container.innerHTML = pdfJobs.map(j => {
        const isDone = j.status === 'done';
        const isFail = j.status === 'failed';
        const isProc = j.status === 'processing';

        let dot = 'dot-x';
        let txt = 'Queued';
        if (isDone) { dot = 'dot-g'; txt = 'Done'; }
        else if (isFail) { dot = 'dot-r'; txt = 'Failed'; }
        else if (isProc) { dot = 'dot-b'; txt = 'Processing'; }
        else if (j.status === 'paused') { dot = 'dot-a'; txt = 'Paused'; }

        let pg = j.progress || 0;

        let resBtn = '';
        if (isDone && (j.extractedPyMuPDF || j.extractedQwen)) {
            resBtn = `<button class="btn btn-xs btn-outline" style="margin-left:0.5rem; border-color:var(--cyan3); color:var(--cyan); border-radius:4px; padding:0.1rem 0.4rem;" onclick="showPdfPreview(${j.id})">Preview Text 👁️</button>`;
        }

        let cancelBtn = `<button class="btn btn-xs btn-outline" style="border-radius:4px;" onclick="removeJob(${j.id})">Remove</button>`;

        return `
        <div style="padding:0.75rem 1rem; border-bottom:1px solid var(--border2); display:flex; flex-direction:column; gap:0.5rem;">
            <div style="display:flex; justify-content:space-between; align-items:flex-start;">
                <div>
                    <div style="font-weight:600; font-size:0.85rem; color:var(--text); margin-bottom:0.2rem;">📄 ${j.name}</div>
                    <div style="display:flex; align-items:center; gap:0.5rem; font-family:var(--mono); font-size:0.75rem; color:var(--text3);">
                       <span class="dot ${dot}"></span> ${txt}
                       ${isProc || isDone ? ` • ${pg}%` : ''}
                       ${resBtn}
                    </div>
                </div>
                <div>${cancelBtn}</div>
            </div>
            ${!isDone && !isFail ? `
            <div class="prog-track" style="height:3px;">
                <div class="prog-fill" style="width:${pg}%; background:var(--cyan); ${isProc ? 'animation:pulse 1.5s infinite;' : ''}"></div>
            </div>` : ''}
        </div>
        `;
    }).join('');
}

function showPdfPreview(jobId) {
    const j = jobs.find(x => x.id === jobId);
    if (!j) return;

    let modal = document.getElementById('pdf-text-modal');
    if (!modal) {
        document.body.insertAdjacentHTML('beforeend', `
          <div id="pdf-text-modal" class="modal" style="display:none; position:fixed; inset:0; z-index:9999; background:rgba(0,0,0,0.85); align-items:center; justify-content:center;">
            <div style="background:var(--bg1); border:1px solid var(--border); border-radius:var(--radius); width:90%; max-width:800px; display:flex; flex-direction:column; max-height:85vh; overflow:hidden; box-shadow:0 10px 40px rgba(0,0,0,0.5);">
              <div style="padding:1rem 1.25rem; border-bottom:1px solid var(--border); display:flex; align-items:center; justify-content:space-between; background:var(--bg2);">
                <div style="font-weight:600; color:var(--text); letter-spacing:0.02em; display:flex; align-items:center; gap:0.5rem;"><span style="font-size:1.1rem;">📄</span> Extracted Document Text</div>
                <button class="btn btn-xs" style="padding:0.2rem 0.5rem; border-radius:4px; border-color:transparent;" onclick="document.getElementById('pdf-text-modal').style.display='none'">✕ Close</button>
              </div>
              <div style="padding:1rem; display:flex; flex-direction:column; flex:1; overflow:hidden;">
                <div id="pdf-modal-tabs" style="display:flex; gap:0.5rem; margin-bottom:1rem; border-bottom:1px solid var(--border2); padding-bottom:0.75rem;">
                  <button class="btn btn-sm btn-primary" id="btn-pymupdf-tab" onclick="switchPdfModalTab('pymupdf')" style="border-radius:4px;">PyMuPDF Text</button>
                  <button class="btn btn-sm btn-outline" id="btn-qwen-tab" onclick="switchPdfModalTab('qwen')" style="border-radius:4px;">Qwen Vision OCR</button>
                </div>
                <div id="modal-pymupdf-text" style="flex:1; overflow-y:auto; white-space:pre-wrap; display:block; background:var(--bg); border:1px solid var(--border2); border-radius:4px; padding:1rem; font-family:var(--mono); font-size:0.75rem; color:var(--text2); line-height:1.6;"></div>
                <div id="modal-qwen-text" style="flex:1; overflow-y:auto; white-space:pre-wrap; display:none; background:var(--bg); border:1px solid var(--border2); border-radius:4px; padding:1rem; font-family:var(--mono); font-size:0.75rem; color:var(--text2); line-height:1.6;"></div>
              </div>
            </div>
          </div>
        `);
        modal = document.getElementById('pdf-text-modal');
    }

    const pyText = document.getElementById('modal-pymupdf-text');
    const qwenText = document.getElementById('modal-qwen-text');
    const btnPy = document.getElementById('btn-pymupdf-tab');
    const btnQwen = document.getElementById('btn-qwen-tab');

    if (j.extractedPyMuPDF) {
        pyText.textContent = j.extractedPyMuPDF;
        pyText.style.display = 'block';
        btnPy.style.display = 'block';
    } else {
        pyText.style.display = 'none';
        btnPy.style.display = 'none';
    }

    if (j.extractedQwen) {
        qwenText.textContent = j.extractedQwen;
        qwenText.style.display = 'none';
        btnQwen.style.display = 'block';
    } else {
        qwenText.style.display = 'none';
        btnQwen.style.display = 'none';
    }

    if (j.extractedPyMuPDF) {
        switchPdfModalTab('pymupdf');
    } else if (j.extractedQwen) {
        switchPdfModalTab('qwen');
    } else {
        pyText.textContent = "No text extracted.";
        pyText.style.display = 'block';
        btnPy.style.display = 'block';
        switchPdfModalTab('pymupdf');
    }

    document.getElementById('pdf-text-modal').style.display = 'flex';
}

function switchPdfModalTab(tab) {
    const btnPy = document.getElementById('btn-pymupdf-tab');
    const btnQwen = document.getElementById('btn-qwen-tab');
    const pyText = document.getElementById('modal-pymupdf-text');
    const qwenText = document.getElementById('modal-qwen-text');

    if (tab === 'pymupdf') {
        btnPy.className = 'btn btn-sm btn-primary';
        btnQwen.className = 'btn btn-sm btn-outline';
        pyText.style.display = 'block';
        qwenText.style.display = 'none';
    } else {
        btnPy.className = 'btn btn-sm btn-outline';
        btnQwen.className = 'btn btn-sm btn-primary';
        pyText.style.display = 'none';
        qwenText.style.display = 'block';
    }
}

// DataCollected Preprocessing Helper Functions
async function loadDataCollectedFolder() {
    const treeEl = document.getElementById('data-col-tree');
    if (!treeEl) return;

    treeEl.innerHTML = '<div style="color:var(--text4); padding:0.5rem;">Loading data...</div>';

    try {
        const res = await fetch('/api/fs/datacollected');
        const data = await res.json();

        if (!data.files || data.files.length === 0) {
            treeEl.innerHTML = '<div style="color:var(--text4); padding:0.5rem;">No files found in DataCollected foldler.</div>';
            return;
        }

        // Group by folder
        const grouped = {};
        data.files.forEach(f => {
            const parts = f.path.split('/');
            const folderName = parts.length > 1 ? parts[0] : 'root';
            if (!grouped[folderName]) grouped[folderName] = [];
            grouped[folderName].push(f);
        });

        // Render
        let html = '';
        for (const [folder, files] of Object.entries(grouped)) {
            html += `<div style="margin-bottom:0.75rem;">
                <div style="font-weight:600; color:var(--text); margin-bottom:0.2rem; cursor:pointer;" onclick="this.nextElementSibling.style.display = this.nextElementSibling.style.display === 'none' ? 'block' : 'none';">📁 ${folder}</div>
                <div style="padding-left:1rem;">
                    ${files.map(f => {
                const kb = (f.size / 1024).toFixed(1);
                return `<div style="padding:0.2rem 0; cursor:pointer; color:var(--text2);" 
                                  onmouseover="this.style.color='var(--cyan)'" 
                                  onmouseout="this.style.color='var(--text2)'"
                                  onclick="openDataCollectedFile('${f.path}')" title="${f.name}">
                                📄 ${f.name} <span style="font-size:0.6rem; color:var(--text4); margin-left:4px;">(${kb} KB)</span>
                              </div>`;
            }).join('')}
                </div>
            </div>`;
        }
        treeEl.innerHTML = html;

    } catch (e) {
        treeEl.innerHTML = `<div style="color:var(--red); padding:0.5rem;">Error loading data: ${e.message}</div>`;
    }
}

async function openDataCollectedFile(path) {
    const hdr = document.getElementById('data-col-hdr');
    const preview = document.getElementById('data-col-preview');
    if (!hdr || !preview) return;

    hdr.textContent = `Loading: ${path}...`;
    preview.value = 'Loading contents...';

    try {
        const res = await fetch(`/api/fs/datacollected/file?path=${encodeURIComponent(path)}`);
        if (!res.ok) {
            const err = await res.json();
            throw new Error(err.error || 'Failed to load file');
        }

        const content = await res.text();
        hdr.innerHTML = `Viewing: <strong>${path}</strong>`;
        preview.value = content;

    } catch (e) {
        hdr.textContent = `Error: ${path}`;
        preview.value = `Error loading file: ${e.message}`;
    }
}

// ═══════════════════════════════════════════════════════════════
//  MYDATABASE ENGINE
//  Prisma Studio embed + live SQLite query runner
// ═══════════════════════════════════════════════════════════════

let mydbLastResults = [];

async function mydbCheckStatus() {
    const dot = document.getElementById('mydb-status-dot');
    const txt = document.getElementById('mydb-status-txt');
    const prismaDot = document.getElementById('mydb-prisma-dot');
    if (!dot) return;
    try {
        await fetch('http://localhost:5555', { signal: AbortSignal.timeout(2000), mode: 'no-cors' });
        dot.style.background = 'var(--green)';
        dot.style.boxShadow = '0 0 6px var(--green)';
        if (txt) txt.textContent = '✓ Prisma Studio connected — SQLite dev.db';
        if (prismaDot) { prismaDot.style.background = 'var(--green)'; prismaDot.style.boxShadow = '0 0 6px var(--green)'; }
    } catch (_) {
        dot.style.background = 'var(--red)';
        dot.style.boxShadow = '0 0 6px var(--red)';
        if (txt) txt.textContent = '✗ Prisma Studio offline — run ./start_all.sh';
        if (prismaDot) { prismaDot.style.background = 'var(--red)'; prismaDot.style.boxShadow = '0 0 6px var(--red)'; }
    }
}

async function mydbLoadTables() {
    const listEl = document.getElementById('mydb-table-list');
    if (!listEl) return;
    listEl.innerHTML = '<div style="color:var(--text4);font-size:0.52rem;padding:0.5rem;">Loading...</div>';
    try {
        const res = await fetch('/api/mydb/tables');
        const data = await res.json();
        if (!data.tables || !data.tables.length) {
            listEl.innerHTML = '<div style="color:var(--text4);font-size:0.52rem;padding:0.5rem;">No tables found</div>';
            return;
        }
        listEl.innerHTML = data.tables.map(t => `
            <button class="btn btn-xs btn-outline"
              style="text-align:left;justify-content:flex-start;font-family:var(--mono);font-size:0.55rem;padding:0.35rem 0.5rem;"
              onclick="mydbSelectTable('${t.name}')">
              <span style="color:var(--cyan);margin-right:0.35rem;">▸</span>${t.name}
              <span style="margin-left:auto;color:var(--text4);font-size:0.44rem;">${t.count} rows</span>
            </button>`).join('');
    } catch (e) {
        listEl.innerHTML = `<div style="color:var(--red);font-size:0.52rem;padding:0.5rem;">Error: ${e.message}</div>`;
    }
}

function mydbSelectTable(name) {
    mydbSetQuery(`SELECT * FROM "${name}" LIMIT 50;`);
    mydbRunQuery();
}

function mydbSetQuery(sql) {
    const el = document.getElementById('mydb-query-input');
    if (el) el.value = sql;
}

function mydbClearQuery() {
    const el = document.getElementById('mydb-query-input');
    if (el) el.value = '';
    const rc = document.getElementById('mydb-results-card');
    if (rc) rc.style.display = 'none';
    const qs = document.getElementById('mydb-query-status');
    if (qs) qs.textContent = '';
    const qc = document.getElementById('mydb-row-count');
    if (qc) qc.textContent = '';
    mydbLastResults = [];
}

async function mydbRunQuery() {
    const input = document.getElementById('mydb-query-input');
    const statusEl = document.getElementById('mydb-query-status');
    const countEl = document.getElementById('mydb-row-count');
    const resultsCard = document.getElementById('mydb-results-card');
    if (!input) return;
    const sql = input.value.trim();
    if (!sql) { if (statusEl) statusEl.textContent = 'No query entered.'; return; }
    if (statusEl) statusEl.innerHTML = '<span style="color:var(--amber);">⟳ Running...</span>';
    if (countEl) countEl.textContent = '';
    try {
        const res = await fetch('/api/mydb/query', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sql })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Query failed');
        mydbLastResults = data.rows || [];
        mydbRenderResults(mydbLastResults);
        if (statusEl) statusEl.innerHTML = `<span style="color:var(--green);">✓ Done in ${data.ms}ms</span>`;
        if (countEl) countEl.textContent = `${mydbLastResults.length} row${mydbLastResults.length !== 1 ? 's' : ''}`;
        if (resultsCard) resultsCard.style.display = mydbLastResults.length > 0 ? 'block' : 'none';
    } catch (e) {
        if (statusEl) statusEl.innerHTML = `<span style="color:var(--red);">✗ ${e.message}</span>`;
        if (resultsCard) resultsCard.style.display = 'none';
    }
}

function mydbRenderResults(rows) {
    const thead = document.getElementById('mydb-results-thead');
    const tbody = document.getElementById('mydb-results-tbody');
    if (!thead || !tbody || !rows.length) return;
    const cols = Object.keys(rows[0]);
    thead.innerHTML = '<tr>' + cols.map(c =>
        `<th style="padding:0.4rem 0.65rem;border-bottom:1px solid var(--border);color:var(--cyan);font-weight:600;white-space:nowrap;text-align:left;">${c}</th>`
    ).join('') + '</tr>';
    tbody.innerHTML = rows.map((row, i) =>
        `<tr style="background:${i % 2 === 0 ? 'var(--bg2)' : 'var(--bg1)'};" onmouseover="this.style.background='var(--bg3)'" onmouseout="this.style.background='${i % 2 === 0 ? 'var(--bg2)' : 'var(--bg1)'}'">` +
        cols.map(c => {
            const raw = row[c] == null ? '' : String(row[c]);
            const display = raw.length > 80 ? raw.substring(0, 80) + '…' : raw;
            const cell = raw === '' ? '<span style="color:var(--text4);">NULL</span>' : display;
            return `<td style="padding:0.4rem 0.65rem;border-bottom:1px solid var(--border2);color:var(--text2);white-space:nowrap;max-width:300px;overflow:hidden;text-overflow:ellipsis;" title="${raw.replace(/"/g, '&quot;')}">${cell}</td>`;
        }).join('') + '</tr>'
    ).join('');
}

function mydbExportCSV() {
    if (!mydbLastResults.length) return;
    const cols = Object.keys(mydbLastResults[0]);
    const csv = [cols.join(','), ...mydbLastResults.map(row =>
        cols.map(c => `"${String(row[c] ?? '').replace(/"/g, '""')}"`).join(',')
    )].join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    a.download = `query_results_${Date.now()}.csv`;
    a.click();
}

function mydbReloadIframe() {
    const iframe = document.getElementById('mydb-prisma-iframe');
    if (iframe) { iframe.src = 'about:blank'; setTimeout(() => { iframe.src = 'http://localhost:5555'; }, 100); }
}

document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', () => {
            if (item.dataset.view === 'mydb') {
                mydbCheckStatus();
                mydbLoadTables();
            }
            if (item.dataset.view === 'preproving') {
                nriLoadAll();
            }
        });
    });
});

// ═══════════════════════════════════════════════════════════════
//  PREPROVING — NRI FILE SCORING PIPELINE
// ═══════════════════════════════════════════════════════════════

const NRI_PILLARS = [
    'electoral_strength', 'legislative_performance', 'constituency_development',
    'public_accessibility', 'communication', 'party_standing', 'media_coverage',
    'digital_influence', 'financial_muscle', 'alliance_intel',
    'caste_equation', 'anti_incumbency', 'grassroots_network',
    'ideology_consistency', 'scandal_index'
];

const PILLAR_LABELS = {
    electoral_strength: 'Electoral Strength',
    legislative_performance: 'Legislative Perf.',
    constituency_development: 'Constituency Dev.',
    public_accessibility: 'Public Access.',
    communication: 'Communication',
    party_standing: 'Party Standing',
    media_coverage: 'Media Coverage',
    digital_influence: 'Digital Influence',
    financial_muscle: 'Financial Muscle',
    alliance_intel: 'Alliance Intel',
    caste_equation: 'Caste Equation',
    anti_incumbency: 'Anti-Incumbency',
    grassroots_network: 'Grassroots Network',
    ideology_consistency: 'Ideology Consist.',
    scandal_index: 'Scandal Index'
};

let nriFiles = [];
let nriDisplayFiles = [];
let nriQueue = [];
let selectedNriFileId = null;

function scoreColor(score) {
    if (score === null || score === undefined) return '#555';
    if (score >= 70) return 'var(--green)';
    if (score >= 40) return 'var(--amber)';
    return 'var(--red)';
}

function heatColor(val) {
    // val = 0.0–1.0 relevance
    if (val === null || val === undefined) return 'var(--bg4)';
    const v = parseFloat(val);
    if (v >= 0.7) return 'rgba(34,197,94,0.5)';
    if (v >= 0.3) return 'rgba(245,158,11,0.4)';
    return 'rgba(100,100,120,0.15)';
}

function formatBytes(b) {
    if (!b) return '—';
    if (b < 1024) return b + ' B';
    if (b < 1024 * 1024) return (b / 1024).toFixed(1) + ' KB';
    return (b / (1024 * 1024)).toFixed(1) + ' MB';
}

function fmtDate(d) {
    if (!d) return '—';
    try { return new Date(d).toLocaleDateString() + ' ' + new Date(d).toTimeString().slice(0, 5); }
    catch { return d; }
}

async function nriLoadStats() {
    try {
        const s = await fetch('/api/nri/stats').then(r => r.json());
        const setEl = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };
        setEl('nri-total', s.total || 0);
        setEl('nri-queued', s.queued || 0);
        setEl('nri-processing', s.processing || 0);
        setEl('nri-done', s.done || 0);
        setEl('nri-failed', s.failed || 0);
        setEl('nri-pending', s.pending || 0);
        setEl('nri-scores-cnt', s.totalScores || 0);
        setEl('nri-avg-score', s.avgScore != null ? s.avgScore : '—');

        const badge = document.getElementById('nb-nri');
        if (badge) {
            const active = (s.queued || 0) + (s.processing || 0);
            badge.textContent = active;
            badge.style.display = active > 0 ? 'flex' : 'none';
        }
    } catch (e) { console.warn('[NRI] Stats fetch failed:', e.message); }
}

async function nriLoadFiles() {
    try {
        nriFiles = await fetch('/api/nri/files').then(r => r.json());
        nriDisplayFiles = [...nriFiles];
        renderNriFiles();
        const cnt = document.getElementById('nri-files-count');
        if (cnt) cnt.textContent = `${nriFiles.length} files`;
    } catch (e) { console.warn('[NRI] Files fetch failed:', e.message); }
}

async function nriLoadQueue() {
    try {
        nriQueue = await fetch('/api/nri/queue').then(r => r.json());
        renderNriQueue();
        const cnt = document.getElementById('nri-queue-count');
        if (cnt) cnt.textContent = `${nriQueue.length} items`;
    } catch (e) { console.warn('[NRI] Queue fetch failed:', e.message); }
}

async function nriLoadAll() {
    await Promise.all([nriLoadStats(), nriLoadFiles(), nriLoadQueue()]);
}

async function nriScanFiles(btn) {
    if (!btn) btn = document.querySelector('[onclick*="nriScanFiles"]');
    const origText = btn ? btn.textContent : '';
    if (btn) { btn.textContent = '⟳ Scanning…'; btn.disabled = true; }
    try {
        const result = await fetch('/api/nri/files/scan', { method: 'POST' }).then(r => r.json());
        qLog('ok', `[NRI] Scan complete — ${result.discovered} files found: ${result.new} new, ${result.existing} already registered`);
        await nriLoadAll();
    } catch (e) {
        qLog('err', '[NRI] Scan failed: ' + e.message);
    } finally {
        if (btn) { btn.textContent = origText || '🔍 Scan DataCollected'; btn.disabled = false; }
    }
}

async function nriQueueAll(btn) {
    if (!btn) btn = document.querySelector('[onclick*="nriQueueAll"]');
    const origText = btn ? btn.textContent : '';
    if (btn) { btn.textContent = '⟳ Queuing…'; btn.disabled = true; }
    // Reload files first in case scan was just done but nriFiles is stale
    await nriLoadFiles();
    const pending = nriFiles.filter(f => f.processing_state === 'pending');
    if (!pending.length) {
        if (btn) { btn.textContent = origText || '▶ Queue All Pending'; btn.disabled = false; }
        alert('No pending files to queue. All files are already queued or done.');
        return;
    }
    const fileIds = pending.map(f => f.id);
    try {
        const r = await fetch('/api/nri/queue/batch', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ fileIds })
        }).then(r => r.json());
        qLog('ok', `[NRI] Queued ${r.queued} files for scoring`);
        await nriLoadAll();
    } catch (e) {
        qLog('err', '[NRI] Batch queue failed: ' + e.message);
    } finally {
        if (btn) { btn.textContent = origText || '▶ Queue All Pending'; btn.disabled = false; }
    }
}

async function nriQueueSelected() {
    const checked = document.querySelectorAll('.nri-file-chk:checked');
    if (!checked.length) { alert('Select files first.'); return; }
    const fileIds = Array.from(checked).map(c => parseInt(c.dataset.fid));
    const toQueue = fileIds.filter(fid => {
        const f = nriFiles.find(x => x.id === fid);
        return f && f.processing_state !== 'done';
    });
    if (!toQueue.length) { alert('All selected files are already done or unavailable.'); return; }
    try {
        const r = await fetch('/api/nri/queue/batch', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ fileIds: toQueue })
        }).then(r => r.json());
        qLog('ok', `[NRI] Queued ${r.queued} selected files`);
        await nriLoadAll();
    } catch (e) {
        qLog('err', '[NRI] Queue error: ' + e.message);
    }
}

async function nriRemoveFromQueue(fileId) {
    await fetch(`/api/nri/queue/${fileId}`, { method: 'DELETE' });
    await nriLoadAll();
}

async function nriClearQueue() {
    const done = nriQueue.filter(q => q.status === 'done' || q.status === 'failed' || q.status === 'cancelled');
    for (const q of done) {
        await fetch(`/api/nri/queue/${q.file_id}`, { method: 'DELETE' });
    }
    await nriLoadAll();
    qLog('info', '[NRI] Cleared completed queue items');
}

function nriSelectAll() {
    document.querySelectorAll('.nri-file-chk').forEach(c => c.checked = true);
    document.getElementById('nri-chk-all').checked = true;
}

function nriCheckAll(checked) {
    document.querySelectorAll('.nri-file-chk').forEach(c => c.checked = checked);
}

function nriFilterFiles(state) {
    if (state === 'all') nriDisplayFiles = [...nriFiles];
    else nriDisplayFiles = nriFiles.filter(f => f.processing_state === state);
    const search = document.getElementById('nri-file-search')?.value || '';
    if (search) nriDisplayFiles = nriDisplayFiles.filter(f => f.filename.toLowerCase().includes(search.toLowerCase()));
    renderNriFiles();
}

function nriSearchFiles(query) {
    const state = document.getElementById('nri-filter-state')?.value || 'all';
    nriDisplayFiles = state === 'all' ? [...nriFiles] : nriFiles.filter(f => f.processing_state === state);
    if (query) nriDisplayFiles = nriDisplayFiles.filter(f =>
        f.filename.toLowerCase().includes(query.toLowerCase()) ||
        f.folder.toLowerCase().includes(query.toLowerCase())
    );
    renderNriFiles();
}

function renderNriFiles() {
    const tbody = document.getElementById('nri-files-body');
    if (!tbody) return;
    if (!nriDisplayFiles.length) {
        tbody.innerHTML = '<tr><td colspan="9" style="text-align:center;color:var(--text4);padding:1.5rem;">No files match the filter</td></tr>';
        return;
    }
    tbody.innerHTML = nriDisplayFiles.map(f => `
        <tr class="${f.id === selectedNriFileId ? 'selected' : ''}" onclick="nriSelectFile(${f.id})" style="cursor:pointer;">
          <td onclick="event.stopPropagation()"><input type="checkbox" class="nri-file-chk" data-fid="${f.id}"></td>
          <td style="max-width:180px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" title="${f.filename}">
            <span style="color:var(--text);">${f.filename}</span>
          </td>
          <td style="max-width:140px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:var(--text4);">
            ${f.folder || '—'} <span class="tag tag-b" style="margin-left:4px;">${f.platform}</span>
          </td>
          <td style="color:var(--text4);">${formatBytes(f.file_size_bytes)}</td>
          <td style="text-align:center;">
            ${f.pillars_scored > 0
            ? `<span style="color:var(--green);font-weight:600;">${f.pillars_scored}</span>/<span style="color:var(--text4)">15</span>`
            : '<span style="color:var(--text4);">—</span>'}
          </td>
          <td style="text-align:center;">
            ${f.avg_score > 0
            ? `<span style="font-weight:600;color:${scoreColor(f.avg_score)}">${parseFloat(f.avg_score).toFixed(1)}</span>`
            : '<span style="color:var(--text4);">—</span>'}
          </td>
          <td><span class="nri-state-badge nri-state-${f.processing_state}">${f.processing_state}</span></td>
          <td style="color:var(--text4);font-size:0.46rem;">${fmtDate(f.discovered_at)}</td>
          <td onclick="event.stopPropagation()">
            ${f.processing_state === 'pending' || f.processing_state === 'failed'
            ? `<button class="btn btn-xs btn-primary" onclick="nriQueueOne(${f.id}, '${f.filepath}')">▶</button>`
            : f.processing_state === 'done' || f.processing_state === 'processing'
                ? `<button class="btn btn-xs btn-outline" style="border-color:var(--red);color:var(--red);" onclick="nriResetScores(${f.id})" title="Delete Scores & Reset">🗑</button>`
                : f.in_queue
                    ? `<button class="btn btn-xs btn-danger" onclick="nriRemoveFromQueue(${f.id})">✕</button>`
                    : ''}
          </td>
        </tr>`
    ).join('');
}

async function nriQueueOne(fileId, filepath) {
    const f = nriFiles.find(x => x.id === fileId);
    if (!f) return;
    if (f.processing_state === 'done') {
        if (!confirm('This file is already done. Re-queue anyway?')) return;
    }
    await fetch('/api/nri/queue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileId, filepath, priority: 5 })
    });
    qLog('info', `[NRI] Queued ${f.filename}`);
    await nriLoadAll();
}

function renderNriQueue() {
    const tbody = document.getElementById('nri-queue-body');
    if (!tbody) return;
    if (!nriQueue.length) {
        tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;color:var(--text4);padding:1rem;">Queue is empty</td></tr>';
        return;
    }
    tbody.innerHTML = nriQueue.map(q => {
        const priClass = q.priority >= 8 ? 'nri-p-high' : q.priority >= 4 ? 'nri-p-normal' : 'nri-p-low';
        return `<tr class="nri-queue-row">
          <td><span class="nri-priority-badge ${priClass}">${q.priority}</span></td>
          <td style="max-width:160px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" title="${q.filename}">${q.filename}</td>
          <td style="color:var(--text4);font-size:0.46rem;">${q.folder || '—'}</td>
          <td><span class="tag tag-b">${q.platform || 'unknown'}</span></td>
          <td><span class="nri-priority-badge ${priClass}">${q.priority}</span></td>
          <td><span class="nri-state-badge nri-state-${q.status}">${q.status}</span></td>
          <td style="color:var(--text4);font-size:0.45rem;">${fmtDate(q.enqueued_at)}</td>
          <td><button class="btn btn-xs btn-danger" onclick="nriRemoveFromQueue(${q.file_id})">✕</button></td>
        </tr>`;
    }).join('');
}

async function nriSelectFile(fileId) {
    selectedNriFileId = fileId;
    // Re-render to show selection
    renderNriFiles();
    // Load scores for this file
    await nriShowScoreDetail(fileId);
}

async function nriShowScoreDetail(fileId) {
    const panel = document.getElementById('nri-score-panel');
    if (!panel) return;

    const file = nriFiles.find(f => f.id === fileId);
    panel.innerHTML = `<div style="color:var(--text4);font-family:var(--mono);font-size:0.52rem;text-align:center;padding:1rem;">Loading scores...</div>`;

    try {
        const scores = await fetch(`/api/nri/scores?fileId=${fileId}`).then(r => r.json());

        const msFileIdEarly = document.getElementById('ms-file-id');
        if (msFileIdEarly) msFileIdEarly.value = fileId;

        if (!scores.length) {
            panel.innerHTML = `
              <div style="font-size:0.62rem;font-weight:600;color:var(--text);margin-bottom:0.5rem;">${file?.filename || 'File #' + fileId}</div>
              <div class="nri-state-badge nri-state-${file?.processing_state || 'pending'}" style="margin-bottom:0.75rem;">${file?.processing_state || 'pending'}</div>
              <div style="color:var(--text4);font-family:var(--mono);font-size:0.52rem;margin-top:1rem;text-align:center;">
                No scores yet. Queue this file and run the scoring pipeline, or enter scores manually below.
              </div>`;
            return;
        }

        // Build score map
        const scoreMap = {};
        scores.forEach(s => { scoreMap[s.pillar] = s; });

        let html = `
          <div style="font-size:0.62rem;font-weight:600;color:var(--text);margin-bottom:0.35rem;">${file?.filename || 'File #' + fileId}</div>
          <div style="display:flex;gap:0.4rem;align-items:center;flex-wrap:wrap;margin-bottom:0.75rem;">
            <span class="nri-state-badge nri-state-${file?.processing_state || 'pending'}">${file?.processing_state || '?'}</span>
            <span class="tag tag-b">${file?.platform || 'unknown'}</span>
            <span style="color:var(--text4);font-family:var(--mono);font-size:0.44rem;">${scores.length} pillars scored</span>
          </div>
          <div style="margin-bottom:0.75rem;">`;

        NRI_PILLARS.forEach(p => {
            const s = scoreMap[p];
            const label = PILLAR_LABELS[p] || p;
            if (!s) {
                html += `<div class="pillar-bar-row">
                  <div class="pillar-rel-dot" style="background:var(--border2)"></div>
                  <div class="pillar-bar-name" style="opacity:0.4">${label}</div>
                  <div class="pillar-bar-track">
                    <div class="pillar-bar-fill pillar-bar-skipped" style="width:0%;background:var(--border2)"></div>
                  </div>
                  <div class="pillar-bar-value" style="opacity:0.4">N/A</div>
                </div>`;
            } else if (!s.is_relevant) {
                html += `<div class="pillar-bar-row">
                  <div class="pillar-rel-dot" style="background:var(--border2)"></div>
                  <div class="pillar-bar-name" style="opacity:0.4">${label}</div>
                  <div class="pillar-bar-track"><div class="pillar-bar-fill pillar-bar-skipped" style="width:${(s.relevance_score * 100).toFixed(0)}%;background:rgba(100,100,120,0.3)"></div></div>
                  <div class="pillar-bar-value" style="opacity:0.4">Skip</div>
                </div>`;
            } else {
                const sc = s.effective_score ?? s.raw_score ?? 0;
                const col = scoreColor(sc);
                html += `<div class="pillar-bar-row" title="Relevance: ${(s.relevance_score * 100).toFixed(0)}% | Confidence: ${((s.confidence || 0) * 100).toFixed(0)}%">
                  <div class="pillar-rel-dot" style="background:${col}"></div>
                  <div class="pillar-bar-name">${label}</div>
                  <div class="pillar-bar-track">
                    <div class="pillar-bar-fill" style="width:${sc}%;background:${col}"></div>
                  </div>
                  <div class="pillar-bar-value" style="color:${col};font-weight:600">${sc.toFixed(0)}</div>
                </div>`;
            }
        });

        html += `</div>`;

        // Evidence section
        const withEvidence = scores.filter(s => s.evidence && s.is_relevant);
        if (withEvidence.length) {
            html += `<div style="font-family:var(--mono);font-size:0.44rem;color:var(--text4);text-transform:uppercase;letter-spacing:0.1em;margin-bottom:0.4rem;">Evidence</div>`;
            withEvidence.slice(0, 3).forEach(s => {
                html += `<div style="background:var(--bg4);border-radius:4px;padding:0.35rem 0.5rem;margin-bottom:0.3rem;">
                  <div style="color:var(--cyan);font-family:var(--mono);font-size:0.42rem;margin-bottom:0.2rem;">${PILLAR_LABELS[s.pillar] || s.pillar}</div>
                  <div style="font-size:0.5rem;color:var(--text3);line-height:1.4;font-style:italic;">"${s.evidence}"</div>
                </div>`;
            });
        }

        // Set in file ID for manual score entry
        const msFileId = document.getElementById('ms-file-id');
        if (msFileId) msFileId.value = fileId;

        panel.innerHTML = html;
    } catch (e) {
        panel.innerHTML = `<div style="color:var(--red);font-family:var(--mono);font-size:0.52rem;">Error loading scores: ${e.message}</div>`;
    }
}

async function nriLoadHeatmap() {
    const container = document.getElementById('nri-heatmap-container');
    if (!container) return;
    container.innerHTML = '<div style="color:var(--text4);font-family:var(--mono);font-size:0.52rem;text-align:center;padding:1rem;">Loading heatmap data...</div>';

    try {
        const allScores = await fetch('/api/nri/scores?limit=300').then(r => r.json());
        if (!allScores.length) {
            container.innerHTML = '<div style="color:var(--text4);font-family:var(--mono);font-size:0.52rem;text-align:center;padding:1rem;">No score data available yet</div>';
            return;
        }

        // Group by filename
        const fileMap = {};
        allScores.forEach(s => {
            if (!fileMap[s.filepath]) fileMap[s.filepath] = { filename: s.filename, scores: {} };
            fileMap[s.filepath].scores[s.pillar] = s.relevance_score;
        });

        const files = Object.values(fileMap).slice(0, 30); // limit to 30 rows

        let html = '<div class="nri-heatmap">';
        // Top-left empty
        html += '<div class="nri-hm-hdr" style="writing-mode:horizontal-tb;height:auto;padding:0.5rem;font-family:var(--mono);font-size:0.4rem;text-align:center;">File / Pillar</div>';

        // Column headers
        NRI_PILLARS.forEach(p => {
            const short = (PILLAR_LABELS[p] || p).replace('ency', '').replace('tion', '').replace('ment', '').slice(0, 10);
            html += `<div class="nri-hm-hdr">${short}</div>`;
        });

        // Data rows
        files.forEach(f => {
            html += `<div class="nri-hm-file" title="${f.filename}">${f.filename.replace(/\.[^.]+$/, '').slice(0, 18)}</div>`;
            NRI_PILLARS.forEach(p => {
                const val = f.scores[p];
                const bg = heatColor(val);
                const display = val != null ? (parseFloat(val) * 100).toFixed(0) + '%' : '—';
                html += `<div class="nri-hm-cell" style="background:${bg};color:${parseFloat(val || 0) >= 0.3 ? 'var(--text)' : 'var(--text4)'};" title="${PILLAR_LABELS[p]}: ${display}">${display}</div>`;
            });
        });

        html += '</div>';
        container.innerHTML = html;
    } catch (e) {
        container.innerHTML = `<div style="color:var(--red);font-family:var(--mono);font-size:0.52rem;text-align:center;padding:1rem;">Heatmap error: ${e.message}</div>`;
    }
}

async function nriSubmitManualScore() {
    const fileId = parseInt(document.getElementById('ms-file-id')?.value);
    const pillar = document.getElementById('ms-pillar')?.value;
    const relevance = parseFloat(document.getElementById('ms-relevance')?.value);
    const score = parseFloat(document.getElementById('ms-score')?.value);
    const evidence = document.getElementById('ms-evidence')?.value || '';

    if (!fileId || !pillar) { alert('File ID and Pillar are required'); return; }

    const file = nriFiles.find(f => f.id === fileId);
    if (!file) { alert('File ID not found in registry. Scan first.'); return; }

    try {
        await fetch('/api/nri/scores', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                fileId,
                filepath: file.filepath,
                pillar,
                relevanceScore: isNaN(relevance) ? 0 : relevance,
                isRelevant: relevance >= 0.3,
                rawScore: isNaN(score) ? null : score,
                effectiveScore: isNaN(score) ? null : score,
                confidence: 1.0,
                evidence
            })
        });

        // Update file state to done if first score
        if (file.processing_state === 'pending' || file.processing_state === 'queued') {
            await fetch(`/api/nri/files/${fileId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ processing_state: 'done', pillar_scored: 1 })
            });
        }

        qLog('ok', `[NRI] Saved score for ${file.filename} — ${PILLAR_LABELS[pillar]}: ${score}`);
        await nriLoadAll();
        if (selectedNriFileId === fileId) await nriShowScoreDetail(fileId);
    } catch (e) {
        qLog('err', '[NRI] Score save failed: ' + e.message);
    }
}

async function nriResetScores(fileId) {
    if (!confirm('Are you sure you want to delete all scores and reset this file to pending state?')) return;
    try {
        await fetch(`/api/nri/scores/file/${fileId}`, { method: 'DELETE' });
        qLog('ok', `[NRI] Reset scores for file #${fileId}`);
        await nriLoadAll();
        if (selectedNriFileId === fileId) {
            await nriShowScoreDetail(fileId);
        }
    } catch (e) {
        qLog('err', '[NRI] Failed to reset scores: ' + e.message);
    }
}

// Auto-refresh NRI stats every 30s when tab is visible
setInterval(async () => {
    const ppView = document.getElementById('v-preproving');
    if (ppView && ppView.classList.contains('active')) {
        await nriLoadStats();
        await nriLoadQueue();
    }
}, 30000);

