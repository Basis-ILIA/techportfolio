#!/usr/bin/env python3
"""
fetch-q2-update.py
==================
Fetches live Q2 progress data from Aha! Roadmaps and rewrites the
Q2_DATA block inside q2-portfolio-update.html so the static site
always reflects the latest numbers without any backend.

USAGE
-----
    python fetch-q2-update.py

ENVIRONMENT
-----------
    AHA_API_KEY     Your Aha! REST API key  (required)
    AHA_SUBDOMAIN   Your Aha! subdomain     (required, e.g. "sitescout")
    AHA_PRODUCT_ID  Aha! product line ID    (default: BTPDW)

AUTOMATION
----------
GitHub Actions example (.github/workflows/sync-aha-q2.yml):

    name: Sync Aha Q2 Data
    on:
      schedule:
        - cron: '0 6 * * *'   # 06:00 UTC every day
      workflow_dispatch:       # allow manual trigger
    jobs:
      sync:
        runs-on: ubuntu-latest
        steps:
          - uses: actions/checkout@v4
          - uses: actions/setup-python@v5
            with:
              python-version: '3.11'
          - name: Install deps
            run: pip install requests
          - name: Run sync
            env:
              AHA_API_KEY:    ${{ secrets.AHA_API_KEY }}
              AHA_SUBDOMAIN:  ${{ secrets.AHA_SUBDOMAIN }}
              AHA_PRODUCT_ID: BTPDW
            run: python fetch-q2-update.py
          - name: Commit updated page
            run: |
              git config user.name  "github-actions[bot]"
              git config user.email "github-actions[bot]@users.noreply.github.com"
              git add q2-portfolio-update.html
              git diff --cached --quiet || git commit -m "chore: sync Q2 data $(date -u +%Y-%m-%d)"
              git push

WHAT IT DOES
------------
1. Hits the Aha! API to pull features for the Q2-Q3 timeframe.
2. Computes:
   - shipped_q2   (Released GA/Beta/Internal with release date in Q2)
   - planned_june (features due in June not yet released)
   - roadmap_pct  (released / total * 100)
   - per-stream done/total/in_dev counts
   - goal progress percentages
3. Rebuilds the Q2_DATA JSON literal between the
   // Q2_DATA_START  ...  // Q2_DATA_END  markers in
   q2-portfolio-update.html.
4. The HTML page renders everything from that data block, so no
   other files need to change.
"""

import json
import os
import re
import sys
import time
import datetime
from typing import Any

try:
    import requests
except ImportError:
    print("ERROR: 'requests' is not installed. Run: pip install requests")
    sys.exit(1)


# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------
AHA_API_KEY    = os.environ.get("AHA_API_KEY", "")
AHA_SUBDOMAIN  = os.environ.get("AHA_SUBDOMAIN", "sitescout")
AHA_PRODUCT_ID = os.environ.get("AHA_PRODUCT_ID", "BTPDW")
HTML_FILE      = os.path.join(os.path.dirname(__file__), "q2-portfolio-update.html")

TIMEFRAME_TAG  = "26Q2-26Q3"   # matches the Aha custom field used in combined-data.json

RELEASED_STATUSES = {"Released - GA", "Released - Beta", "Released - Internal"}

# Q2 date window (inclusive)
Q2_START = datetime.date(2026, 4, 1)
Q2_END   = datetime.date(2026, 6, 30)

# Feature statuses that count as "in development"
IN_DEV_STATUSES = {
    "Development", "PED", "PRD", "PSD",
}


# ---------------------------------------------------------------------------
# Aha! API helpers
# ---------------------------------------------------------------------------
BASE_URL = f"https://{AHA_SUBDOMAIN}.aha.io/api/v1"

HEADERS = {
    "Authorization": f"Bearer {AHA_API_KEY}",
    "Content-Type": "application/json",
    "Accept": "application/json",
}


def aha_get(path: str, params: dict | None = None) -> dict:
    """GET from Aha REST API with simple retry logic."""
    url = BASE_URL + path
    for attempt in range(3):
        resp = requests.get(url, headers=HEADERS, params=params, timeout=30)
        if resp.status_code == 429:
            wait = int(resp.headers.get("Retry-After", "10"))
            print(f"  Rate-limited, waiting {wait}s ...")
            time.sleep(wait)
            continue
        resp.raise_for_status()
        return resp.json()
    raise RuntimeError(f"Failed after retries: GET {url}")


