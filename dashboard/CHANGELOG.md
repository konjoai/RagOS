# Changelog

All notable changes to `@kyro/dashboard` are recorded here. Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/); versioning is [SemVer](https://semver.org/).

## [0.1.0] — 2026-05-08

### Added — Sprint 5: RAG Observatory

The flagship cinematic UI for kyro. Watch a RAG pipeline think — eight stages with real `elapsed_ms` from telemetry, sources scoring themselves, click-to-inspect ChunkInspector, live agent reasoning streamed via `/agent/query/stream`, and an OWASP-compliant audit timeline.

- **Repository scaffold** — Vite 8 + React 19 + TypeScript + Tailwind v4 + Vitest 4. Consumes `@konjoai/ui` via `file:../../konjoai-ui`. React and motion are deduped at the resolver to share one singleton.

- **Nine views**:
  - [`<QueryBar>`](./src/views/QueryBar.tsx) — question input + mode toggle (query / agent) + five feature flag toggles (HyDE · CRAG · Self-RAG · decomp · GraphRAG). ⌘/ctrl-Enter submits.
  - [`<PipelineFlow>`](./src/views/PipelineFlow.tsx) — 8-stage pipeline (route → HyDE → embed → hybrid → CRAG → rerank → Self-RAG → generate) with real `elapsed_ms` from `telemetry`. Disabled features render as `skipped`.
  - [`<AnswerStream>`](./src/views/AnswerStream.tsx) — token-by-token streaming via `/query/stream` with intent + cache-hit pills.
  - [`<AgentReasoning>`](./src/views/AgentReasoning.tsx) — live ReAct steps from `/agent/query/stream`. Each step renders thought/action/observation with action-color tinting.
  - [`<SourcesList>`](./src/views/SourcesList.tsx) — retrieved chunks with reranker score and optional CRAG classification badge. Cinematic stagger reveal after a query completes.
  - [`<ChunkInspector>`](./src/views/ChunkInspector.tsx) — slide-out drawer revealing reranker logit (real), CRAG score + class (real if CRAG enabled), Self-RAG iteration scores ISREL/ISSUP/ISUSE (real per-iteration if Self-RAG enabled), and full content preview. Honest caption: "dense + BM25 raw scores aren't exposed by /query today."
  - [`<AuditTimeline>`](./src/views/AuditTimeline.tsx) — OWASP-compliant audit events from `/audit/events`. Latency-driven bar heights, color by event_type, scrollable recent-events list. Only `question_hash` ever displayed.
  - [`<EvalCard>`](./src/views/EvalCard.tsx) — RAGAS scores from latest `evals/runs/<timestamp>/scores.json` snapshot (4 metrics: faithfulness, answer_relevancy, context_precision, context_recall).
  - [`<MetaInspector>`](./src/views/MetaInspector.tsx) — source labels for every pane: server, vectors, bm25, mode, query/agent, audit. Each independently flagged `live` vs `mock`.

- **Library layer**:
  - [`types.ts`](./src/lib/types.ts) — TS mirrors of `/query`, `/query/stream`, `/agent/query`, `/agent/query/stream`, `/audit/events`, `/audit/stats`, `/health`. Includes CRAG / Self-RAG / Decomposition / GraphRAG response fields.
  - [`sse.ts`](./src/lib/sse.ts) — SSE/NDJSON parser. Auto-detects format. Handles `[DONE]` sentinel, comment keepalives, mid-frame buffer continuation.
  - [`api.ts`](./src/lib/api.ts) — `querySync` + `queryStream` (concurrent — one for telemetry, one for cinematic answer) + `agentStream` (single channel) + `fetchAuditEvents` + `fetchAuditStats` + `fetchHealth`. All fall back to mocks transparently.
  - [`mock.ts`](./src/lib/mock.ts) — `MOCK_QUERY_RESPONSE` (with CRAG + Self-RAG metadata + telemetry), `MOCK_AGENT_RESPONSE` (with thought/action/observation steps), `MOCK_AGENT_STEPS` (replay sequence), `MOCK_AUDIT_EVENTS` (six events including rate_limited), `MOCK_HEALTH`, `MOCK_RAGAS`.

- **Honest visualization**:
  - **`/query/stream` does not emit telemetry**, so the dashboard fires `querySync` in parallel and merges the trace after streaming completes. The streaming pane shows the answer as it arrives; the trace populates the pipeline + ChunkInspector after `/query` resolves.
  - **Pre-rerank dense/sparse scores aren't exposed.** The ChunkInspector explicitly captions this — we don't synthesize what kyro doesn't return.
  - **Audit data is OWASP-safe.** Only `question_hash` (SHA-256[:16]) crosses the wire; the AuditTimeline header reminds the operator.
  - **Pipeline cursor is animation; the trace timing is real.** While streaming, the cursor walks ~one stage / 380ms regardless of server speed. When `/query` resolves, the PipelineFlow shows real `elapsed_ms`. MetaInspector flags live vs mock.

- **Tests** — 30 Vitest cases covering: SSE/NDJSON frame splitting (incl. comment keepalives + mid-frame), mock-fixture invariants (CRAG arrays well-sized, OWASP no-raw-question, RAGAS in [0,1], Self-RAG ISREL/ISSUP/ISUSE in [0,1]), and behavioral tests for `<QueryBar>`, `<SourcesList>`, `<AgentReasoning>`, `<AuditTimeline>`. All green.

- **Docs** — README, CLAUDE.md (operating rules), this changelog.

### Notes

- Sprint 5 of the 10-sprint Konjo UI Initiative.
- All animation respects `prefers-reduced-motion`.
- kyro v1.4.0 doesn't yet enable CORS middleware; the Vite dev proxy bypasses this for local development. For production deployment, `CORSMiddleware` should be added to `konjoai/api/app.py`.
