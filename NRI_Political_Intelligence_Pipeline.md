# 📊 NRI File-Level Scoring, Weighting & Prisma Schema
### Granular visibility: every `.txt` file → its pillar relevance → its score contribution → final aggregated NRI

---

## 🚨 The Core Problem This Solves

A file like `twitter_rally_crowd_2024-01-10.txt` may be **100% relevant** to Electoral Strength but **completely irrelevant** to Legislative Performance. If you score it against all 15 pillars anyway, you get **hallucinated scores** polluting your NRI.

```
❌ WRONG (naive approach):
  File: "crowd was massive at the rally today"
  → Electoral Strength: 85  ✅ correct
  → Legislative Performance: 45  ❌ LLM guessing
  → Scandal Index: 30  ❌ LLM hallucinating

✅ CORRECT (relevance-gated approach):
  File: "crowd was massive at the rally today"
  → Electoral Strength: 85  ✅ scored
  → Legislative Performance: NULL  ✅ skipped (irrelevant)
  → Scandal Index: NULL  ✅ skipped (irrelevant)
```

---

## 🗄️ Complete Prisma Schema (Separate Tables for Everything)

```prisma
// schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}

// ─────────────────────────────────────────────
// ENTITY MASTER
// ─────────────────────────────────────────────

model Archetype {
  id              String   @id @default(uuid())
  name            String   @unique
  type            String   // "politician" | "party" | "organization"
  constituency    String?
  state           String?
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  rawFiles        RawFile[]
  pillarScores    EntityPillarScore[]
  feedbackScores  FeedbackScore[]
  pillarGaps      PillarGap[]
  alerts          Alert[]
  nriSnapshots    NriSnapshot[]
}

// ─────────────────────────────────────────────
// RAW FILE REGISTRY
// Each .txt file gets one row here
// ─────────────────────────────────────────────

model RawFile {
  id              String   @id @default(uuid())
  filename        String
  filepath        String   @unique
  sourceFolder    String   // "facebook" | "twitter" | "youtube_transcript" | etc.
  platform        String   // "facebook" | "twitter" | "youtube" | "news" | "document"
  sourceType      String   // "social" | "video" | "web" | "official" | "structured" | "visual"
  platformWeight  Float    // from SOURCE_MAP e.g. 1.2 for twitter
  fileSizeBytes   Int?
  chunkCount      Int      @default(0)
  tokenCount      Int      @default(0)
  fileTimestamp   DateTime // extracted from filename
  ingestedAt      DateTime @default(now())
  processingState String   @default("raw") // "raw" | "chunked" | "relevance_scored" | "pillar_scored" | "done"

  archetypeId     String
  archetype       Archetype @relation(fields: [archetypeId], references: [id])

  chunks          FileChunk[]
  relevanceScores FileRelevance[]
  pillarScores    FilePillarScore[]
}

// ─────────────────────────────────────────────
// FILE CHUNKS
// Each chunk from a RawFile
// ─────────────────────────────────────────────

model FileChunk {
  id              String   @id @default(uuid())
  chunkIndex      Int      // position within file
  text            String
  tokenCount      Int
  sentimentScore  Float?   // -1.0 to 1.0 (SpaCy pre-processing)
  emotion         String?  // "anger" | "support" | "indifference" | "hope" | "frustration"
  createdAt       DateTime @default(now())

  rawFileId       String
  rawFile         RawFile  @relation(fields: [rawFileId], references: [id])
}

// ─────────────────────────────────────────────
// FILE RELEVANCE
// Is this file relevant to each pillar?
// This MUST be scored BEFORE pillar scoring.
// ─────────────────────────────────────────────

model FileRelevance {
  id              String   @id @default(uuid())
  pillar          String   // e.g. "electoral_strength"
  relevanceScore  Float    // 0.0 to 1.0
  isRelevant      Boolean  // true if relevanceScore >= 0.3 (threshold)
  reasoning       String?  // 1-line LLM explanation
  scoredAt        DateTime @default(now())

  rawFileId       String
  rawFile         RawFile  @relation(fields: [rawFileId], references: [id])

  @@unique([rawFileId, pillar])
}

// ─────────────────────────────────────────────
// FILE PILLAR SCORE
// Score for ONE pillar from ONE file.
// Only created if FileRelevance.isRelevant = true
// ─────────────────────────────────────────────

model FilePillarScore {
  id              String   @id @default(uuid())
  pillar          String   // e.g. "electoral_strength"
  rawScore        Float    // 0–100, as returned by LLM
  confidence      Float    // 0.0–1.0, LLM confidence
  evidence        String?  // 1-line supporting quote/reason
  isInverted      Boolean  @default(false) // true for anti_incumbency, scandal_index
  effectiveScore  Float    // rawScore if not inverted, (100 - rawScore) if inverted

  // Weight of this file within this pillar's aggregation
  platformWeight  Float    // from SOURCE_MAP
  relevanceScore  Float    // from FileRelevance (how relevant this file was)
  combinedWeight  Float    // platformWeight * relevanceScore — used in final aggregation

  scoredAt        DateTime @default(now())

  rawFileId       String
  rawFile         RawFile  @relation(fields: [rawFileId], references: [id])

  @@unique([rawFileId, pillar])
}

// ─────────────────────────────────────────────
// ENTITY PILLAR SCORE (aggregated across all files)
// Final score per pillar per entity per snapshot
// ─────────────────────────────────────────────

model EntityPillarScore {
  id                  String   @id @default(uuid())
  pillar              String
  pillarWeight        Float    // NRI weight e.g. 0.15 for electoral_strength
  aggregatedScore     Float    // weighted average of all FilePillarScores
  fileCount           Int      // how many files contributed
  skippedFileCount    Int      // how many files were irrelevant (skipped)
  avgConfidence       Float
  isInverted          Boolean  @default(false)
  effectiveScore      Float    // after inversion if applicable
  weightedContribution Float   // effectiveScore * pillarWeight = contribution to NRI total
  snapshotId          String
  createdAt           DateTime @default(now())

  archetypeId         String
  archetype           Archetype @relation(fields: [archetypeId], references: [id])
  nriSnapshot         NriSnapshot @relation(fields: [snapshotId], references: [id])

  @@unique([archetypeId, pillar, snapshotId])
}

// ─────────────────────────────────────────────
// NRI SNAPSHOT
// The final computed NRI score at a point in time
// ─────────────────────────────────────────────

model NriSnapshot {
  id              String   @id @default(uuid())
  nriTotal        Float    // final weighted NRI score
  dataQuality     String   // "high" | "medium" | "low"
  totalFiles      Int      // total files used
  totalChunks     Int
  snapshotAt      DateTime @default(now())

  archetypeId     String
  archetype       Archetype @relation(fields: [archetypeId], references: [id])

  pillarScores    EntityPillarScore[]
}

// ─────────────────────────────────────────────
// FEEDBACK SCORE (People's Voice — public sources only)
// ─────────────────────────────────────────────

model FeedbackScore {
  id              String   @id @default(uuid())
  pillar          String
  feedbackScore   Float    // 0–100
  dominantEmotion String?  // "anger" | "support" | "indifference" | "hope" | "frustration"
  topComplaints   String?  // JSON array as string
  topPraises      String?  // JSON array as string
  sampleSize      Int      // number of public chunks used
  scoredAt        DateTime @default(now())

  archetypeId     String
  archetype       Archetype @relation(fields: [archetypeId], references: [id])

  @@unique([archetypeId, pillar, scoredAt])
}

// ─────────────────────────────────────────────
// PILLAR GAP (NRI vs People's Voice divergence)
// ─────────────────────────────────────────────

model PillarGap {
  id              String   @id @default(uuid())
  pillar          String
  nriScore        Float
  feedbackScore   Float
  gap             Float    // nriScore - feedbackScore
  direction       String   // "over" | "under" | "aligned"
  isDivergent     Boolean  // true if |gap| > 20
  riskType        String   // "voter_disillusionment" | "unrealised_opportunity" | "aligned"
  computedAt      DateTime @default(now())

  archetypeId     String
  archetype       Archetype @relation(fields: [archetypeId], references: [id])
}

// ─────────────────────────────────────────────
// ALERTS
// ─────────────────────────────────────────────

model Alert {
  id                  String   @id @default(uuid())
  type                String   // "EC_NOTICE" | "VIRAL_NEGATIVE" | "ALLIANCE_STRESS" | etc.
  severity            String   // "CRISIS" | "HIGH" | "MEDIUM" | "LOW"
  summary             String
  recommendedAction   String
  confidence          Int      // 0–100
  affectedPillar      String?
  location            String?  // ward/constituency
  status              String   @default("pending") // "pending" | "accepted" | "modified" | "rejected"
  detectedAt          DateTime @default(now())
  resolvedAt          DateTime?

  archetypeId         String
  archetype           Archetype @relation(fields: [archetypeId], references: [id])
}
```