def paginate_features(product_id: str, extra_params: dict | None = None) -> list[dict]:
    """Fetch all features for a product, handling pagination."""
    features: list[dict] = []
    page = 1
    per_page = 200
    params = {"page": page, "per_page": per_page, **(extra_params or {})}
    while True:
        params["page"] = page
        data = aha_get(f"/products/{product_id}/features", params=params)
        batch = data.get("features", [])
        features.extend(batch)
        print(f"  Fetched page {page}: {len(batch)} features (total so far: {len(features)})")
        if len(batch) < per_page:
            break
        page += 1
        time.sleep(0.3)   # be polite to the API
    return features


# ---------------------------------------------------------------------------
# Feature processing helpers
# ---------------------------------------------------------------------------
def parse_date(s: str | None) -> datetime.date | None:
    if not s:
        return None
    for fmt in ("%Y-%m-%d", "%Y-%m-%dT%H:%M:%S.%fZ", "%Y-%m-%dT%H:%M:%SZ"):
        try:
            return datetime.datetime.strptime(s[:19], fmt[:len(s[:19])]).date()
        except ValueError:
            pass
    # try just first 10 chars
    try:
        return datetime.date.fromisoformat(s[:10])
    except ValueError:
        return None


def in_q2(feature: dict) -> bool:
    """True if the feature was released in Q2 (April - June 2026)."""
    status = feature.get("workflow_status", {}).get("name", "")
    if status not in RELEASED_STATUSES:
        return False
    # check status_changed_at or due_date
    for key in ("status_changed_at", "due_date", "end_date"):
        d = parse_date(feature.get(key))
        if d and Q2_START <= d <= Q2_END:
            return True
    return False


def planned_for_june(feature: dict) -> bool:
    """True if planned/in progress AND due date falls in June."""
    status = feature.get("workflow_status", {}).get("name", "")
    if status in RELEASED_STATUSES:
        return False
    d = parse_date(feature.get("due_date"))
    if d and datetime.date(2026, 6, 1) <= d <= Q2_END:
        return True
    return False


def get_stream_name(feature: dict) -> str:
    """Extract stream name from Aha initiative/custom field."""
    # try Product Stream custom field first
    for cf in feature.get("custom_fields", []) or []:
        if cf.get("key") == "product_stream" or cf.get("name") == "Product Stream":
            val = cf.get("value") or ""
            if val:
                return val.strip()
    # fall back to first initiative
    inits = feature.get("initiatives", []) or []
    if inits:
        return inits[0].get("name", "Unknown").strip()
    return "Unknown"


def get_custom_field(feature: dict, key: str) -> Any:
    for cf in feature.get("custom_fields", []) or []:
        if cf.get("key") == key or cf.get("name") == key:
            return cf.get("value")
    return None


def is_in_timeframe(feature: dict) -> bool:
    """True if the feature belongs to the 26Q2-26Q3 timeframe."""
    tf = get_custom_field(feature, "Timeframe") or get_custom_field(feature, "timeframe") or ""
    # also accept features with Q2 or Q3 releases
    release = feature.get("release", {})
    release_name = ""
    if isinstance(release, dict):
        release_name = release.get("name", "")
    return (
        TIMEFRAME_TAG in str(tf)
        or "26Q2" in release_name
        or "26Q3" in release_name
        or "2026 Q2" in release_name
        or "2026 Q3" in release_name
        or "Q2-Q3" in release_name
        or "Automation Q2" in release_name
        or "DSP Q2" in release_name
    )


def get_marketing_tier(feature: dict) -> str:
    tier_map = {
        "tier 1": "Signature Feature",
        "signature": "Signature Feature",
        "tier 2": "Core Feature",
        "core": "Core Feature",
        "tier 3": "Enhancement",
        "enhancement": "Enhancement",
        "internal": "Internal",
    }
    raw = (
        get_custom_field(feature, "Marketing Tier")
        or get_custom_field(feature, "marketing_tier")
        or get_custom_field(feature, "Tier")
        or ""
    )
    raw_l = str(raw).lower()
    for k, v in tier_map.items():
        if k in raw_l:
            return v
    return "Enhancement"


