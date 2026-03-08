"""
Speech-to-Text (STT) transcription processor.

Primary:   Whisper microservice at AdminDashboard_DataIngestion/MediaToTextWhisper (:8000)
Fallback:  faster-whisper local model (large-v3 or tiny)
"""

from __future__ import annotations

import asyncio
import logging
import os
import tempfile
from pathlib import Path
from typing import Any, Dict, Optional

from core.base import BaseProcessor
from core.schemas import NormalizedItem

logger = logging.getLogger(__name__)

WHISPER_SERVICE_URL = "http://localhost:8000"


class TranscriberProcessor(BaseProcessor):
    """Transcribes audio/video content to text."""

    def configure(self, config: Dict[str, Any]):
        super().configure(config)
        self._service_url: str = config.get("whisper_service_url", WHISPER_SERVICE_URL)
        self._model_size: str = config.get("model_size", "tiny")  # tiny for speed, large-v3 for quality
        self._device: str = config.get("device", "cpu")
        self._local_model = None
        self._service_available: Optional[bool] = None  # checked lazily

    async def process(self, item: NormalizedItem) -> Dict[str, Any]:
        # Only process audio/video
        if item.content_type not in ("audio", "video"):
            return {}

        # If item already has text (e.g. captions), skip
        if item.text and len(item.text.strip()) > 50:
            return {}

        audio_path = item.audio_path or item.video_path
        if not audio_path or not Path(audio_path).exists():
            # Try downloading audio from media URL
            audio_path = await self._try_download_audio(item)

        if not audio_path:
            return {}

        # Try microservice first
        transcript = await self._transcribe_via_service(audio_path)
        if transcript:
            return {"text": transcript, "processing_meta": {"transcription_source": "whisper_service"}}

        # Local fallback
        transcript = await asyncio.to_thread(self._transcribe_local, audio_path)
        if transcript:
            return {"text": transcript, "processing_meta": {"transcription_source": "whisper_local"}}

        return {}

    async def _transcribe_via_service(self, audio_path: str) -> Optional[str]:
        try:
            import httpx  # type: ignore
            async with httpx.AsyncClient(timeout=120) as client:
                # Check health once
                if self._service_available is None:
                    try:
                        h = await client.get(f"{self._service_url}/health", timeout=3)
                        self._service_available = h.status_code == 200
                    except Exception:
                        self._service_available = False

                if not self._service_available:
                    return None

                with open(audio_path, "rb") as f:
                    resp = await client.post(
                        f"{self._service_url}/api/transcribe",
                        files={"file": (Path(audio_path).name, f)},
                        timeout=120,
                    )
                    resp.raise_for_status()
                    data = resp.json()
                    segments = data.get("segments", [])
                    if segments:
                        return " ".join(s.get("text", "") for s in segments)
                    return data.get("text") or data.get("transcript")
        except Exception as exc:
            logger.debug("[transcriber] Service error: %s", exc)
            self._service_available = False
            return None

    def _transcribe_local(self, audio_path: str) -> Optional[str]:
        try:
            from faster_whisper import WhisperModel  # type: ignore
            if self._local_model is None:
                logger.info("[transcriber] Loading local Whisper %s", self._model_size)
                self._local_model = WhisperModel(self._model_size, device=self._device, compute_type="int8")
            segments, _ = self._local_model.transcribe(audio_path)
            return " ".join(s.text for s in segments)
        except ImportError:
            logger.warning("[transcriber] faster-whisper not installed")
        except Exception as exc:
            logger.error("[transcriber] Local transcription error: %s", exc)
        return None

    async def _try_download_audio(self, item: NormalizedItem) -> Optional[str]:
        """Try to download audio from YouTube URL via yt-dlp."""
        url = next((u for u in item.media_urls if u), None)
        if not url or "youtube" not in url:
            return None
        try:
            import subprocess
            tmpdir = tempfile.mkdtemp()
            out_tmpl = str(Path(tmpdir) / "%(id)s.%(ext)s")
            cmd = [
                "yt-dlp", "-x", "--audio-format", "mp3",
                "--no-warnings", "-o", out_tmpl, url,
            ]
            proc = await asyncio.create_subprocess_exec(
                *cmd, stdout=asyncio.subprocess.DEVNULL, stderr=asyncio.subprocess.DEVNULL,
            )
            await asyncio.wait_for(proc.wait(), timeout=120)
            files = list(Path(tmpdir).glob("*.mp3"))
            return str(files[0]) if files else None
        except Exception as exc:
            logger.debug("[transcriber] Audio download failed: %s", exc)
            return None
