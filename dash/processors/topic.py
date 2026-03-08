"""
Topic classification processor.

Uses keyword scoring over predefined political/social topics.
Maps each item to its dominant topic and computes confidence scores.
"""

from __future__ import annotations

import re
from typing import Any, Dict

from core.base import BaseProcessor
from core.schemas import NormalizedItem

TOPIC_KEYWORDS: Dict[str, list] = {
    "electoral_politics": [
        "election", "vote", "rally", "campaign", "candidate", "constituency",
        "polling", "manifesto", "seat", "parliament", "assembly", "mla", "mp",
    ],
    "infrastructure": [
        "road", "bridge", "highway", "railway", "metro", "airport", "port",
        "construction", "project", "infrastructure", "development",
    ],
    "healthcare": [
        "hospital", "health", "medicine", "doctor", "clinic", "disease",
        "vaccine", "covid", "treatment", "medical", "ayushman",
    ],
    "education": [
        "school", "college", "university", "education", "student",
        "scholarship", "literacy", "teacher", "curriculum",
    ],
    "agriculture": [
        "farmer", "agriculture", "crop", "msp", "irrigation", "kisan",
        "fertilizer", "drought", "flood", "rural",
    ],
    "economy": [
        "gdp", "economy", "budget", "tax", "inflation", "unemployment",
        "industry", "trade", "investment", "startup", "rupee",
    ],
    "security": [
        "army", "police", "security", "terror", "militant", "border",
        "defence", "war", "attack", "encounter", "bsf", "crpf",
    ],
    "corruption": [
        "corrupt", "scam", "scandal", "fraud", "bribe", "sting",
        "cbi", "ed", "arrest", "raid", "allegation", "controversy",
    ],
    "social_welfare": [
        "welfare", "scheme", "benefit", "subsidy", "bpl", "ration",
        "pension", "disability", "women", "child", "empowerment",
    ],
    "environment": [
        "climate", "pollution", "environment", "forest", "wildlife",
        "clean energy", "solar", "water", "flood", "drought", "greenery",
    ],
}

# Map dominant topic to NRI pillar key
TOPIC_TO_PILLAR: Dict[str, str] = {
    "electoral_politics": "es",
    "infrastructure": "cd",
    "healthcare": "cd",
    "education": "cd",
    "agriculture": "cd",
    "economy": "fm",
    "security": "lp",
    "corruption": "sc",
    "social_welfare": "pa",
    "environment": "cd",
}


class TopicProcessor(BaseProcessor):
    """Classifies content into political/social topics."""

    async def process(self, item: NormalizedItem) -> Dict[str, Any]:
        text = (item.text or "").lower()
        if not text:
            return {}

        words = set(re.findall(r"\b\w+\b", text))
        scores: Dict[str, float] = {}
        for topic, keywords in TOPIC_KEYWORDS.items():
            matches = sum(1 for kw in keywords if kw in text or kw in words)
            if matches:
                scores[topic] = round(matches / len(keywords), 4)

        if not scores:
            return {}

        top_topic = max(scores, key=scores.__getitem__)
        top_score = scores[top_topic]

        return {
            "topic_label": top_topic.replace("_", " ").title(),
            "topic_scores": scores,
            "pillar": TOPIC_TO_PILLAR.get(top_topic),
            "pillar_confidence": top_score,
        }