---

## 🔍 Relevance-First Scoring: The Critical Gate

### Step A — Relevance Check Prompt (Run BEFORE Pillar Scoring)

Run this once per file. It returns a relevance score for **all 15 pillars at once**.

```
SYSTEM:
You are a political data relevance classifier for Indian elections.
Given a text, score how relevant it is to each NRI pillar.
Return ONLY a JSON object. No explanation outside JSON.

RELEVANCE SCALE: 0.0 = completely irrelevant | 1.0 = directly and specifically about this pillar

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
  "electoral_strength":       0.0,
  "legislative_performance":  0.0,
  "constituency_development": 0.0,
  "public_accessibility":     0.0,
  "communication":            0.0,
  "party_standing":           0.0,
  "media_coverage":           0.0,
  "digital_influence":        0.0,
  "financial_muscle":         0.0,
  "alliance_intel":           0.0,
  "caste_equation":           0.0,
  "anti_incumbency":          0.0,
  "grassroots_network":       0.0,
  "ideology_consistency":     0.0,
  "scandal_index":            0.0
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
| `platformWeight` | SOURCE_MAP (credibility) | Twitter = 1.2, Document = 1.5 |
| `relevanceScore` | LLM relevance gate | 0.0 – 1.0 |
| `combinedWeight` | Multiplied together | 1.2 × 0.85 = 1.02 |

### Weighted Aggregation Per Pillar

```python
def aggregate_pillar_score(file_scores: list[dict]) -> dict:
    """
    file_scores = list of FilePillarScore rows for one pillar, one entity
    Each dict: { effective_score, combined_weight, confidence }
    """
    relevant = [f for f in file_scores if f["combined_weight"] > 0]

    if not relevant:
        return {"aggregated_score": None, "file_count": 0}

    total_weight  = sum(f["combined_weight"] for f in relevant)
    weighted_sum  = sum(f["effective_score"] * f["combined_weight"] for f in relevant)
    avg_conf      = sum(f["confidence"] for f in relevant) / len(relevant)

    return {
        "aggregated_score":  round(weighted_sum / total_weight, 2),
        "file_count":        len(relevant),
        "skipped_file_count":len(file_scores) - len(relevant),
        "avg_confidence":    round(avg_conf, 3),
        "total_weight":      round(total_weight, 3),
    }
