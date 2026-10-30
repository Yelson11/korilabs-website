# CLAUDE.md

Guide for AI agents (and humans) working on this repo. Read this first; it should save you from
re-reading the whole project. Keep it up to date when the structure changes (see the last section).

## What this is

Website of **Kori Labs**, a small Costa Rican tabletop-game studio. Its first game is **PINTO**
(a racing card game, still "coming soon"). Live at **https://korilabscr.com** (`CNAME`).

- **Plain static site:** hand-written HTML + CSS, a little vanilla JS. No framework, no npm, no build
  step, no tests, no linter.
- **Hosting:** GitHub Pages, deploys `main` / root automatically (1–2 min). `.nojekyll` disables Jekyll.
  Anything merged to `main` is live, so treat `main` as production.
- **Run locally:** `python3 -m http.server` from the repo root, then open http://localhost:8000.
  Use a server rather than `file://` so root-relative behaviour and redirects match production.

## Language rules (important)

| What | Language |
| --- | --- |
| Commit messages, branch names, PR titles and descriptions | **English** |
| Code comments you add or rewrite, this file | **English** |
| Everything visitors see (page text, `alt`, `aria-label`, `<title>`, meta/OG tags) | **Spanish (Costa Rica)** — `lang="es"`, `og:locale` `es_CR` |
| `README.md` | Spanish (owner-facing how-to). Keep it in Spanish unless asked otherwise |
| URLs / folder names (`juegos/`, `privacidad/`, `regalos/`, `pinto/reglas/`, `juegos/pinto/instrucciones/`) | Spanish — **never rename**, they are public and some are printed |

History before October 2026 is in Spanish; that's expected. Don't rewrite existing Spanish code
comments just to translate them — only translate what you are already touching.

## Git & commit conventions

- Work on a branch and open a PR to `main` (PRs are squash-merged). Branch names: short, English,
  kebab-case, optional prefix: `feat/…`, `fix/…`, `content/…`, `chore/…` (e.g. `fix/diamond-divider`).
- Commit/PR title format: optional scope + colon + imperative summary, in English, no trailing period,
  ~72 chars max. Scopes used in this repo: `Home`, `PINTO`, `Subscribe`, `Privacy`, `Assets`, `Docs`.
  - ✅ `PINTO: add Subscribe and Instagram links to the header`
  - ✅ `Home: tighten spacing above the subscribe section`
  - ❌ `PINTO: añadir Suscríbete e Instagram al header`
- Body (optional): a short bullet list of what changed and why. Quoting Spanish UI text is fine
  (e.g. `- Rename CTA to "Conoce PINTO"`).
- One logical change per commit/PR. Don't mix content edits with refactors.

## Directory map

```
/
├── index.html               Home page (all home text lives here)
├── CNAME                    korilabscr.com (GitHub Pages custom domain) — don't touch
├── .nojekyll                Disables Jekyll on Pages — don't delete
├── robots.txt               Disallows /regalos/
├── favicon.ico              Fallback favicon
├── README.md                Owner how-to (Spanish): content edits, Sender, social links, OG image
├── assets/
│   ├── favicon.svg          Cat favicon; switches color with prefers-color-scheme
│   ├── apple-touch-icon.png
│   ├── pattern.svg          Diamond/cat background pattern
│   ├── og-korilabs.jpg      1200×630 share preview for the home page
│   └── pinto-caja.webp      PINTO box used on the home game card
├── css/
│   ├── styles.css           Base: tokens, reset, header/nav, footer, shared bits (loaded on every page)
│   ├── home.css             Home page (h-* classes); also reused by /privacidad/
│   ├── pinto.css            PINTO page (p-* classes, box3d__*), its own dark "asphalt" palette
│   └── legal.css            Privacy page layout (legal__*)
├── juegos/
│   ├── index.html           Meta-refresh redirect → /#juegos (home section). Replace with a listing when there are more games
│   └── pinto/
│       ├── index.html       PINTO page: hero with 3D box, "Cómo se juega", rhythm cards, special cards, CTA
│       ├── box3d.js         Auto-rotating, draggable CSS-3D box with per-face shading (no deps, respects reduced motion)
│       ├── instrucciones/index.html  Rules summary + "Descargar reglamento" PDF button. TARGET OF THE PRINTED QR — never move
│       ├── reglamento.pdf   Official rules PDF (v1.3, source of truth). Linked from instrucciones/ only
│       └── img/             caja-*.webp (6 box faces), cartas/*.webp (card art from Figma "Deck v1.0"),
│                            logo-pinto.webp, og-pinto.jpg (share preview)
├── pinto/reglas/index.html  Meta-refresh → /juegos/pinto/instrucciones/ (short alias; keep working)
├── privacidad/index.html    Privacy policy (only email is collected, via Sender; contact info@korilabscr.com)
└── regalos/
    └── pinto-modo-temporada.pdf  Subscriber gift (score sheets). Public by URL, hidden from search engines
```

## Pages in detail

### Home — `index.html` (`<body class="home">`, CSS: `styles.css` + `home.css`)
1. Hidden inline SVG sprite at the top: `<symbol>`s `icon-instagram`, `icon-players`, `icon-clock`,
   `icon-age`, `icon-imaginar`, `icon-crear`, `icon-compartir`. Use via `<use href="#icon-…"/>`.
   The game-stat icons are duplicated in `juegos/pinto/index.html` — keep both in sync.
