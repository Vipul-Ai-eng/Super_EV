"""
Run with:  uvicorn main:app --reload
Then hit:  POST http://localhost:8000/run-cycle
"""

import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from data.graph_store import GRAPH
from data.mock_data import seed_demo_data
from core.orchestrator import run_full_cycle

app = FastAPI(title="EV Asset & Supply Chain Intelligence Platform — Ohmwatch")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # tighten before any real production use
    allow_methods=["*"],
    allow_headers=["*"],
)

# Only seed demo data if the graph is empty — avoids wiping real state on
# every restart now that storage is persistent (SQLite).
if not GRAPH.vehicles.keys():
    seed_demo_data()


@app.get("/graph")
def get_graph():
    """Inspect current state of the shared knowledge graph / digital twin."""
    return GRAPH.snapshot()


@app.get("/events")
def get_events():
    """Full audit trail — every agent write, in order. Good for showing
    judges the reasoning trail, not just the final answer."""
    return GRAPH.events


@app.post("/run-cycle")
def run_cycle():
    """Trigger all six specialist agents + orchestrator reconciliation.
    This is the endpoint to call live during the demo."""
    return run_full_cycle(GRAPH)


@app.get("/health")
def health():
    return {"status": "ok", "vehicles": len(GRAPH.vehicles), "suppliers": len(GRAPH.suppliers)}


_frontend_dir = os.path.join(os.path.dirname(__file__), "frontend")
if os.path.isdir(_frontend_dir):
    app.mount("/", StaticFiles(directory=_frontend_dir, html=True), name="frontend")
