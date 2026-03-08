"""
Deduplicator transformer.

Uses SHA-256 hash of (platform, platform_item_id) to drop duplicate items
within a sliding time window. Falls back to hashing the text content
when no item ID is available.
"""

from __future__ import annotations

import hashlib
import logging
import time
from collections import OrderedDict
from typing import Any, Dict, Optional

from core.base import BaseTransformer
from core.schemas import NormalizedItem

logger = logging.getLogger(__name__)


class DeduplicatorTransformer(BaseTransformer):
    """Drops items whose content hash has been seen within the TTL window."""

    def configure(self, config: Dict[str, Any]):
        super().configure(config)
        # How long (seconds) to remember a seen hash
        self._ttl: int = config.get("ttl_sec", 3600 * 24)
        # Max number of hashes to keep in memory
        self._max_size: int = config.get("max_size", 100_000)
        # {hash: timestamp}
        self._seen: OrderedDict[str, float] = OrderedDict()

    async def transform(self, item: NormalizedItem) -> Optional[NormalizedItem]:
        h = self._compute_hash(item)
        now = time.time()
        self._evict_expired(now)

        if h in self._seen:
            logger.debug("[dedup] Dropping duplicate: platform=%s id=%s", item.platform, item.platform_item_id)
            return None  # drop

        self._seen[h] = now
        if len(self._seen) > self._max_size:
            self._seen.popitem(last=False)

        # Attach the hash to the item for downstream traceability
        item.dedup_hash = h
        return item

    def _compute_hash(self, item: NormalizedItem) -> str:
        if item.platform_item_id:
            key = f"{item.platform}:{item.platform_item_id}"
        else:
            content = (item.text or "")[:500]
            key = f"{item.platform}:{content}"
        return hashlib.sha256(key.encode()).hexdigest()

    def _evict_expired(self, now: float):
        cutoff = now - self._ttl
        to_delete = [h for h, ts in self._seen.items() if ts < cutoff]
        for h in to_delete:
            del self._seen[h]
