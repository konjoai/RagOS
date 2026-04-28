# KYRO — Next Session Prompt

Read this first before any implementation sprint.

## Current State (as of Sprint 16 session, 2026-04-28)

- **Last commit:** pending push — Sprint 16: OTel + Prometheus Observability Layer
- **Tests:** 485 passing, 6 skipped (prometheus-client absent), 5 pre-existing Python 3.9 compat failures
- **Version:** v0.8.7 (Sprint 16 OTel/Prometheus complete)
- **Active sprint:** Sprint 17 — Multi-tenancy + JWT

## What Was Done Last Session (Sprint 16 — OTel + Prometheus)

- Extended `konjoai/telemetry.py` with `KyroMetrics` (Prometheus counters/histograms), `KyroTracer` (OTel span wrapper), `_noop_span()`, `get_metrics()`, `get_tracer()`, `record_pipeline_metrics()`; `_HAS_PROMETHEUS`/`_HAS_OTEL` import guards (K5: no hard deps)
- Added 4 settings to `konjoai/config.py`: `otel_enabled=False`, `otel_endpoint=""`, `otel_service_name="kyro"`, `prometheus_port=8001`
- Created `konjoai/api/routes/health.py` with `GET /metrics` Prometheus exposition endpoint (404 when disabled, 503 when dep absent)
- Registered `health_route.router` in `konjoai/api/app.py`
- Added `record_pipeline_metrics(tel, intent.value, enabled=settings.otel_enabled)` to `/query` route
- Documented optional deps (`prometheus-client>=0.19`, `opentelemetry-sdk>=1.20`) in `requirements.txt`
- Added 26 new tests to `tests/unit/test_telemetry.py` (46 passed + 6 skipped when prometheus-client absent)
- Updated `_SettingsStub` in 5 route test files with `otel_enabled: bool = False`
- Tests: 464 → 485 (+21 new). ruff permanently absent — `python3 -m py_compile` only.

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

## Recommended Next Task — Sprint 17: Multi-tenancy + JWT

### Goal
Add per-tenant isolation so multiple organizations can share one Kyro deployment. Each tenant gets its own Qdrant collection namespace, rate-limit bucket, and JWT-authenticated session. Feature-flagged off by default (K3). No breaking API changes (K6).

### Files to Create/Modify

| File | Change |
|------|--------|
| `konjoai/auth/` | New package: `jwt_auth.py` (decode/verify HS256 JWT), `tenant.py` (tenant context dataclass) |
| `konjoai/config.py` | Add `multi_tenancy_enabled=False`, `jwt_secret_key=""`, `jwt_algorithm="HS256"` |
| `konjoai/api/app.py` | Optional JWT middleware (K3: no-op when disabled) |
| `konjoai/api/routes/query.py` | Tenant namespace scoping on Qdrant collection name |
| `konjoai/store/qdrant.py` | Accept tenant-scoped collection name parameter |
| `tests/unit/test_auth.py` | ≥ 20 tests covering JWT decode, tenant extraction, K3 disabled fallthrough |

### Sprint 17 Gate (all required before SHIP)
1. Tenant isolation: each tenant only reads/writes to their Qdrant namespace. ✅
2. JWT validation enabled only when `multi_tenancy_enabled=True` (K3). ✅
3. No breaking changes to existing unauthenticated routes (K6). ✅
4. New deps optional or guarded (K5). ✅
5. Full suite stays at ≥ 485 tests passing. ✅

### Critical Patch Target Rule (NEVER FORGET)
Lazy imports inside closures must be patched at the **source module**, not at the route module.
- ✅ `konjoai.retrieve.hybrid.hybrid_search` → patch at source
- ❌ `konjoai.api.routes.query.hybrid_search` → DO NOT patch here

Route-level `Depends`-injected callables patch at the **route module**:
- ✅ `konjoai.api.routes.query.get_settings` → patch here in ALL route tests
- ✅ `konjoai.cache.get_semantic_cache` → always mock alongside `get_settings` in route tests

## Quick Commands

```bash
cd /Users/wesleyscholl/kyro

# Run full unit suite
python3 -m pytest tests/unit/ -q --tb=short

# Run focused test file (update per sprint)
python3 -m pytest tests/unit/test_telemetry.py -v

# Verify Sprint 16 OTel/Prometheus still passes
python3 -m pytest tests/unit/test_telemetry.py -v

# Verify Sprint 15 GraphRAG still passes
python3 -m pytest tests/unit/test_graph_rag.py -v

# CRITIC syntax check (ruff is permanently absent — skip it always)
python3 -m py_compile konjoai/telemetry.py

# Check recent git log
git log --oneline -5
```
