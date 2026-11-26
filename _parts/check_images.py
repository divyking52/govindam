import re
from pathlib import Path
root = Path(r"D:\divyanssh\govindam")
missing = set()
for p in root.glob("*.html"):
    text = p.read_text(encoding="utf-8")
    for src in re.findall(r'src="(images/[^"]+)"', text):
        if not (root / src).exists():
            missing.add(src)
print("missing", len(missing))
for m in sorted(missing):
    print(m)
