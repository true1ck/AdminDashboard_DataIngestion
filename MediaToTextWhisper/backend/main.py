"""
MediaToText — FastAPI Backend
Serves the transcription API and frontend static files.
"""

import os
import uuid
import time
import logging
from pathlib import Path

from fastapi import FastAPI, UploadFile, File, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, JSONResponse
import subprocess
import json
import asyncio

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger(__name__)

# Paths
BASE_DIR = Path(__file__).parent.parent
UPLOAD_DIR = BASE_DIR / "uploads"
FRONTEND_DIR = BASE_DIR / "frontend"
UPLOAD_DIR.mkdir(exist_ok=True)

# Supported file formats
ALLOWED_EXTENSIONS = {
    ".mp4", ".mkv", ".avi", ".mov", ".webm",  # Video
    ".mp3", ".wav", ".flac", ".ogg", ".m4a",   # Audio
}

MAX_FILE_SIZE = 500 * 1024 * 1024  # 500MB

# Model registry
MODELS = {
    "whisper-large-v3": {
        "id": "whisper-large-v3",
        "name": "Whisper Large V3",
        "provider": "OpenAI",
        "description": "High-accuracy ASR model. Best for precise transcription with word-level timestamps.",
        "license": "Apache 2.0",
        "size": "~3GB",
        "params": "1.55B",
        "features": ["Timestamps", "Language Detection", "VAD Filter"],
    },
}

# Lazy-loaded transcriber instance
_whisper_transcriber = None


def get_whisper_transcriber():
    global _whisper_transcriber
    if _whisper_transcriber is None:
        from whisper_transcriber import WhisperTranscriber
        _whisper_transcriber = WhisperTranscriber()
    return _whisper_transcriber


# FastAPI app
app = FastAPI(
    title="MediaToText",
    description="Video/Audio to Text transcription using Apache 2.0 AI models",
    version="1.0.0",
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "ok", "service": "MediaToText"}

# Store simple background jobs
JOBS = {}

def run_ytdlp(url: str, output_path: str, extra_args: list = None) -> tuple:
    """Run yt-dlp with a given strategy. Returns (success, stderr_output)."""
    import sys as _sys
    import os as _os
    venv_bin = Path(_sys.executable).parent
    ytdlp_bin = str(venv_bin / "yt-dlp")
    ffmpeg_bin = "/opt/homebrew/bin"
    env = _os.environ.copy()
    env["PATH"] = f"{ffmpeg_bin}:{str(venv_bin)}:/usr/local/bin:/usr/bin:/bin"
    cmd = [ytdlp_bin] + (extra_args or []) + ["-o", output_path, url]
    res = subprocess.run(cmd, capture_output=True, text=True, env=env)
    return res.returncode == 0, res.stderr


def find_downloaded_file(base: Path):
    """Find the file yt-dlp actually wrote (extension may vary)."""
    for ext in [".mp4", ".m4a", ".webm", ".opus", ".ogg", ".mp3"]:
        candidate = base.with_suffix(ext)
        if candidate.exists():
            return candidate
    for f in base.parent.glob(f"{base.stem}.*"):
        if f.suffix not in [".part", ".ytdl"]:
            return f
    return None


