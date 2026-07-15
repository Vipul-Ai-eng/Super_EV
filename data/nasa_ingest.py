"""
Ingests the NASA Ames PCoE Li-ion Battery Aging dataset from the official
.mat files and produces a clean CSV of capacity/SOH data per cycle.

Source:
    https://phm-datasets.s3.amazonaws.com/NASA/5.+Battery+Data+Set.zip
    Folder: "1. BatteryAgingARC-FY08Q4"
    Files used: B0005.mat, B0006.mat, B0007.mat, B0018.mat

Citation:
    B. Saha and K. Goebel (2007). "Battery Data Set", NASA Prognostics
    Data Repository, NASA Ames Research Center, Moffett Field, CA.

Each discharge cycle in the .mat files includes a precomputed Capacity
field (Ahr), measured down to a per-battery cutoff voltage (2.7V, 2.5V,
2.2V) as documented in NASA's README. This script reads that field
directly rather than deriving capacity from raw current/time telemetry.

Rated capacity: 2.0 Ah. End-of-life criterion (per NASA's documentation):
30% fade, i.e. capacity drops from 2.0 Ah to 1.4 Ah (= 70% SOH). This
matches the 70% threshold used in validate_apm.py.

Setup:
    pip install scipy
    Download the zip above, extract "1. BatteryAgingARC-FY08Q4", and
    place B0005.mat, B0006.mat, B0007.mat, B0018.mat into
    data/_nasa_official/

Usage:
    python data/nasa_ingest.py

Output:
    data/nasa_processed.csv
"""

import csv
import os

import scipy.io as sio

BATTERIES = ["B0005", "B0006", "B0007", "B0018"]
RATED_CAPACITY_AH = 2.0
RAW_DIR = os.path.join(os.path.dirname(__file__), "_nasa_official")
OUTPUT_CSV = os.path.join(os.path.dirname(__file__), "nasa_processed.csv")


def process_battery(battery_id: str) -> list[dict]:
    path = os.path.join(RAW_DIR, f"{battery_id}.mat")
    if not os.path.exists(path):
        print(f"WARNING: {path} not found, skipping {battery_id}")
        return []

    mat = sio.loadmat(path, simplify_cells=True)
    cycles = mat[battery_id]["cycle"]

    rows = []
    discharge_cycle_number = 0
    for c in cycles:
        if c["type"] != "discharge":
            continue
        discharge_cycle_number += 1
        d = c["data"]

        capacity_ah = float(d["Capacity"])
        temps = d.get("Temperature_measured", [])
        voltages = d.get("Voltage_measured", [])

        rows.append({
            "battery_id": battery_id,
            "cycle_number": discharge_cycle_number,
            "capacity_ah": round(capacity_ah, 4),
            "soh_pct": round(100 * capacity_ah / RATED_CAPACITY_AH, 2),
            "max_temp_c": round(max(temps), 2) if len(temps) else None,
            "avg_temp_c": round(sum(temps) / len(temps), 2) if len(temps) else None,
            "min_voltage_v": round(min(voltages), 3) if len(voltages) else None,
        })
    return rows


def main():
    all_rows = []
    for battery_id in BATTERIES:
        rows = process_battery(battery_id)
        all_rows.extend(rows)
        if rows:
            print(f"  {battery_id}: {len(rows)} discharge cycles, "
                  f"SOH {rows[0]['soh_pct']:.1f}% -> {rows[-1]['soh_pct']:.1f}%")

    if not all_rows:
        print(f"No data processed — check that .mat files are in {RAW_DIR}")
        return

    with open(OUTPUT_CSV, "w", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=[
            "battery_id", "cycle_number", "capacity_ah", "soh_pct",
            "max_temp_c", "avg_temp_c", "min_voltage_v",
        ])
        writer.writeheader()
        writer.writerows(all_rows)

    print(f"\nWrote {len(all_rows)} rows to {OUTPUT_CSV}")


if __name__ == "__main__":
    main()