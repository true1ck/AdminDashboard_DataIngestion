# NetaBoard Ecosystem API Documentation

This document provides a comprehensive list of all API endpoints across the NetaBoard project services.

---

## 1. Admin Dashboard (Port 4000)
**Base URL**: `http://localhost:4000`  
**Purpose**: Central administrative interface for managing jobs, settings, and database operations.

| Route | Method | Description | Parameters |
|-------|--------|-------------|------------|
| `/api/health` | GET | Service health check | None |
| `/api/state` | GET | Retrieves full application state | None |
| `/api/jobs` | GET | List all ingestion jobs | `filter` (optional: all, pending, processing, done, failed) |
| `/api/jobs` | POST | Create a new ingestion job | Body: `{ name, source_type, ... }` |
| `/api/jobs/:id` | PUT | Update job status or progress | Body: `{ status, progress, itemsProcessed, errorMsg }` |
| `/api/jobs/:id` | DELETE | Delete a specific job | `id` in path |
| `/api/jobs` | DELETE | Clear completed jobs | Query: `?status=done` |
| `/api/yt/videos` | POST | Register a YouTube video | Body: `{ vid, title, ... }` |
| `/api/yt/videos/:vid`| PUT | Update video status | Body: `{ status }` |
| `/api/yt/playlists`| POST | Register a YouTube playlist | Body: `{ name, url, ... }` |
| `/api/settings` | GET | Retrieve all application settings | None |
| `/api/settings` | POST | Save a single setting | Body: `{ key, value }` |
| `/api/settings` | PUT | Save multiple settings | Body: `{ key: value, ... }` |
| `/api/logs` | GET | Get recent system logs | None |
| `/api/db/test-connection` | POST | Test DB connection and start Prisma Studio | Body: `{ uri, host, port, dbName, user, password, dbType }` |
| `/api/db/tables` | GET | List tables from Prisma schema | None |
| `/api/db/query` | POST | Execute direct SQL query (SQLite) | Body: `{ table, query, limit }` |
| `/api/db/import` | POST | Start a database import job | Body: `{ jobId, config }` |
| `/api/proxy/health`| GET | Aggregated health check of all microservices | None |

### Proxy Endpoints (Forwarded to other services)
- `POST /api/proxy/yt/info`: Forwarded to Whisper Port 8000
- `POST /api/proxy/image`: Forwarded to Qwen Port 5001 (Multipart)
- `POST /api/proxy/pdf`: Forwarded to Qwen Port 5001 (Multipart)
- `POST /api/proxy/twitter-ingest`: Forwarded to Twitter Server Port 6060 (Multipart)
- `ALL /api/proxy/facebook-ingest`: Forwarded to Facebook Server Port 7070 (Multipart)

---

## Disk Ingestion APIs (DataCollected)
These APIs specifically output text results into the project's `DataCollected/` directory for persistent disk storage.

| Service | Endpoint | Target Directory | Description |
|---------|----------|------------------|-------------|
| **Core Backend** (3000) | `POST /api/ingest` | `DataCollected/[SourceOrTitle]/` | Saves extracted text and optional original files. |
| **Admin Dashboard** (4000) | `POST /api/db/import` | `DataCollected/database/` | Consolidated `.txt` export from an external Database. |
| **Admin Dashboard** (4000) | `POST /api/save_local_file`| `DataCollected/[folder]/` | General purpose utility to write any content to disk. |
| **Facebook Server** (7070) | `POST /api/process-facebook`| `DataCollected/facebook/` | Full dataset processing output (ZIP/CSV/JSON). |
| **Twitter Server** (6060) | `POST /api/process-twitter` | `DataCollected/twitter/` | Full dataset processing output (ZIP/CSV/JSON). |

### Database Ingestion Call Chain
When `POST /api/db/import` is triggered on the Admin Dashboard:
1. It reads records from the source SQLite DB.
2. It pushes the data to the Core Backend: `POST http://localhost:3000/api/ingest`.
    *   *Result: Data is saved to `DataCollected/` by the Core Backend.*
3. It also writes a consolidated summary file directly to `DataCollected/database/`.

