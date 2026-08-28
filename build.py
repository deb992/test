#!/usr/bin/env python3
"""
Junior's Chimney — static site assembler.

Pages live in src/pages/*.html as body fragments with a small front-matter
block. Shared chrome lives in src/partials/. Running this writes plain,
dependency-free HTML to the repo root, ready to drop on any host.

    python3 build.py
"""
import pathlib
import re

ROOT = pathlib.Path(__file__).parent
SRC = ROOT / "src"
PARTIALS = SRC / "partials"

SITE = {
    "name": "Junior's Chimney",
    "phone_display": "(215) 526-3574",
    "phone_href": "+12155263574",
    "email": "info@juniorschimney.com",
    "street": "2042 Lincoln Ave",
    "city": "Croydon",
    "region": "PA",
    "zip": "19021",
    "hours": "Open 7 days · 8:00am – 6:00pm",
    "origin": "https://www.juniorschimney.com",
    "facebook": "https://www.facebook.com/juniorschimney/",
}

NAV = [
    ("index.html", "Home"),
    ("services.html", "Services"),
    ("about.html", "About"),
    ("reviews.html", "Reviews"),
    ("contact.html", "Contact"),
]


def read(p):
    return (PARTIALS / p).read_text(encoding="utf-8")


def parse_front_matter(text):
    """Pull the leading <!--- key: value ---> block off a page fragment."""
    meta, body = {}, text
    m = re.match(r"\s*<!--\s*\n(.*?)\n-->\s*\n", text, re.S)
    if m:
        for line in m.group(1).splitlines():
            if ":" in line:
                k, v = line.split(":", 1)
                meta[k.strip()] = v.strip()
        body = text[m.end():]
    return meta, body


def nav_html(current, mobile=False):
    out = []
    for i, (href, label) in enumerate(NAV):
        cur = ' aria-current="page"' if href == current else ""
        if mobile:
            out.append(
                f'<a href="{href}"{cur}><i>0{i + 1}</i>{label}</a>'
            )
        else:
            out.append(f'<a href="{href}"{cur}>{label}</a>')
    return "\n          ".join(out)


def render(template, ctx):
    def sub(m):
        key = m.group(1).strip()
        if key not in ctx:
            raise KeyError(f"Unknown template token: {{{{{key}}}}}")
        return str(ctx[key])

    return re.sub(r"\{\{([A-Z0-9_]+)\}\}", sub, template)


def main():
    head = read("head.html")
    header = read("header.html")
    footer = read("footer.html")

    built = []
    for page in sorted((SRC / "pages").glob("*.html")):
        meta, body = parse_front_matter(page.read_text(encoding="utf-8"))
        slug = page.name

        ctx = {
            "TITLE": meta.get("title", SITE["name"]),
            "DESC": meta.get("description", ""),
            "CANONICAL": f"{SITE['origin']}/" + ("" if slug == "index.html" else slug),
            "OG_IMAGE": f"{SITE['origin']}/assets/img/{meta.get('og', 'og-default.jpg')}",
            "BODY_CLASS": meta.get("body_class", ""),
            "NAV": nav_html(slug),
            "NAV_MOBILE": nav_html(slug, mobile=True),
            "PHONE": SITE["phone_display"],
            "PHONE_HREF": SITE["phone_href"],
            "EMAIL": SITE["email"],
            "STREET": SITE["street"],
            "CITY": SITE["city"],
            "REGION": SITE["region"],
            "ZIP": SITE["zip"],
            "HOURS": SITE["hours"],
            "FACEBOOK": SITE["facebook"],
            "ORIGIN": SITE["origin"],
        }

        html = render(head, ctx) + render(header, ctx) + render(body, ctx) + render(footer, ctx)
        (ROOT / slug).write_text(html, encoding="utf-8")
        built.append(slug)

    print("built:", ", ".join(built))


if __name__ == "__main__":
    main()
