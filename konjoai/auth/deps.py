"""FastAPI dependency for tenant resolution (Sprint 17).

get_tenant_id is injected via Depends() into any route that needs tenant
isolation. It performs three responsibilities:
  1. K3 pass-through: returns None immediately when multi_tenancy_enabled=False.
  2. JWT decode: extracts TenantClaims from the Bearer token.
  3. Context propagation: calls set_current_tenant_id() so that QdrantStore
     operations in the same async task (and threads spawned by asyncio.to_thread)
     automatically pick up the tenant scope without parameter threading.

The context var is reset after the response is returned by yielding in a
generator-style dependency so FastAPI handles cleanup correctly.
"""
from __future__ import annotations

import logging
from collections.abc import AsyncGenerator

from fastapi import Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from konjoai.auth.jwt_auth import decode_token
from konjoai.config import get_settings

logger = logging.getLogger(__name__)

_bearer = HTTPBearer(auto_error=False)


async def get_tenant_id(
    credentials: HTTPAuthorizationCredentials | None = Depends(_bearer),
) -> AsyncGenerator[str | None, None]:
    """Resolve tenant_id from Bearer JWT and set the request-scoped context var.

    Yields:
        tenant_id string or None when multi-tenancy is disabled.

    Raises:
        HTTPException 401: Missing token, invalid/expired JWT.
        HTTPException 503: jwt_secret_key not configured.
    """
    from konjoai.auth.tenant import _current_tenant_id, set_current_tenant_id

    settings = get_settings()

    if not settings.multi_tenancy_enabled:
        yield None
        return

    if credentials is None:
        raise HTTPException(
            status_code=401,
            detail="Bearer token required (multi_tenancy_enabled=true)",
        )

    if not settings.jwt_secret_key:
        logger.error("multi_tenancy_enabled=True but jwt_secret_key is not configured")
        raise HTTPException(
            status_code=503,
            detail="JWT authentication is not configured (jwt_secret_key missing)",
        )

    try:
        claims = decode_token(
            credentials.credentials,
            settings.jwt_secret_key,
            settings.jwt_algorithm,
            settings.tenant_id_claim,
        )
    except (ValueError, RuntimeError) as exc:
        raise HTTPException(status_code=401, detail=str(exc)) from exc

    ctx_token = set_current_tenant_id(claims.tenant_id)
    logger.debug("tenant_id=%s authenticated", claims.tenant_id)

    try:
        yield claims.tenant_id
    finally:
        _current_tenant_id.reset(ctx_token)
