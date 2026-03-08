"""Abstract base classes for all pipeline plugin types."""

from __future__ import annotations

from abc import ABC, abstractmethod
from typing import Any, AsyncIterator, Dict, Optional

from .schemas import NormalizedItem, ProcessedItem, RawItem


class BaseCollector(ABC):
    """Fetches raw data from an external platform."""

    def __init__(self):
        self.entity: Optional[str] = None
        self.event: Optional[str] = None
        self._config: Dict[str, Any] = {}

    def configure(self, config: Dict[str, Any], entity: Optional[str] = None, event: Optional[str] = None):
        self._config = config
        self.entity = entity
        self.event = event

    @abstractmethod
    async def stream(self) -> AsyncIterator[RawItem]:
        """Yield RawItems indefinitely (or until exhausted for one-shot sources)."""
        ...


class BaseTransformer(ABC):
    """Converts items between pipeline stages."""

    def __init__(self):
        self._config: Dict[str, Any] = {}

    def configure(self, config: Dict[str, Any]):
        self._config = config

    @abstractmethod
    async def transform(self, item: Any) -> Optional[Any]:
        """Return transformed item, or None to drop the item."""
        ...


class BaseProcessor(ABC):
    """Runs AI analysis on a NormalizedItem and returns enriched ProcessedItem."""

    def __init__(self):
        self._config: Dict[str, Any] = {}

    def configure(self, config: Dict[str, Any]):
        self._config = config

    @abstractmethod
    async def process(self, item: NormalizedItem) -> Dict[str, Any]:
        """Return a dict of fields to merge into ProcessedItem."""
        ...

    async def fallback(self, item: NormalizedItem) -> Dict[str, Any]:
        """Return safe defaults when processing fails or times out."""
        return {}


class BaseConsumer(ABC):
    """Persists or forwards a ProcessedItem."""

    def __init__(self):
        self._config: Dict[str, Any] = {}

    def configure(self, config: Dict[str, Any]):
        self._config = config

    @abstractmethod
    async def consume(self, item: ProcessedItem) -> None:
        ...