def process_youtube_job(job_id: str, url: str):
    import re
    logger.info(f"Starting YouTube job {job_id} for {url}")
    JOBS[job_id] = {"status": "processing", "progress": 10, "stage": "Checking for existing captions...", "result": None}

    # ── Strategy 0: Instant transcript fetch (bypasses yt-dlp & Whisper entirely) ──
    try:
        vid_match = re.search(r"(?:v=|\/)([0-9A-Za-z_-]{11}).*", url)
        if vid_match:
            vid = vid_match.group(1)
            from youtube_transcript_api import YouTubeTranscriptApi
            api = YouTubeTranscriptApi()
            transcript_list = api.list(vid)
            # Try to get english or hindi, or fallback to first available
            transcript = transcript_list.find_transcript(['en', 'en-US', 'hi']) if transcript_list else None
            if not transcript:
                transcript = transcript_list.find_generated_transcript(['en', 'en-US', 'hi'])
            
            snippets = transcript.fetch()
            
            # Format to look exactly like Whisper output so dashboard doesn't break
            segments = []
            full_text = []
            for s in snippets:
                segments.append({"text": s.text, "start": s.start, "end": s.start + s.duration})
                full_text.append(s.text)
                
            result = {
                "text": " ".join(full_text),
                "segments": segments,
                "processing_time": 0.5,
                "fast_track": True
            }
            
            JOBS[job_id]["progress"] = 100
            JOBS[job_id]["stage"] = "Instant Captions Extracted (Skipped Whisper)"
            JOBS[job_id]["status"] = "done"
            JOBS[job_id]["result"] = result
            logger.info(f"[{job_id}] Fast-tracked transcript via youtube_transcript_api")
            return  # Exit early!
    except Exception as e:
        logger.warning(f"[{job_id}] No native captions available: {e}. Falling back to yt-dlp and Whisper...")

    # ── Fallback to yt-dlp downloading ──
    output_tmpl = str(UPLOAD_DIR / f"{job_id}")
    downloaded_file = None

    strategies = [
        (["-f", "best[ext=mp4]/best", "--no-playlist"], "Downloading video (best mp4)..."),
        (["-x", "--audio-format", "mp3", "--no-playlist"], "Downloading audio (mp3)..."),
        (["-f", "best", "--no-playlist"], "Downloading best available format..."),
        (["-f", "worst", "--no-playlist"], "Downloading minimal quality (fallback)..."),
    ]

    last_error = "All download strategies failed."

    for extra_args, stage_msg in strategies:
        JOBS[job_id]["progress"] = 25
        JOBS[job_id]["stage"] = stage_msg
        logger.info(f"[{job_id}] Trying: {stage_msg}")

        ok, stderr = run_ytdlp(url, output_tmpl, extra_args)
        downloaded_file = find_downloaded_file(Path(output_tmpl))

        if ok and downloaded_file and downloaded_file.exists():
            logger.info(f"[{job_id}] Download OK -> {downloaded_file}")
            break
        else:
            lines = [l for l in stderr.strip().splitlines() if l.strip()]
            last_error = lines[-1] if lines else "Unknown yt-dlp error"
            logger.warning(f"[{job_id}] Strategy failed: {last_error}")
            downloaded_file = None

    try:
        if not downloaded_file or not downloaded_file.exists():
            raise RuntimeError(f"Download failed: {last_error}")

        JOBS[job_id]["progress"] = 45
        JOBS[job_id]["stage"] = "Audio downloaded. Loading Whisper..."
        logger.info(f"Downloaded to {downloaded_file}")

        start_time = time.time()
        JOBS[job_id]["progress"] = 55
        JOBS[job_id]["stage"] = "Loading Whisper model..."
        transcriber = get_whisper_transcriber()

        JOBS[job_id]["progress"] = 65
        JOBS[job_id]["stage"] = "Transcribing with Whisper (may take minutes)..."

        result = transcriber.transcribe(str(downloaded_file))
        elapsed = round(time.time() - start_time, 2)
        result["processing_time"] = elapsed

        JOBS[job_id]["progress"] = 100
        JOBS[job_id]["stage"] = "Complete"
        JOBS[job_id]["status"] = "done"
        JOBS[job_id]["result"] = result
        logger.info(f"Finished YouTube job {job_id} in {elapsed}s")
    except Exception as e:
        logger.error(f"Failed YouTube job {job_id}: {e}")
        JOBS[job_id]["status"] = "failed"
        JOBS[job_id]["result"] = {"error": str(e)}
    finally:
        if downloaded_file and downloaded_file.exists():
            os.unlink(downloaded_file)

@app.post("/api/youtube/info")
async def get_youtube_info(body: dict):
    """Fetch YouTube video metadata without downloading it."""
    url = body.get("url")
    if not url:
        raise HTTPException(status_code=400, detail="URL is required")
    try:
        cmd = ["yt-dlp", "--dump-json", "--no-warnings", url]
        res = subprocess.run(cmd, capture_output=True, text=True, check=True)
        lines = [line for line in res.stdout.splitlines() if line.strip()]
        if not lines:
            raise ValueError("No metadata returned")
            
        data = json.loads(lines[0])
        # Detect if it's a playlist
        is_playlist = data.get("_type") == "playlist" or len(lines) > 1
        
        def format_dur(secs):
            if not secs: return "0:00"
            m, s = divmod(int(secs), 60)
            return f"{m}:{s:02d}"
            
        return {
            "videoId": data.get("id"),
            "url": url,
            "title": data.get("title", "Unknown Title"),
            "duration": format_dur(data.get("duration")),
            "thumbnail": data.get("thumbnail"),
            "channel": data.get("uploader", "Unknown Channel"),
            "isPlaylist": is_playlist
        }
    except Exception as e:
        logger.error(f"yt-dlp info fetch failed: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch YouTube info. Ensure the link is valid.")

@app.post("/api/youtube/playlist")
async def get_youtube_playlist(body: dict):
    url = body.get("url")
    if not url:
        raise HTTPException(status_code=400, detail="URL is required")
    try:
        logger.info(f"Extracting playlist: {url}")
        cmd = ["yt-dlp", "--flat-playlist", "--dump-json", "--no-warnings", url]
        res = subprocess.run(cmd, capture_output=True, text=True, check=True)
        
        videos = []
        for line in res.stdout.splitlines():
            if not line.strip(): continue
            data = json.loads(line)
            videos.append({
                "videoId": data.get("id"),
                "url": data.get("url") or f"https://www.youtube.com/watch?v={data.get('id')}",
                "title": data.get("title", "Unknown"),
                "duration": data.get("duration", 0),
                "channel": data.get("uploader", "Unknown"),
            })
        
        return {"success": True, "count": len(videos), "videos": videos}
    except Exception as e:
        logger.error(f"Playlist extraction failed: {e}")
        raise HTTPException(status_code=500, detail="Failed to extract playlist")

