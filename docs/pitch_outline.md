# Pitch Deck Outline (aim for 10-12 slides)

1. **Title** — Product name, one-line positioning: "The reconciliation
   layer for industrial EV transition — not another dashboard."
2. **Problem** — Use the brief's own numbers: EVs <2.5% of industrial
   penetration despite Rs 10,000cr+ FAME-II disbursed; the gap is
   operational, not financial.
3. **Why point solutions fail** — 1 slide showing the landscape (battery
   APM tools, fleet readiness tools, battery-passport traceability tools)
   all exist separately today — cite that this is exactly why fleets
   still run on spreadsheets and five disconnected systems.
4. **Our wedge** — the shared knowledge graph + orchestrator that makes
   agents reconcile conflicting recommendations, with the one-sentence
   proof point from your demo (the SUP-CELL-01 scenario).
5. **Architecture** — the Mermaid diagram (docs/architecture.mermaid).
   Narrate: data sources → shared graph → 6 specialist agents →
   orchestrator → human-approved action queue.
6. **Live demo** (or embedded video) — the 3-minute script from
   demo_scenario.md.
7. **Evaluation metrics you actually measured** — real numbers, not
   placeholders: run `data/validate_apm.py` for the current baseline
   (as of this build: 3.78 percentage points SOH RMSE, 2.3 cycles mean
   RUL error, computed against NASA's own officially measured Capacity
   field — cite: B. Saha and K. Goebel (2007), NASA Ames PCoE). Also
   report your conflict-detection precision on the two planted scenarios.
8. **Business impact** — capex avoided by not replacing a still-healthy
   pack early, cost delta of supplier switch vs. downstream quality
   failure cost, Scope 1/3 reduction trajectory.
9. **Scalability** — swap-in path from in-memory graph to production
   graph DB; each agent as an independently deployable service; multi-
   tenant story for multiple fleet operators / OEMs.
10. **Roadmap** — real telematics/BMS integration, real supplier ESG data
    feeds (comparable to Battery Passport / EU regulation requirements),
    India-specific SIAM/FAME-II compliance reporting as a defensible,
    underserved niche vs. global point solutions.
11. **Team & ask**.

Keep slide 5 (architecture) and slide 6 (demo) as the emotional core —
judges remember the moment they saw agents disagree and resolve, not the
slide with the TAM number.
