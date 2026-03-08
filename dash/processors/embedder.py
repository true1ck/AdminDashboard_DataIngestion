"""
Embedder processor.

Generates 384-dimensional dense vectors using sentence-transformers
(all-MiniLM-L6-v2) from the item's text. These embeddings are later
used by the Qdrant consumer for semantic similarity search.
"""

from __future__ import annotations

import logging
from typing import Any, Dict, List, Optional

from core.base import BaseProcessor
from core.schemas import NormalizedItem

logger = logging.getLogger(__name__)

DEFAULT_MODEL = "all-MiniLM-L6-v2"


class EmbedderProcessor(BaseProcessor):
    """Generates text embeddings for semantic search."""

    def configure(self, config: Dict[str, Any]):
        super().configure(config)
        self._model_name: str = config.get("model_name", DEFAULT_MODEL)
        self._max_chars: int = config.get("max_chars", 5000)
        self._model = None

    def _get_model(self):
        if self._model is None:
            try:
                from sentence_transformers import SentenceTransformer  # type: ignore
                logger.info("[embedder] Loading model: %s", self._model_name)
                self._model = SentenceTransformer(self._model_name)
            except ImportError:
                logger.warning("[embedder] sentence-transformers not installed; embeddings disabled")
        return self._model

    async def process(self, item: NormalizedItem) -> Dict[str, Any]:
        text = (item.text or item.text_en or "").strip()
        if not text:
            return {}

        model = self._get_model()
        if model is None:
            return {}

        try:
            import asyncio
            embedding: List[float] = await asyncio.to_thread(
                lambda: model.encode(text[: self._max_chars]).tolist()
            )
            return {"embedding": embedding}
        except Exception as exc:
            logger.error("[embedder] Encoding failed: %s", exc)
            return {}
