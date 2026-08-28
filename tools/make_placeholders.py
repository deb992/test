#!/usr/bin/env python3
"""
Generates on-brand placeholder imagery so the site never looks broken before
Junior's real photographs are dropped in. Every file written here is meant to be
REPLACED — see README.md for the shot list and exact dimensions.

    python3 tools/make_placeholders.py
"""
import math
import pathlib
import random

from PIL import Image, ImageDraw, ImageFilter, ImageFont

OUT = pathlib.Path(__file__).resolve().parent.parent / "assets" / "img"
OUT.mkdir(parents=True, exist_ok=True)

SOOT = (11, 11, 13)
CHARCOAL = (26, 26, 32)
EMBER = (255, 106, 26)
EMBER_DEEP = (217, 46, 27)
BONE = (244, 240, 232)
BRASS = (201, 162, 94)


def font(size):
    for path in (
        "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
        "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
    ):
        if pathlib.Path(path).exists():
            return ImageFont.truetype(path, size)
    return ImageFont.load_default()


def base(w, h, warm=0.55):
    """Dark, softly lit ground with an ember glow low-centre."""
    img = Image.new("RGB", (w, h), SOOT)
    px = img.load()
    cx, cy = w * 0.5, h * 1.05
    maxd = math.hypot(w, h)
    for y in range(h):
        for x in range(0, w, 2):
            d = math.hypot(x - cx, y - cy) / maxd
            t = max(0.0, 1.0 - d * 1.9) ** 2 * warm
            v = math.sin(y / h * math.pi) * 0.05
            r = int(SOOT[0] + (EMBER_DEEP[0] - SOOT[0]) * t + CHARCOAL[0] * v)
            g = int(SOOT[1] + (EMBER_DEEP[1] - SOOT[1]) * t * 0.55 + CHARCOAL[1] * v)
            b = int(SOOT[2] + (EMBER_DEEP[2] - SOOT[2]) * t * 0.35 + CHARCOAL[2] * v)
            c = (min(r, 255), min(g, 255), min(b, 255))
            px[x, y] = c
            if x + 1 < w:
                px[x + 1, y] = c
    return img


