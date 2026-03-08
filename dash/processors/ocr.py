"""
OCR processor.

Primary:   Qwen2.5-VL microservice at AdminDashboard_DataIngestion/ImageToTextQwen (:5001)
Fallback:  Tesseract via subprocess
"""

from __future__ import annotations

import asyncio
import logging
import subprocess
import tempfile
from pathlib import Path
from typing import Any, Dict, List, Optional

from core.base import BaseProcessor
from core.schemas import NormalizedItem

logger = logging.getLogger(__name__)

QWEN_SERVICE_URL = "http://localhost:5001"


class OcrProcessor(BaseProcessor):
    """Extracts text from images using OCR."""

    def configure(self, config: Dict[str, Any]):
        super().configure(config)
        self._service_url: str = config.get("qwen_url", f"{QWEN_SERVICE_URL}/api/analyze")
        self._service_available: Optional[bool] = None
        self._custom_prompt: str = config.get(
            "prompt",
            "Extract all text visible in this image. Also identify any people or organizations shown.",
        )

    async def process(self, item: NormalizedItem) -> Dict[str, Any]:
        if item.content_type not in ("image", "video"):
            return {}
        # If item already has good text, skip
        if item.text and len(item.text.strip()) > 50:
            return {}

        media_urls: List[str] = [u for u in item.media_urls if u]
        if not media_urls:
            return {}

        text_parts = []
        for url in media_urls[:3]:
            extracted = await self._ocr_url(url)
            if extracted:
                text_parts.append(extracted)

        if not text_parts:
            return {}

        full_text = "\n\n".join(text_parts)
        return {
            "text": full_text,
            "processing_meta": {"ocr_applied": True},
        }

    async def _ocr_url(self, url: str) -> Optional[str]:
        # Try Qwen microservice first
        result = await self._qwen_ocr(url)
        if result:
            return result

        # Download + Tesseract fallback
        path = await self._download_image(url)
        if path:
            return await asyncio.to_thread(self._tesseract_ocr, path)

        return None

    async def _qwen_ocr(self, url: str) -> Optional[str]:
        try:
            import httpx  # type: ignore
            async with httpx.AsyncClient(timeout=60) as client:
                if self._service_available is None:
                    try:
                        h = await client.get(f"{QWEN_SERVICE_URL}/health", timeout=3)
                        self._service_available = h.status_code == 200
                    except Exception:
                        self._service_available = False

                if not self._service_available:
                    return None

                resp = await client.post(self._service_url, json={
                    "url": url,
                    "prompt": self._custom_prompt,
                })
                resp.raise_for_status()
                data = resp.json()
                return data.get("result") or data.get("text") or data.get("analysis")
        except Exception as exc:
            logger.debug("[ocr] Qwen service error: %s", exc)
            self._service_available = False
            return None

    async def _download_image(self, url: str) -> Optional[str]:
        try:
            import httpx  # type: ignore
            async with httpx.AsyncClient(timeout=30) as client:
                resp = await client.get(url)
                resp.raise_for_status()
                suffix = Path(url.split("?")[0]).suffix or ".jpg"
                with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as f:
                    f.write(resp.content)
                    return f.name
        except Exception:
            return None

    def _tesseract_ocr(self, path: str) -> Optional[str]:
        try:
            result = subprocess.run(
                ["tesseract", path, "stdout", "--psm", "3"],
                capture_output=True, text=True, timeout=30,
            )
            text = result.stdout.strip()
            return text if text else None
        except FileNotFoundError:
            logger.debug("[ocr] tesseract not installed")
            return None
        except Exception as exc:
            logger.debug("[ocr] Tesseract error: %s", exc)
            return None
