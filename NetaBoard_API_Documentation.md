# NetaBoard Dashboard and AI Pipelines API Documentation

This document outlines the list of all backend APIs used across the NetaBoard ecosystem, how they work, and their functionality within the admin dashboard. The ecosystem consists of three main services:

1. **NetaBoard V5 Core Backend** (Node.js/Express)
2. **Visual AI Pipeline (ImageToTextQwen)** (Python/Flask)
3. **Media Transcription Pipeline (MediaToTextWhisper)** (Python/FastAPI)

---

## 1. NetaBoard V5 Core Backend
**Port**: `3000` | **Framework**: Node.js & Express | **Database**: SQLite (via Prisma)

This is the primary backend serving the main administrative dashboard.

### `GET /api/health`
- **Functionality**: Simple health check to verify the dashboard backend is running.

### `GET /api/archetypes`
- **Functionality**: Retrieves the list of political leaders (Archetypes).
- **Dashboard Usage**: Used to populate the "Leaders" or "Archetypes" views on the dashboard. It fetches deeply nested relational data, including their constituencies, pillar scores, and parliamentary (Sansad) records.

### `GET /api/feedback`
- **Functionality**: Retrieves public feedback records submitted through "Jan Darbar".
- **Dashboard Usage**: Used to populate the public feedback/complaints feed in the admin panel, sorted by the most recent timestamp.

### `GET /api/social`
- **Functionality**: Retrieves the social inbox items (tweets, posts, pipeline parsed data).
- **Dashboard Usage**: Populates the unified "Social Inbox" where admins monitor sentiment, user posts, and pipeline-processed data (e.g., analyzed images or transcribed audio). 

### `GET /api/alerts`
- **Functionality**: Feeds the crisis and alert system.
- **Dashboard Usage**: Displays real-time crises or alerts that require immediate administrative intervention on the dashboard.

### `GET /api/channels`
- **Functionality**: Retrieves a list of active channels and integrations (e.g., WhatsApp, Twitter, Custom APIs).
- **Dashboard Usage**: Rendered in the "Settings" or "Integrations" page of the dashboard so admins can monitor active data sources.

### `POST /api/ingest`
- **Functionality**: The Universal Ingestion Endpoint. It accepts data from external sources and the external AI pipelines. It serves a dual purpose:
  1. **File System Storage**: Writes the incoming payload into a `.txt` file inside the `DataCollected/` directory for raw, unstructured retrieval.
  2. **Database Storage**: Safely saves the parsed content into the `SocialItem` database table so it natively appears in the Social Inbox.
- **Payload**: `{ source: string, content: string, author: string }`
- **Dashboard Usage**: This is how the dashboard physically receives the text extracted from images, videos, and PDFs by the other AI pipelines.

---

## 2. Visual AI Pipeline (ImageToTextQwen)
**Port**: `5001` | **Framework**: Python/Flask | **Model**: `Qwen/Qwen2.5-VL-7B-Instruct`

This microservice handles the ingestion and analysis of static visual media like Images and PDFs.

### `GET /api/health`
- **Functionality**: Checks if the model config and HuggingFace API tokens are correctly loaded.

### `POST /api/analyze`
- **Functionality**: Accepts an uploaded image (`multipart/form-data` with `image` and an optional `prompt`), converts it into Base64, and sends it to the Qwen Vision-Language model via the HuggingFace Inference API.
- **Dashboard Usage**: When an admin uploads an image to the dashboard, this API analyzes the image, extracts text, identifies people, and returns a detailed textual description. This text is then usually routed back to the main dashboard via the `/api/ingest` endpoint.

### `POST /api/analyze-pdf`
- **Functionality**: Accepts an uploaded PDF document and uses PyMuPDF (`fitz`) to extract machine-readable text page by page.
- **Dashboard Usage**: Allows admins to parse long PDF reports. The results are converted into plain text and injected into the NetaBoard system.

---

## 3. Media Transcription Pipeline (MediaToTextWhisper)
**Port**: `8000` | **Framework**: Python/FastAPI | **Model**: `whisper-large-v3`

This microservice handles the heavy lifting of downloading media and transcribing audio/video into text.

### `GET /api/health` & `GET /api/models`
- **Functionality**: Checks the service status and lists available models (e.g. Whisper Large V3).

### `POST /api/transcribe`
- **Functionality**: Accepts raw audio or video file uploads directly (up to 500MB). It saves them temporarily, runs them through the local Whisper AI model, and returns full text segments and timestamps.
- **Dashboard Usage**: Used when an admin manually uploads a local video or audio clip for transcription.

### `POST /api/transcribe-path`
- **Functionality**: Triggers transcription for a file that already exists on the server's local file system.

### `POST /api/youtube/info` & `POST /api/youtube/playlist`
- **Functionality**: Fetches metadata for a YouTube link (titles, thumbnails, lengths) or extracts all videos from a playlist URL without downloading the actual media using `yt-dlp`.
- **Dashboard Usage**: Allows the dashboard to show a preview of a video before the admin commits to downloading and processing it.

### `POST /api/youtube/queue` & `GET /api/jobs/{job_id}`
- **Functionality**: Enqueues a YouTube URL for background processing. The background task (1) checks for native YouTube captions, (2) downloads the video audio via `yt-dlp` if captions don't exist, and (3) runs it through Whisper AI. The `GET` endpoint allows the dashboard to poll the exact progress (e.g., 25%, 55%, 100%).
- **Dashboard Usage**: This powers a progress bar in the admin dashboard so the admin can monitor the extraction state without the UI freezing up.

---

## Integration Flow Summary (How it works in the Dashboard)

1. **Upload / Trigger**: Admin inputs a YouTube link, an Image, or a PDF into the dashboard frontend.
2. **Analysis**: The dashboard frontend routes the media to either **Port 5001 (Qwen)** for images/PDFs, or **Port 8000 (Whisper)** for video/audio.
3. **Ingestion**: The AI pipelines extract raw data and return highly accurate text and timestamps.
4. **Storage**: The dashboard frontend immediately takes that text and POSTs it directly to **Port 3000 (`/api/ingest`)**.
5. **Observation**: The Node.js backend safely saves the text to the `DataCollected` folder natively and stores it in the SQLite database. The admin instantly sees the extracted intelligence populated inside their "Social Inbox".
