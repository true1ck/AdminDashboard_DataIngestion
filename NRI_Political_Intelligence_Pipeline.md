# 📊 NRI Political Intelligence Pipeline
### End-to-End: File Discovery → Relevance Gate → Pillar Scoring → DB Storage → Admin Dashboard Visualisation

---

## 🗂️ How It Fits Into the Admin Dashboard

The **PreProving** tab in the Admin Dashboard controls and visualises the entire NRI scoring pipeline.

```
DataCollected/
  ├── twitter/     → platform = "twitter",  platformWeight = 1.2
  ├── facebook/    → platform = "facebook", platformWeight = 1.0
  ├── youtube/     → platform = "youtube",  platformWeight = 1.1
  ├── whisper/     → platform = "youtube",  platformWeight = 1.1
  ├── news/        → platform = "news",     platformWeight = 0.9
  └── database/    → platform = "database", platformWeight = 1.5
```

1. Click **🔍 Scan DataCollected** → All `.txt` files registered in `nri_files` table (fingerprint dedup — never re-registers the same file)
2. Click **▶ Queue All Pending** → Pending files added to `nri_queue` table
3. Your Python scoring pipeline reads the queue via REST API → scores written to `nri_file_scores`
4. Admin Dashboard visualises scores, state, and heatmap in real-time

---

## 🗄️ SQLite Tables (in `dashboard.db`)

All three tables live in the **same** `AdminDashboard/dashboard.db` file. No separate setup needed.

### `nri_files` — File Registry

| Column | Type | Description |
|--------|------|-------------|
| `id` | INTEGER PK | Auto-increment |
| `filepath` | TEXT UNIQUE | Absolute path to .txt file |
| `filename` | TEXT | Just the filename |
| `folder` | TEXT | Relative folder path within DataCollected |
| `platform` | TEXT | twitter / facebook / youtube / news / document |
| `file_size_bytes` | INTEGER | File size |
| `fingerprint` | TEXT UNIQUE | djb2 hash of filepath — **dedup key** |
| `processing_state` | TEXT | pending → queued → processing → done / failed |
| `relevance_scored` | INTEGER | 0/1 |
| `pillar_scored` | INTEGER | 0/1 |
| `pillars_relevant` | INTEGER | Count of pillars with relevance ≥ 0.3 |
| `pillars_scored` | INTEGER | Count of pillars actually scored |
| `avg_relevance` | REAL | Average relevance across all pillars |
| `avg_score` | REAL | Average effective score (relevant pillars only) |
| `error_msg` | TEXT | Error if failed |
| `discovered_at` | TEXT | When first registered |
| `queued_at` | TEXT | When added to queue |
| `started_at` | TEXT | When scoring started |
| `completed_at` | TEXT | When scoring completed |

### `nri_file_scores` — Per-File Per-Pillar Scores

| Column | Type | Description |
|--------|------|-------------|
| `id` | INTEGER PK | Auto-increment |
| `file_id` | INTEGER FK | → nri_files.id |
| `filepath` | TEXT | Denormalised for fast lookup |
| `pillar` | TEXT | e.g. `electoral_strength` |
| `relevance_score` | REAL | 0.0–1.0 from LLM relevance check |
| `is_relevant` | INTEGER | 1 if relevance_score ≥ 0.3 |
| `raw_score` | REAL | 0–100 LLM pillar score |
| `effective_score` | REAL | raw_score adjusted for inversion (anti_incumbency, scandal_index) |
| `confidence` | REAL | 0.0–1.0 LLM confidence |
| `evidence` | TEXT | Direct quote supporting the score |
| `scored_at` | TEXT | Timestamp |
| **UNIQUE** | | `(file_id, pillar)` — one score per file per pillar |

### `nri_queue` — Processing Queue

