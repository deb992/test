# TroKat Labs — website

Static HTML/CSS/JS. No platform, no monthly fee. Runs on free hosting.

**Pages:** Home (the ecosystem map) · Apps · Studio · About · Contact (+ thank-you, 404)

---

## Before it goes live — four things

### 1. Point the contact form at deb@trokatlabs.com — REQUIRED
Go to <https://web3forms.com>, enter the address, copy the Access Key.
Open `src/pages/contact.html`, replace `REPLACE_WITH_WEB3FORMS_ACCESS_KEY`,
then run `python3 build.py`.

### 2. Six app descriptions need your words
`build.py` holds every app in one list, each with a `verified` flag.
These three use TroKat's own published copy: **Networking, Inventory, Travelers**.
These six are drafts written from the app marks and need replacing:

| App | Why it's a draft |
|---|---|
| CoreX | Guessed it's the shared engine the others sit on |
| Globe | Guessed from the map-pin icon and the Globe deploy zips |
| OpenHouse | Guessed from the house-and-QR icon |
| Webs | Guessed from the browser icon |
| Mailers | Guessed from the mailbox icon |
| Voice | Guessed from the icon; the original draft referenced cognitive support and was removed |

Edit the `blurb` in `build.py`, flip `verified` to `True`, run `python3 build.py`.

### 3. Status chips are switched off
Your two ecosystem graphics disagree — one has Inventory as LIVE BETA, the other
as WORKING; Travelers is IN DEVELOPMENT in one and WORKING in the other. Rather
than publish a guess the chips are absent. The styling exists (`.chip.working`,
`.chip.beta`, `.chip.dev`) — give the real status per app and they go in.

### 4. Nine apps or eight?
The site currently shows nine. If CoreX is the shared platform rather than a
product, it belongs inside the centre circle and the map becomes eight apps
around a core — a cleaner diagram. Your call.

---

## Editing

Business facts live in one place: the `SITE` dict at the top of `build.py`
(phone, email, origin). The app family lives in `APPS` right below it — name,
blurb and verified flag. Change either and every page updates.

```
src/partials/   head, header, footer
src/pages/      page content
assets/brand/   the TroKat lockup and icons
assets/apps/    the nine app marks (source PNGs + keyed web versions)
```

After any edit:

```bash
python3 build.py          # regenerates the .html files here
python3 -m http.server 8082   # preview at http://localhost:8082
```

Edit `src/`, never the root `.html` files — they get overwritten.

---

## Deploying

Drag this folder onto <https://app.netlify.com/drop>. Live in about 20 seconds.
`netlify.toml` already sets caching and security headers. Point trokatlabs.com
at it in Netlify → Domain settings.

If the domain differs, update `origin` in `build.py`, `robots.txt` and `sitemap.xml`.

---

## Design notes

- **The home page is the ecosystem.** TroKat Labs at the centre, every app on a
  spoke, each card carrying its own description. Click a card, go to that app.
  Connector wires are drawn in SVG after layout and redrawn on resize.
- **Your artwork, keyed.** The nine app marks were lifted from *Business Plans >
  New Artwork* and keyed off their black plates with a smoothstep luma ramp, so
  each bulb and its amber ring floats with no visible tile edge.
- **The header lockup is composed, not cropped.** The supplied lockup could not
  be keyed — its plate is genuinely bright — so it was rebuilt from the keyed
  bulb plus the keyed chrome wordmark.
- **Palette sampled from the pixels:** void navy ground, cyan `#3BC8FF` and blue
  `#0A6CE8` for structure, amber `#F87A18` held back for the spokes and status.
- **Type:** Bricolage Grotesque, Instrument Sans and JetBrains Mono, self-hosted.

## Verified

- Zero WCAG 2.1 A/AA violations across 7 pages × 2 viewports (`node a11y.js`).
- No console errors, no horizontal scroll at 1440px or 390px.
