from pathlib import Path
import json
import re
import subprocess

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "client/src/data/portfolio.ts"
OUT = ROOT / "converted-covers"
OUT.mkdir(exist_ok=True)
text = SOURCE.read_text()
urls = re.findall(r'thumbnail: "([^"]+)"', text)
manifest = []
for index, url in enumerate(urls):
    raw = OUT / f"cover-{index:02d}.source"
    webp = OUT / f"cover-{index:02d}.webp"
    if not raw.exists() or raw.stat().st_size < 1024:
        if raw.exists(): raw.unlink()
        subprocess.run([
            "curl", "-fL", "--retry", "5", "--retry-all-errors", "--connect-timeout", "20",
            "--max-time", "120", "-A", "Mozilla/5.0", "-o", str(raw), url,
        ], check=True)
    subprocess.run([
        "ffmpeg", "-y", "-loglevel", "error", "-i", str(raw),
        "-vf", "scale='min(1600,iw)':-2", "-c:v", "libwebp", "-q:v", "82", str(webp)
    ], check=True)
    manifest.append({"index": index, "source": url, "file": str(webp), "bytes": webp.stat().st_size})
(ROOT / "converted-covers-manifest.json").write_text(json.dumps(manifest, ensure_ascii=False, indent=2))
print(json.dumps({"converted": len(manifest), "total_bytes": sum(item["bytes"] for item in manifest)}, ensure_ascii=False))
