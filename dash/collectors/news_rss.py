"""
News RSS collector.

Polls configurable RSS feeds and filters entries that mention the target entity.
Supports major Indian news sources (TOI, NDTV, Hindu, IE) and Google News RSS.
"""

from __future__ import annotations

import asyncio
import hashlib
import logging
from datetime import datetime
from typing import Any, AsyncIterator, Dict, List, Optional

from core.base import BaseCollector
from core.schemas import RawItem

logger = logging.getLogger(__name__)

DEFAULT_RSS_FEEDS = [
    "https://timesofindia.indiatimes.com/rssfeeds/1221656.cms",
    "https://feeds.feedburner.com/ndtvnews-india-news",
    "https://www.thehindu.com/news/national/feeder/default.rss",
    "https://indianexpress.com/feed/",
]


class NewsRssCollector(BaseCollector):
    """Polls RSS feeds and filters entries by entity/keyword mentions."""

    def configure(self, config: Dict[str, Any], entity: Optional[str] = None, event: Optional[str] = None):
        super().configure(config, entity, event)
        self._rss_urls: List[str] = config.get("rss_urls", DEFAULT_RSS_FEEDS)
        self._keywords: List[str] = config.get("track_keywords", [])
        if entity:
            self._keywords.append(entity)
        if event:
            self._keywords.append(event)
        # Also support Google News RSS search
        if entity and config.get("use_google_news", True):
            gn_url = f"https://news.google.com/rss/search?q={entity.replace(' ', '+')}&hl=en-IN&gl=IN&ceid=IN:en"
            self._rss_urls.append(gn_url)
        self._poll_interval: int = config.get("poll_interval_sec", 120)
        self._max_items: int = config.get("max_results", 20)
        self._once: bool = config.get("once", False)
        self._seen: set = set()

    async def stream(self) -> AsyncIterator[RawItem]:
        while True:
            for url in self._rss_urls:
                items = await asyncio.to_thread(self._fetch_feed, url)
                for item in items:
                    yield item
            if self._once:
                return
            await asyncio.sleep(self._poll_interval)

    def _fetch_feed(self, url: str) -> List[RawItem]:
        try:
            import feedparser  # type: ignore
        except ImportError:
            logger.warning("[news_rss] feedparser not installed; skipping feed: %s", url)
            return []

        try:
            feed = feedparser.parse(url)
            results = []
            for entry in feed.entries[: self._max_items]:
                title = entry.get("title", "")
                summary = entry.get("summary", "") or entry.get("description", "")
                combined = f"{title} {summary}".lower()

                # Filter: must mention at least one tracked keyword
                if self._keywords:
                    if not any(kw.lower() in combined for kw in self._keywords):
                        continue

                link = entry.get("link", "")
                item_hash = hashlib.sha256(link.encode()).hexdigest()[:16]
                if item_hash in self._seen:
                    continue
                self._seen.add(item_hash)

                published_raw = entry.get("published", "") or entry.get("updated", "")
                published_dt = None
                if entry.get("published_parsed"):
                    import time as _time
                    published_dt = datetime.fromtimestamp(_time.mktime(entry.published_parsed))

                results.append(RawItem(
                    source_collector="news_rss",
                    platform="news_rss",
                    entity=self.entity,
                    event=self.event,
                    raw_payload={
                        "title": title,
                        "summary": summary[:2000],
                        "link": link,
                        "published": published_raw,
                        "published_dt": published_dt.isoformat() if published_dt else None,
                        "source": feed.feed.get("title", url),
                        "tags": [t.term for t in entry.get("tags", [])],
                        "dedup_hash": item_hash,
                    },
                    metadata={"entity": self.entity, "event": self.event},
                ))
            logger.info("[news_rss] %d items from %s", len(results), url[:60])
            return results
        except Exception as exc:
            logger.error("[news_rss] Error fetching %s: %s", url[:60], exc)
            return []
