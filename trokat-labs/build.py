#!/usr/bin/env python3
"""
TroKat Labs — static site assembler.

Pages are body fragments in src/pages/ with a small front-matter block; shared
chrome lives in src/partials/. Running this writes dependency-free HTML to this
folder, ready to drop on any host.

    python3 build.py
"""
import json
import pathlib
import re

ROOT = pathlib.Path(__file__).parent
SRC = ROOT / "src"
PARTIALS = SRC / "partials"

SITE = {
    "name": "TroKat Labs",
    "tagline": "Practical software. Real solutions. Built for life.",
    "phone_display": "267-251-7056",
    "phone_href": "+12672517056",
    "email": "deb@trokatlabs.com",
    "origin": "https://www.trokatlabs.com",
    "motto": ["Innovate", "Build", "Explore", "Inspire"],
}

NAV = [
    ("index.html", "Home"),
    ("apps.html", "Apps"),
    ("studio.html", "Studio"),
    ("about.html", "About"),
    ("contact.html", "Contact"),
]

# The product family. `verified` marks copy taken from TroKat's own artwork;
# everything else is a draft written from the app mark and needs Deb's words.
APPS = [
    {
        "slug": "corex", "name": "TroKat CoreX", "short": "CoreX",
        "blurb": "The shared core the other apps are built on — accounts, data and integrations in one place.",
        "verified": False,
    },
    {
        "slug": "networking", "name": "TroKat Networking", "short": "Networking",
        "blurb": "A complete networking management system for groups and organizations. Track referrals, attendance, leaderboards, members, and more.",
        "verified": True,
    },
    {
        "slug": "inventory", "name": "TroKat Inventory", "short": "Inventory",
        "blurb": "Inventory and order management made easy. Track products, manage orders, monitor stock, and streamline your business operations.",
        "verified": True,
    },
    {
        "slug": "travelers", "name": "TroKat Travelers", "short": "Travelers",
        "blurb": "AI-assisted travel planning that organizes itineraries, maps, restaurants, notes, and everything you need for the perfect trip.",
        "verified": True,
    },
    {
        "slug": "globe", "name": "TroKat Globe", "short": "Globe",
        "blurb": "An interactive world map that clusters pins, photos and notes. Drop a pin anywhere and everything you saved there comes with it.",
        "verified": False,
    },
    {
        "slug": "openhouse", "name": "TroKat OpenHouse", "short": "OpenHouse",
        "blurb": "Open-house sign-in without the clipboard. Visitors scan a code, and every lead lands in one place.",
        "verified": False,
    },
    {
        "slug": "webs", "name": "TroKat Webs", "short": "Webs",
        "blurb": "Fast, owned websites for small businesses — built properly and hosted without a monthly platform fee.",
        "verified": False,
    },
    {
        "slug": "mailer", "name": "TroKat Mailers", "short": "Mailers",
        "blurb": "Mailing and campaign management. Build the list, send the message, see what actually landed.",
        "verified": False,
    },
    {
        "slug": "voice", "name": "TroKat Voice", "short": "Voice",
        "blurb": "Daily-living support for people with cognitive challenges — routine, reminders and reassurance, in a voice that is easy to follow.",
        "verified": False,
    },
]


def read(p):
    return (PARTIALS / p).read_text(encoding="utf-8")


def front_matter(text):
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
        out.append(f'<a href="{href}"{cur}><i>0{i+1}</i>{label}</a>' if mobile
                   else f'<a href="{href}"{cur}>{label}</a>')
    return "\n          ".join(out)


def app_cards():
    out = []
    for a in APPS:
        out.append(
            f'''<article class="app" data-reveal>
        <div class="app__top">
          <img class="app__mark" src="/assets/apps/web/trokat-{a['slug']}-512.webp"
               alt="" width="512" height="512" loading="lazy">
          <span class="app__name"><b>{a['short']}</b><i>TroKat {a['short']}</i></span>
        </div>
        <p>{a['blurb']}</p>
        <a class="stretch link" href="apps.html#{a['slug']}">Learn more</a>
      </article>''')
    return "\n      ".join(out)


def app_sections():
    out = []
    for i, a in enumerate(APPS):
        flip = " app-row--flip" if i % 2 else ""
        out.append(f'''<section class="section app-row{flip}" id="{a['slug']}">
  <div class="wrap grid g2" style="gap:clamp(2rem,5vw,4.5rem);align-items:center">
    <div class="app-row__art" data-reveal>
      <img src="/assets/apps/web/trokat-{a['slug']}-512.webp" alt="{a['name']} logo"
           width="512" height="512" loading="lazy">
    </div>
    <div>
      <p class="tag" data-reveal>{a['name']}</p>
      <h2 class="d3" style="margin:1rem 0 1rem" data-reveal data-d="1">{a['short']}</h2>
      <p class="lede" data-reveal data-d="2">{a['blurb']}</p>
      <div class="hero__actions" data-reveal data-d="3">
        <a class="btn btn-ghost" href="contact.html?app={a['slug']}">Ask about {a['short']}</a>
      </div>
    </div>
  </div>
</section>''')
    return "\n".join(out)


def orbit_data():
    return json.dumps([
        {"name": a["short"], "blurb": a["blurb"],
         "icon": f"/assets/apps/web/trokat-{a['slug']}-orb.png",
         "href": f"apps.html#{a['slug']}"}
        for a in APPS
    ]).replace('"', "&quot;")


def render(tpl, ctx):
    def sub(m):
        k = m.group(1).strip()
        if k not in ctx:
            raise KeyError(f"Unknown token {{{{{k}}}}}")
        return str(ctx[k])
    return re.sub(r"\{\{([A-Z0-9_]+)\}\}", sub, tpl)


def main():
    head, header, footer = read("head.html"), read("header.html"), read("footer.html")
    built = []
    for page in sorted((SRC / "pages").glob("*.html")):
        meta, body = front_matter(page.read_text(encoding="utf-8"))
        slug = page.name
        ctx = {
            "TITLE": meta.get("title", SITE["name"]),
            "DESC": meta.get("description", ""),
            "CANONICAL": f"{SITE['origin']}/" + ("" if slug == "index.html" else slug),
            "OG_IMAGE": f"{SITE['origin']}/assets/img/{meta.get('og', 'og-default.jpg')}",
            "BODY_CLASS": meta.get("body_class", ""),
            "NAV": nav_html(slug), "NAV_MOBILE": nav_html(slug, True),
            "PHONE": SITE["phone_display"], "PHONE_HREF": SITE["phone_href"],
            "EMAIL": SITE["email"], "ORIGIN": SITE["origin"], "TAGLINE": SITE["tagline"],
            "APP_CARDS": app_cards(), "ORBIT": orbit_data(), "APP_SECTIONS": app_sections(),
            "APP_COUNT": str(len(APPS)),
        }
        html = render(head, ctx) + render(header, ctx) + render(body, ctx) + render(footer, ctx)
        (ROOT / slug).write_text(html, encoding="utf-8")
        built.append(slug)
    drafts = [a["short"] for a in APPS if not a["verified"]]
    print("built:", ", ".join(built))
    print("draft copy awaiting Deb's words:", ", ".join(drafts))


if __name__ == "__main__":
    main()
