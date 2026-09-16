#!/usr/bin/env python3
"""Sync public Behance profile projects into a JSON feed consumed by the portfolio build."""
import json, html, re, sys
from pathlib import Path
from urllib.request import Request, urlopen

PROFILE = "https://www.behance.net/deva_braga"
OUT = Path(__file__).parent / "client/src/data/behance-projects.json"

def clean(value):
    return re.sub(r"\\s+", " ", html.unescape(value).replace('\\/', '/')).strip()

raw = urlopen(Request(PROFILE, headers={"User-Agent": "Mozilla/5.0 (portfolio sync)"}), timeout=30).read().decode("utf-8", "ignore")
# Behance embeds project cards as JSON in the public profile HTML. Keep the sequence
# and pair project titles with the nearest project-cover URL.
names = []
for raw_name in re.findall(r'"name":"((?:\\.|[^"\\])+)"', raw):
    name = clean(raw_name)
    if name and name not in names and name not in {"Deva Braga", "photoshop", "illustrator", "lightroom", "portfolio"}:
        names.append(name)

covers = []
for raw_url in re.findall(r'https://mir-s3-cdn-cf\.behance\.net/projects/[^"\\ ]+', raw):
    url = clean(raw_url)
    url = re.sub(r'/projects/(?:202|404)/', '/projects/max_808/', url)
    if url not in covers and '/projects/max_808/' in url:
        covers.append(url)

# Titles are emitted before their card cover in the current public HTML format.
projects = []
for index, title in enumerate(names):
    cover = covers[index] if index < len(covers) else ""
    projects.append({"title": title, "cover": cover, "sourceUrl": "https://www.behance.net/deva_braga"})

OUT.parent.mkdir(parents=True, exist_ok=True)
OUT.write_text(json.dumps({"profile": PROFILE, "syncedAt": __import__('datetime').datetime.utcnow().isoformat() + "Z", "projects": projects}, ensure_ascii=False, indent=2) + "\n")
print(f"synced {len(projects)} public Behance projects to {OUT}")