### Image Processing Flow
When an image is processed within the ecosystem:
1. **Source**: Triggered by an upload in the Dashboard UI or an Ingestion Server (FB/Twitter).
2. **Analysis**: The image is sent to the **Visual AI Pipeline** (Port 5001) via `POST /api/analyze`.
3. **Proxies**: Multiple services provide proxy routes to reach this endpoint:
    *   **Admin Dashboard** (4000): `POST /api/proxy/image`
    *   **Core Backend** (3000): `POST /api/proxy/analyze` (detects file type)
4. **Internal Logic**: Facebook and Twitter servers call the Qwen API directly via internal Python helper functions during dataset processing.

---

## 2. NetaBoard V5 Core (Port 3000)
**Base URL**: `http://localhost:3000`  
**Purpose**: Primary backend for data access, social inbox, and universal ingestion.

| Route | Method | Description | Parameters |
|-------|--------|-------------|------------|
| `/api/health` | GET | Service health check | None |
| `/api/archetypes` | GET | Retrieves political leaders/archetypes | None |
| `/api/feedback` | GET | Retrieves "Jan Darbar" public feedback | None |
| `/api/social` | GET | Retrieves processed social inbox items | None |
| `/api/alerts` | GET | Retrieves crisis/alert feed | None |
| `/api/ingest` | POST | Universal ingestion for pipeline data | Body: `{ source, content, author, title, fileName, fileData }` |
| `/api/jobs` | GET | List ingestion jobs | None |
| `/api/jobs` | POST | Create an ingestion job tracker | Body: `{ name, sourceType, totalItems }` |
| `/api/vault` | GET | List folders in `DataCollected` | None |
| `/api/vault/:folder`| GET | List files within a vault folder | `folder` in path |
| `/api/vault/:f/:file`| GET | Download or view specific file | `folder`, `file` in path |

---

## 3. Visual AI Pipeline - Qwen (Port 5001)
**Base URL**: `http://localhost:5001`  
**Purpose**: Image analysis, OCR, and PDF parsing using Qwen2.5-VL.

| Route | Method | Description | Parameters |
|-------|--------|-------------|------------|
| `/api/health` | GET | Model status and API config check | None |
| `/api/analyze` | POST | Analyze single image (VLM) | Multipart: `image`. Form: `prompt` |
| `/api/analyze-batch`| POST | Analyze multiple images | Multipart: `images` |
| `/api/analyze-pdf` | POST | Extract text and OCR from PDF | Multipart: `pdf`. Form: `strategy` (both, text_only, vision_only) |
| `/api/analyze-kaggle`| POST | Process ZIP dataset (SSE progress) | Multipart: `zipfile` |

---

## 4. Media Transcription Pipeline - Whisper (Port 8000)
**Base URL**: `http://localhost:8000`  
**Purpose**: Audio/Video transcription and YouTube content extraction.

| Route | Method | Description | Parameters |
|-------|--------|-------------|------------|
| `/api/health` | GET | Service health check | None |
| `/api/models` | GET | List available transcription models | None |
| `/api/transcribe` | POST | Transcribe uploaded media file | Multipart: `file` |
| `/api/transcribe-path`| POST | Transcribe file already on server | Body: `{ file_path }` |
| `/api/youtube/info` | POST | Fetch YouTube video metadata | Body: `{ url }` |
| `/api/youtube/queue`| POST | Enqueue YouTube for background transcription | Body: `{ url }` |
| `/api/jobs/:id` | GET | Poll background job status | `id` in path |

---

## 5. Facebook Ingestion Server (Port 7070)
**Base URL**: `http://localhost:7070`  
**Purpose**: Orchestrator for Facebook dataset ingestion.

| Route | Method | Description | Parameters |
|-------|--------|-------------|------------|
| `/api/health` | GET | Service health check | None |
| `/api/process-facebook`| POST | Process FB CSV/JSON/ZIP | Multipart: `file`. Form: `meta` (JSON config) |

---

## 6. Twitter Ingestion Server (Port 6060)
**Base URL**: `http://localhost:6060`  
**Purpose**: Orchestrator for Twitter/X dataset ingestion.

| Route | Method | Description | Parameters |
|-------|--------|-------------|------------|
| `/api/health` | GET | Service health check | None |
| `/api/process-twitter`| POST | Process Twitter CSV/JSON/ZIP | Multipart: `file`. Form: `meta` (JSON config) |
