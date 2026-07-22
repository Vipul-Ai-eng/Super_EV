"""
Validates SOH/RUL prediction accuracy against REAL NASA battery ground
truth. 

Method: for each battery, train on the first 70% of cycles, predict SOH
for the held-out last 30% using a simple linear-fade baseline, and report
RMSE against the actual measured SOH. Also reports RUL error: predicted
vs. actual cycle at which SOH crosses the 70% end-of-life threshold
(the standard NASA PCoE benchmark definition)."

The linear baseline here is intentionally simple — it's the floor
Claude-based APM agent should beat when it has more signal (temperature,
cycle count, thermal excursions) to reason over.

Usage:
    python data/validate_apm.py
"""

import csv
from collections import defaultdict

EOL_THRESHOLD_PCT = 70.0  # NASA PCoE standard end-of-life definition
INPUT_CSV = "data/nasa_processed.csv"


def load_data() -> dict[str, list[tuple[int, float]]]:
    by_battery = defaultdict(list)
    with open(INPUT_CSV) as f:
        for row in csv.DictReader(f):
            by_battery[row["battery_id"]].append(
                (int(row["cycle_number"]), float(row["soh_pct"]))
            )
    for b in by_battery:
        by_battery[b].sort()
    return by_battery


def linear_fit(points: list[tuple[int, float]]) -> tuple[float, float]:
    """Least-squares fit of soh = a*cycle + b. Returns (a, b)."""
    n = len(points)
    sx = sum(p[0] for p in points)
    sy = sum(p[1] for p in points)
    sxx = sum(p[0] ** 2 for p in points)
    sxy = sum(p[0] * p[1] for p in points)
    denom = (n * sxx - sx ** 2) or 1e-9
    a = (n * sxy - sx * sy) / denom
    b = (sy - a * sx) / n
    return a, b


def rmse(errors: list[float]) -> float:
    return (sum(e ** 2 for e in errors) / len(errors)) ** 0.5 if errors else float("nan")


def first_crossing_cycle(points: list[tuple[int, float]], threshold: float) -> int | None:
    for cycle, soh in points:
        if soh <= threshold:
            return cycle
    return None


def main():
    by_battery = load_data()
    print(f"{'Battery':<8} {'Train/Test split':<18} {'SOH RMSE (pp)':<16} {'Actual EOL cyc':<15} {'Predicted EOL cyc':<18} {'RUL error (cycles)'}")

    all_soh_errors = []
    all_rul_errors = []

    for battery, points in sorted(by_battery.items()):
        split_idx = int(len(points) * 0.7)
        train, test = points[:split_idx], points[split_idx:]
        if len(train) < 2 or not test:
            continue

        a, b = linear_fit(train)
        soh_errors = [abs((a * cyc + b) - actual) for cyc, actual in test]
        all_soh_errors.extend(soh_errors)

        actual_eol = first_crossing_cycle(points, EOL_THRESHOLD_PCT)
        # solve a*cycle + b = threshold for predicted crossing cycle
        predicted_eol = int((EOL_THRESHOLD_PCT - b) / a) if a != 0 else None

        rul_error = None
        if actual_eol is not None and predicted_eol is not None:
            rul_error = abs(predicted_eol - actual_eol)
            all_rul_errors.append(rul_error)

        print(f"{battery:<8} {f'{len(train)}/{len(test)}':<18} {rmse(soh_errors):<16.2f} "
              f"{str(actual_eol):<15} {str(predicted_eol):<18} {rul_error}")

    print()
    print(f"OVERALL SOH RMSE across all batteries: {rmse(all_soh_errors):.2f} percentage points")
    if all_rul_errors:
        print(f"OVERALL mean RUL error: {sum(all_rul_errors)/len(all_rul_errors):.1f} cycles")


if __name__ == "__main__":
    main()
