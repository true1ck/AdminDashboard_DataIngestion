/**
 * LivingAI — Frontend Logic
 * Handles image upload, API communication, and result display
 */

(function () {
    'use strict';

    // ========== DOM Elements ==========
    const dropZone = document.getElementById('drop-zone');
    const dropZoneContent = document.getElementById('drop-zone-content');
    const imagePreview = document.getElementById('image-preview');
    const previewImg = document.getElementById('preview-img');
    const removeImageBtn = document.getElementById('remove-image-btn');
    const fileInput = document.getElementById('file-input');
    const fileInfo = document.getElementById('file-info');
    const fileName = document.getElementById('file-name');
    const fileSize = document.getElementById('file-size');
    const promptInput = document.getElementById('prompt-input');
    const analyzeBtn = document.getElementById('analyze-btn');
    const btnContent = document.getElementById('btn-content');
    const btnLoading = document.getElementById('btn-loading');
    const resultSection = document.getElementById('result-section');
    const resultBody = document.getElementById('result-body');
    const resultMeta = document.getElementById('result-meta');
    const copyBtn = document.getElementById('copy-btn');
    const errorSection = document.getElementById('error-section');
    const errorText = document.getElementById('error-text');
    const errorHelp = document.getElementById('error-help');
    const suggestionChips = document.querySelectorAll('.suggestion-chip');

    // ========== State ==========
    let selectedFile = null;
    const API_BASE = window.location.origin;

    // ========== Utility Functions ==========
    function formatFileSize(bytes) {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    }

    function showElement(el) {
        el.style.display = '';
        el.style.animation = 'none';
        el.offsetHeight; // force reflow
        el.style.animation = '';
    }

    function hideElement(el) {
        el.style.display = 'none';
    }

    // ========== Image Upload Handling ==========
    function handleFile(file) {
        // Validate file type
        const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/bmp', 'image/webp', 'image/tiff'];
        if (!validTypes.includes(file.type)) {
            showError('Invalid file type. Please upload a PNG, JPG, GIF, WebP, or BMP image.');
            return;
        }

        // Validate file size (10MB)
        if (file.size > 10 * 1024 * 1024) {
            showError('File too large. Maximum size is 10MB.');
            return;
        }

        selectedFile = file;
        hideError();

        // Show image preview
        const reader = new FileReader();
        reader.onload = function (e) {
            previewImg.src = e.target.result;
            hideElement(dropZoneContent);
            showElement(imagePreview);
        };
        reader.readAsDataURL(file);

        // Show file info
        fileName.textContent = file.name;
        fileSize.textContent = formatFileSize(file.size);
        showElement(fileInfo);

        // Enable analyze button
        analyzeBtn.disabled = false;
    }

    function removeImage() {
        selectedFile = null;
        fileInput.value = '';
        previewImg.src = '';

        showElement(dropZoneContent);
        hideElement(imagePreview);
        hideElement(fileInfo);
        hideElement(resultSection);
        hideError();

        analyzeBtn.disabled = true;
    }

    // ========== Drag and Drop ==========
    dropZone.addEventListener('click', (e) => {
        if (e.target === removeImageBtn || removeImageBtn.contains(e.target)) return;
        fileInput.click();
    });

    fileInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            handleFile(e.target.files[0]);
        }
    });

    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.stopPropagation();
        dropZone.classList.add('drag-over');
    });

    dropZone.addEventListener('dragleave', (e) => {
        e.preventDefault();
        e.stopPropagation();
        dropZone.classList.remove('drag-over');
    });

    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        e.stopPropagation();
        dropZone.classList.remove('drag-over');

        const files = e.dataTransfer.files;
        if (files.length > 0) {
            handleFile(files[0]);
        }
    });

    removeImageBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        removeImage();
    });

    // ========== Suggestion Chips ==========
    suggestionChips.forEach(chip => {
        chip.addEventListener('click', () => {
            const prompt = chip.getAttribute('data-prompt');
            promptInput.value = prompt;

            // Toggle active state
            suggestionChips.forEach(c => c.classList.remove('active'));
            chip.classList.add('active');
        });
    });

    promptInput.addEventListener('input', () => {
        // Deactivate chips when user types manually
        suggestionChips.forEach(c => c.classList.remove('active'));
    });

    // ========== API Communication ==========
    async function analyzeImage() {
        if (!selectedFile) return;

        // Set loading state
        setLoading(true);
        hideError();
        hideElement(resultSection);

        const formData = new FormData();
        formData.append('image', selectedFile);
        formData.append('prompt', promptInput.value || 'Describe this image in detail. If there are any people or entities in the picture, please attempt to identify who they are. If there is any text in the image, extract and include it.');

        try {
            const response = await fetch(`${API_BASE}/api/analyze`, {
                method: 'POST',
                body: formData
            });

            const data = await response.json();

            if (!response.ok) {
                showError(data.error || 'An unexpected error occurred.', data.help || '');
                return;
            }

            // Display result
            displayResult(data);
        } catch (err) {
            console.error('API Error:', err);
            if (err.message.includes('Failed to fetch') || err.message.includes('NetworkError')) {
                showError(
                    'Cannot connect to the server.',
                    'Make sure the backend is running: cd backend && python app.py'
                );
            } else {
                showError('An unexpected error occurred: ' + err.message);
            }
        } finally {
            setLoading(false);
        }
    }

    function displayResult(data) {
        resultBody.textContent = data.result;
        resultMeta.innerHTML = `
            <span>Model: ${data.model}</span>
            <span>Prompt: "${truncateText(data.prompt, 60)}"</span>
        `;
        showElement(resultSection);

        // Scroll to result
        resultSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    function truncateText(text, maxLen) {
        if (text.length <= maxLen) return text;
        return text.substring(0, maxLen) + '...';
    }

    // ========== UI State Helpers ==========
    function setLoading(loading) {
        analyzeBtn.disabled = loading;
        if (loading) {
            hideElement(btnContent);
            showElement(btnLoading);
        } else {
            showElement(btnContent);
            hideElement(btnLoading);
            if (selectedFile) analyzeBtn.disabled = false;
        }
    }

    function showError(message, helpText = '') {
        errorText.textContent = message;
        errorHelp.textContent = helpText;
        showElement(errorSection);
    }

    function hideError() {
        hideElement(errorSection);
    }

    // ========== Button Events ==========
    analyzeBtn.addEventListener('click', analyzeImage);

    // Copy to clipboard
    copyBtn.addEventListener('click', () => {
        const text = resultBody.textContent;
        navigator.clipboard.writeText(text).then(() => {
            const originalHTML = copyBtn.innerHTML;
            copyBtn.classList.add('copied');
            copyBtn.innerHTML = `
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="20 6 9 17 4 12"/>
                </svg>
                Copied!
            `;
            setTimeout(() => {
                copyBtn.innerHTML = originalHTML;
                copyBtn.classList.remove('copied');
            }, 2000);
        });
    });

    // ========== Keyboard Shortcuts ==========
    document.addEventListener('keydown', (e) => {
        // Ctrl/Cmd + Enter to analyze
        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter' && !analyzeBtn.disabled) {
            e.preventDefault();
            analyzeImage();
        }
    });

    // ========== Health Check on Load ==========
    async function checkHealth() {
        try {
            const response = await fetch(`${API_BASE}/api/health`);
            const data = await response.json();
            if (!data.api_configured) {
                showError(
                    'HuggingFace API token not configured.',
                    'Copy .env.example to .env and add your token from https://huggingface.co/settings/tokens'
                );
            }
        } catch {
            // Server might not be running yet — that's OK
        }
    }

    checkHealth();
})();
