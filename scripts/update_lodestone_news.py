#!/usr/bin/env python3
from __future__ import annotations
import json
import re
import sys
from datetime import datetime
from pathlib import Path
from urllib.parse import urljoin

import requests
from bs4 import BeautifulSoup

BASE = "https://jp.finalfantasyxiv.com"
OUTPUT = Path("assets/data/lodestone-news.json")
SOURCES = [
    ("TOPIC", f"{BASE}/lodestone/topics/"),
    ("NOTICE", f"{BASE}/lodestone/news/category/1"),
    ("MAINT", f"{BASE}/lodestone/news/category/2"),
    ("UPDATE", f"{BASE}/lodestone/news/category/3"),
    ("ISSUE", f"{BASE}/lodestone/news/category/4"),
]
HEADERS = {
    "User-Agent": "Mozilla/5.0 (compatible; FF14PersonalToolPortal/1.0; +GitHub-Actions)"
}
MAX_ITEMS = 8

def clean(text: str) -> str:
    return re.sub(r"\s+", " ", text or "").strip()

def classify(title: str, fallback: str) -> str:
    if "パッチノート" in title or re.search(r"Patch\s*\d|パッチ\d", title, re.I):
        return "PATCH"
    if "メンテナンス" in title:
        return "MAINT"
    if "障害" in title or "不具合" in title:
        return "ISSUE"
    if "更新のお知らせ" in title:
        return "UPDATE"
    if any(k in title for k in ("開催", "イベント", "キャンペーン", "シーズン")):
        return "EVENT"
    return fallback

def date_from_context(anchor, now: datetime) -> str:
    nodes = [anchor]
    parent = anchor.parent
    for _ in range(5):
        if parent is None:
            break
        nodes.append(parent)
        parent = parent.parent

    for node in nodes:
        time_el = getattr(node, "find", lambda *a, **k: None)("time")
        if time_el:
            raw = time_el.get("datetime") or clean(time_el.get_text(" ", strip=True))
            m = re.search(r"(20\d{2})[-/.年](\d{1,2})[-/.月](\d{1,2})", raw)
            if m:
                return f"{int(m.group(1)):04d}.{int(m.group(2)):02d}.{int(m.group(3)):02d}"

        txt = clean(getattr(node, "get_text", lambda *a, **k: "")(" ", strip=True))
        m = re.search(r"(20\d{2})[-/.年](\d{1,2})[-/.月](\d{1,2})", txt)
        if m:
            return f"{int(m.group(1)):04d}.{int(m.group(2)):02d}.{int(m.group(3)):02d}"

    # News titles often contain (8/7)
    txt = clean(anchor.get_text(" ", strip=True))
    m = re.search(r"\((\d{1,2})/(\d{1,2})\)", txt)
    if m:
        return f"{now.year:04d}.{int(m.group(1)):02d}.{int(m.group(2)):02d}"
    return ""

def get_summary(session: requests.Session, url: str) -> str:
    try:
        r = session.get(url, headers=HEADERS, timeout=20)
        r.raise_for_status()
        soup = BeautifulSoup(r.text, "html.parser")
        for selector in ('meta[property="og:description"]', 'meta[name="description"]'):
            tag = soup.select_one(selector)
            if tag and clean(tag.get("content", "")):
                text = clean(tag["content"])
                return text[:150] + ("…" if len(text) > 150 else "")
    except Exception as exc:
        print(f"summary warning: {url}: {exc}", file=sys.stderr)
    return "公式Lodestoneで詳細を確認できます。"

def candidates_from_page(session, badge: str, url: str, now: datetime):
    r = session.get(url, headers=HEADERS, timeout=20)
    r.raise_for_status()
    soup = BeautifulSoup(r.text, "html.parser")
    out = []
    seen = set()
    for a in soup.find_all("a", href=True):
        href = a["href"]
        if "/lodestone/topics/detail/" not in href and "/lodestone/news/detail/" not in href:
            continue
        full = urljoin(BASE, href)
        if full in seen:
            continue
        title = clean(a.get_text(" ", strip=True))
        if len(title) < 4 or title in ("前の記事", "次の記事"):
            continue
        seen.add(full)
        out.append({
            "date": date_from_context(a, now),
            "badge": classify(title, badge),
            "title": title,
            "url": full,
        })
        if len(out) >= 12:
            break
    return out

def sort_key(item):
    try:
        return datetime.strptime(item["date"], "%Y.%m.%d")
    except Exception:
        return datetime(1970, 1, 1)

def main():
    now = datetime.now().astimezone()
    session = requests.Session()
    combined = []
    seen = set()

    for badge, url in SOURCES:
        try:
            for item in candidates_from_page(session, badge, url, now):
                if item["url"] in seen:
                    continue
                seen.add(item["url"])
                combined.append(item)
        except Exception as exc:
            print(f"source warning: {url}: {exc}", file=sys.stderr)

    if not combined:
        raise SystemExit("No Lodestone items were found; keeping the existing JSON.")

    combined.sort(key=sort_key, reverse=True)
    items = combined[:MAX_ITEMS]
    for item in items:
        item["summary"] = get_summary(session, item["url"])

    payload = {
        "updated_at": datetime.now().astimezone().isoformat(timespec="seconds"),
        "source": f"{BASE}/lodestone/news/",
        "items": items,
    }

    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    old = None
    if OUTPUT.exists():
        try:
            old = json.loads(OUTPUT.read_text(encoding="utf-8"))
        except Exception:
            pass

    # Avoid commits when article data has not changed; updated_at only advances on content change.
    if old and old.get("items") == payload["items"]:
        print("No news changes.")
        return

    OUTPUT.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"Updated {OUTPUT} with {len(items)} items.")

if __name__ == "__main__":
    main()
