# NétaBoard V5.0 — AI APIs & License Audit

> Generated: 2026-03-04 | Conversation with AI Assistant

## 5-Tier AI Cascade (in `src/data/engines.ts`)

### Tier 5 — Claude API (Anthropic)
- **Model**: `claude-sonnet-4-20250514`
- **Endpoint**: `https://api.anthropic.com/v1/messages`
- **Purpose**: Executive summaries, crisis response, what-if scenarios, social auto-replies, caste analysis, alliance strategy
- **License**: ❌ **Proprietary** (Anthropic ToS, paid API)

### Tier 4 — Local LLM (Self-hosted via Ollama/vLLM)
- **Models**: Llama 3.1 8B / Mistral 7B
- **Custom model**: `netaboard-political-8b` (fine-tuned)
- **Endpoint**: `http://localhost:11434/api/generate`
- **Purpose**: Hindi/English sentiment, constituency vocabulary, IASCL drafting, shikayat categorization, booth report summarization
- **License**:
  - Mistral 7B — ✅ **Apache 2.0**
  - Llama 3.1 8B — ❌ **Meta Llama 3.1 Community License** (NOT Apache 2.0)

> ⚠️ Code comment on line 203 claims "Apache 2.0" for both, but only Mistral 7B is actually Apache 2.0.

### Tier 3 — Smart Templates (No external AI)
- **Purpose**: Archetype-aware pre-computed crisis protocols and response drafts
- **License**: ✅ Own code

### Tier 2 — ALGO_ENGINE (Rule-based)
- **Purpose**: Alert triage, weakest-pillar analysis, what-if simulation, executive summaries
- **License**: ✅ Own code

### Tier 1 — Static Fallback
- **Purpose**: Hardcoded default responses
- **License**: ✅ Own code

---

## Media Pipeline (MEDIA_PIPE)

| Engine | Purpose | License |
|---|---|---|
| **Tesseract 5** | OCR for newspaper scans (Hindi/English/Urdu) | ✅ **Apache 2.0** |
| **Claude Vision** | Enhanced OCR with Tesseract | ❌ Proprietary (Anthropic) |
| **Whisper Large-v3** | Speech recognition (radio, rallies) | ❌ **MIT License** |
| **YOLOv8** | Face detection, banner OCR, crowd estimation | ❌ **AGPL-3.0** (most restrictive!) |

---

## Apache 2.0 Compliance Summary

| Component | Apache 2.0? | Actual License |
|---|---|---|
| Claude API | ❌ | Proprietary |
| Llama 3.1 8B | ❌ | Meta Community License |
| Mistral 7B | ✅ | Apache 2.0 |
| Tesseract 5 | ✅ | Apache 2.0 |
| Whisper v3 | ❌ | MIT |
| YOLOv8 | ❌ | **AGPL-3.0** |
| Smart Templates / Algo | ✅ | Own code |

## Key Concerns

1. **YOLOv8 (AGPL-3.0)** — Most problematic. Proprietary use requires Ultralytics commercial license or open-sourcing your code.
2. **Llama 3.1 mislabeled** — Code comments say "Apache 2.0" but it's Meta's custom license with restrictions (700M MAU cap, can't train competing models).
3. **Nothing is integrated yet** — MEDIA_PIPE is simulated, LLM engines need API keys/server setup.

## Apache 2.0 Alternatives (if strict compliance needed)

| Replace | With | License |
|---|---|---|
| Llama 3.1 8B | **Mistral 7B** or **Falcon 7B** | Apache 2.0 |
| Whisper v3 | Already MIT (very permissive, compatible) | MIT |
| YOLOv8 | **DETR** (Apache 2.0) or pay Ultralytics license | Apache 2.0 |
| Claude API | N/A (proprietary cloud, usage via API is fine) | — |
