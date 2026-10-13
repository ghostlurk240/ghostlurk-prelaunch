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
- Copy limits: never mention swaps, prices, the token, or how anything works. One button only: Follow on X (https://x.com/Ghostlurk_). No arrow icons or arrow characters.

## Preview and deploy

- Preview: `python3 -m http.server 8000` in this folder, then open http://localhost:8000
- Railway: runs `npm start` (`server.js`, no dependencies), which serves only the site files on Railway's `PORT` (8080 if unset). Test it the same way locally: `PORT=4321 npm start`, then open http://localhost:4321
- Every push to `main` also deploys to GitHub Pages via `.github/workflows/pages.yml` (kept as a backup).
- GitHub Pages: https://ghostlurk240.github.io/ghostlurk-prelaunch/
