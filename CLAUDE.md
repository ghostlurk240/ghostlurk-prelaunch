# CLAUDE.md

Ghostlurk pre-launch teaser. One page, plain HTML, CSS and a little JavaScript. No framework, no build step.

## Working with me

- I'm a designer. Explain things in plain words, not developer jargon.
- Never use em dashes, in replies, copy, code comments, or commit messages.
- When I say "push it": commit with a short, clear message, push `main` to GitHub, and confirm the GitHub Pages deploy finished (check the Actions run with `gh run watch` and open the live URL).

## The site

- `index.html`: the page. `assets/css/site.css`: all styles. `assets/js/site.js`: veil, reveal, countdown, peek, whispers, ghost smoke.
- The look is copied from the Ghostlurk website (`~/Projects/Ghostlurk website`): palette, fonts (Unbounded, Geist, Geist Mono), grain, veil, blur-to-sharp reveal, `#haunt` filter, ghost smoke and cursor. Do not reinvent them. If the website changes, copy the change from its `app/globals.css`.
- Colors: ink `#0b1030`, cobalt `#2f479b`, indigo `#4848a8`, ice `#e6f0f5`, charcoal `#4f555b`, accent Lantern amber `#ffb61c`.
- Countdown target: Oct 31, 2026, 9:00 PM US Eastern (`easternToUtc` in `site.js` handles daylight saving).
- Only use real NFT art from the website's `public/art`, never drawn or generated ghosts.
- Motion is always on; only the device's reduced-motion setting turns it down. No video: the haze is CSS.
- Layout ("The Apparition"): a giant dim, blurred Ghostlurk (`assets/art/apparition.webp`, from the website's `ghostlurlk2`, smoothed so it stays small; the page grain adds texture back) fills the center behind everything, eyes glowing faint amber, rising from a fog bank. Logo top-left (centered on phones), "10.31" top-right, headline and the rest centered over the fog.
- The art's eyes sit at 32.2% / 44.4% across and about 30% down. `site.css` (`.ghost-box`, `.ghost-eyes`) and the blink whisper in `site.js` use those numbers; update them if the art changes.
- Effects (one per element, nothing busy): ember glow on amber words, smoke whispers at random spots around the ghost, "you blinked. it didn't." after 5 seconds of stillness, lantern cursor that sharpens the ghost and shows two hidden lines (tap on phones), smoke flicker on countdown digits, a rare tagline flicker, logo mark float with an amber eye glint on hover. With reduced motion, only the static glow stays.
- Motion layer (mouse, or taps on phones; all off with reduced motion): the ghost and fog shift at different depths with the cursor, the eye glows follow it, the button leans toward a nearby cursor, a faint scan line passes through the ghost every 13 seconds, and "10.31" and the date line decode out of scrambled code on load, hover or tap.
- The logo sits above the page grain so it stays crisp. Sources are the website's `logo-mark.webp` and `logo-word.webp` (no SVG exists; both are over 2x the shown size).
- Keep the whole site under 500 KB.
- Copy limits: never mention swaps, prices, the token, or how anything works. One button only: Follow on X (https://x.com/Ghostlurk_). No arrow icons or arrow characters.

## Preview and deploy

- Preview: `python3 -m http.server 8000` in this folder, then open http://localhost:8000
- Railway: runs `npm start` (`server.js`, no dependencies), which serves only the site files on Railway's `PORT` (8080 if unset). Test it the same way locally: `PORT=4321 npm start`, then open http://localhost:4321
- Every push to `main` also deploys to GitHub Pages via `.github/workflows/pages.yml` (kept as a backup).
- GitHub Pages: https://ghostlurk240.github.io/ghostlurk-prelaunch/
