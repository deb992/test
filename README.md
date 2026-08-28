# Junior's Chimney — website

A complete rebuild of juniorschimney.com. Static HTML/CSS/JS — no WordPress, no page
builder, no monthly platform fee. It will run on free hosting and load in well under a
second.

**Pages:** Home · Services · About · Reviews · Contact (+ thank-you and 404)

---

## ⚠️ Three things to do before this goes live

Everything else is finished. These three need real information that only Junior has.

### 1. Point the contact form at his inbox — REQUIRED

Right now the form validates, but it will not deliver until a key is set. Pick one:

**Option A — any host (recommended, free, 2 minutes)**

1. Go to <https://web3forms.com>, enter Junior's real email, and copy the Access Key.
2. Open `src/pages/contact.html`, find `REPLACE_WITH_WEB3FORMS_ACCESS_KEY`, paste the key in.
3. Run `python3 build.py`.

Submissions then arrive as an email with the customer's name, phone, email, address,
which services they ticked, how urgent it is, and their message. Reply-to is set to the
customer, so hitting Reply in his email client goes straight to them.

**Option B — hosts that run PHP** (GoDaddy, Bluehost, SiteGround, most cPanel hosts)

1. Set `$TO` at the top of `send.php` to Junior's inbox.
2. In `src/pages/contact.html`, change `action="https://api.web3forms.com/submit"` to
   `action="send.php"` and delete the `access_key` hidden input.
3. Run `python3 build.py`.

If neither is set up, the form shows the customer an error with the phone number and
email address — it never fails silently.

### 2. Swap in Junior's real photographs

Every image in `assets/img/` is a generated placeholder with "REPLACE" written on it.
Drop his real photos in **using the exact same filenames** and the site picks them up —
no code changes.

| File | Size (px) | What it should be |
|---|---|---|
| `hero-roofline.jpg` | 1920×1280 | **The money shot.** Junior on a roof beside a chimney, late afternoon light. Shot wide with room on the right — the headline sits on the left. |
| `junior-portrait.jpg` | 900×1200 | Vertical. Junior with his tools or at the truck. Looking at camera. |
| `service-sweeping.jpg` | 1200×900 | Rods and the HEPA vacuum at a firebox, tarps visible. |
| `service-relining.jpg` | 1200×900 | Stainless liner going down a flue. |
| `service-certification.jpg` | 1200×900 | Inspection camera / signed paperwork. |
| `service-dryer-vent.jpg` | 1200×900 | Dryer vent run being cleared. |
| `work-crown-before.jpg` | 1200×750 | Before shot of a chimney. |
| `work-crown-after.jpg` | 1200×750 | **Same chimney, same angle, after.** These two power the drag-to-compare slider, so the framing must match. |
| `equipment.jpg` | 1200×900 | Truck / rods / HEPA vac / camera laid out. |
| `og-*.jpg` | 1200×630 | Link previews for texts, Facebook and Google. `og-default.jpg` is the important one. |
| `apple-touch-icon.png` | 180×180 | Home-screen icon. |

Phone photos are fine — daylight, hold it steady, wipe the lens. Landscape for everything
except the portrait. More photos of real jobs is the single biggest upgrade left in this site.

### 3. Put the real reviews in

The three testimonials currently on Home and Reviews are close paraphrases of Junior's
actual Yelp and Facebook reviews, attributed only to "Verified customer" — because I could
not retrieve the reviewers' real names, and inventing names on a live business site is not
something I'll do.

Copy the real review text and first names off his Facebook and Yelp pages into
`src/pages/index.html` and `src/pages/reviews.html`, then run `python3 build.py`.
Real names make these convert dramatically better.

---

## Editing the site

Business facts live in **one place**: the `SITE` dictionary at the top of `build.py`
(phone, email, address, hours, Facebook URL). Change it there and every page updates.

```
src/partials/head.html     <head>, SEO tags, Google structured data
src/partials/header.html   Logo, nav, phone button, mobile menu
src/partials/footer.html   Footer + mobile call bar
src/pages/*.html           The actual page content
```

After any edit:

```bash
python3 build.py
```

That regenerates the `.html` files in the root. **Edit `src/`, never the root `.html`
files** — they get overwritten.

To preview locally:

```bash
python3 -m http.server 8080     # then open http://localhost:8080
```

---

## Deploying

**Netlify (free, recommended)** — drag this whole folder onto <https://app.netlify.com/drop>.
Live in about 20 seconds. `netlify.toml` is already configured with caching, security
headers, and redirects from the old URLs (`/services`, `/about`, `/testimonials`, `/contact`)
so existing Google results keep working.

Then point `juniorschimney.com` at it in Netlify → Domain settings. HTTPS is automatic.

**Any traditional host** — upload everything by FTP. There is no build step required on the
server; the `.html` files are ready to serve.

If the site ends up somewhere other than `https://www.juniorschimney.com`, update `origin`
in `build.py`, plus `robots.txt` and `sitemap.xml`.

---

## Design notes

- **Type:** Fraunces (display) + Archivo (text), self-hosted in `assets/fonts/`. No Google
  Fonts request — faster, and it renders identically on every network.
- **Colour:** soot black, bone, brass, and an ember gradient. Warm, expensive, and nothing
  like the red-and-blue clipart every other chimney site uses.
- **The chimney cutaway** on the home page is hand-drawn SVG, not a stock graphic. Hovering
  a hotspot highlights the matching explanation. It is the thing people will remember.
- **Motion:** ember particles on a canvas, scroll reveals, a scroll-progress line, and a
  drag-to-compare before/after slider. All of it switches off automatically for anyone who
  has "reduce motion" turned on.
- Logo mark is custom SVG (`assets/brand/`) — scales to a business card or a truck door.

---

## What was verified

- **24 functional tests** pass (`node test.js`) — form validation, multi-select services,
  redirect on success, spam honeypot, diagram hotspots, before/after slider, mobile drawer,
  sticky call bar.
- **Zero WCAG 2.1 A/AA violations** (`node a11y.js`, axe-core) across 7 pages × 2 viewports.
- No console errors and no horizontal scroll at 1440px or 390px.

Re-run any of these with the local server running.

## Regenerating assets

```bash
python3 tools/make_placeholders.py   # rebuild placeholder images (delete once real photos are in)
python3 tools/fetch_fonts.py         # re-download webfonts (only if the type system changes)
python3 tools/bundle_artifact.py     # bundle the whole site into one shareable HTML file
```

`tools/bundle_artifact.py` writes `dist/juniors-chimney-preview.html` — every page,
stylesheet, script, font and image inlined into a single file that opens by
double-clicking, with no server and no internet connection. Handy for showing the
site to someone before it is hosted. `dist/` is generated output and is not tracked
in git; rebuild it any time with that command.
