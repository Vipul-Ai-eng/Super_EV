# 6-Day Build Checklist

Assign an owner initial to each box right now, before writing any code.

## Day 1 — Foundation
- [ ] Repo created, branch protection on `main`, `.env.example` committed
- [ ] Team roles assigned (Backend/Agents, Data, Frontend, Deploy+Pitch)
- [ ] Scaffold running locally with a real ANTHROPIC_API_KEY, `/run-cycle` returns real Claude JSON
- [ ] NASA battery dataset downloaded + inspected (`data/nasa_ingest.py`)
- [ ] Scope frozen: 6 agents, 1 orchestrator, 1 dashboard. No new agent ideas after today.

## Day 2 — Real data + persistence
- [ ] APM agent reading real NASA battery records, not synthetic ones
- [ ] Graph store migrated to SQLite (`data/graph_store.py` — persists across restarts)
- [ ] Agent retries/timeouts/fallbacks added (`agents/base.py`)
- [ ] 5-10 unit tests passing (`tests/`)
- [ ] Second conflict scenario added to demo data

## Day 3 — Orchestrator depth
- [ ] Reconciliation handles both planted conflict scenarios correctly
- [ ] Structured logging: every agent call logs latency + token count
- [ ] Frontend skeleton: routing + static mock render of action cards
- [ ] Decide and lock deployment target (Railway/Render/Fly.io)

## Day 4 — Frontend integration
- [ ] Dashboard wired to live `/run-cycle`, `/graph`, `/events`
- [ ] Three views working: fleet/battery, supply chain risk, unified action queue
- [ ] Basic auth in front of the deployed instance
- [ ] Deployed to a real public URL — demo from this URL from now on, never localhost

## Day 5 — Metrics + hardening
- [ ] Real APM accuracy number computed vs. NASA ground truth (RMSE/MAE)
- [ ] Supply chain conflict-detection lead time measured and written down
- [ ] Quality drift precision/recall on a labeled sample (even n=20)
- [ ] Demo path run 10+ times back-to-back with no crash
- [ ] Full demo video recorded as fallback
- [ ] `docs/architecture.mermaid` updated to match what's actually built

## Day 6 — Pitch + submit
- [ ] Deck built from `docs/pitch_outline.md` with real Day-5 numbers
- [ ] Full run-through rehearsed 3+ times, timed
- [ ] One person talks, one person drives the demo — decide who, today
- [ ] Submitted with buffer before deadline
- [ ] Final check: reload deployed URL in a clean/incognito browser
