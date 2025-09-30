#!/usr/bin/env python3
"""
Build a year->bond total return JSON series (1900 -> present).

Sources fetched at runtime:
- 1976 -> present: Bloomberg U.S. Aggregate Bond Index annual returns
  (scraped from a public table maintained at https://www.upmyinterest.com/bloomberg-us-aggregate-bonds/).
- 1928 -> present (backup / pre-1976): Aswath Damodaran's "Stocks, Bonds, Bills & Inflation"
  10-Year Treasury Bond total returns (https://www.stern.nyu.edu/~adamodar/pc/datasets/histretSP.xls).
  Used for 1928-1975 and for any missing years after 1976 if the Agg source is unavailable for a given year.

Note on 1900-1927:
- Free, reliable, machine-readable U.S. bond *total return* series before 1928 are hard to source publicly.
- This script will leave 1900-1927 as null by default. You may override via a custom CSV to backfill.

Output:
- us_bond_total_returns.json: {"1900": null, "1901": null, ..., "2024": 0.017, ...}
  Returns are decimals (e.g., 0.075 = +7.5%).

Usage:
    python build_bond_returns.py [--out us_bond_total_returns.json] [--fill-missing-with damodaran|none]
    python build_bond_returns.py --help

Requirements:
    pip install requests beautifulsoup4 lxml pandas openpyxl
"""
import argparse
import datetime as dt
import io
import json
import re
import sys
from typing import Dict, Optional, List, Tuple, Any

import requests
from bs4 import BeautifulSoup
import pandas as pd
import numpy as np

AGG_URL = "https://www.upmyinterest.com/bloomberg-us-aggregate-bonds/"
DAMODARAN_XLS_URL = "https://www.stern.nyu.edu/~adamodar/pc/datasets/histretSP.xls"


def _normalize_percent_or_decimal(raw: Dict[int, float]) -> Dict[int, float]:
    """Detect if a numeric series is in percent (typical for tables) or decimal.
    Heuristic: if median absolute value > 1.0, treat as percent and divide by 100.
    Then apply a safety pass: if any |v| > 0.5 (50%), divide that entry by 100 as it's implausible for bonds.
    """
    if not raw:
        return raw
    import numpy as _np
    med = _np.median([abs(v) for v in raw.values()])
    if med > 1.0:
        raw = {y: v/100.0 for y, v in raw.items()}
    # Safety pass for stray mis-scaled values
    fixed = {}
    for y, v in raw.items():
        if v is None:
            fixed[y] = None
            continue
        fixed[y] = v/100.0 if abs(v) > 0.5 else v
    return fixed

def fetch_agg_returns() -> Dict[int, float]:
    """Scrape Bloomberg U.S. Aggregate Bond Index annual total returns (1976 -> present)."""
    resp = requests.get(AGG_URL, timeout=30)
    resp.raise_for_status()
    soup = BeautifulSoup(resp.text, "lxml")

    raw: Dict[int, float] = {}

    text = soup.get_text(" ", strip=True)
    pattern = re.compile(r"(19[7-9]\d|20\d{2})\s+(-?\d+(?:\.\d+)?)\s*%?")
    for m in pattern.finditer(text):
        year = int(m.group(1))
        val = float(m.group(2))
        if 1976 <= year <= dt.date.today().year:
            raw[year] = val  # keep raw; we'll normalize scale below

    if len(raw) < 30:
        raise RuntimeError(f"AGG scrape looked suspiciously small ({len(raw)} years). Page layout may have changed.")

    return _normalize_percent_or_decimal(raw)


def _extract_from_headered_frame(df: pd.DataFrame) -> Optional[Dict[int, float]]:
    """Try when df already has headers; look for Year and a suitable bond column."""
    cols = [str(c).strip() for c in df.columns]
    # Find a 'Year' column (or similar) by name
    year_col = None
    for c in cols:
        if re.search(r"^year\b", c, re.I):
            year_col = c
            break
    if year_col is None:
        return None

    # Candidate bond columns
    cand = [c for c in cols if re.search(r"(t\.?\s?bond|10[-\s]?year.*bond|treasury.*bond)", c, re.I)]
    if not cand:
        cand = [c for c in cols if "bond" in c.lower()]

    # Avoid Baa
    cand = [c for c in cand if not re.search(r"\bbaa\b", c, re.I)]
    if not cand:
        return None

    # Choose the one with most numeric non-null rows in plausible range
    def score(col: str) -> Tuple[int, int]:
        s = pd.to_numeric(df[col], errors="coerce")
        n = s.notna().sum()
        plausible = ((s > -50) & (s < 100)).sum()
        return (plausible, n)

    bond_col = sorted(cand, key=score, reverse=True)[0]

    out: Dict[int, float] = {}
    for _, row in df[[year_col, bond_col]].dropna().iterrows():
        try:
            y = int(str(row[year_col]).split(".")[0])
            if not (1800 <= y <= 3000):
                continue
            v = float(row[bond_col])
            # Assume percentages (Damodaran convention)
            out[y] = v / 100.0 if abs(v) > 2 else v
        except Exception:
            continue
    return _normalize_percent_or_decimal(out) if len(out) >= 50 else None


