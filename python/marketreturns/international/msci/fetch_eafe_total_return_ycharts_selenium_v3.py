
#!/usr/bin/env python3
import argparse
import sys
import re
import time
from typing import Optional, Tuple

import pandas as pd
from bs4 import BeautifulSoup

from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from webdriver_manager.chrome import ChromeDriverManager

ANNUAL_RETURNS_URL = "https://ycharts.com/indices/%5EMSEAFETR/annual_returns"
INDEX_MAIN_URL = "https://ycharts.com/indices/%5EMSEAFETR"

def build_driver(headless: bool) -> webdriver.Chrome:
    chrome_options = Options()
    if headless:
        chrome_options.add_argument("--headless=new")
    # GPU / SwiftShader setup to satisfy Chromium's new restrictions
    chrome_options.add_argument("--enable-unsafe-swiftshader")
    chrome_options.add_argument("--use-gl=angle")
    chrome_options.add_argument("--use-angle=swiftshader")
    chrome_options.add_argument("--ignore-gpu-blocklist")
    chrome_options.add_argument("--disable-gpu")  # often stabilizes headless on Windows
    # General stability flags
    chrome_options.add_argument("--no-sandbox")
    chrome_options.add_argument("--disable-dev-shm-usage")
    chrome_options.add_argument("--window-size=1400,1000")
    chrome_options.add_argument("--log-level=2")
    chrome_options.add_argument(
        "user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/123.0.0.0 Safari/537.36"
    )
    service = Service(ChromeDriverManager().install())
    driver = webdriver.Chrome(service=service, options=chrome_options)
    return driver

def wait_for_any_table(driver, timeout=30):
    WebDriverWait(driver, timeout).until(
        EC.presence_of_element_located((By.TAG_NAME, "table"))
    )
    # Give time for JS to populate
    time.sleep(1.5)

def extract_returns_table_from_html(html: str) -> Optional[pd.DataFrame]:
    soup = BeautifulSoup(html, "html.parser")
    candidate_tables = list(soup.find_all("table"))
    best_df = None
    best_len = 0
    for tbl in candidate_tables:
        headers = [th.get_text(strip=True).lower() for th in tbl.find_all("th")]
        if not headers:
            first_row = tbl.find("tr")
            if first_row:
                headers = [td.get_text(strip=True).lower() for td in first_row.find_all(["td", "th"])]
        has_year = any("year" in h for h in headers)
        has_ret = any("return" in h for h in headers)
        rows = []
        for tr in tbl.find_all("tr"):
            cells = [td.get_text(strip=True) for td in tr.find_all(["td", "th"])]
            if len(cells) >= 2 and re.fullmatch(r"\d{4}", cells[0] or ""):
                second = cells[1].replace(",", "")
                if re.search(r"%", second) or re.fullmatch(r"-?\d+(\.\d+)?", second):
                    rows.append(cells[:2])
        if rows and (has_year or has_ret):
            df = pd.DataFrame(rows, columns=["Year", "Return"])
            if len(df) > best_len:
                best_len = len(df)
                best_df = df
    return best_df

def clean_df(df: pd.DataFrame) -> pd.DataFrame:
    out = pd.DataFrame()
    out["Year"] = pd.to_numeric(df["Year"], errors="coerce").astype("Int64")
    def to_decimal(x: str):
        if x is None:
            return None
        s = str(x).strip().replace(",", "")
        if s == "":
            return None
        try:
            if s.endswith("%"):
                return float(s[:-1]) / 100.0
            val = float(s)
            if abs(val) > 1.5:
                return val / 100.0
            return val
        except Exception:
            return None
    out["Return_Total_USD"] = df["Return"].map(to_decimal)
    out = out.dropna(subset=["Year", "Return_Total_USD"]).copy()
    out["Year"] = out["Year"].astype(int)
    out = out.sort_values("Year").reset_index(drop=True)
    return out

def scrape(url: str, headless: bool) -> Optional[pd.DataFrame]:
    driver = build_driver(headless=headless)
    try:
        driver.get(url)
        wait_for_any_table(driver, timeout=40)
        html = driver.page_source
        df = extract_returns_table_from_html(html)
        return df
    finally:
        driver.quit()

def fetch_eafe_total_return(headless: bool) -> Tuple[pd.DataFrame, str]:
    df = scrape(ANNUAL_RETURNS_URL, headless=headless)
    if df is not None and not df.empty:
        return clean_df(df), ANNUAL_RETURNS_URL
    df = scrape(INDEX_MAIN_URL, headless=headless)
    if df is not None and not df.empty:
        return clean_df(df), INDEX_MAIN_URL
    raise RuntimeError("Failed to find an Annual Returns table on YCharts with Selenium.")

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--out", default="MSCI_EAFE_TotalReturn_USD_from_YCharts.csv",
                    help="Output CSV filename")
    ap.add_argument("--headless", action="store_true", help="Run Chrome in headless mode")
    args = ap.parse_args()
    try:
        df, src = fetch_eafe_total_return(headless=args.headless)
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
