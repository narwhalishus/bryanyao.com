# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this site is

Bryan Yao's personal website (bryanyao.com). It is a static Astro build with a physics-driven "desk" on the desktop home page and a static considered composition on mobile. Every element on the surface is a physical object — leather keyfob, 35mm film canister, Grand Seiko watch, Laufey vinyl, chalk bag, leather recipe notebook, cream calling card, crimson wax seal, platinum cufflinks, identity medallion, handwritten "working on" note, and a rubber stamp paired with the seal.

Aesthetic: Aston Martin Vanquish palette — deep British racing green, saddle cognac, ivory card stock, platinum hairlines, oxblood/crimson accents. Restraint over announcement.

## Architecture

- **`src/pages/`** — file-based routes. `index.astro` is the desk. `journal/`, `projects/`, `photography/` are Content-Collection-backed list + detail routes.
- **`src/components/desk/`** — each desk object is its own Astro component with scoped CSS. Every object carries a `data-obj="<id>"` attribute so physics can find it. External behavior is an `<a>`; drawer-opening behavior is a `<button>` with `data-drawer="<id>"`.
- **`src/components/Desk.astro`** — composition. Holds the `data-desk` container. Objects positioned via `--x`/`--y` custom props (%) on desktop; CSS grid on mobile.
- **`src/components/Drawer.astro`** — slide-in panel. Content for each drawer lives in `<template data-drawer-id="…">` elements. URL-synced via `?drawer=<id>`.
- **`src/physics/`** — vanilla-TS Matter.js integration, booted only on viewports ≥ 769px with `prefers-reduced-motion: no-preference`. `responsive.ts` is the entry point.
- **`src/layouts/Base.astro`** — every page. Wraps content in `<TopBar />` + `<main>`.
- **`src/content.config.ts`** — Zod-typed collections pointing at `./content/*` via Astro's `glob()` / `file()` loaders.
- **`content/`** — lives *outside* `src/` on purpose. Markdown + one JSON manifest; portable to another runtime if the site is ever rebuilt again.
- **`public/`** — copied verbatim into `dist/`. Contains `favicon.svg` and `photos/`.

## Commands

- `yarn dev` — Astro dev server with HMR
- `yarn build` — Astro build → `dist/` (the production artifact)
- `yarn preview` — serve the built `dist/` locally
- `yarn typecheck` — `astro check` (diagnostics over `.astro` + TS files)
- `yarn lint` / `yarn lint:fix` — ESLint over `src/**/*.{js,ts,astro,json}`
- `yarn format` — Prettier write over `src/**` and `content/**`

Note: `yarn check` is shadowed by a built-in Yarn 1 command — use `yarn typecheck` for `astro check`.

## Package manager

`yarn.lock` is the source of truth. Use Yarn locally, not npm. CI installs with `yarn install --frozen-lockfile` and builds with `yarn build` — both consistent.

## Hosting & DNS topology

Not visible from the repo — recorded here so DNS-adjacent changes do not silently break mail.

- **Registrar / DNS host:** Squarespace. Squarespace does *not* host the site; it only manages records.
- **Web host:** GitHub Pages, under GitHub user `narwhalishus`. Apex `A` records point to GH Pages anycast IPs (`185.199.108–111.153`, matching `AAAA`); `www` CNAMEs to `narwhalishus.github.io`. Domain verification: `TXT _github-pages-challenge-narwhalishus`.
- **Email:** iCloud Mail. `MX` → `mx01.mail.icloud.com` / `mx02.mail.icloud.com`, SPF `v=spf1 include:icloud.com ~all`, DKIM via `CNAME sig1._domainkey → sig1.dkim.bryanyao.com.at.icloudmailadmin.com`, plus `apple-domain=…` verification.
- **Other:** A Google Site Verification TXT and a Google-hosted CNAME are present but not load-bearing.

**Do not suggest migrating DNS to a different provider** without explicitly calling out that iCloud mail records must be preserved. Losing mail is a silent, high-regret failure.

## Deployment

`.github/workflows/static.yml` deploys `dist/` to GitHub Pages on every push to `main` (and on manual `workflow_dispatch`). **A merge to `main` is a production deploy.** There is no staging, no PR previews.

If the toolchain is ever replaced again, the workflow's build step and the `path: './dist'` upload must be updated together.

## Formatting quirks

`.prettierrc.json` uses `singleQuote: true`, `jsxSingleQuote: true`, and `bracketSpacing: false` — so imports render as `import {useState}`, not `import { useState }`. Match this; it is intentional.

## Testing

No test runner is configured. Do not claim tests pass; do not invent a `test` script. Verify changes by running `yarn build` and `yarn preview`, then clicking through the site.
