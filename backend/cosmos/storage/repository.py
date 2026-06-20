"""
Persistence for saved universes.

A lightweight, dependency-free JSON file store. Each saved universe records its
parameters and (optionally) the last simulation result, plus metadata for
sharing. Suitable for local use and easily swapped for a real database behind
the same interface.
"""

from __future__ import annotations

from dataclasses import dataclass, asdict, field
from datetime import datetime, timezone
from pathlib import Path
from typing import Any
import json
import threading
import uuid

from ..physics.parameters import UniverseParameters


@dataclass
class SavedUniverse:
    id: str
    name: str
    parameters: dict[str, Any]
    result: dict[str, Any] | None
    created_at: str
    updated_at: str
    share_token: str | None = None

    def public(self) -> dict[str, Any]:
        d = asdict(self)
        return d


class UniverseRepository:
    def __init__(self, path: str | Path = "cosmos_universes.json"):
        self.path = Path(path)
        self._lock = threading.Lock()
        if not self.path.exists():
            self._write({})

    # -- low-level io -----------------------------------------------------
    def _read(self) -> dict[str, Any]:
        try:
            return json.loads(self.path.read_text(encoding="utf-8"))
        except (FileNotFoundError, json.JSONDecodeError):
            return {}

    def _write(self, data: dict[str, Any]) -> None:
        tmp = self.path.with_suffix(".tmp")
        tmp.write_text(json.dumps(data, indent=2), encoding="utf-8")
        tmp.replace(self.path)

    # -- public api -------------------------------------------------------
    def save(self, params: UniverseParameters,
             result: dict[str, Any] | None = None,
             universe_id: str | None = None) -> SavedUniverse:
        now = datetime.now(timezone.utc).isoformat()
        with self._lock:
            store = self._read()
            uid = universe_id or uuid.uuid4().hex[:12]
            created = store.get(uid, {}).get("created_at", now)
            su = SavedUniverse(
                id=uid, name=params.name, parameters=params.to_dict(),
                result=result, created_at=created, updated_at=now,
                share_token=store.get(uid, {}).get("share_token"),
            )
            store[uid] = asdict(su)
            self._write(store)
            return su

    def get(self, universe_id: str) -> SavedUniverse | None:
        data = self._read().get(universe_id)
        return SavedUniverse(**data) if data else None

    def list(self) -> list[SavedUniverse]:
        return [SavedUniverse(**v) for v in self._read().values()]

    def delete(self, universe_id: str) -> bool:
        with self._lock:
            store = self._read()
            if universe_id in store:
                del store[universe_id]
                self._write(store)
                return True
            return False

    def make_shareable(self, universe_id: str) -> str | None:
        with self._lock:
            store = self._read()
            if universe_id not in store:
                return None
            token = store[universe_id].get("share_token") or uuid.uuid4().hex
            store[universe_id]["share_token"] = token
            self._write(store)
            return token

    def get_by_share_token(self, token: str) -> SavedUniverse | None:
        for v in self._read().values():
            if v.get("share_token") == token:
                return SavedUniverse(**v)
        return None


__all__ = ["SavedUniverse", "UniverseRepository"]
