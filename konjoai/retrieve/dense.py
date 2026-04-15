from __future__ import annotations

import numpy as np

from konjoai.store.qdrant import SearchResult, get_store
from konjoai.embed.encoder import get_encoder


def dense_search(query: str, top_k: int | None = None) -> list[SearchResult]:
    """Embed *query* and return the top-*k* closest chunks from Qdrant."""
    from konjoai.config import get_settings

    k = top_k if top_k is not None else get_settings().top_k_dense
    encoder = get_encoder()
    store = get_store()
    q_vec = encoder.encode_query(query)
    assert q_vec.dtype == np.float32
    return store.search(q_vec, top_k=k)
