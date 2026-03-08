"""
YouTube collector using yt-dlp.

Searches YouTube for videos mentioning the target entity, extracts metadata,
auto-captions, and optionally downloads audio for transcription.
"""

from __future__ import annotations

import asyncio
import json
import logging
import subprocess
import tempfile
from pathlib import Path
from typing import Any, AsyncIterator, Dict, List, Optional

from core.base import BaseCollector
from core.schemas import RawItem

logger = logging.getLogger(__name__)


class YoutubeCollector(BaseCollector):
    """Collects YouTube videos via yt-dlp (no API key required)."""

    def configure(self, config: Dict[str, Any], entity: Optional[str] = None, event: Optional[str] = None):
        super().configure(config, entity, event)
        self._queries: List[str] = config.get("search_queries", [])
        if not self._queries and entity:
            self._queries = [entity]
        self._max_results: int = config.get("max_results", 5)
        self._extract_audio: bool = config.get("extract_audio", False)
        self._extract_captions: bool = config.get("extract_captions", True)
        self._poll_interval: int = config.get("poll_interval_sec", 300)
        self._once: bool = config.get("once", False)

    async def stream(self) -> AsyncIterator[RawItem]:
        while True:
            for query in self._queries:
                videos = await asyncio.to_thread(self._search_yt_dlp, query)
                for video in videos:
                    yield self._to_raw_item(video)
            if self._once:
                return
            await asyncio.sleep(self._poll_interval)

    def _search_yt_dlp(self, query: str) -> List[Dict[str, Any]]:
        search_spec = f"ytsearch{self._max_results}:{query}"
        cmd = [
            "yt-dlp",
            "--dump-json",
            "--no-playlist",
            "--flat-playlist",
            "--no-warnings",
            search_spec,
        ]
        try:
            result = subprocess.run(cmd, capture_output=True, text=True, timeout=60)
            videos = []
            for line in result.stdout.strip().splitlines():
                line = line.strip()
                if not line:
                    continue
                try:
                    info = json.loads(line)
                    if self._extract_captions and info.get("id"):
                        captions = self._fetch_captions(info["id"])
                        info["_captions_text"] = captions
                    videos.append(info)
                except json.JSONDecodeError:
                    continue
            logger.info("[youtube] Found %d videos for query: %s", len(videos), query)
            return videos
        except FileNotFoundError:
            logger.warning("[youtube] yt-dlp not found; returning mock data")
            return self._mock_videos(query)
        except subprocess.TimeoutExpired:
            logger.warning("[youtube] yt-dlp timed out for query: %s", query)
            return []
        except Exception as exc:
            logger.error("[youtube] Unexpected error: %s", exc)
            return []

    def _fetch_captions(self, video_id: str) -> str:
        """Try youtube_transcript_api first, then yt-dlp subtitle download."""
        try:
            from youtube_transcript_api import YouTubeTranscriptApi  # type: ignore
            api = YouTubeTranscriptApi()
            transcript_list = api.list(video_id)
            try:
                transcript = transcript_list.find_transcript(["en", "en-US", "hi"])
            except Exception:
                transcript = transcript_list.find_generated_transcript(["en", "en-US", "hi"])
            snippets = transcript.fetch()
            return " ".join(s.text for s in snippets)
        except Exception:
            pass

        # Fallback: yt-dlp subtitle download
        try:
            with tempfile.TemporaryDirectory() as tmpdir:
                cmd = [
                    "yt-dlp",
                    "--write-auto-sub",
                    "--sub-lang", "en",
                    "--skip-download",
                    "--no-warnings",
                    "-o", str(Path(tmpdir) / "%(id)s.%(ext)s"),
                    f"https://www.youtube.com/watch?v={video_id}",
                ]
                subprocess.run(cmd, capture_output=True, timeout=30)
                srt_files = list(Path(tmpdir).glob("*.vtt")) + list(Path(tmpdir).glob("*.srt"))
                if srt_files:
                    return srt_files[0].read_text(errors="replace")[:5000]
        except Exception:
            pass
        return ""

    def _mock_videos(self, query: str) -> List[Dict[str, Any]]:
        return [
            {
                "id": f"mock_{i}",
                "title": f"[MOCK] {query} — Video {i}",
                "channel": "MockChannel",
                "uploader": "MockUser",
                "upload_date": "20250101",
                "view_count": 1000 * i,
                "like_count": 100 * i,
                "comment_count": 10 * i,
                "description": f"Mock description for {query}",
                "duration": 300,
                "webpage_url": f"https://youtube.com/watch?v=mock_{i}",
                "_captions_text": f"Mock caption text about {query}.",
                "_is_mock": True,
            }
            for i in range(1, 4)
        ]

    def _to_raw_item(self, info: Dict[str, Any]) -> RawItem:
        return RawItem(
            source_collector="youtube",
            platform="youtube",
            entity=self.entity,
            event=self.event,
            raw_payload={
                "video_id": info.get("id"),
                "title": info.get("title", ""),
                "channel": info.get("channel") or info.get("uploader", ""),
                "upload_date": info.get("upload_date"),
                "view_count": info.get("view_count", 0),
                "like_count": info.get("like_count", 0),
                "comment_count": info.get("comment_count", 0),
                "description": (info.get("description") or "")[:1000],
                "duration": info.get("duration", 0),
                "webpage_url": info.get("webpage_url", ""),
                "captions_text": info.get("_captions_text", ""),
                "is_mock": info.get("_is_mock", False),
            },
            metadata={
                "entity": self.entity,
                "event": self.event,
            },
        )
