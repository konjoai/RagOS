"""konjoai.auth — JWT authentication and multi-tenant isolation (Sprint 17).

Public surface:
    TenantClaims     — decoded JWT payload
    decode_token     — decode + verify a Bearer token
    get_tenant_id    — FastAPI dependency: returns tenant_id or None
    get_current_tenant_id / set_current_tenant_id — context-var accessors
    ANONYMOUS_TENANT — sentinel string for unauthenticated requests
"""
from konjoai.auth.jwt_auth import TenantClaims, decode_token, _HAS_JWT
from konjoai.auth.tenant import (
    ANONYMOUS_TENANT,
    get_current_tenant_id,
    set_current_tenant_id,
)

__all__ = [
    "TenantClaims",
    "decode_token",
    "_HAS_JWT",
    "ANONYMOUS_TENANT",
    "get_current_tenant_id",
    "set_current_tenant_id",
]