def _scan_loose_table(df_raw: pd.DataFrame) -> Optional[Dict[int, float]]:
    """When no headers match, scan the sheet (header=None) to discover a year column and a bond column nearby."""
    # Find any column with many year-like ints
    best_year_col = None
    best_year_rows: List[int] = []
    for col in df_raw.columns:
        col_vals = df_raw[col]
        years_idx = []
        for idx, val in col_vals.items():
            try:
                y = int(str(val).strip().split(".")[0])
            except Exception:
                continue
            if 1800 <= y <= 3000:
                years_idx.append(idx)
        if len(years_idx) > len(best_year_rows):
            best_year_rows = years_idx
            best_year_col = col
    if best_year_col is None or len(best_year_rows) < 30:
        return None

    year_series = df_raw[best_year_col]

    # Candidate numeric columns
    numeric_cols = [c for c in df_raw.columns if c != best_year_col]
    best_col = None
    best_score = -1

    for c in numeric_cols:
        vals = pd.to_numeric(df_raw[c], errors="coerce")
        # Score by overlap on year rows and plausibility range for annual returns
        aligned = vals.loc[best_year_rows]
        plausible = ((aligned > -50) & (aligned < 100)).sum()
        score = plausible
        if score > best_score:
            best_score = score
            best_col = c

    if best_col is None or best_score < 30:
        return None

    out: Dict[int, float] = {}
    for idx in best_year_rows:
        try:
            y = int(str(year_series.loc[idx]).strip().split(".")[0])
            v_raw = df_raw.loc[idx, best_col]
            if pd.isna(v_raw):
                continue
            v = float(v_raw)
            out[y] = v / 100.0 if abs(v) > 2 else v
        except Exception:
            continue

    return _normalize_percent_or_decimal(out) if len(out) >= 50 else None


def fetch_damodaran_bond_returns() -> Dict[int, float]:
    """Download Damodaran's spreadsheet and robustly extract the 10-year Treasury Bond total returns (annual)."""
    resp = requests.get(DAMODARAN_XLS_URL, timeout=30)
    resp.raise_for_status()

    xls_bytes = io.BytesIO(resp.content)

    # Try: (1) first sheet with headers; (2) all sheets with headers; (3) all sheets header=None -> loose scan
    # 1) Try first sheet
    try:
        df = pd.read_excel(xls_bytes, sheet_name=0)
        out = _extract_from_headered_frame(df)
        if out:
            return out
    except Exception:
        pass

    # 2) Try all sheets with headers
    xls_bytes.seek(0)
    try:
        xls = pd.ExcelFile(xls_bytes)
        for name in xls.sheet_names:
            try:
                df = pd.read_excel(xls, sheet_name=name)
                out = _extract_from_headered_frame(df)
                if out:
                    return out
            except Exception:
                continue
    except Exception:
        pass

    # 3) Loose scan (header=None) for each sheet
    xls_bytes.seek(0)
    try:
        xls = pd.ExcelFile(xls_bytes)
        for name in xls.sheet_names:
            try:
                df_raw = pd.read_excel(xls, sheet_name=name, header=None)
                out = _scan_loose_table(df_raw)
                if out:
                    return out
            except Exception:
                continue
    except Exception:
        pass

    raise RuntimeError("Could not parse Damodaran sheet for 10-year Treasury bond total returns.")


def build_series(start_year: int = 1900,
                 end_year: Optional[int] = None,
                 fill_missing_with: str = "damodaran") -> Dict[int, Optional[float]]:
    if end_year is None:
        end_year = dt.date.today().year

    print("Fetching AGG proxy (Bloomberg U.S. Aggregate Index) ...", file=sys.stderr)
    agg = fetch_agg_returns()

    print("Fetching Damodaran 10-year Treasury total returns ...", file=sys.stderr)
    dam = fetch_damodaran_bond_returns()

    result: Dict[int, Optional[float]] = {}
    for y in range(start_year, end_year + 1):
        val: Optional[float] = None
        if y >= 1976 and y in agg:
            val = agg[y]
        else:
            if fill_missing_with == "damodaran" and y in dam:
                val = dam[y]
            else:
                val = None
        result[y] = val
    # Final safety pass: correct any stray >0.5 values
    for y, v in list(result.items()):
        if v is not None and abs(v) > 0.5:
            result[y] = v/100.0
    return result


def main():
    parser = argparse.ArgumentParser(description="Build US bond total return JSON (1900 -> present).")
    parser.add_argument("--out", default="us_bond_total_returns.json", help="Output JSON file path.")
    parser.add_argument("--fill-missing-with", choices=["damodaran", "none"], default="damodaran",
                        help="Fallback for years without Agg returns (pre-1976 and any gaps).")
    parser.add_argument("--start-year", type=int, default=1900, help="Series start year.")
    parser.add_argument("--end-year", type=int, default=dt.date.today().year, help="Series end year (inclusive).")
    args = parser.parse_args()

    series = build_series(start_year=args.start_year,
                          end_year=args.end_year,
                          fill_missing_with=args.fill_missing_with)

    out_obj = {str(y): (None if v is None else round(float(v), 6)) for y, v in series.items()}
    with open(args.out, "w", encoding="utf-8") as f:
        json.dump(out_obj, f, indent=2, sort_keys=True)
    print(f"Wrote {args.out} with {len(out_obj)} years.", file=sys.stderr)


if __name__ == "__main__":
    main()