| Column | Type | Description |
|--------|------|-------------|
| `id` | INTEGER PK | Auto-increment |
| `file_id` | INTEGER FK UNIQUE | → nri_files.id (one entry per file max) |
| `filepath` | TEXT | File path |
| `priority` | INTEGER | 1–10 (higher = processed first) |
| `status` | TEXT | queued → processing → done / failed |
| `enqueued_at` | TEXT | When queued |
| `started_at` | TEXT | When scoring started |
| `completed_at` | TEXT | When done |
| `error_msg` | TEXT | Error if failed |

---

## 🔌 REST API Endpoints (Admin Dashboard — Port 4000)

### File Discovery
```
POST /api/nri/files/scan      → Scan DataCollected, register all .txt files (idempotent)
POST /api/nri/files/discover  → Register a single file  { filepath, filename, folder, platform, fileSizeBytes }
GET  /api/nri/files           → List all files          ?filter=all|pending|queued|done|failed
PUT  /api/nri/files/:id       → Update processing state { processing_state, pillars_scored, avg_score, ... }
```

### Queue Management
```
GET    /api/nri/queue           → List queue             ?status=all|queued|processing|done
POST   /api/nri/queue           → Enqueue single file    { fileId, filepath, priority }
POST   /api/nri/queue/batch     → Enqueue multiple       { fileIds: [1,2,3,...] }
PUT    /api/nri/queue/:id       → Update queue item      { status, startedAt, completedAt, errorMsg }
DELETE /api/nri/queue/:fileId   → Remove from queue
```

### Scores
```
GET  /api/nri/scores            → All scores             ?fileId=123  or  ?limit=500
POST /api/nri/scores            → Save score             see body schema below
GET  /api/nri/stats             → Pipeline overview stats
```

**POST /api/nri/scores body:**
```json
{
  "fileId":        123,
  "filepath":      "/absolute/path/to/file.txt",
  "pillar":        "electoral_strength",
  "relevanceScore": 0.85,
  "isRelevant":    true,
  "rawScore":      72,
  "effectiveScore": 72,
  "confidence":    0.91,
  "evidence":      "crowd was massive at the rally today"
}
```

---

## 🐍 Python Scoring Pipeline Integration

### Step 1 — Register & Queue Files

```python
import requests

BASE = "http://localhost:4000/api/nri"

# Scan DataCollected automatically (idempotent — safe to call repeatedly)
result = requests.post(f"{BASE}/files/scan").json()
print(f"Discovered {result['discovered']} files: {result['new']} new, {result['existing']} already registered")

# Queue all pending files
files = requests.get(f"{BASE}/files?filter=pending").json()
if files:
    file_ids = [f["id"] for f in files]
    queued = requests.post(f"{BASE}/queue/batch",
                           json={"fileIds": file_ids}).json()
    print(f"Queued {queued['queued']} files")
```

### Step 2 — Process the Queue

