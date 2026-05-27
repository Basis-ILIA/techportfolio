# Basis · Tech Portfolio

A static site for the Basis Technology sector portfolio. Matches the visual
language of the Summer 2026 Roadmap and the Prisma status page.

## Files

| File                      | What it is                                                 |
|---------------------------|------------------------------------------------------------|
| `index.html`              | Home / splash page. Lists everything in the directory.     |
| `mediaocean-status.html`  | Mediaocean (Prisma) program status — same as before.       |
| **`menu.js`**             | **← Edit this to add/remove/reorder menu items.**          |
| `shared.css`              | All styles, light + dark theme tokens.                     |
| `shared.js`               | Renders the top nav, handles theme toggle, builds home.    |

## Adding a new section

Open `menu.js`. Copy any block in `NAV_ITEMS` and edit the fields:

```js
{
  id: 'sam',                         // unique
  label: 'SAM',                      // shown in the nav
  href: 'sam-status.html',           // page to link to
  section: 'Program Status',         // groups it on the home page
  desc: 'One-line description.',     // shown on the home card
  status: 'planning',                // active | planning | draft | external | soon
},
```

Save. Refresh the browser. That's it — no build step.

To make a new status page, copy `mediaocean-status.html` to a new filename,
edit the content, and change the `BasisPortfolio.initNav('mediaocean')` line
at the bottom to use your new `id`.

## Splash page text

Edit `PORTFOLIO_META` at the bottom of `menu.js` to change the home-page
title, lede, and "updated" date.

## Light / dark mode

Top right corner of every page. The choice is saved to `localStorage` so
it persists across pages and visits. First-time visitors get whatever
their OS prefers.

## Status colors

| status     | badge   |
|------------|---------|
| `active`   | green   |
| `planning` | blue    |
| `draft`    | gray    |
| `external` | gray    |
| `soon`     | amber   |

## Hosting

Drop the whole `basis-tech-portfolio/` folder onto any static host
(Azure Static Web Apps, Netlify, GitHub Pages, S3, etc.). No server,
no build.
