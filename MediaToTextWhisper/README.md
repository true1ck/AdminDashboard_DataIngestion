# MediaToText

> AI-powered video/audio to text transcription using **Whisper Large V3** (Apache 2.0).

## Features

- **Whisper Large V3** (OpenAI) — Fast, accurate ASR with word-level timestamps
- **Drag & Drop** upload with file validation
- **Timestamped segments** + full transcript
- **Copy to clipboard** and **download as text**
- **Premium dark-mode UI** with glassmorphism design
- Model licensed under **Apache 2.0**

## Requirements

- **Python 3.8+**
- **FFmpeg** — for audio extraction from video files
  ```bash
  # macOS
  brew install ffmpeg
  ```

## Quick Start

```bash
# 1. Create virtual environment
python3 -m venv venv
source venv/bin/activate

# 2. Install dependencies
pip install -r backend/requirements.txt

# 3. Start the server
cd backend
python main.py
```

Then open **http://localhost:8000** in your browser.

Or use the quick-start script:
```bash
chmod +x run.sh
./run.sh
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/health` | Health check |
| `GET` | `/api/models` | List available models |
| `POST` | `/api/transcribe` | Transcribe uploaded file |

### POST /api/transcribe

**Form Data:**
- `file` — media file (MP4, MKV, AVI, MOV, WebM, MP3, WAV, FLAC, OGG, M4A)

**Response:**
```json
{
  "segments": [{"start": 0.0, "end": 2.5, "text": "Hello world"}],
  "full_text": "Hello world",
  "language": "en",
  "duration": 2.5,
  "processing_time": 1.23,
  "model": "openai/whisper-large-v3"
}
```

## License Compliance

| Component | License |
|-----------|---------|
| Whisper Large V3 | Apache 2.0 |
| faster-whisper | MIT |
| FastAPI | MIT |
| FFmpeg | LGPL 2.1+ |

All AI models used are **Apache 2.0** licensed, ensuring full compliance for commercial and personal use.