```python
import requests, time

BASE = "http://localhost:4000/api/nri"
RELEVANCE_THRESHOLD = 0.3

def score_file_with_llm(filepath, pillar):
    """Your LLM scoring logic here."""
    # Returns: { relevance, score, confidence, evidence }
    ...

while True:
    queue = requests.get(f"{BASE}/queue?status=queued").json()
    if not queue:
        print("Queue empty. Sleeping 60s...")
        time.sleep(60)
        continue

    item = queue[0]  # Take first (highest priority)
    file_id   = item["file_id"]
    filepath  = item["filepath"]
    queue_id  = item["id"]

    # Mark as processing
    requests.put(f"{BASE}/queue/{queue_id}",
                 json={"status": "processing",
                       "startedAt": datetime.utcnow().isoformat()})
    requests.put(f"{BASE}/files/{file_id}",
                 json={"processing_state": "processing"})

    try:
        # Read file text
        with open(filepath, "r", encoding="utf-8") as f:
            text = f.read()

        # Step A: Relevance check (ALL 15 pillars at once)
        relevance_results = check_relevance_all_pillars(text[:2000])  # first 2000 chars

        pillars_scored = 0
        total_score = 0.0

        for pillar, rel_score in relevance_results.items():
            is_relevant = rel_score >= RELEVANCE_THRESHOLD

            if is_relevant:
                # Step B: Actual pillar scoring
                result = score_file_with_llm(text, pillar)
                raw_score = result.get("score", 0)
                # Invert for anti-incumbency, scandal_index
                effective_score = (100 - raw_score) if pillar in ["anti_incumbency","scandal_index"] else raw_score
                pillars_scored += 1
                total_score += effective_score
            else:
                raw_score = effective_score = None

            # Save to DB
            requests.post(f"{BASE}/scores", json={
                "fileId":         file_id,
                "filepath":       filepath,
                "pillar":         pillar,
                "relevanceScore": rel_score,
                "isRelevant":     is_relevant,
                "rawScore":       raw_score,
                "effectiveScore": effective_score,
                "confidence":     result.get("confidence") if is_relevant else None,
                "evidence":       result.get("evidence") if is_relevant else None
            })

        avg_score = total_score / pillars_scored if pillars_scored > 0 else 0

        # Mark file as done
        requests.put(f"{BASE}/files/{file_id}", json={
            "processing_state": "done",
            "pillar_scored":    1,
            "pillars_scored":   pillars_scored,
            "avg_score":        round(avg_score, 2),
            "completed_at":     datetime.utcnow().isoformat()
        })

        # Mark queue item as done
        requests.put(f"{BASE}/queue/{queue_id}", json={
            "status":       "done",
            "completedAt":  datetime.utcnow().isoformat()
        })

        print(f"✓ Done: {item['filename']} — {pillars_scored}/15 pillars scored, avg={avg_score:.1f}")

    except Exception as e:
        requests.put(f"{BASE}/files/{file_id}",
                     json={"processing_state": "failed", "error_msg": str(e)})
        requests.put(f"{BASE}/queue/{queue_id}",
                     json={"status": "failed", "errorMsg": str(e)})
        print(f"✗ Failed: {item['filename']} — {e}")
```

---

## 🔍 Relevance-First Scoring: The Critical Gate

### Step A — Relevance Check Prompt (Run BEFORE Pillar Scoring)

Run this once per file. Returns a relevance score for **all 15 pillars at once**.

```
SYSTEM:
You are a political data relevance classifier for Indian elections.
Given a text, score how relevant it is to each NRI pillar.
Return ONLY a JSON object. No explanation outside JSON.

RELEVANCE SCALE: 0.0 = completely irrelevant | 1.0 = directly about this pillar

PILLARS:
- electoral_strength:       vote share, booth data, rally attendance, voter turnout
- legislative_performance:  parliament/assembly bills, debates, attendance records
- constituency_development: roads, water supply, hospitals, local welfare
- public_accessibility:     jan darbar, public meetings, citizen grievances
- communication:            speeches, messaging, clarity, public statements
- party_standing:           internal party rank, loyalty, leadership endorsements
- media_coverage:           news articles about politician, press coverage
- digital_influence:        social media posts, followers, engagement, virality
- financial_muscle:         donations, rally funding, expenditure, assets
- alliance_intel:           coalition talks, seat sharing, partner parties
- caste_equation:           caste mentions, community support, jati dynamics
- anti_incumbency:          public complaints, dissatisfaction, negative feedback
- grassroots_network:       booth workers, karyakartas, ground volunteers
- ideology_consistency:     party manifesto alignment, political positions
- scandal_index:            corruption, FIRs, court cases, controversies

TEXT:
"{file_text_sample}"   ← use first 500 tokens of file

Return JSON ONLY:
{
  "electoral_strength": 0.0,
  ...(all 15 pillars)
}
```

### Relevance Threshold Logic

```python
RELEVANCE_THRESHOLD = 0.3  # skip pillar scoring if below this

def gate_scoring(relevance: dict) -> dict:
    return {
        pillar: {
            "score":      rel_score,
            "is_relevant": rel_score >= RELEVANCE_THRESHOLD
        }
        for pillar, rel_score in relevance.items()
    }
```

### Step B — Targeted Pillar Scoring (Only for Relevant Pillars)

