"""
Twitter/X collector.

Tries snscrape for scraping without API keys, falls back to Twitter API v2
if TWITTER_BEARER_TOKEN env var is set. Returns mock data if neither works.
"""

from __future__ import annotations

import asyncio
import logging
import os
from datetime import datetime
from typing import Any, AsyncIterator, Dict, List, Optional

from core.base import BaseCollector
from core.schemas import RawItem

logger = logging.getLogger(__name__)


class TwitterCollector(BaseCollector):
    """Collects tweets mentioning the target entity."""

    def configure(self, config: Dict[str, Any], entity: Optional[str] = None, event: Optional[str] = None):
        super().configure(config, entity, event)
        self._queries: List[str] = config.get("search_queries", [])
        if not self._queries and entity:
            self._queries = [entity]
        self._max_results: int = config.get("max_results", 20)
        self._poll_interval: int = config.get("poll_interval_sec", 180)
        self._once: bool = config.get("once", False)
        self._bearer_token: Optional[str] = os.environ.get("TWITTER_BEARER_TOKEN")

    async def stream(self) -> AsyncIterator[RawItem]:
        while True:
            for query in self._queries:
                tweets = await asyncio.to_thread(self._fetch_tweets, query)
                for tweet in tweets:
                    yield tweet
            if self._once:
                return
            await asyncio.sleep(self._poll_interval)

    def _fetch_tweets(self, query: str) -> List[RawItem]:
        # Try API v2 first
        if self._bearer_token:
            results = self._fetch_via_api(query)
            if results:
                return results

        # Fallback: snscrape
        results = self._fetch_via_snscrape(query)
        if results:
            return results

        # Last resort: mock
        logger.warning("[twitter] No access method available; returning mock tweets for: %s", query)
        return self._mock_tweets(query)

    def _fetch_via_api(self, query: str) -> List[RawItem]:
        try:
            import requests  # type: ignore
            headers = {"Authorization": f"Bearer {self._bearer_token}"}
            params = {
                "query": f"{query} lang:en -is:retweet",
                "max_results": min(self._max_results, 100),
                "tweet.fields": "created_at,author_id,public_metrics,lang",
                "expansions": "author_id",
                "user.fields": "name,username,verified",
            }
            resp = requests.get(
                "https://api.twitter.com/2/tweets/search/recent",
                headers=headers, params=params, timeout=15,
            )
            resp.raise_for_status()
            data = resp.json()
            tweets = data.get("data", [])
            users = {u["id"]: u for u in data.get("includes", {}).get("users", [])}
            results = []
            for tw in tweets:
                author = users.get(tw.get("author_id", ""), {})
                metrics = tw.get("public_metrics", {})
                results.append(self._make_raw_item(
                    tweet_id=tw["id"],
                    text=tw.get("text", ""),
                    author=author.get("username", ""),
                    author_name=author.get("name", ""),
                    author_verified=author.get("verified", False),
                    created_at=tw.get("created_at"),
                    likes=metrics.get("like_count", 0),
                    retweets=metrics.get("retweet_count", 0),
                    replies=metrics.get("reply_count", 0),
                    query=query,
                ))
            logger.info("[twitter] API returned %d tweets for: %s", len(results), query)
            return results
        except Exception as exc:
            logger.warning("[twitter] API error: %s", exc)
            return []

    def _fetch_via_snscrape(self, query: str) -> List[RawItem]:
        try:
            import snscrape.modules.twitter as sntwitter  # type: ignore
            results = []
            for i, tw in enumerate(sntwitter.TwitterSearchScraper(query).get_items()):
                if i >= self._max_results:
                    break
                results.append(self._make_raw_item(
                    tweet_id=str(tw.id),
                    text=tw.content,
                    author=tw.user.username,
                    author_name=tw.user.displayname,
                    author_verified=tw.user.verified or False,
                    created_at=tw.date.isoformat() if tw.date else None,
                    likes=tw.likeCount or 0,
                    retweets=tw.retweetCount or 0,
                    replies=tw.replyCount or 0,
                    query=query,
                ))
            logger.info("[twitter] snscrape returned %d tweets for: %s", len(results), query)
            return results
        except ImportError:
            logger.info("[twitter] snscrape not installed")
            return []
        except Exception as exc:
            logger.warning("[twitter] snscrape error: %s", exc)
            return []

    def _make_raw_item(
        self, *, tweet_id: str, text: str, author: str, author_name: str,
        author_verified: bool, created_at: Optional[str],
        likes: int, retweets: int, replies: int, query: str,
    ) -> RawItem:
        return RawItem(
            source_collector="twitter",
            platform="twitter",
            entity=self.entity,
            event=self.event,
            raw_payload={
                "tweet_id": tweet_id,
                "text": text,
                "author_username": author,
                "author_name": author_name,
                "author_verified": author_verified,
                "created_at": created_at,
                "like_count": likes,
                "retweet_count": retweets,
                "reply_count": replies,
                "query": query,
                "url": f"https://twitter.com/{author}/status/{tweet_id}",
            },
            metadata={"entity": self.entity, "event": self.event},
        )

    def _mock_tweets(self, query: str) -> List[RawItem]:
        return [
            self._make_raw_item(
                tweet_id=f"mock_{i}",
                text=f"[MOCK] Tweet {i} about {query}. This is a test tweet.",
                author=f"user{i}",
                author_name=f"User {i}",
                author_verified=i == 1,
                created_at=datetime.utcnow().isoformat(),
                likes=i * 50,
                retweets=i * 10,
                replies=i * 5,
                query=query,
            )
            for i in range(1, 4)
        ]