2. `header.site-header` + `nav.site-nav` (shared pattern on every page; nav links are hard-coded per page).
3. `section.h-hero` — `h1` "Estamos preparando la mesa…".
4. `section#juegos.h-games` — PINTO card (box image, chips: players / time / 8+ age) and "Más juegos en el taller".
5. `section#suscribete.h-join` — Sender newsletter form (see below).
6. `section.h-values` — Imaginar / Crear / Compartir.
7. `footer.site-footer.h-footer` — includes link to `/privacidad/`.
8. Inline `<script>` at the end: Sender form fallback ("Cargando…" → after 8 s shows a link to the hosted form).

### PINTO — `juegos/pinto/index.html` (`<html class="no-js">` → `js`, CSS: `styles.css` + `pinto.css`)
Fonts: Istok Web + **Poppins** (display). Sections: `p-hero` (title + `#box-stage`/`#box3d` 3D box),
"Cómo se juega", "Cartas de ritmo" (ritmo-1…8), "Cartas especiales" (banderas, rebufo, vuelta rápida),
`p-cta` "Muy pronto en la parrilla de salida". Script: `box3d.js` (deferred).
Below the 3-step "Cómo se juega" there's a "Ver instrucciones completas" link; a "Modos de juego" section
(Modo Rápido / Modo Temporada, icons `img/icono-bandera-cuadros.svg` / `img/icono-trofeo.svg`) sits before the CTA.
Game facts (players, duration, 8+, card names, rules wording) must stay consistent between the home
card, this page, `instrucciones/` and `reglamento.pdf` v1.3.

### PINTO instructions — `juegos/pinto/instrucciones/index.html` (CSS: `styles.css` + `pinto.css`)
Target of the QR printed in the rules leaflet. A **summary** of the rules, not a copy of the PDF: the PDF is
the detailed source of truth (edge cases, FAQ, full championship scoring). Sections: intro with download
button + in-page chips (`p-toc`), `#preparacion` (steps + deck table), `#turno`, `#mesa`, `#especiales`,
`#referencia` (quick-reference table), `#modos`, closing CTA with a second download button. The score
sheet gift is offered via "Suscribirme" (`/#suscribete`), never linked directly. If the PDF changes, update
the size/page count shown next to the download button.

### Privacy — `privacidad/index.html` (CSS: `styles.css` + `home.css` + `legal.css`)

## Design tokens

- `css/styles.css` `:root`: `--forest #1f4f37`, `--cream #f7f3ea`, `--cream-dim`, `--peach #fee4c1`,
  `--line`, `--font` (Istok Web + system stack), `--gutter`.
- `css/home.css`: `--forest-deep`, `--forest-line`, `--kori #399e5a`, `--teal #51a3a3`, `--asphalt*`,
  `--pinto-red #e5463b`, `--sep`.
- `css/pinto.css` redefines its own palette (`--asphalt*`, `--cream`, `--red`, `--display: Poppins`) and
  box dimensions `--bw/--bh/--bd` (box ratio 758 × 1057 × 244 — keep it if box images change).
- Class prefixes: `h-` home, `p-` PINTO, `legal__` privacy, BEM-ish (`block__elem--mod`).
  Utility: `.visually-hidden`, `.accent`.
- Every CSS file has a `prefers-reduced-motion` block; keep animations behind it.

## Rules & gotchas

- **Cache busting:** CSS/JS/image links carry `?v=N`. When you change a file, bump its `N` **in every
  page that links it** (e.g. `home.css` is linked from `index.html` *and* `privacidad/index.html`).
  Current: `styles.css?v=2`, `home.css?v=6` (index) / `?v=3` (privacidad — stale, bump when touching),
  `pinto.css?v=8`, `legal.css?v=1`, `box3d.js?v=2`, `favicon.svg?v=2`, box faces `?v=2`.
- **Relative paths everywhere** (`../../css/…`). Pages live in folders as `index.html` so URLs are clean
  (`/juegos/pinto/`). New pages: create `folder/index.html`, copy the head/header/footer of a sibling page.
- **Sender (newsletter):** universal script in the `<head>` of `index.html`; form is
  `div.sender-form-field[data-sender-form-id="dNk3wL"]`; fallback block `[data-sender-fallback]` links to
  `https://stats.sender.net/forms/dNk3wL/view`. Form look and the welcome/gift email are configured in
  Sender, not here. Only touch code if the form ID changes.
- **Never break public URLs:** `/juegos/pinto/instrucciones/` (printed QR), `/pinto/reglas/`,
  `/regalos/pinto-modo-temporada.pdf` (sent in emails), `/privacidad/`. `reglamento.pdf` is only reached
  through the instructions page, so it may move — just update both download buttons there.
- **Share previews:** `og-korilabs.jpg` / `og-pinto.jpg` are 1200×630; regenerate if headlines change.
  Absolute `og:url` / `og:image` / canonical use `https://korilabscr.com/…`.
- **Accessibility:** keep `aria-labelledby` on sections, `alt` text (Spanish), visible focus styles,
  external links with `target="_blank" rel="noopener noreferrer"` plus a visually-hidden "(se abre en una
  pestaña nueva)".
- **Assets:** prefer `.webp` for images; keep files small (no build step will optimize them).
- No dependencies to install. Don't add a framework, bundler or package.json without being asked.

## Before opening a PR

1. Serve locally and check the pages you touched at mobile (~375 px) and desktop widths, light and dark
   OS theme, and with reduced motion if you touched animation.
2. Bumped `?v=N` for every changed CSS/JS file on every page that links it.
3. No broken relative links (`grep -rn 'href=\|src=' <file>` on new pages).
4. Visitor-facing text in Spanish; commit/PR text in English.

## Keeping this file current

If you add/move/remove pages, CSS files, scripts, tokens or public URLs, update the directory map and
the relevant section here in the same PR, so the next agent doesn't have to rediscover it.
