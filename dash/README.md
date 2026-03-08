# Entity Intelligence Pipeline

A real-time, multi-source data collection and intelligence pipeline for tracking entities (persons) across YouTube, news, Twitter, and Instagram. Processes data with hybrid AI (local + microservice), stores in PostgreSQL and Qdrant, and surfaces live logs in the **NetaBoardV5** dashboard.

## Architecture

```
Entity (person name)
    │
    ▼
Collectors (YouTube, News RSS, Twitter, Instagram)
    │  raw-items
    ▼
Transformers (Normalizer → Deduplicator)
    │  normalized-items
    ▼
Processors (NER, Sentiment, Topic, Embedder, Transcriber, OCR)
    │  processed-items
    ▼
Consumers (Dashboard live feed, PostgreSQL, Qdrant)
```

## Quick Start

### 1. Start infrastructure (optional — uses in-memory bus by default)
```bash
docker-compose up -d
```

### 2. Install dependencies and start the API server
```bash
./scripts/run.sh
# API available at http://localhost:8500
```

### 3. Run demo pipeline (no Kafka/DB needed)
```bash
./scripts/demo.sh "Rahul Gandhi"
```

### 4. Open NetaBoardV5 dashboard
```bash
cd ../AdminDashboard_DataIngestion/NetaBoardV5
npm install && npm run dev
# Open http://localhost:5180
# Navigate to: Pipeline Intel (sidebar)
```

## Configuration

Edit `pipelines/entity_pipeline.yaml` to:
- Change the target entity (`pipeline.entity`)
- Enable/disable collectors (YouTube, news RSS)
- Switch from in-memory bus to Kafka (`kafka.bootstrap_servers: "localhost:9092"`)
- Enable PostgreSQL and Qdrant consumers

## API Endpoints (port 8500)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/v1/events` | List events (filterable by topic, stage, entity) |
| GET | `/api/v1/events/stream` | SSE real-time event stream |
| GET | `/api/v1/events/topics` | Available topic names |
| GET | `/api/v1/events/stats` | Event buffer statistics |
| POST | `/api/v1/events` | Push event (used by pipeline consumers) |
| POST | `/api/v1/entities` | Trigger collection for an entity |
| GET | `/api/v1/pipelines` | List pipeline configs |
| POST | `/api/v1/pipelines/{id}/start` | Start a pipeline |
| POST | `/api/v1/pipelines/{id}/stop` | Stop a pipeline |
| GET | `/health` | Health check |

## Project Structure

```
dash/
├── core/           — Schemas, config, Kafka wrapper, base classes
├── collectors/     — YouTube, News RSS, Twitter, Instagram
├── transformers/   — Normalizer, Deduplicator
├── processors/     — NER, Sentiment, Topic, Embedder, Transcriber, OCR
├── consumers/      — PostgreSQL, Qdrant, Dashboard, Stdout
├── engine/         — Pipeline orchestrator, async runner, supervisor
├── api/            — FastAPI server (port 8500)
├── pipelines/      — YAML pipeline configs
└── scripts/        — run.sh, demo.sh
```

## Hybrid AI Strategy

| Processor | Primary | Fallback |
|-----------|---------|---------|
| NER | spaCy en_core_web_sm | Regex heuristics |
| Sentiment | VADER | TextBlob → keyword scoring |
| Transcription | Whisper microservice (:8000) | faster-whisper local |
| OCR | Qwen microservice (:5001) | Tesseract subprocess |
| Embeddings | — | sentence-transformers (all-MiniLM-L6-v2) |

## NetaBoardV5 Integration

The monitoring UI is integrated into the existing NetaBoardV5 app as a new **Pipeline Intel** module with three tabs:
- **Monitor** — Live event feed with entity search, topic/stage filters, SSE streaming
- **Visualize** — Pipeline flowchart with start/stop controls
- **Logs** — Audit trail and dead-letter queue
