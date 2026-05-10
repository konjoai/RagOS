# kyro · RAG Observatory

A flagship Konjo UI for **kyro** — the production RAG pipeline.

> 距離 (kyo) — distance · 距 — gap · 寄る (yoru) — to draw close

Watch a RAG pipeline think. Eight stages walk left to right with real `elapsed_ms` from `telemetry`. Sources score themselves. Click any chunk to see why it ranked. Switch to agent mode and the ReAct loop streams its thoughts live via `/agent/query/stream`. The audit timeline shows every retrieval — OWASP-compliant, hashed, never raw.

## Quick start

```bash
npm install
npm run dev      # → http://localhost:5178
npm test         # vitest (30 tests)
npm run build    # production build → dist/
```

To wire to a live kyro backend:

```bash
# Terminal 1 — start kyro (default :8000)
konjoai serve

# Terminal 2 — start the dashboard (proxies all routes → :8000)
cd dashboard && npm run dev
```

Note: kyro v1.4.0 doesn't yet enable CORS middleware. The Vite dev proxy bypasses this for local development. For production, add CORS to `konjoai/api/app.py`.

When the server is unreachable the dashboard transparently falls back to mocks. The MetaInspector reports `live` vs `mock` for each pane independently.

## Stack

`React 19` · `TypeScript` · `Vite 8` · `Tailwind CSS v4` · `motion` · `Vitest`
Built on top of [`@konjoai/ui`](../../konjoai-ui).

## What you'll see

| Panel              | What it shows                                                          |
|--------------------|------------------------------------------------------------------------|
| **Hero**           | The kyro promise · accent gradient                                     |
| **QueryBar**       | Question input + mode toggle (query / agent) + feature flags          |
| **PipelineFlow**   | 8 stages with real `elapsed_ms` from `telemetry`: route → HyDE → embed → hybrid → CRAG → rerank → Self-RAG → generate |
| **AnswerStream**   | Token-by-token answer from `/query/stream` with intent + cache-hit pills |
| **AgentReasoning** | Live ReAct steps from `/agent/query/stream` (thought / action / observation) |
| **SourcesList**    | Each retrieved chunk with reranker score; click to inspect            |
| **ChunkInspector** | Drawer revealing reranker logit · CRAG class + score · Self-RAG iteration scores · full preview |
| **AuditTimeline**  | OWASP-compliant audit events from `/audit/events` — only `question_hash`, never raw |
| **EvalCard**       | RAGAS scores from latest `evals/runs/<timestamp>/scores.json`         |
| **MetaInspector**  | Source labels for every pane (live vs mock)                            |

## Architecture

- **Two streaming transports.** `/query/stream` for RAG mode (token frames + final-with-sources frame) · `/agent/query/stream` for agent mode (`step` / `result` / `telemetry` events + `[DONE]` sentinel).

- **Telemetry-first.** The PipelineFlow's per-stage durations come from `telemetry.{stage}.elapsed_ms` — real measurements, not animation. Disabled features render as `skipped` rather than absent so the surface always shows the full intended pipeline.

- **Mock-first** ([src/lib/mock.ts](./src/lib/mock.ts)). Every transport has a hand-crafted fallback that mirrors the real wire format. The streaming fallback replays mock tokens and steps with realistic cadence so the cinematic experience is preserved offline.

- **SSE / NDJSON parser** ([src/lib/sse.ts](./src/lib/sse.ts)). Auto-detects format. Handles `[DONE]` sentinel, comment keepalives, mid-frame buffer continuation. Used by both streaming endpoints.

## Honesty notes

- **`/query` returns the trace; `/query/stream` doesn't.** kyro's streaming endpoint emits only `{token, done}` and a final frame with `sources` + `intent` — no per-stage telemetry. The dashboard fires `querySync` in parallel with `queryStream` and uses the sync response for `telemetry`, `sources`, `crag_*`, `self_rag_*`. The streaming pane gets the answer as it arrives; the trace populates the pipeline + ChunkInspector after `/query` resolves.

- **Pre-rerank dense / BM25 raw scores aren't exposed.** Only the RRF-fused reranker output is in `sources[].score`. The ChunkInspector explicitly notes this in its caption — we don't synthesize what we don't have.

- **CRAG arrays may have more entries than `sources`.** CRAG runs over the hybrid candidate set (typically 20+); the rerank trims to 5. The ChunkInspector reads `crag_scores[i]` / `crag_classification[i]` for source index `i`, which assumes alignment to retrieval order. If your backend differs, adjust [`ChunkInspector.tsx:Body`](./src/views/ChunkInspector.tsx).

- **Audit data is OWASP-safe.** Only `question_hash` (SHA-256[:16]) ever crosses the wire — never the raw question. The AuditTimeline header reminds the operator.

- **Pipeline cursor is animation, not measurement.** During streaming, the pipeline visually advances ~one stage every 380 ms regardless of how fast the server is. After `/query` resolves, the PipelineFlow shows real `elapsed_ms` from telemetry. The MetaInspector flags whether you're looking at live or mock data.

## Configuration

- `VITE_KYRO_API` — base URL of the kyro server (default: `""`, leans on dev proxy).
- `VITE_KYRO_TENANT` — tenant id sent as `x-tenant-id` (optional).

The dev server proxies `/query`, `/agent`, `/audit`, `/eval`, `/health`, `/vectro`, `/metrics` to `http://localhost:8000`.

## Tests

```bash
npm test
```

Covers: SSE/NDJSON frame splitting (incl. comment keepalives + mid-frame continuation), mock-fixture invariants (CRAG arrays well-sized, OWASP no-raw-question, RAGAS in [0,1], Self-RAG iteration scores), and behavioral tests for `<QueryBar>`, `<SourcesList>`, `<AgentReasoning>`, `<AuditTimeline>`. 30 tests, all green.

See [`CLAUDE.md`](./CLAUDE.md) for operating rules.
