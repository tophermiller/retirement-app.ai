#!/usr/bin/env python3
"""
Build a year->US stock total return JSON series (1928 -> present).

Primary source fetched at runtime:
- Aswath Damodaran's "Stocks, Bonds, Bills & Inflation" dataset
  (https://www.stern.nyu.edu/~adamodar/pc/datasets/histretSP.xls).
  We extract the S&P 500 total return (including dividends) by calendar year.

Backup source (if XLS parsing fails):
- The companion HTML page (https://pages.stern.nyu.edu/~adamodar/New_Home_Page/datafile/histretSP.html)
  is parsed to recover the same values.

Output:
- us_stock_total_returns.json: {"1928": 0.434, "1929": -0.084, ..., "2024": 0.268, ...}
  Returns are decimals (e.g., 0.075 = +7.5%).

Usage:
    python build_stock_returns.py [--out us_stock_total_returns.json] [--start-year 1928] [--end-year YYYY]
    python build_stock_returns.py --help

Requirements:
    pip install requests beautifulsoup4 lxml pandas openpyxl
"""
import argparse
import datetime as dt
import io
import json
import re
from typing import Dict, Optional, Tuple, Any, List

import requests
from bs4 import BeautifulSoup
import pandas as pd
import numpy as np

DAMODARAN_XLS_URL = "https://www.stern.nyu.edu/~adamodar/pc/datasets/histretSP.xls"
DAMODARAN_HTML_URL = "https://pages.stern.nyu.edu/~adamodar/New_Home_Page/datafile/histretSP.html"


def _normalize_percent_or_decimal(series: Dict[int, float], hard_clip: float = 4.0) -> Dict[int, float]:
    """
    Detect whether a numeric series is percent (common in tables) or decimal.
    Heuristic: if median absolute value > 1.0 -> percent, divide all by 100.
    Then clamp any absurd outliers by dividing by 100 if |v| > hard_clip (e.g., > 400% in a year).
    """
    if not series:
        return series
    med = float(np.median([abs(v) for v in series.values()]))
    out = dict(series)
    if med > 1.0:
        out = {y: v / 100.0 for y, v in out.items()}
    # Fix any strays that look like percent left behind
    fixed = {}
    for y, v in out.items():
        fixed[y] = v / 100.0 if abs(v) > hard_clip else v
    return fixed


def _extract_sp500_total_return_from_headered(df: pd.DataFrame) -> Optional[Dict[int, float]]:
    """
    Try to find a 'Year' column and a column that is S&P 500 total return (including dividends).
    Damodaran sheet varies over time; look for 'S&P' and 'including'/'with dividends' keywords.
    """
    cols = [str(c).strip() for c in df.columns]
    # Find Year
    year_col = None
    for c in cols:
        if re.search(r"^year\\b", c, re.I):
            year_col = c
            break
    if not year_col:
        return None

    # Candidate S&P total return columns
    cands = []
    for c in cols:
        lc = c.lower()
        if ("s&p" in lc or "sp" in lc) and ("including" in lc or "with dividends" in lc or "total return" in lc):
            cands.append(c)
    # fallback: any column with 'stocks' and hints of total
    if not cands:
        for c in cols:
            lc = c.lower()
            if "stocks" in lc and ("including" in lc or "with dividends" in lc or "total" in lc):
                cands.append(c)
    # final fallback: any column that looks like 's&p 500' even if not explicit about dividends
    if not cands:
        for c in cols:
            if re.search(r"s\\&p\\s*500", c, re.I):
                cands.append(c)

    if not cands:
        return None

    # Pick the candidate with the largest count of plausible annual % values
    def score(col: str) -> Tuple[int, int]:
        s = pd.to_numeric(df[col], errors="coerce")
        n = s.notna().sum()
        plausible = ((s > -90) & (s < 300)).sum()
        return (plausible, n)

    best = sorted(cands, key=score, reverse=True)[0]

    out: Dict[int, float] = {}
    for _, row in df[[year_col, best]].dropna().iterrows():
        try:
            y = int(str(row[year_col]).split(".")[0])
            if not (1800 <= y <= 3000):
                continue
            v = float(row[best])
            out[y] = v
        except Exception:
            continue

    return _normalize_percent_or_decimal(out) if len(out) >= 50 else None


def _extract_sp500_total_return_loose(df_raw: pd.DataFrame) -> Optional[Dict[int, float]]:
    """
    When headers are unreliable (header=None read), find a column of years and a nearby numeric column that looks like S&P total return.
    """
    best_year_col = None
    best_year_rows: List[int] = []
    for c in df_raw.columns:
        years_idx = []
        for idx, val in df_raw[c].items():
            try:
                y = int(str(val).strip().split(".")[0])
            except Exception:
                continue
            if 1800 <= y <= 3000:
                years_idx.append(idx)
        if len(years_idx) > len(best_year_rows):
            best_year_rows = years_idx
            best_year_col = c

    if best_year_col is None or len(best_year_rows) < 30:
        return None

    # Among numeric columns, pick the one with plausible equity return ranges
    best_col = None
    best_score = -1
    for c in df_raw.columns:
        if c == best_year_col:
            continue
        s = pd.to_numeric(df_raw[c], errors="coerce")
        aligned = s.loc[best_year_rows]
        plausible = ((aligned > -90) & (aligned < 300)).sum()
        if plausible > best_score:
            best_score = plausible
            best_col = c
    if best_col is None or best_score < 30:
        return None

    out: Dict[int, float] = {}
    year_series = df_raw[best_year_col]
    for idx in best_year_rows:
        try:
            y = int(str(year_series.loc[idx]).strip().split(".")[0])
            v_raw = df_raw.loc[idx, best_col]
            if pd.isna(v_raw):
                continue
            out[y] = float(v_raw)
        except Exception:
            continue

    return _normalize_percent_or_decimal(out) if len(out) >= 50 else None


