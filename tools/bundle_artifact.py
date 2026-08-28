#!/usr/bin/env python3
"""
Bundle the built multi-page site into ONE self-contained HTML file.

Used to publish a live, shareable preview of the site (an Artifact) without a
host. Everything is inlined — CSS, JS, fonts and images as data URIs — so the
single file renders identically with zero network requests.

The real deployable site remains the multi-page build at the repo root; this is
a preview artifact, not a replacement for it.

    python3 tools/bundle_artifact.py
"""
import base64
import mimetypes
import pathlib
import re

ROOT = pathlib.Path(__file__).resolve().parent.parent
OUT = ROOT / "dist" / "juniors-chimney-preview.html"
PAGES = ["index", "services", "about", "reviews", "contact"]
LABELS = {"index": "Home", "services": "Services", "about": "About",
          "reviews": "Reviews", "contact": "Contact"}


def data_uri(path: pathlib.Path) -> str:
    mime = mimetypes.guess_type(path.name)[0] or "application/octet-stream"
    return f"data:{mime};base64," + base64.b64encode(path.read_bytes()).decode()


def slice_between(html: str, start: str, end: str) -> str:
    i = html.index(start)
    j = html.index(end, i)
    return html[i + len(start):j]


# ---------------------------------------------------------------- assets
css = (ROOT / "assets/css/fonts.css").read_text() + "\n" + (ROOT / "assets/css/site.css").read_text()

# fonts + images -> data URIs
for font in sorted((ROOT / "assets/fonts").glob("*.woff2")):
    css = css.replace(f"/assets/fonts/{font.name}", data_uri(font))

js = (ROOT / "assets/js/site.js").read_text()

home = (ROOT / "index.html").read_text()

# ---------------------------------------------------------------- chrome (once)
header = slice_between(home, "<header class=\"masthead\">", "<main id=\"main\">")
header = "<header class=\"masthead\">" + header
footer_start = home.index("<footer class=\"footer\">")
footer_end = home.index("<script src=", footer_start)
footer = home[footer_start:footer_end]

# ---------------------------------------------------------------- routes
routes = []
for name in PAGES:
    html = (ROOT / f"{name}.html").read_text()
    body = slice_between(html, '<main id="main">', "</main>")
    routes.append(f'<div class="route" data-route="{name}" '
                  f'{"" if name == "index" else "hidden"}>{body}</div>')

# nav links -> router hrefs handled in JS; keep hrefs so they still read as links
page_html = f"""<div class="grain" aria-hidden="true"></div>
<div class="cursor-glow" aria-hidden="true"></div>
<div class="flue" aria-hidden="true"><i></i></div>
{header}
<main id="main">
{"".join(routes)}
</main>
{footer}
<div class="callbar" aria-hidden="false">
  <div class="callbar__inner">
    <a class="btn" href="tel:+12155263574">Call now</a>
    <a class="btn btn-ghost" href="contact.html" data-nav>Get a quote</a>
  </div>
</div>"""

# strip the duplicated call bar that came in with the footer slice
page_html = page_html.replace(
    '<div class="callbar" aria-hidden="false">\n  <div class="callbar__inner">\n'
    '    <a class="btn" href="tel:+12155263574">Call now</a>\n'
    '    <a class="btn btn-ghost" href="contact.html">Get a quote</a>\n'
    '  </div>\n</div>\n\n', "", 1)

# images -> data URIs
def inline_img(m):
    src = m.group(1)
    p = ROOT / src.lstrip("/")
    return f'src="{data_uri(p)}"' if p.exists() else m.group(0)


page_html = re.sub(r'src="(/assets/(?:img|brand)/[^"]+)"', inline_img, page_html)

# preview-only: the form must not POST to a live endpoint from inside the artifact
page_html = page_html.replace(' data-redirect="thank-you.html"', "")

router = """
/* ---- preview shell: client-side routing between the five pages ---- */
(function () {
  var PAGES = %s;
  var routes = document.querySelectorAll('.route');

  function show(name, push) {
    if (PAGES.indexOf(name) === -1) name = 'index';
    routes.forEach(function (r) { r.hidden = r.dataset.route !== name; });
    document.querySelectorAll('.nav a[href], .drawer a[href]').forEach(function (a) {
      var t = (a.getAttribute('href') || '').replace(/\\.html.*$/, '');
      {
        if (t === name) a.setAttribute('aria-current', 'page');
        else a.removeAttribute('aria-current');
      }
    });
    var active = document.querySelector('.route[data-route="' + name + '"]');
    if (active) active.querySelectorAll('[data-reveal]').forEach(function (e) { e.classList.add('is-in'); });
    window.scrollTo({ top: 0, behavior: 'auto' });
    // the ember canvas measures 0 while its route is hidden — re-measure on show
    window.dispatchEvent(new Event('resize'));
    if (push) history.replaceState(null, '', '#' + name);
    document.title = (name === 'index' ? '' : %s[name] + ' \\u00b7 ') + "Junior's Chimney";
  }

  document.addEventListener('click', function (e) {
    var a = e.target.closest('a[href]');
    if (!a) return;
    var href = a.getAttribute('href') || '';
    // Links carry deep anchors too (services.html#relining) — route on the file
    // part and scroll to the fragment afterwards.
    var m = href.match(/^(?:.*\\/)?([a-z0-9-]+)\\.html(#.*)?$/i);
    if (!m) return;
    var name = m[1], frag = m[2] || '';
    if (PAGES.indexOf(name) === -1 && name !== 'thank-you') return;
    e.preventDefault();
    var drawer = document.querySelector('.drawer');
    if (drawer && drawer.classList.contains('is-open')) {
      drawer.classList.remove('is-open');
      document.body.style.overflow = '';
      var burger = document.querySelector('.burger');
      if (burger) burger.setAttribute('aria-expanded', 'false');
    }
    show(name === 'thank-you' ? 'contact' : name, true);
    if (frag) {
      var target = document.querySelector(frag);
      if (target) target.scrollIntoView({ behavior: 'auto', block: 'start' });
    }
  });

  show((location.hash || '#index').slice(1), false);

  /* The contact form is fully wired on the real site. In this preview there is
     no inbox to deliver to, so intercept the send and show the success state. */
  var realFetch = window.fetch;
  window.fetch = function (url, opts) {
    if (String(url).indexOf('web3forms.com') !== -1) {
      return Promise.resolve({ ok: true, json: function () { return Promise.resolve({ success: true }); } });
    }
    return realFetch.apply(this, arguments);
  };
  var form = document.getElementById('quoteForm');
  if (form) {
    form.addEventListener('submit', function () {
      setTimeout(function () {
        var s = document.getElementById('formStatus');
        if (s && s.classList.contains('is-ok')) {
          s.innerHTML = 'Got it \\u2014 thank you. Junior will call you back shortly.'
            + '<br><small style="opacity:.75">Preview note: on the live site this email lands in Junior\\u2019s inbox.</small>';
        }
      }, 120);
    });
  }
})();
""" % (repr(PAGES).replace("'", '"'), repr(LABELS).replace("'", '"'))

doc = f"""<title>Junior's Chimney</title>
<style>
{css}
</style>
{page_html}
<script>
{js}
{router}
</script>
"""

OUT.parent.mkdir(exist_ok=True)
OUT.write_text(doc, encoding="utf-8")
print(f"wrote {OUT.relative_to(ROOT)}  ({OUT.stat().st_size/1048576:.2f} MB)")