# ---------------------------------------------------------------------------
# Main fetch + compute logic
# ---------------------------------------------------------------------------
def fetch_and_compute() -> dict:
    print(f"\nFetching features for product: {AHA_PRODUCT_ID}")
    all_features = paginate_features(AHA_PRODUCT_ID)
    print(f"Total features fetched: {len(all_features)}")

    # Filter to Q2-Q3 timeframe features
    timeframe_features = [f for f in all_features if is_in_timeframe(f)]
    print(f"Features in Q2-Q3 timeframe: {len(timeframe_features)}")

    total_projects = len(timeframe_features)
    if total_projects == 0:
        print("WARNING: No timeframe features found. Check AHA_PRODUCT_ID and timeframe config.")

    # Released counts
    released = [f for f in timeframe_features if f.get("workflow_status", {}).get("name") in RELEASED_STATUSES]
    shipped_q2_features = [f for f in timeframe_features if in_q2(f)]
    june_planned = [f for f in timeframe_features if planned_for_june(f)]
    in_dev = [f for f in timeframe_features if f.get("workflow_status", {}).get("name") in IN_DEV_STATUSES]

    roadmap_pct = round(len(released) / total_projects * 100) if total_projects else 0

    # Per-stream aggregation
    stream_stats: dict[str, dict] = {}
    for f in timeframe_features:
        sname = get_stream_name(f)
        if sname not in stream_stats:
            stream_stats[sname] = {"done": 0, "total": 0, "in_dev": 0}
        stream_stats[sname]["total"] += 1
        status = f.get("workflow_status", {}).get("name", "")
        if status in RELEASED_STATUSES:
            stream_stats[sname]["done"] += 1
        if status in IN_DEV_STATUSES:
            stream_stats[sname]["in_dev"] += 1

    streams_list = sorted(
        [{"name": k, **v} for k, v in stream_stats.items()],
        key=lambda x: (-x["done"], -x["in_dev"], x["name"])
    )

    # Build release tables (recently released in Q2)
    def build_release_row(f: dict) -> dict:
        status_name = f.get("workflow_status", {}).get("name", "")
        status_short = (
            "GA"       if status_name == "Released - GA"       else
            "Beta"     if status_name == "Released - Beta"     else
            "Internal" if status_name == "Released - Internal" else
            "Planned"
        )
        due = parse_date(f.get("due_date"))
        date_str = due.strftime("%-m/%-d") if due else ""
        return {
            "name":   f.get("name", ""),
            "stream": get_stream_name(f),
            "status": status_short,
            "tier":   get_marketing_tier(f),
            "date":   date_str,
        }

    april_features = [f for f in shipped_q2_features if (lambda d: d and d.month == 4)(parse_date(f.get("due_date") or f.get("status_changed_at")))]
    may_features   = [f for f in shipped_q2_features if (lambda d: d and d.month == 5)(parse_date(f.get("due_date") or f.get("status_changed_at")))]
    june_released  = [f for f in shipped_q2_features if (lambda d: d and d.month == 6)(parse_date(f.get("due_date") or f.get("status_changed_at")))]

    # Signature features for June
    sig_june = [
        f for f in june_planned
        if get_marketing_tier(f) == "Signature Feature"
    ]
    signature_june = []
    for f in sig_june:
        due = parse_date(f.get("due_date"))
        signature_june.append({
            "name":   f.get("name", ""),
            "stream": get_stream_name(f),
            "date":   f"Jun {due.day}" if due else "Jun",
        })

    # Fetch goal (key results) progress
    goals_list = fetch_goals(AHA_PRODUCT_ID)

    return {
        "meta": {
            "generated":     datetime.date.today().isoformat(),
            "shipped_q2":    len(shipped_q2_features),
            "planned_june":  len(june_planned),
            "roadmap_pct":   roadmap_pct,
            "goals_complete": sum(1 for g in goals_list if g["pct"] == 100),
            "goals_total":    len(goals_list),
            "total_projects": total_projects,
            "in_development": len(in_dev),
        },
        "signature_june": signature_june[:3],   # top 3 sig features
        "streams": streams_list,
        "goals":   goals_list,
        "releases": {
            "april": [build_release_row(f) for f in april_features],
            "may":   [build_release_row(f) for f in may_features],
            "june":  (
                [build_release_row(f) for f in june_released] +
                [build_release_row(f) for f in june_planned]
            ),
        },
        "glossary": [
            {"term": "Beta",                  "def": "Available to a limited set of customers for early access and feedback before full release."},
            {"term": "GA (Generally Available)", "def": "Released to all customers. Fully shipped and accessible in production."},
            {"term": "Goal",                  "def": "A specific outcome a stream is working to achieve, expressed as a measurable statement."},
            {"term": "Internal Release",      "def": "Deployed to production but limited to internal use. Not customer-facing and will not be promoted to GA."},
            {"term": "KR (Key Result)",       "def": "A specific, measurable outcome that defines success for a given Product Objective."},
            {"term": "PO (Product Objective)","def": "A high-level strategic objective for the product organization (e.g. PO-1, PO-2)."},
            {"term": "Q2-Q3 Roadmap",         "def": "The summer 2026 product roadmap covering Q2 (April - June) and Q3 (July - September)."},
            {"term": "Stream",                "def": "A logical grouping of related projects aligned to a product or technology area."},
            {"term": "Supporting Metric",     "def": "A leading indicator tracked alongside a Key Result to monitor progress."},
            {"term": "Tier 1 - Signature Feature", "def": "The highest-priority customer-facing releases with planned marketing and launch support."},
            {"term": "Tier 2 - Core Feature", "def": "Significant customer-facing releases that deliver meaningful product value."},
            {"term": "Tier 3 - Enhancement",  "def": "Incremental improvements, fixes, and smaller additions. Released without a formal launch campaign."},
        ],
    }


