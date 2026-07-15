# EV Asset & Supply Chain Intelligence Platform — SuperEV

A multi-agent system that unifies six agent ideas from the challenge
brief (APM, Procurement/Readiness, Supply Chain Risk, Quality, Carbon,
Maintenance Ops) around **one shared knowledge graph**, with an
**orchestrator** that reconciles conflicting recommendations instead of
running six bots side by side.

## Why this architecture wins on the judging criteria

Competitors in this space (Oxmaint, iFactory, FleetRabbit, Sawatch Labs,
ReSource) each solve ONE slice — battery APM, or fleet readiness, or
battery-passport traceability — as a standalone product. None of them
make the agents talk to each other. That cross-agent reconciliation step
is the differentiator. See `docs/demo_scenario.md` for the demo script.

## What's real vs. synthetic (be upfront about this with judges)

- **Real, from the official NASA source**: 4 of the fleet's batteries
  (`VEH-001`–`VEH-004`) are seeded from the official NASA Ames PCoE
  Li-ion Battery Aging dataset, downloaded directly from
  `https://phm-datasets.s3.amazonaws.com/NASA/5.+Battery+Data+Set.zip`
  (folder "1. BatteryAgingARC-FY08Q4"), not a third-party mirror.
  Citation: B. Saha and K. Goebel (2007), "Battery Data Set", NASA
  Prognostics Data Repository, NASA Ames Research Center.
  `data/nasa_ingest.py` reads NASA's own precomputed `Capacity` field
  directly from the `.mat` files. `data/validate_apm.py` computes a real
  baseline accuracy number against this ground truth — current result:
  3.78 percentage points SOH RMSE, 2.3 cycles mean RUL error across all
  4 batteries.
- **Synthetic but realistic**: the other 36 vehicles, the 5-supplier
  network, and route/duty-cycle data — built to be internally consistent
  and to carry two planted cross-agent conflict scenarios (see
  `docs/demo_scenario.md`).
- **Storage is persistent**: `data/graph_store.py` is SQLite-backed
  (`ev_platform.db`), so state survives a server restart.

## LLM provider: Anthropic (default) or Groq (free)

Set via environment variable — same code path, same retry/error
handling, same JSON schema per agent, regardless of provider:

```bash
# Default: Claude via Anthropic
export ANTHROPIC_API_KEY=your_key_here
export EV_PLATFORM_PROVIDER=anthropic   # optional, this is the default
export EV_PLATFORM_MODEL=claude-sonnet-4-5

# Or: free tier via Groq (no credit card, rate-limited, open-source models)
export GROQ_API_KEY=your_key_here
export EV_PLATFORM_PROVIDER=groq
export EV_PLATFORM_MODEL=llama-3.3-70b-versatile
```

## Quick start

```bash
pip install -r requirements.txt
uvicorn main:app --reload
```

Open **http://localhost:8000/** for the dashboard. Click
**RUN ANALYSIS CYCLE** to trigger all six agents + reconciliation live.

Or hit the API directly:
```bash
curl -X POST http://localhost:8000/run-cycle
curl http://localhost:8000/graph
curl http://localhost:8000/events
```

To regenerate the real battery dataset from the official `.mat` files:
```bash
pip install scipy
# Download https://phm-datasets.s3.amazonaws.com/NASA/5.+Battery+Data+Set.zip
# extract "1. BatteryAgingARC-FY08Q4", place the 4 .mat files into
# data/_nasa_official/
python data/nasa_ingest.py
python data/validate_apm.py
```

## Project structure
data/graph_store.py       SQLite-backed shared knowledge graph
data/mock_data.py         seeds fleet + supplier network, blends in real NASA batteries
data/nasa_ingest.py       processes official NASA PCoE .mat files
data/nasa_processed.csv   processed real data (already generated)
data/validate_apm.py      computes accuracy baseline (RMSE, RUL error) vs ground truth
agents/base.py            base class: structured-JSON LLM calls, retries, timeouts, fallback
agents/specialists.py     the 6 agents from the challenge brief
core/orchestrator.py      runs all agents + reconciles conflicts into 1 action queue
main.py                   FastAPI app: API + serves the dashboard
frontend/index.html       control-room dashboard (agent stations, action queue, audit log)
docs/architecture.mermaid architecture diagram
docs/demo_scenario.md     3-minute demo script
docs/pitch_outline.md     slide-by-slide outline mapped to judging weights
docs/checklist.md         day-by-day team checklist
## Remaining work for a "production ready" bar

- [ ] Deploy to a real public URL (Railway/Render/Fly.io)
- [ ] Add basic auth in front of the deployed instance
- [ ] Wire "Approve" button on action cards to update `work_orders`
      status server-side (currently client-side only)
- [ ] Re-run held-out cycles through the live agent and report agent
      RMSE next to the baseline RMSE in the deck
- [ ] Load-test `/run-cycle` 10+ times back-to-back before demo day
- [ ] Record the full demo video following `docs/demo_scenario.md`