def bricks(img, y0, alpha=26, course=None):
    """Faint brick coursing — reads as masonry without shouting."""
    d = ImageDraw.Draw(img, "RGBA")
    w, h = img.size
    course = course or max(14, h // 26)
    unit = course * 2
    row = 0
    y = y0
    while y < h:
        d.line([(0, y), (w, y)], fill=(*BONE, alpha), width=1)
        offset = 0 if row % 2 == 0 else unit // 2
        for x in range(offset, w + unit, unit):
            d.line([(x, y), (x, y + course)], fill=(*BONE, alpha), width=1)
        y += course
        row += 1
    return img


def embers(img, count=90, seed=7):
    rnd = random.Random(seed)
    w, h = img.size
    layer = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    d = ImageDraw.Draw(layer)
    for _ in range(count):
        x = rnd.uniform(0, w)
        y = rnd.uniform(h * 0.25, h)
        r = rnd.uniform(1.0, 3.2)
        a = int(rnd.uniform(60, 210) * (1 - (y / h) * 0.35))
        col = EMBER if rnd.random() > 0.4 else (255, 196, 107)
        d.ellipse([x - r, y - r, x + r, y + r], fill=(*col, a))
    layer = layer.filter(ImageFilter.GaussianBlur(1.4))
    img.paste(Image.alpha_composite(img.convert("RGBA"), layer).convert("RGB"), (0, 0))
    return img


def grain(img, amount=9, seed=3):
    rnd = random.Random(seed)
    w, h = img.size
    noise = Image.new("L", (w // 2, h // 2))
    noise.putdata([rnd.randint(0, 255) for _ in range((w // 2) * (h // 2))])
    noise = noise.resize((w, h), Image.BILINEAR)
    return Image.blend(img, Image.merge("RGB", (noise, noise, noise)), amount / 100)


def label(img, title, sub):
    d = ImageDraw.Draw(img, "RGBA")
    w, h = img.size
    pad = max(24, w // 26)
    f1 = font(max(15, w // 34))
    f2 = font(max(11, w // 62))

    d.line([(pad, h - pad - 62), (pad + 46, h - pad - 62)], fill=(*EMBER, 255), width=3)
    d.text((pad, h - pad - 48), title, font=f1, fill=(*BONE, 236))
    d.text((pad, h - pad - 20), sub, font=f2, fill=(*BRASS, 210))
    return img


def make(name, w, h, title, sub, warm=0.55, brick_at=None, ember_count=80, seed=7):
    img = base(w, h, warm)
    if brick_at is not None:
        bricks(img, int(h * brick_at))
    img = embers(img, ember_count, seed)
    img = grain(img)
    img = label(img, title, sub)
    path = OUT / name
    img.save(path, quality=86, optimize=True)
    print(f"  {name}  {w}x{h}")


SHOTS = [
    # name,                       w,    h,   title,                       subtitle,                                warm, brick, embers, seed
    ("hero-roofline.jpg",        1920, 1280, "REPLACE: HERO",             "Junior on a roofline at golden hour",    0.62, 0.42, 150, 11),
    ("service-sweeping.jpg",     1200,  900, "REPLACE: SWEEPING",         "Rods + HEPA vacuum at the firebox",      0.50, 0.30,  70,  3),
    ("service-relining.jpg",     1200,  900, "REPLACE: RELINING",         "Stainless liner going down the flue",    0.45, 0.26,  60,  5),
    ("service-certification.jpg",1200,  900, "REPLACE: CERTIFICATION",    "Paperwork, camera + inspection report",  0.38, None,  50,  9),
    ("service-dryer-vent.jpg",   1200,  900, "REPLACE: DRYER VENT",       "Vent run being cleared of lint",         0.36, None,  45, 13),
    ("work-crown-before.jpg",    1200,  750, "REPLACE: BEFORE",           "Spalled brick + failed crown",           0.30, 0.14,  30, 17),
    ("work-crown-after.jpg",     1200,  750, "REPLACE: AFTER",            "Same chimney, rebuilt + repointed",      0.58, 0.14,  90, 19),
    ("junior-portrait.jpg",       900, 1200, "REPLACE: PORTRAIT",         "Junior on the roof with his tools",      0.52, None,  70, 23),
    ("equipment.jpg",            1200,  900, "REPLACE: EQUIPMENT",        "Truck, rods, HEPA vac, camera",          0.42, None,  55, 29),
    ("og-default.jpg",           1200,  630, "JUNIOR'S CHIMNEY",          "Bucks County, PA - (215) 526-3574",      0.70, 0.34, 130, 31),
    ("og-services.jpg",          1200,  630, "CHIMNEY SERVICES",          "Sweeping - Relining - Repairs - Masonry",0.66, 0.34, 120, 37),
    ("og-about.jpg",             1200,  630, "30 YEARS ON THE ROOF",      "Junior's Chimney - Croydon, PA",         0.64, 0.34, 120, 41),
    ("og-reviews.jpg",           1200,  630, "WHAT NEIGHBOURS SAY",       "Junior's Chimney - Bucks County",        0.64, 0.34, 120, 43),
    ("og-contact.jpg",           1200,  630, "GET A FREE ESTIMATE",       "(215) 526-3574 - Open 7 days",           0.68, 0.34, 130, 47),
]

if __name__ == "__main__":
    print("Generating placeholder imagery ->", OUT)
    for name, w, h, title, sub, warm, brick, ec, seed in SHOTS:
        make(name, w, h, title, sub, warm, brick, ec, seed)

    # apple touch icon, drawn rather than photographed
    icon = Image.new("RGB", (180, 180), SOOT)
    d = ImageDraw.Draw(icon)
    d.rounded_rectangle([0, 0, 179, 179], radius=38, fill=SOOT)
    d.polygon([(36, 58), (52, 40), (128, 40), (144, 58)], outline=BONE, width=7)
    d.line([(47, 58), (47, 146)], fill=BONE, width=7)
    d.line([(133, 58), (133, 146)], fill=BONE, width=7)
    d.line([(47, 146), (133, 146)], fill=BONE, width=7)
    d.polygon([(90, 128), (72, 112), (82, 96), (86, 104), (98, 88), (108, 110)], fill=EMBER)
    icon.save(OUT / "apple-touch-icon.png")
    print("  apple-touch-icon.png  180x180")
    print("done.")