def fetch_goals(product_id: str) -> list[dict]:
    """
    Fetch goals (key results) from Aha! and compute % complete.
    Returns a simplified list suitable for the goals table.
    """
    goals: list[dict] = []
    try:
        page = 1
        while True:
            data = aha_get(f"/products/{product_id}/goals", params={"page": page, "per_page": 200})
            batch = data.get("goals", [])
            if not batch:
                break
            for g in batch:
                # Each goal may have child records (features linked via goal_refs)
                name = g.get("name", "")
                # progress can come from Aha's own progress field or linked features
                progress = g.get("progress", 0) or 0
                total_f = g.get("total_features_count", 0) or 0
                done_f  = g.get("done_features_count",  0) or 0
                pct = round(progress) if progress else (round(done_f / total_f * 100) if total_f else 0)
                goals.append({
                    "pct":   pct,
                    "name":  name,
                    "stream": "",   # Aha goals don't always have a stream field; left blank
                    "done":  done_f,
                    "total": total_f,
                    "watch": False,
                })
            if len(batch) < 200:
                break
            page += 1
            time.sleep(0.3)
    except Exception as exc:
        print(f"  WARNING: Could not fetch goals ({exc}). Using empty list.")
    return sorted(goals, key=lambda g: -g["pct"])


# ---------------------------------------------------------------------------
# HTML rewrite
# ---------------------------------------------------------------------------
START_MARKER = "// Q2_DATA_START"
END_MARKER   = "// Q2_DATA_END"


def rewrite_html(data: dict) -> None:
    with open(HTML_FILE, "r", encoding="utf-8") as fh:
        content = fh.read()

    pattern = re.compile(
        re.escape(START_MARKER) + r".*?" + re.escape(END_MARKER),
        re.DOTALL
    )

    json_str = json.dumps(data, ensure_ascii=False, indent=2)
    replacement = f"{START_MARKER}\nconst Q2_DATA = {json_str};\n{END_MARKER}"

    new_content, n = pattern.subn(replacement, content)
    if n == 0:
        print(f"ERROR: Could not find markers in {HTML_FILE}")
        print(f"  Expected:  {START_MARKER} ... {END_MARKER}")
        sys.exit(1)

    with open(HTML_FILE, "w", encoding="utf-8") as fh:
        fh.write(new_content)

    print(f"\nUpdated: {HTML_FILE}")
    print(f"  Generated:       {data['meta']['generated']}")
    print(f"  Shipped Q2:      {data['meta']['shipped_q2']}")
    print(f"  Planned June:    {data['meta']['planned_june']}")
    print(f"  Roadmap %:       {data['meta']['roadmap_pct']}%")
    print(f"  Goals complete:  {data['meta']['goals_complete']}/{data['meta']['goals_total']}")
    print(f"  Streams:         {len(data['streams'])}")


# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------
if __name__ == "__main__":
    if not AHA_API_KEY:
        print("ERROR: AHA_API_KEY environment variable is not set.")
        print("  Set it before running:")
        print("    export AHA_API_KEY=your_key_here")
        sys.exit(1)

    print("=" * 60)
    print("  fetch-q2-update.py - Aha! Q2 Portfolio Sync")
    print("=" * 60)
    print(f"  Subdomain:   {AHA_SUBDOMAIN}.aha.io")
    print(f"  Product:     {AHA_PRODUCT_ID}")
    print(f"  HTML target: {HTML_FILE}")
    print(f"  Timeframe:   {TIMEFRAME_TAG}")
    print()

    try:
        data = fetch_and_compute()
        rewrite_html(data)
        print("\nDone. Commit and push to deploy the updated page.")
    except requests.HTTPError as exc:
        print(f"\nHTTP ERROR: {exc}")
        print("  Check that AHA_API_KEY is valid and AHA_SUBDOMAIN is correct.")
        sys.exit(1)
    except Exception as exc:
        print(f"\nUNEXPECTED ERROR: {exc}")
        raise
