"""
Shared Asset & Supply Chain Graph - SQLite-backed persistent version.
Same public API as the in-memory prototype (upsert_vehicle, upsert_battery,
upsert_supplier, create_work_order, snapshot, log_event, etc.) so no agent
code needs to change."""

from __future__ import annotations
import itertools
import json
import os
import sqlite3
import time

DB_PATH = os.environ.get("EV_PLATFORM_DB_PATH", "ev_platform.db")
_id_counter = itertools.count(1)


def next_id(prefix: str) -> str:
    return f"{prefix}-{next(_id_counter):04d}-{int(time.time() * 1000) % 100000}"


SCHEMA = """
CREATE TABLE IF NOT EXISTS entities (
    kind TEXT NOT NULL,
    id TEXT NOT NULL,
    data TEXT NOT NULL,
    updated_at REAL NOT NULL,
    PRIMARY KEY (kind, id)
);
CREATE TABLE IF NOT EXISTS events (
    seq INTEGER PRIMARY KEY AUTOINCREMENT,
    ts REAL NOT NULL,
    agent TEXT NOT NULL,
    action TEXT NOT NULL,
    payload TEXT NOT NULL
);
"""


class _EntityView(dict):
    """Dict-like proxy so graph.vehicles["VEH-001"] etc. keeps working
    exactly like the in-memory version, backed by SQLite underneath."""

    def __init__(self, conn: sqlite3.Connection, kind: str):
        super().__init__()
        self._conn = conn
        self._kind = kind

    def _all(self) -> dict:
        rows = self._conn.execute(
            "SELECT id, data FROM entities WHERE kind = ?", (self._kind,)
        ).fetchall()
        return {row[0]: json.loads(row[1]) for row in rows}

    def __getitem__(self, key):
        row = self._conn.execute(
            "SELECT data FROM entities WHERE kind = ? AND id = ?", (self._kind, key)
        ).fetchone()
        if row is None:
            raise KeyError(key)
        return json.loads(row[0])

    def __setitem__(self, key, value):
        self._conn.execute(
            "INSERT INTO entities (kind, id, data, updated_at) VALUES (?, ?, ?, ?)"
            " ON CONFLICT(kind, id) DO UPDATE SET data=excluded.data, updated_at=excluded.updated_at",
            (self._kind, key, json.dumps(value), time.time()),
        )
        self._conn.commit()

    def get(self, key, default=None):
        try:
            return self[key]
        except KeyError:
            return default

    def setdefault(self, key, default):
        try:
            return self[key]
        except KeyError:
            self[key] = default
            return default

    def values(self):
        return self._all().values()

    def items(self):
        return self._all().items()

    def keys(self):
        return self._all().keys()

    def __iter__(self):
        return iter(self._all())

    def __len__(self):
        return len(self._all())

    def __contains__(self, key):
        row = self._conn.execute(
            "SELECT 1 FROM entities WHERE kind = ? AND id = ?", (self._kind, key)
        ).fetchone()
        return row is not None


class GraphStore:
    def __init__(self, db_path: str = DB_PATH):
        self._conn = sqlite3.connect(db_path, check_same_thread=False)
        self._conn.executescript(SCHEMA)
        self._conn.commit()

        self.vehicles = _EntityView(self._conn, "vehicle")
        self.batteries = _EntityView(self._conn, "battery")
        self.suppliers = _EntityView(self._conn, "supplier")
        self.materials = _EntityView(self._conn, "material")
        self.routes = _EntityView(self._conn, "route")
        self.work_orders = _EntityView(self._conn, "work_order")
        self.emissions = _EntityView(self._conn, "emissions")

    def log_event(self, agent: str, action: str, payload: dict):
        self._conn.execute(
            "INSERT INTO events (ts, agent, action, payload) VALUES (?, ?, ?, ?)",
            (time.time(), agent, action, json.dumps(payload)),
        )
        self._conn.commit()

    def upsert_vehicle(self, vehicle_id: str, **fields):
        current = self.vehicles.get(vehicle_id, {"id": vehicle_id})
        current.update(fields)
        self.vehicles[vehicle_id] = current

    def upsert_battery(self, battery_id: str, **fields):
        current = self.batteries.get(battery_id, {"id": battery_id})
        current.update(fields)
        self.batteries[battery_id] = current

    def upsert_supplier(self, supplier_id: str, **fields):
        current = self.suppliers.get(supplier_id, {"id": supplier_id})
        current.update(fields)
        self.suppliers[supplier_id] = current

    def create_work_order(self, **fields) -> str:
        wo_id = next_id("WO")
        self.work_orders[wo_id] = {"id": wo_id, "status": "proposed", **fields}
        return wo_id

    @property
    def events(self) -> list[dict]:
        rows = self._conn.execute(
            "SELECT ts, agent, action, payload FROM events ORDER BY seq"
        ).fetchall()
        return [
            {"ts": r[0], "agent": r[1], "action": r[2], "payload": json.loads(r[3])}
            for r in rows
        ]

    def snapshot(self) -> dict:
        return {
            "vehicles": self.vehicles._all(),
            "batteries": self.batteries._all(),
            "suppliers": self.suppliers._all(),
            "materials": self.materials._all(),
            "routes": self.routes._all(),
            "work_orders": self.work_orders._all(),
            "emissions": self.emissions._all(),
        }

    def suppliers_for_material(self, material: str) -> list[dict]:
        return [s for s in self.suppliers.values() if material in s.get("materials", [])]

    def batteries_below_soh(self, threshold: float) -> list[dict]:
        return [b for b in self.batteries.values() if b.get("soh_pct", 100) < threshold]

    def reset(self):
        """Wipes all data — useful between demo rehearsals. Not wired to
        any endpoint by default; call manually."""
        self._conn.executescript("DELETE FROM entities; DELETE FROM events;")
        self._conn.commit()


GRAPH = GraphStore()  # process-wide singleton, persisted to ev_platform.db
