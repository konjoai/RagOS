# KYRO — Next Session Prompt

Read this first before any implementation sprint.

## Current State (as of pre-Sprint-15 session, 2026-04-22)

- **Last commit:** `e48ed09` on `main` — Pre-Sprint-15: Query Route Timeout Parity
- **Tests:** 427 passing, 0 failing (`python3 -m pytest tests/unit/ -q --tb=short`)
- **Version:** v0.8.0 (Sprint 14 Agentic RAG complete)
- **Active sprint:** Sprint 15 — Lightweight GraphRAG (v0.8.5) — NOT STARTED

## What Was Done Last Session

- Added `asyncio.wait_for` timeout to `POST /query` and `POST /query/stream` (`_execute()` + `_stream_execute()` closures)
- Added `logger.warning(...)` on both `asyncio.TimeoutError` paths (K2 compliance fix)
- Created `tests/unit/test_query_route_timeout.py` (4 tests)
- Updated `_SettingsStub` in 3 existing test files with `request_timeout_seconds: float = 30.0`
- ruff permanently absent — skip forever; use `python3 -m py_compile` + manual K1-K7 in all future CRITIC phases

## Active Invariants (K1–K7)

| # | Invariant | Rule |
|---|-----------|------|
| K1 | No silent failures | All exceptions re-raised with `from exc` chain |
| K2 | Telemetry everywhere | `logger.warning(...)` on every error/timeout path |
| K3 | Graceful degradation | Optional features gated `if settings.X` |
| K4 | float32 dtype | All embeddings cast to `np.float32` before Qdrant |
| K5 | No unnecessary hard deps | New packages must be optional or stdlib |
| K6 | Backward-compatible API | New fields `Optional`/nullable, no removals |
| K7 | Reproducible evals | RAGAS seeds fixed; baseline scores locked |

## Known Blockers / Risks

- Full-repo `mypy` still reports baseline issues unrelated to Sprint 14 (missing stubs/external deps and pre-existing typedness gaps). Ignore pre-existing errors; only fix new ones introduced this session.
- `DREX_UNIFIED_SPEC.md` canonical source is shared from the `drex` workspace; kyro keeps a local pointer file.
- ruff is permanently absent from this machine — skip it everywhere. Syntax check via `python3 -m py_compile`.

## Recommended Next Task — Sprint 15 Wave 1: Lightweight GraphRAG

### Goal
Scaffold `GraphRAGRetriever` using NetworkX community detection (Louvain via `greedy_modularity_communities`). Feature-flagged off by default (K3). No breaking API changes (K6).

### Files to Create/Modify

| File | Change |
|------|--------|
| `konjoai/retrieve/graph_rag.py` | New: `EntityGraph`, `GraphRAGRetriever`, `CommunityContext` |
| `konjoai/config.py` | Add `enable_graph_rag: bool = False`, `graph_rag_max_communities: int = 5` |
| `konjoai/api/schemas.py` | Add `QueryRequest.use_graph_rag: bool = False`, `QueryResponse.graph_rag_communities: list[str] \| None = None` |
| `konjoai/api/routes/query.py` | K3 gate: `if settings.enable_graph_rag and req.use_graph_rag` |
| `requirements.txt` | Add `networkx>=3.2` |
| `tests/unit/test_graph_rag.py` | New: ≥ 20 tests covering entity graph, community detection, retriever, K3 gate |

### Sprint 15 Gate (all required before SHIP)
1. `GraphRAGRetriever` is feature-flagged off by default (K3) ✅
2. No breaking changes to `/query` or `/query/stream` when flag is off (K6) ✅
3. `networkx` is the only new dependency; no GPU/heavy deps (K5) ✅
4. All K1-K7 pass on new code ✅
5. Full suite stays at ≥ 427 tests passing ✅

### Critical Patch Target Rule (NEVER FORGET)
Lazy imports inside closures must be patched at the **source module**, not at the route module.
- ✅ `konjoai.retrieve.hybrid.hybrid_search`
- ❌ `konjoai.api.routes.query.hybrid_search`

## Quick Commands

```bash
cd /Users/wscholl/kyro

# Run full unit suite
python3 -m pytest tests/unit/ -q --tb=short

# Run focused test file
python3 -m pytest tests/unit/test_graph_rag.py -v

# CRITIC syntax check (ruff is permanently absent — skip it always)
python3 -m py_compile konjoai/retrieve/graph_rag.py

# Check recent git log
git log --oneline -5
```
