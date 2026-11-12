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
│   ├── pinto-caja.webp      PINTO box used on the home game card
│   ├── sello-hecho-en-costa-rica.svg  "Hecho en Costa Rica · Kori Labs" seal (PINTO hero, under the fact chips)
│   └── taller/              Logos for the home "Taller" carousel (last-of-the-wilds.webp)
├── css/
│   ├── styles.css           Base: tokens, reset, header/nav, footer, shared bits (loaded on every page)
│   ├── home.css             Home page (h-* classes); also reused by /privacidad/
│   ├── pinto.css            PINTO page (p-* classes, box3d__*), its own dark "asphalt" palette
│   ├── pinto-demo.css       PINTO demo board (pd-* classes), loaded after pinto.css
│   ├── pinto-tutorial.css   PINTO rules tutorial (pt-* classes), loaded after pinto.css
│   ├── pinto-temporada.css  PINTO season scorekeeper (ps-* classes), loaded after pinto.css
│   └── legal.css            Privacy page layout (legal__*)
├── juegos/
│   ├── index.html           Meta-refresh redirect → /#juegos (home section). Replace with a listing when there are more games
│   └── pinto/
│       ├── index.html       PINTO page: hero with 3D box, "Cómo se juega", rhythm cards, special cards, CTA
│       ├── menu.js          Hamburger menu for the PINTO header (loaded on all six PINTO pages)
│       ├── box3d.js         Auto-rotating, draggable CSS-3D box with per-face shading (no deps, respects reduced motion)
│       ├── instrucciones/index.html  Welcome page for QR visitors (tutorial, resources) + quick rules guide (v1.5). Full rules PDF opens in a new tab, no `download` attr. TARGET OF THE PRINTED QR — never move
│       ├── reglamento.pdf   Official rules PDF ("Instrucciones", phone version, 9 pages; replaced Nov 2026). Linked from instrucciones/ only
│       ├── demo/            Playable web demo (you vs 3 bots). Unlisted + noindex while it's being tested.
│       │   ├── index.html   Page shell (board markup, help text); CSS: styles.css + pinto.css + pinto-demo.css
│       │   ├── pinto-engine.js  Pure rules engine (no DOM, also runs in Node for simulations). Rules changes go here
│       │   ├── demo.js      Rendering, selection, bot pacing, result panel (uses window.PintoEngine)
│       │   └── multijugador/ Online with friends, 2–4 players (unlisted + noindex). index.html (lobby + board) and
│       │                    multi.js: PeerJS rooms (4-char code, ?sala=CODE link); the room creator's browser runs
│       │                    the engine and sends each player only their view. ?transporte=local = multi-tab test mode
│       ├── tutorial/        Tutorial = rules finder (indexable; linked from instrucciones/). Content follows the printed
│       │                    leaflet ("PINTO · Instrucciones"), without Objetivo/Contenido/Preparación/Quién comienza (owner's
│       │                    choice). Four groups: En tu turno, Fases de la carrera, Combinaciones (Encadenar + Carril Lleno;
│       │                    our name, the leaflet has no title for them), Cartas especiales. Each rule = a visitor question
│       │                    (+ official name), leaflet text, optional note / "Sobre" / "Luego", related rules and a looping,
│       │                    GIF-like animation on a mini table (pause button). Phones: list (sticky search + group chips,
│       │                    special cards as a grid) → one rule per #hash with a fixed bottom bar (Anterior · Reglas ·
│       │                    Siguiente) and a <dialog> bottom sheet with every rule. Desktop (≥60rem): sticky sidebar
│       │                    (search + all questions) + the open rule. Search is accent-insensitive word-prefix matching
│       │                    over question, name, text and per-rule `keys` synonyms.
│       │                    tutorial-data.js (GROUPS → rules), tutorial.js (hash router #<rule id> / #<group id>, old
│       │                    #desarrollo / #reglas still work; rule ids are linked from instrucciones/ — keep them).
│       │                    CSS: styles.css + pinto.css + pinto-tutorial.css
│       └── img/             caja-*.webp (6 box faces), cartas/*.webp (card art, 660×922, cream border baked in,
│                            rendered from the Figma SVG export; special cards WITHOUT their description — see rules),
│                            logo-pinto.webp, og-pinto.jpg (share preview), favicon/ (favicon.ico, favicon.png 48px, apple-touch-icon.png — PINTO pages only)
│       ├── modos/index.html Meta-refresh → ../instrucciones/#modos (modos/ has no page of its own)
│       ├── modos/temporada/ Modo Temporada scorekeeper (see "PINTO season scorekeeper" below). index.html (shell) +
│       │                    temporada.js (whole app). Linked from the Temporada mode card on the PINTO page and instrucciones/
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
   Home nav: Juegos / Taller / Suscríbete (Suscríbete is hidden under 30rem so it fits on phones).
3. `section.h-hero` — `h1` "Estamos preparando la mesa…" (owner prefers this original copy), CTA to `#juegos`.
4. `section#juegos.h-games` — "Nuestros juegos": released/upcoming games (PINTO card with a cream "Ver el juego" pill).
5. `section#taller.h-lab` — "Otros proyectos / Taller": horizontal scroll-snap carousel (`.h-lab__track`, arrow
   buttons via inline script, hidden when nothing overflows). Cards: `.h-lab__item` with logo + name + type line
   (`.h-lab__type`), or `.h-lab__item--locked` (striped dark art, corner lock, name "???"). Keep cards minimal:
   name and game type only — no project numbers or development stages. To add a game, copy an item and put its
   logo in `assets/taller/`.
6. `section#suscribete.h-join` — Sender newsletter form (see below).
7. `section.h-values` — Imaginar / Crear / Compartir.
8. `footer.site-footer.h-footer` — includes link to `/privacidad/`.
9. Inline `<script>`s at the end: workshop carousel arrows, and the Sender form fallback ("Cargando…" → after 8 s shows a link to the hosted form).

### PINTO — `juegos/pinto/index.html` (`<html class="no-js">` → `js`, CSS: `styles.css` + `pinto.css`)
Fonts: **Poppins** (display/headings) + **Saira** for body text on every PINTO page (`--font` is overridden in `.pinto`); Istok Web only for the small spaced labels (`.p-eyebrow`, `.p-soon`, `--label-font`). Every PINTO page has its **own header, not Kori Labs'**: PINTO logo on the left (`.home-link.p-brand` → `/juegos/pinto/`), nav (`.p-nav`) Inicio (→ `/juegos/pinto/`) / Instrucciones (→ instrucciones/) / Temporada (→ modos/temporada/) — each opens its own page, no same-page anchors (owner's choice) — then `.p-nav__extra` = a "Kori Labs" pill with the cat (`.p-kori`, → home page) + Instagram; `aria-current="page"` on the current one. Under 56rem the nav collapses behind a hamburger (`.p-menu-btn`, dropdown panel; `menu.js` adds `.p-header--js`, toggles `.is-open`, closes on link tap / Esc / outside tap; without JS the button stays hidden and the nav wraps); PINTO favicon set in `img/favicon/` (dark tile with the logo's "P" + red swoosh); Kori Labs appears only as the header pill and in the footer ("PINTO es un juego de Kori Labs", linked to the home page). Goal: PINTO should feel like its own site. The hero also has a gold "Jugar Modo Temporada" button (`.p-season-cta`, → `modos/temporada/`) between the facts and the seal. Section ids: `#cartas` (Cartas de ritmo), `#modos` (Modos de juego). Sections: `p-hero` (title + `#box-stage`/`#box3d` 3D box),
"Cómo se juega", "Cartas de ritmo" (ritmo-1…8), "Cartas especiales" (banderas, rebufo, vuelta rápida),
`p-cta` "Muy pronto en la parrilla de salida". Script: `box3d.js` (deferred).
After the hero: "Acerca de PINTO" (short text), "Cómo jugar" (`.p-how`: a Ritmo-card style speedometer SVG whose needle and
colored arc move through the 5 step titles in a 10 s CSS loop, plus a cream "Ver instrucciones" button), "Cartas de ritmo", "Cartas especiales" (image + name only,
`.p-specials--compact`), then a "Modos de juego" section
(Modo Carrera Única / Modo Temporada, icons `img/icono-bandera-cuadros.svg` / `img/icono-trofeo.svg`) sits before the CTA.
The Modo Temporada card (here and in instrucciones/) is `.p-mode--featured`: gold border + inline "★ Recomendado" badge
in the header row (wraps under the title, never overlaps) + gold "Ir a modo temporada →" button (`.p-season-cta.p-mode__play`) to `modos/temporada/`.
No subscribe button / score-sheet offer in the mode cards (owner removed it).
Game facts (players, 5–15 min, 10+, card names, rules wording) must stay consistent between the home
card, this page, `instrucciones/` and `reglamento.pdf` v1.3.

### PINTO instructions — `juegos/pinto/instrucciones/index.html` (CSS: `styles.css` + `pinto.css`)
Target of the QR printed in the rules leaflet, so it's the first page a player sees after buying the game: it opens as a
light **welcome page** and the rules summary sits below it. Keep the top short (no rules dump, no sign-ups or pop-ups).
Order: `.p-welcome` (centered "Cómo Jugar" title with the PINTO logo under it, short text, fan of 5 cards), `#recursos` (`.p-paths`: four
numbered cards with a colored top bar and a dotted "track" line under them on desktop: Guía rápida → `#guia`,
Tutoriales → `../tutorial/`, Reglamento → `../reglamento.pdf`, new tab (button label is just "Reglamento"); Modos de juego → `#modos`, marked `.p-path--new` with a "¡Nuevo!" tab on its top border and a
"Con marcador de temporada" line), then `#guia` "Guía rápida" (intro + `.p-gnav` index: one tile per section with a colored icon, name and arrow) followed by the summary of the official rules (v1.5),
not a copy — never add rules that aren't in the official text: `#preparacion` (6 steps incl. "Banderazo de salida" = who starts, + deck table as a rounded panel `.p-table--panel`),
`#desarrollo`, `#reglas` (rule cards `.p-rcard`: mini card illustration on the tutorial's wooden table + title + short
text + "Ver tutorial" link; the art per rule is hand-picked in the HTML), `#especiales` (rules order), `#referencia` ("Qué carta puedo jugar": table with card images),
`#modos` (stacked, same order and layout as the PINTO page); every rule and special card links to its tutorial subsection ("Ver tutorial").
Minimal closing `.p-finish` ("¡Que comience la carrera!" · "PINTO · Un juego de Kori Labs" · "Conoce más de PINTO").
The score sheet gift is never linked directly (only via the home `#suscribete` form). There are no real videos yet
(the "videos" are the tutorial animations); don't invent video links.

### PINTO season scorekeeper — `juegos/pinto/modos/temporada/` (CSS: `styles.css` + `pinto.css` + `pinto-temporada.css`)
Single-page vanilla JS app (`temporada.js`, renders into `#ps-app`). Hero: trophy icon + title (no "PINTO" eyebrow — the header already carries the PINTO logo), "Modo Temporada" (not "Campeonato de Grandes Premios"). Visitor text says **"carrera"**, never "Gran Premio"/"GP" (owner's choice); points per position are shown as tiles (`.ps-pts`) in setup and on each race screen. Each country has a simplified inline SVG flag (`FLAGS` in `temporada.js`, 30×20; no emoji flags, they don't render on Windows) on the race screen, in the race history and in the saved-seasons list. Screens: home (new season, resume by code, list of
seasons saved on this device) → setup (2–6 players, Modo escudería toggle right under the player count, names — required and unique, compared
ignoring case/accents/extra spaces; inline error + aria-invalid —, Temporada Corta 5 / Regular 10 /
Completa 15 carreras — owner's names, not the rulebook's; no country list on the cards — then Puntos dobles) → one screen per Gran
Premio (tap players in finishing order; the last one is filled in automatically; standings + GP history; "Corregir el último
Gran Premio") → final podium. Data comes from the official rules ("Campeonato de Grandes Premios" / "Puntuación"): GP list
Australia, Estados Unidos, Arabia Saudita, Italia, Brasil, España, Países Bajos, Singapur, Canadá, Bélgica, China, Japón,
México, Inglaterra, Qatar (longer seasons include the shorter ones, same order); points 2 players 3/1 · 3 → 5/3/1 ·
4 → 5/3/1/0 · 5 → 7/4/3/2/1 · 6 → 7/4/3/2/1/0. End-of-season ties (owner's rule): most 1st places, then most 2nd, 3rd…,
then best result in the last GP; still tied = shared place. Optional house rules picked in setup (owner's
rules, not in the rulebook): **Modo escudería** (only 4 or 6 players; everyone races alone but players 1+2, 3+4, 5+6
form a team that adds up points; teams default to "Escudería Pura Sangre" (red), "Silver Team" (silver) and "Nitro Racing"
(blue) — a wink at real F1 teams without their names or brands, keep it that way. Team names are fixed (with 4 players
only the first two); players just type their names into a team; standings show teams + drivers; team tiebreak uses the members'
positions and the best member result in the last GP) and **Puntos dobles** (GP 5, 10 and 15 score double; tiebreak
position counts are not doubled). **Animations** (skipped entirely with prefers-reduced-motion; every overlay `.ps-fx` can be skipped by tap, Esc or
"Saltar"): season start = five red start lights then "¡Comienza la temporada!" + first race (owner dislikes "¡Arrancan!"); after
each race = winner of that race, then the next race with a big static flag (no waving); after the last race = winner,
then straight to the podium reveal (no "bandera a cuadros" step)
(3rd, 2nd, "Y el campeón de la temporada es…", then 1st with confetti; "Ver resultado" skips; "Ver el podio otra vez"
replays). Reopening a finished season by code shows the podium without the reveal. **No server:** each season is saved in localStorage as
`pinto-temporada:<CODE>` (4 chars, no 0/O/1/I/L) and the URL hash `#CODE` reopens it after a reload; codes only work
on the same device/browser. If storage is blocked the page says progress won't survive a reload.

### Privacy — `privacidad/index.html` (CSS: `styles.css` + `home.css` + `legal.css`)

## Design tokens

- `css/styles.css` `:root`: `--forest #1f4f37`, `--cream #f7f3ea`, `--cream-dim`, `--peach #fee4c1`,
  `--line`, `--font` (Istok Web + system stack), `--gutter`.
- `css/home.css`: `--forest-deep`, `--forest-line`, `--kori #399e5a`, `--teal #51a3a3`, `--asphalt*`,
  `--pinto-red #e5463b`, `--sep`.
- `css/pinto.css` redefines its own palette (`--asphalt*`, `--cream`, `--red`, `--display: Poppins`) and
  box dimensions `--bw/--bh/--bd` (box ratio 758 × 1057 × 244 — keep it if box images change).
- Buttons are pills (`h-btn`, `p-button`, `p-button--cream`); don't use red-underlined text links as buttons.
- Class prefixes: `h-` home, `p-` PINTO, `pd-` PINTO demo, `pt-` PINTO tutorial, `ps-` PINTO season scorekeeper, `legal__` privacy, BEM-ish (`block__elem--mod`).
  Utility: `.visually-hidden`, `.accent`.
- Every CSS file has a `prefers-reduced-motion` block; keep animations behind it.

## Rules & gotchas

- **Cache busting:** CSS/JS/image links carry `?v=N`. When you change a file, bump its `N` **in every
  page that links it** (e.g. `home.css` is linked from `index.html` *and* `privacidad/index.html`).
  Current: `styles.css?v=2`, `home.css?v=9` (index and privacidad),
  `pinto.css?v=37`, card images `?v=5` (also `VER` in `demo.js` and `multi.js`), `pinto-demo.css?v=17`, `pinto-engine.js?v=10`, `demo.js?v=16`, `multi.js?v=3`, `legal.css?v=1`, `pinto-tutorial.css?v=8`, `tutorial-data.js?v=10`, `tutorial.js?v=8`, `pinto-temporada.css?v=10`, `temporada.js?v=10`, PINTO favicons `?v=1`, `menu.js?v=1`, `box3d.js?v=2`, `favicon.svg?v=2`, box faces `?v=3`.
- **Relative paths everywhere** (`../../css/…`). Pages live in folders as `index.html` so URLs are clean
  (`/juegos/pinto/`). New pages: create `folder/index.html`, copy the head/header/footer of a sibling page.
- **Sender (newsletter):** universal script in the `<head>` of `index.html`; form is
  `div.sender-form-field[data-sender-form-id="dNk3wL"]`; fallback block `[data-sender-fallback]` links to
  `https://stats.sender.net/forms/dNk3wL/view`. Form look and the welcome/gift email are configured in
  Sender, not here. Only touch code if the form ID changes.
- **Never break public URLs:** `/juegos/pinto/instrucciones/` (printed QR), `/juegos/pinto/modos/temporada/` (season codes live in its URL hash), `/pinto/reglas/`,
  `/regalos/pinto-modo-temporada.pdf` (sent in emails), `/privacidad/`. `reglamento.pdf` is only reached
  through the instructions page, so it may move — just update the "Reglamento" card there.
- **Share previews:** `og-korilabs.jpg` / `og-pinto.jpg` are 1200×630; regenerate if headlines change.
  Absolute `og:url` / `og:image` / canonical use `https://korilabscr.com/…`.
- **Accessibility:** keep `aria-labelledby` on sections, `alt` text (Spanish), visible focus styles,
  external links with `target="_blank" rel="noopener noreferrer"` plus a visually-hidden "(se abre en una
  pestaña nueva)".
- **Assets:** prefer `.webp` for images; keep files small (no build step will optimize them).
- **Digital card art never shows the special-card description.** The printed special cards (Rebufo, Banderas,
  Vuelta Rápida) carry a description paragraph that is unreadable on screen, so every card image used on the
  site and in the demos must be the version **without** it. The rules text lives elsewhere: the special-card
  tips in the demos (`INFO` in `demo.js` / `multi.js`) and `juegos/pinto/instrucciones/`. When new card art
  arrives from Figma, remove the description layer (in the SVG export it's the large text shape in the band
  y≈708–800 of the 744×1039 card) before converting to WebP, and check the result visually.
- No dependencies to install. Don't add a framework, bundler or package.json without being asked.
  Only exception (approved by the owner): `demo/multijugador/` loads PeerJS 1.5.4 from jsDelivr for online rooms.

## Before opening a PR

1. Serve locally and check the pages you touched at mobile (~375 px) and desktop widths, light and dark
   OS theme, and with reduced motion if you touched animation.
2. Bumped `?v=N` for every changed CSS/JS file on every page that links it.
3. No broken relative links (`grep -rn 'href=\|src=' <file>` on new pages).
4. Visitor-facing text in Spanish; commit/PR text in English.

## Keeping this file current

If you add/move/remove pages, CSS files, scripts, tokens or public URLs, update the directory map and
the relevant section here in the same PR, so the next agent doesn't have to rediscover it.
