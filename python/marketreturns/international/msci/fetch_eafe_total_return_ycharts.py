
#!/usr/bin/env python3
"""
fetch_eafe_total_return_ycharts_v2.py

Fetches annual total return (USD) for MSCI EAFE Total Return index (^MSEAFETR) from YCharts
and writes a CSV file with columns: Year, Return_Total_USD (decimal form).

Improvements vs v1:
- Uses io.StringIO with pandas.read_html (no FutureWarning)
- More robust BeautifulSoup fallback parser (handles varied column headers)
- Verbose mode for easier debugging

Usage:
    python fetch_eafe_total_return_ycharts_v2.py --out eafe_total_return_ycharts.csv --verbose

Note:
- Scrapes public YCharts pages. May break if layout changes or if blocked.
- Values are gross total return (USD).
"""

import argparse
import sys
import re
from typing import Optional, Tuple

import requests
import pandas as pd
from bs4 import BeautifulSoup
from io import StringIO

HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/123.0.0.0 Safari/537.36"
    ),
    "Accept-Language": "en-US,en;q=0.9",
}

ANNUAL_RETURNS_URL = "https://ycharts.com/indices/%5EMSEAFETR/annual_returns"
INDEX_MAIN_URL = "https://ycharts.com/indices/%5EMSEAFETR"


def vprint(verbose: bool, *args, **kwargs):
    if verbose:
        print(*args, **kwargs)


def parse_annual_returns_table_from_html(html: str, *, verbose: bool=False) -> Optional[pd.DataFrame]:
    """
    Attempt to parse an annual returns table using pandas.read_html first,
    then fall back to manual soup parsing if needed.
    """
    # Try pandas.read_html from StringIO
    try:
        tables = pd.read_html(StringIO(html))
        vprint(verbose, f"[read_html] Found {len(tables)} tables")
        for i, t in enumerate(tables):
            cols = [str(c).strip().lower() for c in t.columns]
            vprint(verbose, f"  Table {i} columns: {cols}")
            if any("year" in c for c in cols) and any("return" in c for c in cols):
                vprint(verbose, f"  Using table {i} from read_html")
                return t
    except Exception as e:
        vprint(verbose, f"[read_html] Exception: {e}")

    # Fallback: soup-based parsing
    soup = BeautifulSoup(html, "html.parser")

    # Try to find tables near headings that include "Annual Returns"
    candidate_tables = []
    for header in soup.find_all(["h1", "h2", "h3", "h4", "h5"]):
        if "annual" in header.get_text(strip=True).lower() and "return" in header.get_text(strip=True).lower():
            # Find the next table
            nxt_tbl = header.find_next("table")
            if nxt_tbl:
                candidate_tables.append(nxt_tbl)

    # Also add all tables as fallback
    candidate_tables.extend(list(soup.find_all("table")))

    seen = set()
    cleaned = []
    for tbl in candidate_tables:
        if id(tbl) in seen:
            continue
        seen.add(id(tbl))

        # Extract header
        headers = [th.get_text(strip=True).lower() for th in tbl.find_all("th")]
        if not headers:
            first_row = tbl.find("tr")
            if first_row:
                headers = [td.get_text(strip=True).lower() for td in first_row.find_all(["td", "th"])]
        vprint(verbose, f"[soup] Checking table with headers: {headers}")

        if not (any("year" in h for h in headers) and any("return" in h for h in headers)):
            # If we can't see headers, we will attempt relaxed row parsing anyway
            pass

        rows = []
        for tr in tbl.find_all("tr"):
            cells = [td.get_text(strip=True) for td in tr.find_all(["td", "th"])]
            # Expect first cell to be a 4-digit year, second to be return
            if len(cells) >= 2 and re.fullmatch(r"\d{4}", cells[0] or ""):
                # Accept rows where second cell looks like %, e.g., "18.85%"
                if re.search(r"%", cells[1]) or re.fullmatch(r"-?\d+(\.\d+)?", cells[1].replace(",", "")):
                    rows.append(cells[:2])
        if rows:
            df = pd.DataFrame(rows, columns=["Year", "Return"])
            cleaned.append(df)

    # Choose the largest parsed table
    if cleaned:
        best = max(cleaned, key=lambda d: len(d))
        vprint(verbose, f"[soup] Parsed {len(best)} rows from soup fallback")
        return best

    return None


def clean_returns_df(df: pd.DataFrame) -> pd.DataFrame:
    """
    Normalize a raw DataFrame with columns (Year, Return or similar) into:
      Year (int), Return_Total_USD (float decimal)
    """
    df = df.copy()
    df.columns = [str(c).strip().lower() for c in df.columns]

    # Map likely column names
    year_col = next((c for c in df.columns if "year" in c), None)
    ret_col = next((c for c in df.columns if "return" in c), None)

    if year_col is None or ret_col is None:
        raise ValueError("Could not find Year/Return columns in the parsed table.")

    out = pd.DataFrame()
    out["Year"] = pd.to_numeric(df[year_col], errors="coerce").astype("Int64")

    def to_decimal(x):
        if x is None:
            return None
        s = str(x).strip()
        if s == "":
            return None
        s = s.replace(",", "").replace(" ", "")
        try:
            if s.endswith("%"):
                return float(s[:-1]) / 100.0
            val = float(s)
            if abs(val) > 1.5:
                return val / 100.0
            return val
        except Exception:
            return None

    out["Return_Total_USD"] = df[ret_col].map(to_decimal)
    out = out.dropna(subset=["Year", "Return_Total_USD"]).copy()
    out["Year"] = out["Year"].astype(int)
    out = out.sort_values("Year").reset_index(drop=True)
    return out


def fetch_table(url: str, *, verbose: bool=False) -> Optional[pd.DataFrame]:
    resp = requests.get(url, headers=HEADERS, timeout=30)
    if not resp.ok:
        vprint(verbose, f"[fetch_table] GET {url} -> {resp.status_code}")
        return None
    return parse_annual_returns_table_from_html(resp.text, verbose=verbose)


def fetch_eafe_total_return(*, verbose: bool=False) -> Tuple[pd.DataFrame, str]:
    df = fetch_table(ANNUAL_RETURNS_URL, verbose=verbose)
    if df is not None and not df.empty:
        return clean_returns_df(df), ANNUAL_RETURNS_URL

    vprint(verbose, "[main] Annual returns page failed; trying main index page")
    df = fetch_table(INDEX_MAIN_URL, verbose=verbose)
    if df is not None and not df.empty:
        return clean_returns_df(df), INDEX_MAIN_URL

    raise RuntimeError("Failed to locate an annual returns table on YCharts pages.")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--out", default="MSCI_EAFE_TotalReturn_USD_from_YCharts.csv",
                    help="Output CSV filename (default: %(default)s)")
    ap.add_argument("--verbose", action="store_true", help="Enable verbose logging")
    args = ap.parse_args()

    try:
        df_raw, src = fetch_eafe_total_return(verbose=args.verbose)
        df = df_raw[["Year", "Return_Total_USD"]].copy()
        if df.empty:
            print("ERROR: Parsed a table but it contains 0 usable rows.", file=sys.stderr)
            sys.exit(2)
        df.to_csv(args.out, index=False)
        print(f"Wrote {len(df)} rows to '{args.out}' from {src}")
    except Exception as e:
        print(f"ERROR: {e}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
