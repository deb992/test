#!/usr/bin/env python3
"""Download the self-hosted webfonts and regenerate assets/css/fonts.css."""
import pathlib, re, subprocess

UA = ("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
      "(KHTML, like Gecko) Chrome/120.0 Safari/537.36")
ROOT = pathlib.Path(__file__).resolve().parent.parent
FONTS = ROOT / "assets" / "fonts"; FONTS.mkdir(parents=True, exist_ok=True)

URLS = {
    "bricolage": ("https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:"
                  "opsz,wdth,wght@12..96,75..100,300..800&display=swap"),
    "instrument": "https://fonts.googleapis.com/css2?family=Instrument+Sans:ital,wght@0,400..700;1,400..600&display=swap",
    "jetbrains": "https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400..700&display=swap",
}

def curl(url, dest=None):
    cmd = ["curl", "-sS", "-A", UA] + (["-o", str(dest)] if dest else []) + [url]
    return subprocess.run(cmd, capture_output=not dest, text=True, check=True).stdout

faces = []
for fam, url in URLS.items():
    for subset, block in re.findall(r"/\*\s*([a-z-]+)\s*\*/\s*(@font-face\s*\{.*?\})", curl(url), re.S):
        if subset not in ("latin", "latin-ext"):
            continue
        m = re.search(r"url\((https://fonts\.gstatic\.com/[^)]+\.woff2)\)", block)
        if not m:
            continue
        name = f"{fam}{'-italic' if 'font-style: italic' in block else ''}-{subset}.woff2"
        curl(m.group(1), FONTS / name)
        faces.append(block.replace(m.group(1), f"/assets/fonts/{name}").strip())
        print("  ", name, (FONTS / name).stat().st_size // 1024, "KB")

(ROOT / "assets" / "css" / "fonts.css").write_text(
    "/* Self-hosted Bricolage Grotesque + Instrument Sans + JetBrains Mono. */\n"
    + "\n\n".join(faces) + "\n", encoding="utf-8")
print(f"wrote assets/css/fonts.css ({len(faces)} faces)")