def fetch_sp500_total_return_from_xls() -> Dict[int, float]:
    """Download the Damodaran XLS and extract S&P 500 total returns (including dividends)."""
    resp = requests.get(DAMODARAN_XLS_URL, timeout=30)
    resp.raise_for_status()
    xls_bytes = io.BytesIO(resp.content)

    # Try headered then loose for all sheets
    # First, the first sheet
    try:
        df = pd.read_excel(xls_bytes, sheet_name=0)
        out = _extract_sp500_total_return_from_headered(df)
        if out:
            return out
    except Exception:
        pass

    # All sheets, headered
    xls_bytes.seek(0)
    try:
        xls = pd.ExcelFile(xls_bytes)
        for name in xls.sheet_names:
            try:
                df = pd.read_excel(xls, sheet_name=name)
                out = _extract_sp500_total_return_from_headered(df)
                if out:
                    return out
            except Exception:
                continue
    except Exception:
        pass

    # All sheets, loose
    xls_bytes.seek(0)
    try:
        xls = pd.ExcelFile(xls_bytes)
        for name in xls.sheet_names:
            try:
                df_raw = pd.read_excel(xls, sheet_name=name, header=None)
                out = _extract_sp500_total_return_loose(df_raw)
                if out:
                    return out
            except Exception:
                continue
    except Exception:
        pass

    raise RuntimeError("Could not extract S&P 500 total returns from Damodaran XLS.")


def fetch_sp500_total_return_from_html() -> Dict[int, float]:
    """Fallback: parse the Damodaran HTML page for the same series."""
    resp = requests.get(DAMODARAN_HTML_URL, timeout=30)
    resp.raise_for_status()
    soup = BeautifulSoup(resp.text, "lxml")

    # Find a table with Year column and 'Stocks' (including dividends) column
    tables = soup.find_all("table")
    best: Dict[int, float] = {}
    for table in tables:
        # Build a grid
        rows = table.find_all(["tr"])
        grid: List[List[str]] = []
        for r in rows:
            cells = r.find_all(["th", "td"])
            grid.append([c.get_text(strip=True) for c in cells])
        if not grid or len(grid) < 10:
            continue
        # Seek header row with 'Year' and something like 'Stocks' including dividends
        header_idx = None
        headers = None
        for i, row in enumerate(grid[:5]):
            lower = [c.lower() for c in row]
            if any(re.search(r"^year\\b", c) for c in lower) and any(("stocks" in c and ("including" in c or "with dividends" in c or "total" in c)) for c in lower):
                header_idx = i
                headers = row
                break
        if header_idx is None:
            continue

        # Map column names
        colmap = {j: h for j, h in enumerate(headers)}
        year_col = None
        stock_col = None
        for j, h in colmap.items():
            if re.search(r"^year\\b", h, re.I):
                year_col = j
            if (("stocks" in h.lower() or "s&p" in h.lower()) and
                ("including" in h.lower() or "with dividends" in h.lower() or "total" in h.lower())):
                stock_col = j
        if year_col is None or stock_col is None:
            continue

        tmp: Dict[int, float] = {}
        for row in grid[header_idx+1:]:
            if len(row) <= max(year_col, stock_col):
                continue
            ytxt = row[year_col]
            vtxt = row[stock_col]
            try:
                y = int(re.sub(r"[^0-9]", "", ytxt))
            except Exception:
                continue
            if not (1800 <= y <= 3000):
                continue
            # Extract a float possibly with %
            m = re.search(r"-?\\d+(?:\\.\\d+)?", vtxt.replace(",", ""))
            if not m:
                continue
            v = float(m.group(0))
            tmp[y] = v
        tmp = _normalize_percent_or_decimal(tmp)
        if len(tmp) >= len(best):
            best = tmp

    if not best:
        raise RuntimeError("Could not parse Damodaran HTML fallback.")
    return best


def build_series(start_year: int = 1928,
                 end_year: Optional[int] = None) -> Dict[int, Optional[float]]:
    if end_year is None:
        end_year = dt.date.today().year

    try:
        series = fetch_sp500_total_return_from_xls()
    except Exception:
        series = fetch_sp500_total_return_from_html()

    # Restrict to requested range
    out: Dict[int, Optional[float]] = {}
    for y in range(start_year, end_year + 1):
        out[y] = series.get(y, None)

    # Final safety: re-normalize just in case merging added oddities
    out = _normalize_percent_or_decimal({k: v for k, v in out.items() if v is not None})
    # Merge back with Nones if needed
    final = {str(y): (None if y not in out else round(float(out[y]), 6)) for y in range(start_year, end_year + 1)}
    return final


def main():
    parser = argparse.ArgumentParser(description="Build US stock (S&P 500 total return) JSON (1928 -> present).")
    parser.add_argument("--out", default="us_stock_total_returns.json", help="Output JSON file path.")
    parser.add_argument("--start-year", type=int, default=1928, help="Series start year (Damodaran coverage begins 1928).")
    parser.add_argument("--end-year", type=int, default=dt.date.today().year, help="Series end year (inclusive).")
    args = parser.parse_args()

    series = build_series(start_year=args.start_year, end_year=args.end_year)

    with open(args.out, "w", encoding="utf-8") as f:
        json.dump(series, f, indent=2, sort_keys=True)
    print(f"Wrote {args.out} with {len(series)} years.")

if __name__ == "__main__":
    main()
