# kyro/dashboard

RAG Observatory — flagship cinematic UI for kyro. Vite + React + `@konjoai/ui`. Sprint 5 of the Konjo UI Initiative.

## Stack
React 19 · TypeScript · Vite 8 · Tailwind v4 (`@theme` config) · motion · Vitest 4 · `@konjoai/ui` (file: dep)

## Commands
```bash
npm install
npm run dev          # → http://localhost:5178 (proxies all routes → :8000)
npm test             # vitest (30 tests)
npm run build        # tsc -b && vite build
npm run typecheck    # tsc -b --noEmit
```

## Critical Constraints
- React, react-dom, and motion are deduped in [vite.config.ts](./vite.config.ts) so the dashboard and `@konjoai/ui` share a singleton.
- `@konjoai/ui` is consumed via `file:../../konjoai-ui`. Tokens come from `@konjoai/ui/styles` — don't redefine.
- kyro v1.4.0 has NO CORS middleware. Dev relies on the Vite proxy. Production deployments will need `CORSMiddleware` in `konjoai/api/app.py`.
- `/query/stream` does NOT emit telemetry; we fire `querySync` in parallel for the trace. Don't try to read telemetry from streaming frames.
- Pre-rerank dense / BM25 raw scores are NOT exposed by /query — only the RRF-fused reranker output. The ChunkInspector explicitly says so. Don't synthesize.
- Audit data is OWASP-safe — only `question_hash` ever crosses the wire. Never display anything that could leak the raw question.
- All 30 tests + the build must stay green.

## File Map
| Path | Role |
|------|------|
| `src/App.tsx` | Composition + dual-mode (query / agent) state machine |
| `src/views/PipelineFlow.tsx` | 8-stage RAG pipeline with real elapsed_ms from telemetry |
| `src/views/AnswerStream.tsx` | Token-by-token answer with intent + cache-hit pills |
| `src/views/SourcesList.tsx` | Retrieved chunks with reranker score, CRAG class, click-to-inspect |
| `src/views/ChunkInspector.tsx` | Drawer with all available scores per chunk |
| `src/views/AgentReasoning.tsx` | Live ReAct steps from /agent/query/stream |
| `src/views/AuditTimeline.tsx` | OWASP-compliant audit events from /audit/events |
| `src/views/QueryBar.tsx` | Question input + mode toggle + feature flags |
| `src/views/EvalCard.tsx` | RAGAS scores card |
| `src/views/MetaInspector.tsx` | Source labels for every pane |
| `src/lib/types.ts` | TS mirrors of /query, /agent/query, /audit/events shapes |
| `src/lib/api.ts` | querySync + queryStream + agentStream + fetchAuditEvents + fetchHealth |
| `src/lib/sse.ts` | SSE/NDJSON parser (auto-detect, keepalive-tolerant) |
| `src/lib/mock.ts` | MOCK_QUERY_RESPONSE + MOCK_AGENT_RESPONSE + MOCK_AUDIT_EVENTS + MOCK_RAGAS |

## Backend integration
- `POST /query` — full RAG response with telemetry, sources, CRAG/Self-RAG/Decomposition/GraphRAG metadata.
- `POST /query/stream` — SSE streaming answer tokens; final frame with sources. NO telemetry in stream.
- `POST /agent/query/stream` — SSE: `step` / `result` / `telemetry` events with `[DONE]` sentinel. v1.4.0 production-ready.
- `GET /audit/events` — OWASP-compliant audit log. Only `question_hash`, never raw.
- `GET /audit/stats` — aggregate counts per event_type.
- `GET /health` — `{status, vector_count, bm25_built}`.
- `POST /eval` — runs RAGAS evaluation; archives to `evals/runs/<timestamp>/scores.json`.

## When extending
- New panel? Lives in `src/views/`. Always ship a Vitest test.
- New backend shape? Mirror types in [src/lib/types.ts](./src/lib/types.ts), add a mock fixture, then add the API method to [src/lib/api.ts](./src/lib/api.ts) with a mock fallback.
- Future backend lift: when `/query/stream` emits per-stage telemetry frames, the dashboard's PipelineFlow can drive its cursor from real events instead of the 380 ms walk. Wire format change only.
- Future backend lift: when raw dense/sparse scores are exposed in telemetry, the ChunkInspector can show parallel-coordinates ranking. Type slot is ready.

## Sprint context
This is **Sprint 5** of the 10-sprint Konjo UI Initiative. Sprint 0 = `@konjoai/ui` foundation. Sprint 1 = squash Compliance Bridge. Sprint 2 = miru Mind of the Machine. Sprint 3 = kairu Speed Cockpit. Sprint 4 = squish Inference Cockpit. Sprint 6 = vectro Quantization Forge (next).
