from pathlib import Path
import re

root = Path('/home/ubuntu/deva-braga-portfolio')
source = root / 'client/src/data/portfolio.ts'
upload_log = Path('/tmp/webp_upload_output.txt').read_text()
paths = {}
for index, path in re.findall(r'converted-covers/cover-(\d+)\.webp -> (\S+)', upload_log):
    paths[int(index)] = path
text = source.read_text()
position = 0
parts = []
pattern = re.compile(r'thumbnail: "([^"]+)"')
for index, match in enumerate(pattern.finditer(text)):
    parts.append(text[position:match.start(1)])
    parts.append(paths[index])
    position = match.end(1)
parts.append(text[position:])
if len(paths) != len(list(pattern.finditer(text))):
    raise SystemExit(f'Upload mapping mismatch: {len(paths)} uploaded vs {len(list(pattern.finditer(text)))} thumbnails')
source.write_text(''.join(parts))
print(f'Updated {len(paths)} portfolio thumbnails to WebP storage paths')
