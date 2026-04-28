# KYRO — Next Session Prompt

Read this first before any implementation sprint.

## Current State (as of Sprint 17 session, 2026-04-28)

- **Last commit:** pending push — Sprint 17: Multi-tenancy + JWT
- **Tests:** 509 passing, 15 skipped (PyJWT/prometheus-client absent), 5 pre-existing Python 3.9 compat failures
- **Version:** v0.9.0 (Sprint 17 Multi-tenancy + JWT complete)
- **Active sprint:** Sprint 18 — Auth + rate limiting

## What Was Done Last Session (Sprint 17 — Multi-tenancy + JWT)

- Created `konjoai/auth/` package: `tenant.py` (`_current_tenant_id` ContextVar, `get/set_current_tenant_id`, `ANONYMOUS_TENANT`), `jwt_auth.py` (`TenantClaims`, `decode_token`, `_HAS_JWT`), `deps.py` (`get_tenant_id` async generator dep)
- Added 4 settings to `konjoai/config.py`: `multi_tenancy_enabled=False`, `jwt_secret_key=""`, `jwt_algorithm="HS256"`, `tenant_id_claim="sub"`
- Modified `konjoai/store/qdrant.py`: `upsert()` stamps `tenant_id` in payload; `search()` adds `Filter(must=[FieldCondition(...)])` — both read from ContextVar, backward-compatible when unset
- Injected `tenant_id: str | None = Depends(get_tenant_id)` into `ingest` and both `query`/`query_stream` routes
- Documented `# PyJWT>=2.8` in `requirements.txt`
- Created `tests/unit/test_auth.py` (24 passed + 9 skipped without PyJWT)
- Tests: 485 → 509 (+24 new). ruff permanently absent — `python3 -m py_compile` only.

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

## Recommended Next Task — Sprint 18: Auth + Rate Limiting

### Goal
Add per-endpoint rate limiting as a complement to Sprint 17 JWT auth. Rate limits prevent abuse and provide per-tenant throttling using a sliding window algorithm. Feature-flagged off by default (K3). No new hard deps — pure stdlib (K5).

### Files to Create/Modify

| File | Change |
|------|--------|
| `konjoai/auth/ratelimit.py` | `SlidingWindowRateLimiter` (per-key deque), `check_rate_limit()` dep |
| `konjoai/config.py` | `rate_limit_enabled=False`, `rate_limit_rpm=60`, `rate_limit_burst=10` |
| `konjoai/auth/deps.py` | Add `require_rate_limit` dep; raises 429 + `Retry-After` header on breach |
| `konjoai/api/routes/query.py` | Inject rate-limit dep |
| `konjoai/api/routes/ingest.py` | Inject rate-limit dep |
| `tests/unit/test_ratelimit.py` | ≥ 20 tests: sliding window, burst, per-tenant isolation, K3 disabled pass-through, 429 contract |

### Sprint 18 Gate (all required before SHIP)
1. Rate limits isolated per tenant_id (or global `__anonymous__` when multi_tenancy disabled).
2. 429 returned on breach with `Retry-After` header (K2 observability).
3. K3: `rate_limit_enabled=False` → no-op, zero overhead.
4. No new hard deps (K5: `collections.deque` + `time`).
5. Full suite stays at ≥ 509 tests passing.

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