```

---

## 📊 Visualisation Data Model

These queries power your dashboard visualisations directly from SQLite.

### View 1 — File Weight Breakdown Per Entity

> "Which files contributed most to this entity's NRI?"

```sql
SELECT
  rf.filename,
  rf.sourceFolder,
  rf.platform,
  rf.platformWeight,
  rf.chunkCount,
  COUNT(fps.id)            AS pillars_scored,
  COUNT(fr.id)             AS pillars_skipped,
  AVG(fps.relevanceScore)  AS avg_relevance,
  AVG(fps.combinedWeight)  AS avg_combined_weight,
  AVG(fps.effectiveScore)  AS avg_effective_score
FROM RawFile rf
LEFT JOIN FilePillarScore fps ON fps.rawFileId = rf.id
LEFT JOIN FileRelevance fr    ON fr.rawFileId  = rf.id AND fr.isRelevant = false
WHERE rf.archetypeId = '{entity_id}'
GROUP BY rf.id
ORDER BY avg_combined_weight DESC;
```

### View 2 — Per-Pillar File Contribution Matrix

> "For Electoral Strength, which files contributed and how much?"

```sql
SELECT
  rf.filename,
  rf.platform,
  fps.rawScore,
  fps.effectiveScore,
  fps.confidence,
  fps.relevanceScore,
  fps.platformWeight,
  fps.combinedWeight,
  fps.evidence,
  fr.isRelevant
