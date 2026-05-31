"""
DriveKaki — LTA data updater
Run: python update_lta_data.py

Edit the WAITING_TIMES and BENCHMARKS dicts below with new LTA data,
then run. The script upserts — safe to run multiple times.

LTA publishes:
  - Waiting times: monthly (check lta.gov.sg)
  - Pass rates: annually (Feb–Jan period)
  - Individual instructor rates: annually

Required env vars (or edit directly below):
  SUPABASE_URL
  SUPABASE_SERVICE_KEY   ← use SERVICE key, not anon key
"""

import os
import sys
from supabase import create_client

SUPABASE_URL = os.environ.get("SUPABASE_URL", "")
SUPABASE_KEY = os.environ.get("SUPABASE_SERVICE_KEY", "")

if not SUPABASE_URL or not SUPABASE_KEY:
    print("ERROR: Set SUPABASE_URL and SUPABASE_SERVICE_KEY env vars")
    sys.exit(1)

sb = create_client(SUPABASE_URL, SUPABASE_KEY)

# ─────────────────────────────────────────────────────────────────────────────
# EDIT THIS SECTION each time LTA publishes new data
# ─────────────────────────────────────────────────────────────────────────────

# Latest month from LTA waiting time table — change "Feb-26" to new month
NEW_MONTH = "Feb-26"

# Format: (test_type, centre, is_private_lane, waiting_months)
# Get from: lta.gov.sg → Driving Licence → Practical Test Waiting Time
NEW_WAITING_TIMES = [
    # BTT school lane
    ("BTT", "SSDC", False, 0.9),
    ("BTT", "BBDC", False, 0.3),
    ("BTT", "CDC",  False, 0.2),
    # BTT private lane
    ("BTT", "SSDC", True, 0.9),
    ("BTT", "BBDC", True, 0.3),
    ("BTT", "CDC",  True, 0.2),
    # FTT school lane
    ("FTT", "SSDC", False, 0.5),
    ("FTT", "BBDC", False, 0.3),
    ("FTT", "CDC",  False, 0.2),
    # FTT private lane
    ("FTT", "SSDC", True, 0.5),
    ("FTT", "BBDC", True, 0.3),
    ("FTT", "CDC",  True, 0.2),
    # RTT
    ("RTT", "SSDC", False, 0.5),
    ("RTT", "BBDC", False, 0.4),
    ("RTT", "CDC",  False, 0.6),
    # Class 3 school lane
    ("Class 3", "SSDC", False, 0.5),
    ("Class 3", "BBDC", False, 0.4),
    ("Class 3", "CDC",  False, 1.1),
    # Class 3 private lane
    ("Class 3", "SSDC", True, 0.5),
    ("Class 3", "BBDC", True, 0.6),
    ("Class 3", "CDC",  True, 0.5),
    # Class 3A school lane
    ("Class 3A", "SSDC", False, 0.8),
    ("Class 3A", "BBDC", False, 0.4),
    ("Class 3A", "CDC",  False, 0.9),
    # Class 3A private lane
    ("Class 3A", "SSDC", True, 0.5),
    ("Class 3A", "BBDC", True, 0.6),
    ("Class 3A", "CDC",  True, 0.5),
    # Class 2B
    ("Class 2B", "SSDC", False, 0.5),
    ("Class 2B", "BBDC", False, 1.0),
    ("Class 2B", "CDC",  False, 1.5),
    # Class 2A
    ("Class 2A", "SSDC", False, 1.0),
    ("Class 2A", "BBDC", False, 1.0),
    ("Class 2A", "CDC",  False, 1.1),
    # Class 2
    ("Class 2", "SSDC", False, 0.7),
    ("Class 2", "BBDC", False, 1.2),
    ("Class 2", "CDC",  False, 1.7),
]

# Only update benchmarks when LTA publishes a new annual report
# Set to None to skip benchmark update
NEW_BENCHMARKS_PERIOD = None  # e.g. "Feb 26 – Jan 27" when new data is out
NEW_BENCHMARKS = []           # Fill in when period changes

# ─────────────────────────────────────────────────────────────────────────────

def upsert_waiting_times():
    rows = [
        {
            "test_type": tt,
            "centre": centre,
            "is_private_lane": priv,
            "month": NEW_MONTH,
            "waiting_months": months,
            "updated_at": "now()",
        }
        for tt, centre, priv, months in NEW_WAITING_TIMES
    ]
    res = sb.table("test_waiting_times").upsert(
        rows,
        on_conflict="test_type,centre,is_private_lane,month"
    ).execute()
    print(f"✓ Upserted {len(rows)} waiting time rows for {NEW_MONTH}")

def upsert_benchmarks():
    if not NEW_BENCHMARKS_PERIOD or not NEW_BENCHMARKS:
        print("  Skipping benchmarks — no new period set")
        return
    rows = [
        {
            "test_type": tt,
            "centre": centre,
            "is_retest": retest,
            "period": NEW_BENCHMARKS_PERIOD,
            "total_tested": tested,
            "total_passed": passed,
            "pass_pct": pct,
            "updated_at": "now()",
        }
        for tt, centre, retest, tested, passed, pct in NEW_BENCHMARKS
    ]
    res = sb.table("national_benchmarks").upsert(
        rows,
        on_conflict="test_type,centre,is_retest,period"
    ).execute()
    print(f"✓ Upserted {len(rows)} benchmark rows for {NEW_BENCHMARKS_PERIOD}")

if __name__ == "__main__":
    print(f"Updating LTA data for {NEW_MONTH}...")
    upsert_waiting_times()
    upsert_benchmarks()
    print("Done.")