```
SYSTEM:
You are scoring ONE specific NRI pillar for an Indian politician/party.
Only score what the text directly supports. Do NOT infer or hallucinate.
If the text does not contain enough signal, return score: null.

PILLAR: {pillar_name}
DEFINITION: {pillar_definition}
SCALE: 0 = very negative/weak | 50 = neutral | 100 = very positive/strong

TEXT:
{file_text}

Return JSON ONLY:
{
  "score":      0-100 or null,
  "confidence": 0.0-1.0,
  "evidence":   "<direct quote or phrase from text that supports score>"
}
```

---

## ⚖️ File Weight Calculation

Each file's contribution to a pillar's final score uses a **combined weight**:

```
combinedWeight = platformWeight × relevanceScore
```

| Factor | Source | Example |
|--------|--------|---------|
| `platformWeight` | Platform type | Twitter = 1.2, Document = 1.5 |
| `relevanceScore` | LLM relevance gate | 0.0 – 1.0 |
| `combinedWeight` | Multiplied | 1.2 × 0.85 = 1.02 |

---

## 📊 Admin Dashboard Visualisation

The **PreProving** tab provides:

| Feature | Description |
|---------|-------------|
| **Stats Cards** | Total files, queued, processing, done, failed, avg score |
| **Processing Queue** | Live view with priority, status, timestamps |
| **File Registry** | Filterable table with state, pillars scored, avg score |
| **Score Detail Panel** | Click any file → pillar bar chart with color-coded scores |
| **Heatmap** | File × Pillar relevance matrix (green = relevant, amber = marginal, grey = skip) |
| **Manual Score Entry** | Enter scores manually or from Python pipeline |
| **Dedup Protection** | Fingerprint-based: same file never re-registered or re-queued |

### Score Color Coding
- 🟢 **Green** (≥70) — Strong signal
- 🟡 **Amber** (40–70) — Moderate signal  
- 🔴 **Red** (<40) — Weak signal
- ⬜ **Skipped** — Relevance < 0.3 (LLM gate blocked)

---

## 🔄 Full Processing Flow Per File

```
1. Scan DataCollected    → POST /api/nri/files/scan
                           Creates nri_files rows (idempotent, fingerprint dedup)

2. Queue files           → POST /api/nri/queue/batch
                           Creates nri_queue rows (one per file max)

3. Python pipeline reads → GET /api/nri/queue?status=queued

4. For each file:
   a. Mark processing    → PUT /api/nri/queue/:id  { status: "processing" }
   b. Read .txt content
   c. Relevance check    → LLM: all 15 pillars at once
   d. For relevant pillars (score ≥ 0.3):
      - Score pillar     → LLM: score 0–100 + evidence
      - Save to DB       → POST /api/nri/scores

5. Mark done             → PUT /api/nri/files/:id   { processing_state: "done" }
                           PUT /api/nri/queue/:id   { status: "done" }

6. Dashboard refreshes   → Auto-poll every 30s when PreProving tab is active
```

---

## 🗂️ All Tables Summary

| Table | Per Entity | Purpose |
|-------|-----------|---------|
| `nri_files` | 1 per .txt file | File registry + dedup fingerprint |
| `nri_file_scores` | 0–15 per file | Per-pillar relevance + score + evidence |
| `nri_queue` | 1 per file max | Queue management with priority |

> **All tables are in `AdminDashboard/dashboard.db`** — the same SQLite file the Admin Dashboard already uses. No second database needed.

---

## 🔑 Why This Prevents Bad Scores

| Problem | Solution |
|---------|----------|
| File unrelated to pillar → LLM invents score | `FileRelevance` gate: skip if relevance < 0.3 |
| Same file scored twice | `fingerprint` UNIQUE in `nri_files` + UNIQUE on `nri_queue.file_id` |
| Can't trace why a pillar score is low | `evidence` field in `nri_file_scores` |
| No visibility into scoring progress | Admin Dashboard PreProving tab: live queue + state |
| Scores lost after server restart | All data persisted in SQLite `dashboard.db` |

---

*NRI Political Intelligence System · Integration Version 3.0 · Admin Dashboard PreProving Tab*