FROM FilePillarScore fps
JOIN RawFile rf       ON fps.rawFileId = rf.id
JOIN FileRelevance fr ON fr.rawFileId  = rf.id AND fr.pillar = fps.pillar
WHERE rf.archetypeId = '{entity_id}'
  AND fps.pillar     = 'electoral_strength'
ORDER BY fps.combinedWeight DESC;
```

### View 3 — Pillar Score Composition (Final NRI Breakdown)

```sql
SELECT
  eps.pillar,
  eps.pillarWeight,
  eps.aggregatedScore,
  eps.effectiveScore,
  eps.weightedContribution,
  eps.fileCount,
  eps.skippedFileCount,
  eps.avgConfidence,
  eps.isInverted
FROM EntityPillarScore eps
WHERE eps.archetypeId = '{entity_id}'
  AND eps.snapshotId  = '{latest_snapshot_id}'
ORDER BY eps.weightedContribution DESC;
```

### View 4 — File Relevance Heatmap Data

> Feeds a heatmap: rows = files, columns = pillars, cells = relevance score

```sql
SELECT
  rf.filename,
  rf.platform,
  fr.pillar,
  fr.relevanceScore,
  fr.isRelevant
FROM FileRelevance fr
JOIN RawFile rf ON fr.rawFileId = rf.id
WHERE rf.archetypeId = '{entity_id}'
ORDER BY rf.filename, fr.pillar;
```

---

## 🔄 Full Processing Flow Per File

```
FOR each RawFile:
  1. chunk_text()                   → creates FileChunk rows
  2. extract_entity()               → links to Archetype
  3. score_relevance()              → creates FileRelevance rows (all 15 pillars)
  4. FOR each pillar WHERE isRelevant = true:
       score_pillar()               → creates FilePillarScore row
                                       combinedWeight = platformWeight × relevanceScore
  5. Mark RawFile.processingState = "done"

AFTER all files processed for entity:
  6. aggregate_pillar_scores()      → creates EntityPillarScore rows (15 rows)
  7. compute_nri_total()            → creates NriSnapshot row
  8. score_feedback()               → creates FeedbackScore rows (public sources only)
  9. compute_gaps()                 → creates PillarGap rows
  10. detect_alerts()               → creates Alert rows
```

---

## 🗂️ All Prisma Tables Summary

| Table | Rows per Entity | Purpose |
|-------|----------------|---------|
| `Archetype` | 1 | Master entity record |
| `RawFile` | 1 per `.txt` file | File registry with source weight |
| `FileChunk` | ~20–50 per file | Raw text chunks |
| `FileRelevance` | 15 per file | Pillar relevance gate scores |
| `FilePillarScore` | 0–15 per file | Actual pillar scores (only relevant pillars) |
| `EntityPillarScore` | 15 per snapshot | Aggregated scores with weights |
| `NriSnapshot` | 1 per analysis run | Final NRI total |
| `FeedbackScore` | 15 per analysis run | Public-only sentiment per pillar |
| `PillarGap` | 15 per analysis run | NRI vs Feedback divergence |
| `Alert` | Variable | Detected crisis alerts |

---

## 🔑 Why This Prevents Bad Scores

| Problem | Solution |
|---------|----------|
| File unrelated to pillar → LLM invents score | `FileRelevance` gate: skip if relevance < 0.3 |
| One credible document dominates all social data | `platformWeight` is multiplied by `relevanceScore`, not applied blindly |
| Can't trace why a pillar score is low | `evidence` field in `FilePillarScore` + `skippedFileCount` in `EntityPillarScore` |
| All files weighted equally | `combinedWeight = platformWeight × relevanceScore` per file per pillar |
| Can't see which files matter | `FileRelevance` heatmap query shows the full matrix |

---

*NRI Political Intelligence System · Schema Version 2.0 · Relevance-Gated Scoring*