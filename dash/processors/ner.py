"""
Named Entity Recognition (NER) processor.

Primary:   spaCy en_core_web_sm for text content
           Qwen2.5-VL microservice (:5001) for image/video frame analysis
Fallback:  Regex + keyword heuristics when spaCy is not installed
"""

from __future__ import annotations

import logging
import re
from typing import Any, Dict, List, Optional

from core.base import BaseProcessor
from core.schemas import Entity, NormalizedItem

logger = logging.getLogger(__name__)

# Lightweight heuristic: capitalised consecutive words likely to be names
_PROPER_NOUN_RE = re.compile(r"\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)\b")

# Common Indian political entity types
_KNOWN_PARTIES = {"BJP", "INC", "Congress", "AAP", "SP", "TMC", "JDU", "RJD", "BSP", "NCP", "DMK", "AIADMK"}
_KNOWN_PLACES = {"Delhi", "Mumbai", "Kolkata", "Chennai", "Bangalore", "Hyderabad", "India", "Uttar Pradesh",
                 "Gujarat", "Maharashtra", "Bihar", "Rajasthan", "Punjab"}


def _heuristic_ner(text: str) -> List[Entity]:
    entities = []
    for m in _PROPER_NOUN_RE.finditer(text):
        name = m.group(0)
        if name in _KNOWN_PARTIES:
            etype = "ORG"
        elif name in _KNOWN_PLACES:
            etype = "LOC"
        else:
            etype = "PERSON"
        entities.append(Entity(text=name, type=etype, relevance=0.6))
    return entities[:20]


class NerProcessor(BaseProcessor):
    """Extract named entities from text content."""

    def configure(self, config: Dict[str, Any]):
        super().configure(config)
        self._qwen_url: str = config.get("qwen_url", "http://localhost:5001/api/analyze")
        self._use_spacy: bool = config.get("use_spacy", True)
        self._nlp = None
        if self._use_spacy:
            try:
                import spacy  # type: ignore
                self._nlp = spacy.load("en_core_web_sm")
                logger.info("[ner] Loaded spaCy en_core_web_sm")
            except (ImportError, OSError):
                logger.warning("[ner] spaCy/model not available; using heuristic fallback")

    async def process(self, item: NormalizedItem) -> Dict[str, Any]:
        entities: List[Entity] = []

        if item.content_type in ("image", "video") and self._config.get("analyze_visual", False):
            entities += await self._qwen_ner(item)

        if item.text:
            entities += self._text_ner(item.text)

        # Deduplicate by text
        seen = set()
        unique: List[Entity] = []
        for e in entities:
            key = e.text.lower()
            if key not in seen:
                seen.add(key)
                unique.append(e)

        return {"entities": unique}

    def _text_ner(self, text: str) -> List[Entity]:
        if self._nlp:
            doc = self._nlp(text[:10_000])
            return [
                Entity(
                    text=ent.text,
                    type=self._map_label(ent.label_),
                    relevance=0.9,
                    normalized=ent.text.title(),
                )
                for ent in doc.ents
                if ent.label_ in ("PERSON", "ORG", "GPE", "LOC", "EVENT", "LAW", "NORP")
            ]
        return _heuristic_ner(text)

    def _map_label(self, label: str) -> str:
        mapping = {
            "PERSON": "PERSON", "ORG": "ORG", "GPE": "LOC",
            "LOC": "LOC", "EVENT": "EVENT", "LAW": "POLICY",
            "NORP": "ORG",
        }
        return mapping.get(label, "OTHER")

    async def _qwen_ner(self, item: NormalizedItem) -> List[Entity]:
        try:
            import httpx  # type: ignore
            media_url = item.media_urls[0] if item.media_urls else None
            if not media_url:
                return []
            async with httpx.AsyncClient(timeout=30) as client:
                resp = await client.post(self._qwen_url, json={
                    "url": media_url,
                    "prompt": "List all people and organizations visible in this image. Return as JSON array of {name, type} objects.",
                })
                resp.raise_for_status()
                data = resp.json()
                raw = data.get("result") or data.get("text") or ""
                return _parse_qwen_entities(raw)
        except Exception as exc:
            logger.debug("[ner] Qwen request failed: %s", exc)
            return []


def _parse_qwen_entities(raw: str) -> List[Entity]:
    import json as _json
    try:
        # Try to extract JSON array from the response
        match = re.search(r"\[.*?\]", raw, re.DOTALL)
        if match:
            items = _json.loads(match.group(0))
            return [
                Entity(text=it.get("name", ""), type=it.get("type", "PERSON"), relevance=0.8)
                for it in items if it.get("name")
            ]
    except Exception:
        pass
    return _heuristic_ner(raw)
