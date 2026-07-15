# Demo Script — "Watch the agents argue, then agree"

Judges have seen ten "AI monitors your battery" demos. What they have not
seen is a system where agent #3's finding visibly changes agent #2's
recommendation, live, without a human relaying the message. Build the
demo around that moment. Total run time: ~3 minutes.

## The planted scenario (already in mock_data.py)

- `SUP-CELL-01` (EastPack Cell Manufacturing) supplies 70% of your LFP
  cells — a concentration risk — and has 3 recent quality deviation flags.
- Batteries sourced from `SUP-CELL-01` show a disproportionate share of the
  low-SOH cluster seeded in the data (every 5th vehicle).
- 26 diesel vehicles are still awaiting electrification, and several of the
  best "readiness" candidates would naturally be provisioned with cells
  from the same over-concentrated supplier if procurement just followed
  its own default logic.

## The narrative to say out loud

1. **"Here's our fleet today."** Show `/graph` — 40 vehicles, 14 already
   electrified, live SOH data, live supplier network. This is the digital
   twin, not a mockup.
2. **"Watch what happens when we ask the platform what to do next."**
   Hit `/run-cycle`. Narrate the six specialist outputs appearing:
   - APM flags the low-SOH battery cluster.
   - Quality Agent independently traces that cluster back to
     `SUP-CELL-01`.
   - Supply Chain Risk Agent has already flagged `SUP-CELL-01` at 70%
     concentration with active deviation flags.
   - Procurement/Readiness Agent's initial pass recommends chemistry
     sourced from the path of least resistance — the same supplier.
3. **"This is the part nobody else does."** Show the Orchestrator's
   reconciliation output: it explicitly states the conflict —
   *"Procurement's recommended sourcing path relies on a supplier already
   flagged as high concentration risk AND linked to a quality drift
   pattern — recommend rerouting new orders to SUP-CELL-02 (Bharat Cell
   Systems) despite the [X]% cost delta."*
4. **"And the ripple effect is priced."** Carbon Agent + Maintenance Ops
   Agent outputs show how the corrected plan still hits the Net Zero
   trajectory, and a maintenance work order is auto-created for the
   affected vehicles.
5. **Close on the unified action queue** — one ranked list, each item
   showing which trade-off it makes, each with an "approve" affordance.
   This is your answer to the "how is this different from five
   dashboards" question before anyone asks it.

## Second conflict scenario (also already planted, uses REAL data)

`VEH-004` carries battery `BAT-004`, which is seeded directly from the real
NASA PCoE `B0018` cell — genuinely measured SOH of ~68%, right at the
dataset's standard 70% end-of-life threshold. This vehicle is also given a
long-haul route (195 km/day, highest mileage in the fleet) with only a
2-hour daily dwell window.

This creates a real three-way tension without any scripting beyond the
data itself:
- **APM Agent** flags BAT-004 as high-risk, wants urgent service.
- **Carbon Agent** independently ranks VEH-004 as a top electrification/
  emissions priority *because* it's the highest-mileage vehicle — reducing
  its emissions matters most.
- **Maintenance Ops Agent** has almost no window (2 hours/day) to actually
  service it without disrupting the route.

Use this as your second "wow" moment if the judges ask "is the first one
just a fluke / scripted?" — point out that this second conflict emerges
from real measured battery degradation, not a hand-authored rule.

## Mapping to judging criteria while you talk

- **Innovation (15%)** — say it explicitly: "the innovation isn't any one
  agent, it's the reconciliation step that makes five domains argue with
  each other before a human sees the answer."
- **Business Impact (25%)** — quantify: cost delta of switching suppliers
  vs. avoided quality-failure cost vs. Rs 10,000cr FAME-II incentive
  context from the brief.
- **Technical Excellence (25%)** — point at the audit trail (`/events`)
  as evidence of a real reasoning pipeline, not a single mega-prompt.
- **Scalability (20%)** — mention the graph store is swappable for
  Neo4j/Postgres with zero agent code changes; each agent is a stateless
  service that can scale independently.
- **User Experience (15%)** — show the approvable action cards, not raw
  JSON, in your actual dashboard UI.
