#!/usr/bin/env python3
"""
Build a year->international (developed ex‑US) total return JSON series.

Primary free source:
- Ken French Data Library: "Developed ex US Market" monthly returns (value‑weighted, dividends included).
  We'll scrape the Data Library page to locate the CSV/ZIP link dynamically, download it,
  parse the monthly total returns, and compound to annual returns.

Why French instead of MSCI EAFE directly?
- MSCI EAFE (1970+) is the standard ex‑US developed benchmark, but the full historical TR table is not
  freely downloadable from MSCI. The Ken French "Developed ex US Market" series is a high‑quality,
  widely used free proxy that tracks the same economic concept (developed markets outside the US) and
  includes reinvested dividends.

Output:
- intl_exus_total_returns.json: {"1975": 0.25, "1976": 0.17, ...} decimal total returns.
- Years before first availability are set to null by default.

Usage:
    pip install requests beautifulsoup4 lxml pandas
    python build_intl_exus_returns.py --out intl_exus_total_returns.json --start-year 1970 --end-year 2025
"""
import argparse
import datetime as dt
import io
import json
import re
import sys
import zipfile
from typing import Dict, Optional

import requests
from bs4 import BeautifulSoup
import pandas as pd

FRENCH_PAGE = "https://mba.tuck.dartmouth.edu/pages/faculty/ken.french/data_library.html"


def find_developed_ex_us_csv_zip_url() -> str:
    """Locate the CSV/ZIP link for 'Developed ex US Market' on the Ken French page."""
    r = requests.get(FRENCH_PAGE, timeout=30)
    r.raise_for_status()
    soup = BeautifulSoup(r.text, "lxml")

    candidates = []
    for a in soup.find_all("a", href=True):
        href = a["href"]
        text = a.get_text(" ", strip=True) or ""
        parent_txt = a.parent.get_text(" ", strip=True) if a.parent else ""
        ctx = (text + " " + parent_txt).lower()
        if href.lower().endswith(".zip") and ("developed" in ctx) and ("ex" in ctx and "us" in ctx):
            candidates.append(requests.compat.urljoin(FRENCH_PAGE, href))

    if not candidates:
        # fallback: filename contains developed/ex_us
        for a in soup.find_all("a", href=True):
            href = a["href"]
            low = href.lower()
            if low.endswith(".zip") and ("developed" in low) and ("ex" in low and "us" in low):
                candidates.append(requests.compat.urljoin(FRENCH_PAGE, href))

    if not candidates:
        raise RuntimeError("Could not locate the 'Developed ex US' monthly CSV/ZIP on the Ken French page.")

    # Prefer a link with 'monthly' or 'csv' in it
    def score(u: str) -> int:
        s = 0
        if "monthly" in u.lower(): s += 2
        if "csv" in u.lower(): s += 1
        return s

    return sorted(candidates, key=score, reverse=True)[0]


def load_developed_ex_us_monthly() -> pd.DataFrame:
    """
    Download and parse the Developed ex US Market monthly file.
    Robustly extract YYYYMM and monthly return using regex; skip NA placeholders like -99.99.
    """
    url = find_developed_ex_us_csv_zip_url()
    resp = requests.get(url, timeout=60)
    resp.raise_for_status()

    z = zipfile.ZipFile(io.BytesIO(resp.content))
    member = None
    for name in z.namelist():
        low = name.lower()
        if low.endswith(".csv") or low.endswith(".txt"):
            member = name
            break
    if member is None:
        raise RuntimeError("ZIP did not contain a CSV/TXT file.")

    raw = z.read(member).decode("latin-1", errors="ignore")
    # Normalize non-breaking spaces and tabs
    raw = raw.replace("\u00a0", " ").replace("\t", " ")
    lines = raw.splitlines()

    rows = []
    # Capture lines that start with 6-digit year-month and the first number after
    pat = re.compile(r"^\s*(\d{6})\D+(-?\d+(?:\.\d+)?)")
    for ln in lines:
        m = pat.search(ln)
        if not m:
            continue
        yyyymm = m.group(1)
        try:
            val = float(m.group(2))
        except Exception:
            continue
        # Skip placeholder NA codes (e.g., -99.99)
        if val <= -90.0:
            continue
        rows.append((yyyymm, val))

    if not rows:
        raise RuntimeError("Could not find any YYYYMM rows in Ken French file.")

    df = pd.DataFrame(rows, columns=["YYYYMM", "RET"])

    # Convert percent -> decimal if needed (median abs > 1 implies percent)
    med = float(df["RET"].abs().median())
    if med > 1.0:
        df["RET"] = df["RET"] / 100.0

    return df.reset_index(drop=True)


def monthly_to_annual(monthly_df: pd.DataFrame) -> Dict[int, float]:
    """Compound monthly decimal returns to calendar-year total returns (only full years)."""
    out: Dict[int, float] = {}
    m = monthly_df.copy()
    m["YYYY"] = m["YYYYMM"].str[:4].astype(int)
    for y, grp in m.groupby("YYYY"):
        if grp.shape[0] >= 12:
            out[y] = float((1.0 + grp["RET"]).prod() - 1.0)
    return out


def build_series(start_year: int, end_year: int) -> Dict[str, Optional[float]]:
    monthly = load_developed_ex_us_monthly()
    annual = monthly_to_annual(monthly)
    out: Dict[str, Optional[float]] = {}
    for y in range(start_year, end_year + 1):
        out[str(y)] = round(annual[y], 6) if y in annual else None
    return out


def main():
    ap = argparse.ArgumentParser(description="Build international (developed ex‑US) total return JSON via Ken French.")
    ap.add_argument("--out", default="intl_exus_total_returns.json", help="Output JSON filename.")
    ap.add_argument("--start-year", type=int, default=1970, help="Start year for the series.")
    ap.add_argument("--end-year", type=int, default=dt.date.today().year, help="End year (inclusive).")
    args = ap.parse_args()

    series = build_series(args.start_year, args.end_year)
    with open(args.out, "w", encoding="utf-8") as f:
        json.dump(series, f, indent=2, sort_keys=True)
    print(f"Wrote {args.out} with {len(series)} years.")

if __name__ == "__main__":
    main()
