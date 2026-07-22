import os
import time
from typing import Dict, Any
from dotenv import load_dotenv

load_dotenv()

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from data.graph_store import GRAPH
from data.mock_data import seed_demo_data
from core.orchestrator import run_full_cycle

app = FastAPI(title="EV Asset & Supply Chain Intelligence Platform — SuperEV")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

if not GRAPH.vehicles.keys():
    seed_demo_data()

# In-memory store for work orders
_work_orders_store: Dict[str, Dict[str, Any]] = {}

@app.get("/graph")
def get_graph():
    return GRAPH.snapshot()

@app.get("/events")
def get_events():
    return GRAPH.events

@app.post("/run-cycle")
def run_cycle():
    result = run_full_cycle(GRAPH)
    if result and "reconciled" in result:
        queue = result["reconciled"].get("unified_action_queue", [])
        for item in queue:
            order_id = item.get("id") or f"wo_{int(time.time()*1000)}_{len(_work_orders_store)}"
            item["id"] = order_id
            _work_orders_store[order_id] = {**item, "status": "pending"}
    return result

@app.get("/work-orders")
def get_work_orders():
    return list(_work_orders_store.values())

@app.patch("/work-orders/{work_order_id}")
def update_work_order(work_order_id: str, update: dict):
    if work_order_id not in _work_orders_store:
        raise HTTPException(status_code=404, detail="Work order not found")

    for key, value in update.items():
        _work_orders_store[work_order_id][key] = value

    # positional arguments for log_event
    GRAPH.log_event(
        "orchestrator",
        f"work_order_{update.get('status', 'updated')}",
        {"work_order_id": work_order_id}
    )

    return _work_orders_store[work_order_id]

@app.get("/health")
def health():
    return {"status": "ok", "vehicles": len(GRAPH.vehicles), "suppliers": len(GRAPH.suppliers)}

_frontend_dir = os.path.join(os.path.dirname(__file__), "frontend")
if os.path.isdir(_frontend_dir):
    app.mount("/", StaticFiles(directory=_frontend_dir, html=True), name="frontend")