"""
Runs the six specialist agents against the shared graph, then makes one
additional call whose only job is reconciliation: given all six
structured outputs, identify conflicts and reinforcements between them,
and produce a single prioritized action queue with trade-offs stated
explicitly.

The reconciliation step is what distinguishes this system from six
independent tools running side by side — it's the one place where all
six agents' outputs are considered together.
"""

from agents.base import Agent
from agents.specialists import (
    APMAgent, ProcurementReadinessAgent, SupplyChainRiskAgent,
    QualityIntelligenceAgent, CarbonIntelligenceAgent, MaintenanceOpsAgent,
)

RECONCILE_SYSTEM_PROMPT = """You are the Orchestrator for an EV asset &
supply chain intelligence platform. You receive structured JSON outputs
from six specialist agents (APM, Procurement/Readiness, Supply Chain Risk,
Quality, Carbon, Maintenance Ops). Your job:

1. Find CONFLICTS — e.g. Procurement recommends a battery chemistry/supplier
   that Supply Chain Risk has flagged, or Quality has found a drift pattern
   tied to a supplier that Procurement is about to buy more from.
2. Find REINFORCEMENTS — e.g. Carbon's next-priority vehicle matches
   Procurement's top readiness candidate.
3. Produce ONE prioritized action queue that a human fleet/supply-chain
   manager can approve with one click each, explicitly stating the
   trade-off each action makes (cost vs. carbon vs. risk vs. speed).

Return JSON only:
{
  "conflicts_detected": [{"agents_involved": [...], "description",
                            "resolution_recommendation"}],
  "reinforcements_detected": [{"agents_involved": [...], "description"}],
  "unified_action_queue": [{"priority": 1, "action", "owner_agent",
                             "trade_off_explained", "requires_approval": true}]
}"""


class ReconciliationAgent(Agent):
    """Uses the same Agent.call() implementation as the specialist
    agents — same provider switching, retry, and error-handling
    behavior — so reconciliation isn't a separate code path."""
    name = "orchestrator_reconciliation"
    system_prompt = RECONCILE_SYSTEM_PROMPT


def run_full_cycle(graph) -> dict:
    apm_result = APMAgent().run(graph)
    procurement_result = ProcurementReadinessAgent().run(graph)
    supply_chain_result = SupplyChainRiskAgent().run(graph)
    quality_result = QualityIntelligenceAgent().run(graph)
    carbon_result = CarbonIntelligenceAgent().run(graph)

    at_risk_ids = [b["battery_id"] for b in apm_result.get("at_risk_batteries", [])]
    maintenance_result = MaintenanceOpsAgent().run(graph, at_risk_ids)

    specialist_outputs = {
        "apm_agent": apm_result,
        "procurement_readiness_agent": procurement_result,
        "supply_chain_risk_agent": supply_chain_result,
        "quality_intelligence_agent": quality_result,
        "carbon_intelligence_agent": carbon_result,
        "maintenance_ops_agent": maintenance_result,
    }

    reconciled = ReconciliationAgent().call(specialist_outputs, max_tokens=2000)

    # The LLM doesn't always assign strictly sequential priorities —
    # renumber deterministically so the UI always shows a clean 1, 2, 3...
    if isinstance(reconciled.get("unified_action_queue"), list):
        for idx, item in enumerate(reconciled["unified_action_queue"], start=1):
            if isinstance(item, dict):
                item["priority"] = idx

    graph.log_event("orchestrator", "reconciliation", reconciled)
    return {
        "specialist_outputs": specialist_outputs,
        "reconciled": reconciled,
    }