@app.post("/api/youtube/queue")
async def queue_youtube(body: dict, background_tasks: BackgroundTasks):
    """Queue a YouTube video for downloading and transcription."""
    url = body.get("url")
    if not url:
        raise HTTPException(status_code=400, detail="URL is required")
    
    job_id = str(uuid.uuid4())
    JOBS[job_id] = {"status": "queued", "progress": 0, "stage": "Queued", "result": None}
    
    background_tasks.add_task(process_youtube_job, job_id, url)
    return {"job_id": job_id}

@app.get("/api/jobs/{job_id}")
async def get_job_status(job_id: str):
    """Poll for the status of a background job."""
    job = JOBS.get(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return job


@app.get("/api/models")
async def get_models():
    """Return available models with metadata."""
    return {"models": list(MODELS.values())}


@app.post("/api/transcribe")
async def transcribe(
    file: UploadFile = File(...),
):
    """
    Transcribe an uploaded audio/video file using Whisper Large V3.

    Args:
        file: The media file to transcribe
    """

    # Validate file extension
    ext = Path(file.filename).suffix.lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported format '{ext}'. Supported: {sorted(ALLOWED_EXTENSIONS)}",
        )

    # Save uploaded file
    file_id = str(uuid.uuid4())
    save_path = UPLOAD_DIR / f"{file_id}{ext}"

    try:
        content = await file.read()

        # Check file size
        if len(content) > MAX_FILE_SIZE:
            raise HTTPException(
                status_code=413,
                detail=f"File too large. Max size: {MAX_FILE_SIZE // (1024*1024)}MB",
            )

        with open(save_path, "wb") as f:
            f.write(content)

        logger.info(f"File saved: {save_path} ({len(content) / (1024*1024):.1f}MB)")

        # Transcribe
        start_time = time.time()

        transcriber = get_whisper_transcriber()
        result = transcriber.transcribe(str(save_path))
        elapsed = round(time.time() - start_time, 2)

        result["processing_time"] = elapsed
        result["file_name"] = file.filename

        logger.info(f"Transcription complete in {elapsed}s using whisper-large-v3")

        return JSONResponse(content=result)

    except HTTPException:
        raise
    except RuntimeError as e:
        logger.error(f"Transcription error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    except Exception as e:
        logger.error(f"Unexpected error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Transcription failed: {str(e)}")
    finally:
        # Clean up uploaded file
        if save_path.exists():
            os.unlink(save_path)


@app.post("/api/transcribe-path")
async def transcribe_from_path(body: dict):
    """
    Transcribe a media file already present on the server by its path.

    Args:
        body: JSON with 'file_path' (str) — absolute path to the file on the server
    """
    file_path = body.get("file_path", "").strip()

    if not file_path:
        raise HTTPException(status_code=400, detail="file_path is required.")

    path = Path(file_path)

    # Validate file exists
    if not path.exists():
        raise HTTPException(status_code=404, detail=f"File not found: {file_path}")

    if not path.is_file():
        raise HTTPException(status_code=400, detail=f"Path is not a file: {file_path}")

    # Validate extension
    ext = path.suffix.lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported format '{ext}'. Supported: {sorted(ALLOWED_EXTENSIONS)}",
        )

    # Validate size
    file_size = path.stat().st_size
    if file_size > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=413,
            detail=f"File too large ({file_size // (1024*1024)}MB). Max size: {MAX_FILE_SIZE // (1024*1024)}MB",
        )

    try:
        logger.info(f"Transcribing server file: {file_path} ({file_size / (1024*1024):.1f}MB)")

        start_time = time.time()
        transcriber = get_whisper_transcriber()
        result = transcriber.transcribe(str(path))
        elapsed = round(time.time() - start_time, 2)

        result["processing_time"] = elapsed
        result["file_name"] = path.name

        logger.info(f"Transcription complete in {elapsed}s using whisper-large-v3")

        return JSONResponse(content=result)

    except HTTPException:
        raise
    except RuntimeError as e:
        logger.error(f"Transcription error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    except Exception as e:
        logger.error(f"Unexpected error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Transcription failed: {str(e)}")


# Serve frontend
@app.get("/")
async def serve_index():
    """Serve the frontend index page."""
    return FileResponse(FRONTEND_DIR / "index.html")


# Mount static files for CSS/JS
app.mount("/static", StaticFiles(directory=str(FRONTEND_DIR)), name="static")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info",
    )
