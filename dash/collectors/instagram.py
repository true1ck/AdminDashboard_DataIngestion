"""
Instagram collector using instaloader for public profile scraping.

Falls back to mock data if instaloader is not installed or access is denied.
"""

from __future__ import annotations

import asyncio
import logging
from datetime import datetime
from typing import Any, AsyncIterator, Dict, List, Optional

from core.base import BaseCollector
from core.schemas import RawItem

logger = logging.getLogger(__name__)


class InstagramCollector(BaseCollector):
    """Scrapes Instagram public posts mentioning the target entity."""

    def configure(self, config: Dict[str, Any], entity: Optional[str] = None, event: Optional[str] = None):
        super().configure(config, entity, event)
        self._profiles: List[str] = config.get("track_accounts", [])
        self._hashtags: List[str] = config.get("track_keywords", [])
        if not self._profiles and not self._hashtags and entity:
            # Convert "Rahul Gandhi" -> "rahulgandhi" as a hashtag guess
            self._hashtags = [entity.lower().replace(" ", "")]
        self._max_posts: int = config.get("max_results", 10)
        self._poll_interval: int = config.get("poll_interval_sec", 600)
        self._once: bool = config.get("once", False)

    async def stream(self) -> AsyncIterator[RawItem]:
        while True:
            for profile in self._profiles:
                items = await asyncio.to_thread(self._fetch_profile, profile)
                for item in items:
                    yield item
            for hashtag in self._hashtags:
                items = await asyncio.to_thread(self._fetch_hashtag, hashtag)
                for item in items:
                    yield item
            if self._once:
                return
            await asyncio.sleep(self._poll_interval)

    def _fetch_profile(self, username: str) -> List[RawItem]:
        try:
            import instaloader  # type: ignore
            L = instaloader.Instaloader(quiet=True, download_pictures=False,
                                         download_videos=False, download_video_thumbnails=False,
                                         compress_json=False)
            profile = instaloader.Profile.from_username(L.context, username)
            results = []
            for i, post in enumerate(profile.get_posts()):
                if i >= self._max_posts:
                    break
                results.append(self._make_raw_item(
                    post_id=str(post.mediaid),
                    caption=post.caption or "",
                    author=username,
                    author_name=profile.full_name,
                    likes=post.likes,
                    comments=post.comments,
                    timestamp=post.date_utc.isoformat(),
                    media_type="video" if post.is_video else "image",
                    url=f"https://www.instagram.com/p/{post.shortcode}/",
                    media_url=post.url,
                ))
            logger.info("[instagram] %d posts from profile: %s", len(results), username)
            return results
        except ImportError:
            logger.warning("[instagram] instaloader not installed")
            return self._mock_posts(username)
        except Exception as exc:
            logger.warning("[instagram] Error fetching profile %s: %s", username, exc)
            return self._mock_posts(username)

    def _fetch_hashtag(self, hashtag: str) -> List[RawItem]:
        try:
            import instaloader  # type: ignore
            L = instaloader.Instaloader(quiet=True, download_pictures=False,
                                         download_videos=False, compress_json=False)
            results = []
            for i, post in enumerate(instaloader.Hashtag.from_name(L.context, hashtag).get_posts()):
                if i >= self._max_posts:
                    break
                results.append(self._make_raw_item(
                    post_id=str(post.mediaid),
                    caption=post.caption or "",
                    author=post.owner_username,
                    author_name=post.owner_username,
                    likes=post.likes,
                    comments=post.comments,
                    timestamp=post.date_utc.isoformat(),
                    media_type="video" if post.is_video else "image",
                    url=f"https://www.instagram.com/p/{post.shortcode}/",
                    media_url=post.url,
                ))
            logger.info("[instagram] %d posts from hashtag: #%s", len(results), hashtag)
            return results
        except ImportError:
            return self._mock_posts(f"#{hashtag}")
        except Exception as exc:
            logger.warning("[instagram] Error fetching hashtag #%s: %s", hashtag, exc)
            return []

    def _make_raw_item(self, *, post_id: str, caption: str, author: str,
                       author_name: str, likes: int, comments: int,
                       timestamp: str, media_type: str, url: str, media_url: str) -> RawItem:
        return RawItem(
            source_collector="instagram",
            platform="instagram",
            entity=self.entity,
            event=self.event,
            raw_payload={
                "post_id": post_id,
                "caption": caption[:2000],
                "author_username": author,
                "author_name": author_name,
                "like_count": likes,
                "comment_count": comments,
                "created_at": timestamp,
                "media_type": media_type,
                "url": url,
                "media_url": media_url,
            },
            metadata={"entity": self.entity, "event": self.event},
        )

    def _mock_posts(self, source: str) -> List[RawItem]:
        return [
            self._make_raw_item(
                post_id=f"mock_{i}",
                caption=f"[MOCK] Instagram post {i} about {self.entity or source}.",
                author=f"user{i}",
                author_name=f"User {i}",
                likes=i * 200,
                comments=i * 20,
                timestamp=datetime.utcnow().isoformat(),
                media_type="image",
                url=f"https://www.instagram.com/p/mock{i}/",
                media_url="",
            )
            for i in range(1, 4)
        ]
