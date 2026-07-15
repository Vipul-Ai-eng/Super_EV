"""
Seeds the GraphStore with a believable industrial EV fleet + battery supply
chain scenario for a demo: a 40-vehicle intra-plant logistics fleet
transitioning from diesel forklifts/tuggers to EVs, sourcing LFP packs
through a 3-tier supplier network.

Includes ONE planted scenario (a supplier concentration + quality drift
combo) that the orchestrator is designed to surface — this is your
scripted "wow" moment for judges. See docs/demo_scenario.md.
"""

import csv
import os
import random
from collections import defaultdict
from data.graph_store import GRAPH

random.seed(42)

NASA_CSV_PATH = os.path.join(os.path.dirname(__file__), "nasa_processed.csv")
# Map real NASA batteries onto 4 specific fleet vehicles so the demo fleet
# is a REAL + synthetic blend, not fully synthetic. Judges can be told
# exactly which battery_id in the dashboard is real measured data.
NASA_BATTERY_TO_VEHICLE = {
    "B0005": "VEH-001",
    "B0006": "VEH-002",
    "B0007": "VEH-003",
    "B0018": "VEH-004",
}


def _load_real_nasa_batteries() -> dict[str, dict]:
    """Returns the LATEST cycle's real capacity/SOH per battery, plus the
    full cycle history (used for validation and for showing a real
    degradation curve in the frontend)."""
    if not os.path.exists(NASA_CSV_PATH):
        return {}
    history = defaultdict(list)
    with open(NASA_CSV_PATH) as f:
        for row in csv.DictReader(f):
            history[row["battery_id"]].append({
                "cycle_number": int(row["cycle_number"]),
                "soh_pct": float(row["soh_pct"]),
                "capacity_ah": float(row["capacity_ah"]),
                "max_temp_c": float(row["max_temp_c"]),
            })
    real = {}
    for battery_id, cycles in history.items():
        cycles.sort(key=lambda c: c["cycle_number"])
        latest = cycles[-1]
        real[battery_id] = {
            "soh_pct": latest["soh_pct"],
            "cycles": latest["cycle_number"],
            "max_temp_c": latest["max_temp_c"],
            "history": cycles,  # full real degradation curve
            "data_source": "real_nasa_pcoe",
        }
    return real


def seed_demo_data():
    # --- Suppliers (3-tier battery material network) -----------------
    GRAPH.upsert_supplier("SUP-CO-01", name="CobaltSource DRC Ltd", tier=1,
                           materials=["cobalt"], country="DRC",
                           concentration_share_pct=62, esg_score=41,
                           recent_deviation_flags=2)
    GRAPH.upsert_supplier("SUP-CO-02", name="Andes Cobalt Refiners", tier=1,
                           materials=["cobalt"], country="Chile",
                           concentration_share_pct=18, esg_score=78,
                           recent_deviation_flags=0)
    GRAPH.upsert_supplier("SUP-LI-01", name="Salar Lithium Corp", tier=1,
                           materials=["lithium"], country="Argentina",
                           concentration_share_pct=45, esg_score=71,
                           recent_deviation_flags=0)
    GRAPH.upsert_supplier("SUP-CELL-01", name="EastPack Cell Manufacturing",
                           tier=2, materials=["nmc_cell", "lfp_cell"],
                           country="China", concentration_share_pct=70,
                           esg_score=55, recent_deviation_flags=3)
    GRAPH.upsert_supplier("SUP-CELL-02", name="Bharat Cell Systems", tier=2,
                           materials=["lfp_cell"], country="India",
                           concentration_share_pct=30, esg_score=80,
                           recent_deviation_flags=0)

    # --- Vehicles: mixed diesel + EV intra-plant logistics fleet ------
    duty_profiles = [
        dict(daily_km=38, payload_pct=65, dwell_hrs=9, route_type="intra_plant"),
        dict(daily_km=112, payload_pct=80, dwell_hrs=4, route_type="regional_freight"),
        dict(daily_km=22, payload_pct=40, dwell_hrs=12, route_type="intra_plant"),
        dict(daily_km=180, payload_pct=90, dwell_hrs=2, route_type="long_haul"),
    ]
    real_batteries = _load_real_nasa_batteries()  # {} if nasa_processed.csv missing
    vehicle_to_nasa_battery = {v: k for k, v in NASA_BATTERY_TO_VEHICLE.items()}

    for i in range(1, 41):
        profile = random.choice(duty_profiles)
        vid = f"VEH-{i:03d}"
        is_ev = i <= 14  # 14 already electrified, 26 still diesel

        # SECOND PLANTED CONFLICT: VEH-004 carries the real B0018 battery,
        # which is the lowest-SOH real battery (~68%, near NASA's 70% EOL
        # threshold) AND we deliberately give it a long-haul route with a
        # 2-hour dwell window — high Carbon-Agent priority (highest mileage,
        # highest emissions offset) but almost no time for the maintenance
        # bay to actually service it. APM wants urgent action, Maintenance
        # Ops has nowhere to put it, Carbon wants it electrified/prioritized
        # first. See docs/demo_scenario.md for the narrative.
        if vid == "VEH-004":
            profile = dict(daily_km=195, payload_pct=88, dwell_hrs=2, route_type="long_haul")

        GRAPH.upsert_vehicle(
            vid, powertrain="EV" if is_ev else "diesel",
            **profile,
        )
        if is_ev:
            bid = f"BAT-{i:03d}"
            nasa_id = vehicle_to_nasa_battery.get(vid)
            if nasa_id and nasa_id in real_batteries:
                real = real_batteries[nasa_id]
                GRAPH.upsert_battery(
                    bid, vehicle_id=vid, chemistry="Li-ion (NASA PCoE)",
                    cell_supplier="SUP-CELL-01" if i % 3 == 0 else "SUP-CELL-02",
                    soh_pct=real["soh_pct"],
                    cycles=real["cycles"],
                    max_temp_c_observed=real["max_temp_c"],
                    avg_thermal_excursions_30d=random.randint(0, 4),
                    data_source="real_nasa_pcoe",
                    nasa_battery_id=nasa_id,
                )
            else:
                # Most synthetic batteries healthy; a cluster shows early degradation
                soh = random.uniform(88, 98) if i % 5 != 0 else random.uniform(74, 82)
                GRAPH.upsert_battery(
                    bid, vehicle_id=vid, chemistry="LFP",
                    cell_supplier="SUP-CELL-01" if i % 3 == 0 else "SUP-CELL-02",
                    soh_pct=round(soh, 1),
                    cycles=random.randint(300, 1400),
                    avg_thermal_excursions_30d=random.randint(0, 4),
                    data_source="synthetic",
                )

    # --- Emissions baseline -------------------------------------------
    GRAPH.emissions["baseline"] = {
        "scope1_tpa": 1840,   # diesel combustion, tonnes CO2e/year
        "scope3_tpa": 960,    # upstream battery material + logistics
        "target_reduction_pct_2030": 45,
    }

    GRAPH.log_event("system", "seed_complete", {"vehicles": 40, "suppliers": 5})
