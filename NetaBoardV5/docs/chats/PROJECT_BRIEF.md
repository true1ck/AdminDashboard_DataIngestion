# NétaBoard V5.0 "Sarvashakti" — Project Brief

> Generated: 2026-03-04 | Conversation with AI Assistant

## What It Is

A **Political Reputation Intelligence Dashboard** — a React/TypeScript PWA for Indian elected representatives to monitor, analyze, and improve their political reputation across 15 measurable pillars.

---

## Architecture

| Layer | Details |
|---|---|
| **Framework** | React 18 + TypeScript + Vite (port 5180) |
| **Styling** | TailwindCSS 3 — two palettes: `nb` (dark violet), `pp` (parchment brown) |
| **Animations** | Framer Motion |
| **Charts** | Recharts |
| **PWA** | `vite-plugin-pwa` with offline caching |
| **Export** | PDF via `html2canvas` + `jspdf` |
| **Testing** | Vitest + Testing Library |

---

## Dual-Mode Design

### Back Office (`bo`) — 17 Modules
For the politician/party team:
Overview, 15-Pillar Analysis, Alerts & Crisis, Analytics, Chunav (Election), Sansad (Parliament), Vikas (Development), Jan Darbar, Samikaran (Caste Math), Dal (Party), Social Media, Pratikriya (Response), Arthbal (Finance), Shield (Crisis), Gathbandhan (Alliance), Planning, Settings

### People's Portal (`pp`) — 11 Jan Setu Modules
Public-facing:
Parichay (Profile), Shikayat Kendra (Grievances), Vani (Videos/Speeches), Vikas Darshak (Projects), Jan Awaaz (Polls), Aavedhan (Petitions), E-Darbar, Sahyogi (Helpers), Karyakram (Events), Samvad (Forum), Apatkal (Emergency)

---

## Key Systems

- **15 NRI Pillars** — weighted reputation metrics
- **7 Politician Archetypes** — Grassroots, Technocrat, Dynasty, Firebrand, Silent, Satrap, Turncoat
- **5-Tier AI Cascade** — Claude → Local LLM → Smart Templates → Algo → Static
- **IASCL State Machine** — 10-state workflow with SLA tiers
- **Event Bus** — inter-module communication
- **Media Pipeline** — OCR (Tesseract) + ASR (Whisper) + Vision (YOLO)
- **i18n** — Hindi/English bilingual

---

## Current State & Known Issues

1. `ContentRouter.tsx` is **117KB monolith** — needs splitting into per-module components
2. `src/components/bo/` is **empty** — BO modules not yet extracted
3. `src/components/pp/` — only `ShikayatKendra.tsx` exists
4. All data is **hardcoded/mocked** — no backend API
5. Only **1 test file** — very low coverage

---

## Suggested Next Actions

1. Break up `ContentRouter.tsx` into per-module components
2. Build a backend API (FastAPI/Express + DB)
3. Expand test coverage (IASCL, AI engines, NRI)
4. Connect AI engines to real API endpoints
5. Add React Router for deep-linking
6. PWA polish (icons, splash screens, offline caching)
