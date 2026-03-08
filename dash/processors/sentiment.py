"""
Sentiment analysis processor.

Primary:   TextBlob polarity + VADER for robust text sentiment
Fallback:  Keyword-based scoring when neither library is available
Optional:  Ollama LLM for nuanced analysis if configured
"""

from __future__ import annotations

import logging
import re
from typing import Any, Dict, Optional

from core.base import BaseProcessor
from core.schemas import NormalizedItem

logger = logging.getLogger(__name__)

# Simple keyword weights for bare-minimum fallback
_POS_WORDS = {"great", "good", "excellent", "positive", "development", "growth",
              "support", "win", "victory", "progress", "success", "achievement"}
_NEG_WORDS = {"bad", "poor", "failure", "corrupt", "scandal", "loss", "protest",
              "crisis", "attack", "controversy", "threat", "riot", "arrest"}


def _keyword_sentiment(text: str) -> float:
    words = set(re.findall(r"\b\w+\b", text.lower()))
    pos = len(words & _POS_WORDS)
    neg = len(words & _NEG_WORDS)
    total = pos + neg
    if total == 0:
        return 0.0
    return round((pos - neg) / total, 3)


class SentimentProcessor(BaseProcessor):
    """Scores sentiment of text content."""

    def configure(self, config: Dict[str, Any]):
        super().configure(config)
        self._ollama_url: Optional[str] = config.get("ollama_url")
        self._ollama_model: str = config.get("ollama_model", "mistral")
        self._use_vader: bool = config.get("use_vader", True)
        self._use_textblob: bool = config.get("use_textblob", True)
        self._vader = None
        if self._use_vader:
            try:
                from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer  # type: ignore
                self._vader = SentimentIntensityAnalyzer()
                logger.info("[sentiment] VADER loaded")
            except ImportError:
                logger.info("[sentiment] VADER not available")

    async def process(self, item: NormalizedItem) -> Dict[str, Any]:
        text = item.text or item.text_en or ""
        if not text.strip():
            return {}

        score, subjectivity = self._score(text)
        label = "positive" if score > 0.1 else "negative" if score < -0.1 else "neutral"

        # Flag potential threats / crisis signals
        is_threat = any(w in text.lower() for w in {"riot", "violence", "attack", "threat", "kill", "bomb", "explosion"})
        threat_score = 0.8 if is_threat else 0.0

        return {
            "sentiment": score,
            "sentiment_label": label,
            "sentiment_subjectivity": subjectivity,
            "is_threat": is_threat,
            "threat_score": threat_score,
            "urgency": "tatkal" if is_threat else "samanya",
        }

    def _score(self, text: str):
        # VADER is best for social-media style short text
        if self._vader:
            scores = self._vader.polarity_scores(text[:5000])
            compound = scores["compound"]
            return compound, abs(scores["pos"] - scores["neg"])

        # TextBlob handles longer analytical text better
        if self._use_textblob:
            try:
                from textblob import TextBlob  # type: ignore
                blob = TextBlob(text[:5000])
                return blob.sentiment.polarity, blob.sentiment.subjectivity
            except ImportError:
                pass

        return _keyword_sentiment(text), 0.5
