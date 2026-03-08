"""
Normalizer transformer.

Converts RawItem → NormalizedItem with per-platform dispatch.
Sets content_type, topic, engagement, and copies entity/event context.
"""

from __future__ import annotations

import logging
import re
from datetime import datetime
from typing import Any, Dict, Optional

from core.base import BaseTransformer
from core.schemas import Engagement, NormalizedItem, RawItem

logger = logging.getLogger(__name__)


def _slugify(text: str) -> str:
    """Convert a string to a safe identifier: 'Rahul Gandhi' -> 'RahulGandhi'."""
    return re.sub(r"[^A-Za-z0-9]", "", text.title().replace(" ", ""))


def _parse_date(raw: Optional[str]) -> Optional[datetime]:
    if not raw:
        return None
    for fmt in ("%Y%m%d", "%Y-%m-%dT%H:%M:%S", "%Y-%m-%d", "%a, %d %b %Y %H:%M:%S %z"):
        try:
            return datetime.strptime(raw[:25], fmt)
        except (ValueError, TypeError):
            continue
    return None


class NormalizerTransformer(BaseTransformer):
    """Dispatches normalization by platform."""

    async def transform(self, item: RawItem) -> Optional[NormalizedItem]:
        platform = item.platform.lower()
        try:
            if platform == "youtube":
                return self._normalize_youtube(item)
            elif platform in ("news_rss", "india_news"):
                return self._normalize_news_rss(item)
            elif platform == "twitter":
                return self._normalize_twitter(item)
            elif platform == "instagram":
                return self._normalize_instagram(item)
            else:
                return self._normalize_generic(item)
        except Exception as exc:
            logger.error("[normalizer] Failed for %s item %s: %s", platform, item.id, exc)
            return None

    def _build_topic(self, entity: Optional[str], platform: str) -> Optional[str]:
        if not entity:
            return None
        slug = _slugify(entity)
        plat = platform.replace("_rss", "").replace("news", "News").title()
        return f"{slug}_{plat}"

    def _normalize_youtube(self, item: RawItem) -> NormalizedItem:
        p = item.raw_payload
        text_parts = []
        if p.get("captions_text"):
            text_parts.append(p["captions_text"])
        elif p.get("description"):
            text_parts.append(p["description"])
        text = " ".join(text_parts).strip() or p.get("title", "")

        return NormalizedItem(
            raw_id=item.id,
            source_collector=item.source_collector,
            platform="youtube",
            platform_item_id=p.get("video_id"),
            entity=item.entity,
            event=item.event,
            topic=self._build_topic(item.entity, "YouTube"),
            content_type="video",
            text=text,
            author=p.get("channel", ""),
            engagement=Engagement(
                views=p.get("view_count", 0),
                likes=p.get("like_count", 0),
                comments=p.get("comment_count", 0),
            ),
            original_timestamp=_parse_date(p.get("upload_date")),
            media_urls=[p.get("webpage_url", "")],
            metadata={
                "title": p.get("title"),
                "duration": p.get("duration"),
                "video_url": p.get("webpage_url"),
                "is_mock": p.get("is_mock", False),
            },
        )

    def _normalize_news_rss(self, item: RawItem) -> NormalizedItem:
        p = item.raw_payload
        text = f"{p.get('title', '')} {p.get('summary', '')}".strip()
        return NormalizedItem(
            raw_id=item.id,
            source_collector=item.source_collector,
            platform="news_rss",
            platform_item_id=p.get("dedup_hash"),
            entity=item.entity,
            event=item.event,
            topic=self._build_topic(item.entity, "News"),
            content_type="text",
            text=text,
            author=p.get("source", ""),
            original_timestamp=_parse_date(p.get("published_dt") or p.get("published")),
            media_urls=[p.get("link", "")],
            metadata={
                "title": p.get("title"),
                "source": p.get("source"),
                "link": p.get("link"),
                "tags": p.get("tags", []),
            },
        )

    def _normalize_twitter(self, item: RawItem) -> NormalizedItem:
        p = item.raw_payload
        return NormalizedItem(
            raw_id=item.id,
            source_collector=item.source_collector,
            platform="twitter",
            platform_item_id=p.get("tweet_id"),
            entity=item.entity,
            event=item.event,
            topic=self._build_topic(item.entity, "Twitter"),
            content_type="text",
            text=p.get("text", ""),
            author=p.get("author_username", ""),
            author_verified=p.get("author_verified", False),
            engagement=Engagement(
                likes=p.get("like_count", 0),
                shares=p.get("retweet_count", 0),
                replies=p.get("reply_count", 0),
            ),
            original_timestamp=_parse_date(p.get("created_at")),
            media_urls=[p.get("url", "")],
            metadata={
                "author_name": p.get("author_name"),
                "query": p.get("query"),
            },
        )

    def _normalize_instagram(self, item: RawItem) -> NormalizedItem:
        p = item.raw_payload
        media_type = p.get("media_type", "image")
        content_type = "video" if media_type == "video" else "image"
        return NormalizedItem(
            raw_id=item.id,
            source_collector=item.source_collector,
            platform="instagram",
            platform_item_id=p.get("post_id"),
            entity=item.entity,
            event=item.event,
            topic=self._build_topic(item.entity, "Instagram"),
            content_type=content_type,
            text=p.get("caption", ""),
            author=p.get("author_username", ""),
            engagement=Engagement(
                likes=p.get("like_count", 0),
                comments=p.get("comment_count", 0),
            ),
            original_timestamp=_parse_date(p.get("created_at")),
            media_urls=[u for u in [p.get("url"), p.get("media_url")] if u],
            metadata={
                "author_name": p.get("author_name"),
                "media_type": media_type,
            },
        )

    def _normalize_generic(self, item: RawItem) -> NormalizedItem:
        p = item.raw_payload
        text = p.get("text") or p.get("content") or p.get("body") or p.get("title") or ""
        return NormalizedItem(
            raw_id=item.id,
            source_collector=item.source_collector,
            platform=item.platform,
            entity=item.entity,
            event=item.event,
            topic=self._build_topic(item.entity, item.platform),
            content_type="text",
            text=str(text),
            metadata=item.metadata,
        )
