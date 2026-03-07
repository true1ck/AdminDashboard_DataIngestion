/**
 * MediaToText — Frontend Application
 * Handles model selection, file upload, and transcription display.
 */

(function () {
    'use strict';

    // --- State ---
    let selectedFile = null;
    let inputMode = 'upload'; // 'upload' or 'path'

    // --- DOM Elements ---
    const tabUpload = document.getElementById('tab-upload');
    const tabPath = document.getElementById('tab-path');
    const contentUpload = document.getElementById('content-upload');
    const contentPath = document.getElementById('content-path');
    const pathInput = document.getElementById('path-input');
    const uploadZone = document.getElementById('upload-zone');
    const fileInput = document.getElementById('file-input');
    const fileInfo = document.getElementById('file-info');
    const fileName = document.getElementById('file-name');
    const fileSize = document.getElementById('file-size');
    const btnRemove = document.getElementById('btn-remove');
    const btnTranscribe = document.getElementById('btn-transcribe');
    const progressSection = document.getElementById('progress-section');
    const progressTitle = document.getElementById('progress-title');
    const progressDesc = document.getElementById('progress-desc');
    const progressBar = document.getElementById('progress-bar');
    const resultsSection = document.getElementById('results-section');
    const resultBadges = document.getElementById('result-badges');
    const segmentsContainer = document.getElementById('segments-container');
    const fullText = document.getElementById('full-text');
    const btnCopy = document.getElementById('btn-copy');
    const btnDownload = document.getElementById('btn-download');
    const errorSection = document.getElementById('error-section');
    const errorMessage = document.getElementById('error-message');
    const btnRetry = document.getElementById('btn-retry');

    // --- Tab Switching ---
    function switchTab(tab) {
        inputMode = tab;

        tabUpload.classList.toggle('active', tab === 'upload');
        tabPath.classList.toggle('active', tab === 'path');
        contentUpload.classList.toggle('active', tab === 'upload');
        contentPath.classList.toggle('active', tab === 'path');

        // Update transcribe button state
        if (tab === 'upload') {
            btnTranscribe.disabled = !selectedFile;
        } else {
            btnTranscribe.disabled = !pathInput.value.trim();
        }

        // Hide previous results/errors
        resultsSection.classList.add('hidden');
        errorSection.classList.add('hidden');
    }

    tabUpload.addEventListener('click', () => switchTab('upload'));
    tabPath.addEventListener('click', () => switchTab('path'));

    // Enable transcribe button when path is typed
    pathInput.addEventListener('input', () => {
        if (inputMode === 'path') {
            btnTranscribe.disabled = !pathInput.value.trim();
        }
    });

    // Allow Enter key to trigger transcription in path mode
    pathInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && pathInput.value.trim()) {
            e.preventDefault();
            startTranscription();
        }
    });

    // --- File Upload: Drag & Drop ---
    uploadZone.addEventListener('click', () => fileInput.click());

    uploadZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadZone.classList.add('drag-over');
    });

    uploadZone.addEventListener('dragleave', () => {
        uploadZone.classList.remove('drag-over');
    });

    uploadZone.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadZone.classList.remove('drag-over');
        if (e.dataTransfer.files.length > 0) {
            handleFile(e.dataTransfer.files[0]);
        }
    });

    fileInput.addEventListener('change', () => {
        if (fileInput.files.length > 0) {
            handleFile(fileInput.files[0]);
        }
    });

    // --- File Handling ---
    const ALLOWED_EXT = new Set([
        '.mp4', '.mkv', '.avi', '.mov', '.webm',
        '.mp3', '.wav', '.flac', '.ogg', '.m4a'
    ]);
    const MAX_SIZE = 500 * 1024 * 1024; // 500MB

    function handleFile(file) {
        const ext = '.' + file.name.split('.').pop().toLowerCase();

        if (!ALLOWED_EXT.has(ext)) {
            showError(`Unsupported file format "${ext}". Please use a supported video or audio file.`);
            return;
        }

        if (file.size > MAX_SIZE) {
            showError(`File is too large (${formatSize(file.size)}). Maximum allowed size is 500MB.`);
            return;
        }

        selectedFile = file;
        fileName.textContent = file.name;
        fileSize.textContent = formatSize(file.size);
        fileInfo.classList.remove('hidden');
        uploadZone.style.display = 'none';
        btnTranscribe.disabled = false;

        // Hide any previous results/errors
        resultsSection.classList.add('hidden');
        errorSection.classList.add('hidden');
    }

    function removeFile() {
        selectedFile = null;
        fileInput.value = '';
        fileInfo.classList.add('hidden');
        uploadZone.style.display = '';
        btnTranscribe.disabled = true;
    }

    btnRemove.addEventListener('click', removeFile);

    // --- Transcription ---
    btnTranscribe.addEventListener('click', startTranscription);

    async function startTranscription() {
        if (inputMode === 'upload') {
            if (!selectedFile) return;
            await startUploadTranscription();
        } else {
            const filePath = pathInput.value.trim();
            if (!filePath) return;
            await startPathTranscription(filePath);
        }
    }

    async function startUploadTranscription() {

        // UI: show progress, hide others
        progressSection.classList.remove('hidden');
        resultsSection.classList.add('hidden');
        errorSection.classList.add('hidden');
        btnTranscribe.disabled = true;

        progressTitle.textContent = 'Uploading...';
        progressDesc.textContent = 'Sending your file to the server';
        progressBar.style.width = '10%';

        const formData = new FormData();
        formData.append('file', selectedFile);

        try {
            // Progress simulation
            progressBar.style.width = '25%';
            progressTitle.textContent = 'Processing...';
            progressDesc.textContent = 'Transcribing with Whisper Large V3';

            const startTime = Date.now();

            // Start progress animation
            const progressInterval = setInterval(() => {
                const elapsed = (Date.now() - startTime) / 1000;
                const currentWidth = parseFloat(progressBar.style.width);
                if (currentWidth < 85) {
                    progressBar.style.width = Math.min(25 + elapsed * 2, 85) + '%';
                }
                // Update elapsed time display
                progressDesc.textContent = `Transcribing with Whisper Large V3 · ${formatTime(elapsed)}`;
            }, 500);

            const response = await fetch('/api/transcribe', {
                method: 'POST',
                body: formData,
            });

            clearInterval(progressInterval);

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ detail: 'Unknown error' }));
                throw new Error(errorData.detail || `Server returned ${response.status}`);
            }

            progressBar.style.width = '100%';
            progressTitle.textContent = 'Complete!';
            progressDesc.textContent = 'Rendering results...';

            const result = await response.json();

            setTimeout(() => {
                progressSection.classList.add('hidden');
                displayResults(result);
            }, 500);

        } catch (err) {
            progressSection.classList.add('hidden');
            showError(err.message);
        } finally {
            btnTranscribe.disabled = false;
            progressBar.style.width = '0%';
        }
    }

    async function startPathTranscription(filePath) {
        // UI: show progress, hide others
        progressSection.classList.remove('hidden');
        resultsSection.classList.add('hidden');
        errorSection.classList.add('hidden');
        btnTranscribe.disabled = true;

        progressTitle.textContent = 'Processing...';
        progressDesc.textContent = 'Transcribing server file with Whisper Large V3';
        progressBar.style.width = '25%';

        const startTime = Date.now();

        const progressInterval = setInterval(() => {
            const elapsed = (Date.now() - startTime) / 1000;
            const currentWidth = parseFloat(progressBar.style.width);
            if (currentWidth < 85) {
                progressBar.style.width = Math.min(25 + elapsed * 2, 85) + '%';
            }
            progressDesc.textContent = `Transcribing with Whisper Large V3 · ${formatTime(elapsed)}`;
        }, 500);

        try {
            const response = await fetch('/api/transcribe-path', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ file_path: filePath }),
            });

            clearInterval(progressInterval);

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ detail: 'Unknown error' }));
                throw new Error(errorData.detail || `Server returned ${response.status}`);
            }

            progressBar.style.width = '100%';
            progressTitle.textContent = 'Complete!';
            progressDesc.textContent = 'Rendering results...';

            const result = await response.json();

            setTimeout(() => {
                progressSection.classList.add('hidden');
                displayResults(result);
            }, 500);

        } catch (err) {
            progressSection.classList.add('hidden');
            showError(err.message);
        } finally {
            btnTranscribe.disabled = false;
            progressBar.style.width = '0%';
        }
    }

    // --- Display Results ---
    function displayResults(result) {
        resultsSection.classList.remove('hidden');
        errorSection.classList.add('hidden');

        // Badges
        resultBadges.innerHTML = '';
        addBadge(result.model || 'whisper-large-v3', 'model-badge-result');
        if (result.language) addBadge(`Language: ${result.language}`);
        if (result.duration) addBadge(`Duration: ${formatTime(result.duration)}`);
        if (result.processing_time) addBadge(`Processed in ${result.processing_time}s`);

        // Segments (Whisper provides timestamps)
        segmentsContainer.innerHTML = '';
        if (result.segments && result.segments.length > 0) {
            result.segments.forEach(seg => {
                const div = document.createElement('div');
                div.className = 'segment';
                div.innerHTML = `
                    <span class="segment-time">${formatTimestamp(seg.start)} → ${formatTimestamp(seg.end)}</span>
                    <span class="segment-text">${escapeHtml(seg.text)}</span>
                `;
                segmentsContainer.appendChild(div);
            });
        }

        // Full text
        fullText.textContent = result.full_text || '(No text detected)';

        // Store file name for download
        displayResults._lastFileName = result.file_name || null;

        // Scroll to results
        resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    function addBadge(text, extraClass = '') {
        const span = document.createElement('span');
        span.className = `result-badge ${extraClass}`;
        span.textContent = text;
        resultBadges.appendChild(span);
    }

    // --- Copy & Download ---
    btnCopy.addEventListener('click', () => {
        const text = fullText.textContent;
        navigator.clipboard.writeText(text).then(() => {
            btnCopy.classList.add('copied');
            btnCopy.querySelector('span').textContent = 'Copied!';
            setTimeout(() => {
                btnCopy.classList.remove('copied');
                btnCopy.querySelector('span').textContent = 'Copy';
            }, 2000);
        });
    });

    btnDownload.addEventListener('click', () => {
        const text = fullText.textContent;
        const blob = new Blob([text], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        // Determine file name from upload or path
        let baseName = 'transcript';
        if (selectedFile) {
            baseName = selectedFile.name.replace(/\.[^.]+$/, '');
        } else if (displayResults._lastFileName) {
            baseName = displayResults._lastFileName.replace(/\.[^.]+$/, '');
        }
        a.download = baseName + '.txt';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    });

    // --- Error ---
    function showError(message) {
        errorSection.classList.remove('hidden');
        resultsSection.classList.add('hidden');
        progressSection.classList.add('hidden');
        errorMessage.textContent = message;
    }

    btnRetry.addEventListener('click', () => {
        errorSection.classList.add('hidden');
        if (inputMode === 'upload' && selectedFile) {
            btnTranscribe.disabled = false;
        } else if (inputMode === 'path' && pathInput.value.trim()) {
            btnTranscribe.disabled = false;
        }
    });

    // --- Helpers ---
    function formatSize(bytes) {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
        return (bytes / (1024 * 1024 * 1024)).toFixed(2) + ' GB';
    }

    function formatTime(seconds) {
        const m = Math.floor(seconds / 60);
        const s = Math.floor(seconds % 60);
        return m > 0 ? `${m}m ${s}s` : `${s}s`;
    }

    function formatTimestamp(seconds) {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = Math.floor(seconds % 60);
        const ms = Math.floor((seconds % 1) * 100);
        if (h > 0) {
            return `${h}:${pad(m)}:${pad(s)}.${pad(ms)}`;
        }
        return `${pad(m)}:${pad(s)}.${pad(ms)}`;
    }

    function pad(n) {
        return String(n).padStart(2, '0');
    }

    function getModelName(id) {
        const names = {
            'whisper-large-v3': 'Whisper Large V3',
        };
        return names[id] || id;
    }

    function escapeHtml(str) {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }
})();
