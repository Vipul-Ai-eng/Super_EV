from agents.base import Agent


class APMAgent(Agent):
    name = "apm_agent"
    system_prompt = """You are the Battery Asset Performance Management agent.
Given battery telemetry (SOH, cycles, thermal excursions, cell supplier),
identify assets at risk and estimate remaining useful life.
Return JSON: {"at_risk_batteries": [{"battery_id","soh_pct","risk_level":
"low|medium|high","est_rul_months","recommended_action"}], "fleet_soh_avg": number}"""

    def run(self, graph) -> dict:
        batteries = dict(graph.batteries.items())
        result = self.call({"batteries": batteries})
        graph.log_event(self.name, "analysis", result)
        return result


class ProcurementReadinessAgent(Agent):
    name = "procurement_readiness_agent"
    system_prompt = """You are the Fleet Electrification Readiness & Procurement
Intelligence agent. Given vehicle duty-cycle data (daily_km, payload_pct,
dwell_hrs, route_type, current powertrain), score each non-EV vehicle's
readiness to transition to EV (0-100) and recommend a battery chemistry
(LFP vs NMC) based on route_type and payload.
Return JSON: {"transition_candidates": [{"vehicle_id","readiness_score",
"recommended_chemistry","rationale"}], "priority_order": [vehicle_id,...]}"""

    def run(self, graph) -> dict:
        diesel_vehicles = {k: v for k, v in graph.vehicles.items() if v.get("powertrain") == "diesel"}
        result = self.call({"diesel_vehicles": diesel_vehicles})
        graph.log_event(self.name, "analysis", result)
        return result


class SupplyChainRiskAgent(Agent):
    name = "supply_chain_risk_agent"
    system_prompt = """You are the EV Supply Chain Risk & Traceability agent.
Given supplier data (tier, materials, country, concentration_share_pct,
esg_score, recent_deviation_flags), flag concentration risk (>50% share on
any critical material is high risk), geopolitical exposure, and quality/ESG
gaps. Return JSON: {"flags": [{"supplier_id","risk_type":
"concentration|geopolitical|quality|esg","severity":"low|medium|high",
"detail","recommended_mitigation"}], "overall_supply_risk_score": 0-100}"""

    def run(self, graph) -> dict:
        suppliers = dict(graph.suppliers.items())
        result = self.call({"suppliers": suppliers})
        graph.log_event(self.name, "analysis", result)
        return result


class QualityIntelligenceAgent(Agent):
    name = "quality_intelligence_agent"
    system_prompt = """You are the Manufacturing Quality Intelligence (QMS)
agent. Given battery records linked to cell suppliers (soh_pct, cycles,
cell_supplier, avg_thermal_excursions_30d), detect quality drift patterns
that correlate with a specific supplier — this supports cell-to-pack-to
-vehicle traceability and root-cause analysis.
Return JSON: {"drift_signals": [{"cell_supplier","affected_battery_count",
"pattern_detected","confidence":"low|medium|high","root_cause_hypothesis"}]}"""

    def run(self, graph) -> dict:
        batteries = dict(graph.batteries.items())
        result = self.call({"batteries": batteries})
        graph.log_event(self.name, "analysis", result)
        return result


class CarbonIntelligenceAgent(Agent):
    name = "carbon_intelligence_agent"
    system_prompt = """You are the Net Zero Progress & Carbon Intelligence
agent. Given fleet composition (EV vs diesel counts, duty cycles) and an
emissions baseline (scope1_tpa, scope3_tpa, target_reduction_pct_2030),
quantify current progress and identify the highest-impact next
electrification priorities (which vehicles/routes to convert next for
maximum Scope 1 reduction per rupee of capex).
Return JSON: {"scope1_reduction_pct_to_date","scope3_reduction_pct_to_date",
"on_track_for_target": true/false, "next_priority_vehicle_ids": [...],
"rationale"}"""

    def run(self, graph) -> dict:
        vehicles = dict(graph.vehicles.items())
        result = self.call({
            "vehicles": vehicles,
            "emissions_baseline": graph.emissions.get("baseline", {}),
        })
        graph.log_event(self.name, "analysis", result)
        return result


class MaintenanceOpsAgent(Agent):
    name = "maintenance_ops_agent"
    system_prompt = """You are the Maintenance Operations Optimiser agent.
Given at-risk batteries needing service and vehicle dwell-hour patterns
(a proxy for workshop/charging bay availability), propose a maintenance
schedule that minimizes unplanned downtime.
Return JSON: {"proposed_work_orders": [{"vehicle_id","action",
"suggested_window","priority":"low|medium|high"}]}"""

    def run(self, graph, at_risk_battery_ids: list[str]) -> dict:
        at_risk_vehicles = {
            b["vehicle_id"]: graph.vehicles.get(b["vehicle_id"], {})
            for b in graph.batteries.values() if b["id"] in at_risk_battery_ids
        }
        result = self.call({"at_risk_vehicles": at_risk_vehicles})
        for wo in result.get("proposed_work_orders", []):
            graph.create_work_order(**wo)
        graph.log_event(self.name, "analysis", result)
        return result