# Basis Tech Portfolio

A static portfolio site for the Basis Technology sector. No build step, no framework — pure HTML / CSS / JS that runs in any browser and hosts on any static host (Azure Static Web Apps, S3, GitHub Pages, etc.).

## File structure

```
basis-tech-portfolio/
├── index.html                          ← Home (splash + status summary)
├── mediaocean-overview.html            ← Mediaocean program overview
├── prisma-integration-status.html      ← Prisma workstream status
├── innovid-integration-status.html     ← Innovid workstream (scaffold — pending content)
├── sam-status.html                     ← SAM workstream (scaffold — pending content)
├── prod-kpi-dashboard.html             ← Production KPI Dashboard (full app, wrapped in portfolio shell)
│
├── shared.css                          ← All theming, layout, components
├── shared.js                           ← Sidebar nav, theme toggle, hamburger, home renderer
└── menu.js                             ← ← EDIT THIS to add/remove pages
```

## Adding or editing pages

**1. Edit `menu.js`** to register the new page in the sidebar. The file is heavily commented.

**2. Create the HTML file** — use any existing status page as a template:

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>My New Page · Basis Tech Portfolio</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="shared.css">
  <script src="menu.js"></script>
  <script src="shared.js"></script>
</head>
<body>

<div class="page page-narrow">
  <h1>My New Page</h1>
  <p class="page-sub">One-line description.</p>

  <!-- ... your content ... -->
</div>

<script>
  BasisPortfolio.init('my-page-id', { context: '<strong>Section</strong> · My Page' });
</script>

</body>
</html>
```

The `init('my-page-id', ...)` ID must match the `id` you set in `menu.js`.

## Sub-menus (parent + children)

To create a collapsible parent in the sidebar (like Mediaocean), add a `children` array in `menu.js`:

```js
{
  id: 'my-program',
  label: 'My Program',
  href: 'my-program-overview.html',
  section: 'Programs',
  status: 'active',
  children: [
    { id: 'sub1', label: 'Workstream 1', href: 'sub1.html', status: 'active' },
    { id: 'sub2', label: 'Workstream 2', href: 'sub2.html', status: 'planning' },
  ],
},
```

## Theme

Light and dark modes are supported and toggleable via the sun/moon button in the top bar. Preference persists to `localStorage` per browser. Initial theme respects the user's OS preference.

CSS variables in `shared.css` drive everything. To tweak colors, edit the `:root` (light) and `[data-theme="dark"]` blocks.

## Components available in `shared.css`

- **`.kpi-row` + `.kpi-cell`** — Top-of-page metric strip
- **`.card`** — Bordered content card
- **`.callout` with `.red` `.amber` `.green` `.blue` `.gray`** — Highlighted box
- **`.badge` with same color variants** — Pill labels
- **`.pilot-table` / `.data-table`** — Styled tables, with `.top-candidate` row highlight
- **`.timeline` + `.tl-item` (`.done` `.active` `.upcoming` `.risk`)** — Vertical timeline
- **`.project-item`** — Numbered project list rows
- **`.decision-list-wrap` + `.decision-item`** — Decision log
- **`.section-heading`** — Small uppercase section label
- **`.page-tabs` + `.tab-panel`** — In-page tab navigation (see Prisma page)

## Local preview

Open any `.html` file directly in a browser — no server required.

Or, for proper relative-path testing:

```bash
cd basis-tech-portfolio
python3 -m http.server 8000
# open http://localhost:8000
```

## Hosting

Just upload the folder. The site is fully static. Tested patterns:

- **Azure Static Web Apps** — Drop into the `/` deploy path.
- **GitHub Pages** — Push to `gh-pages` branch or `/docs` folder.
- **S3 / Cloudfront** — `aws s3 sync . s3://bucket/`.

## The Production KPI Dashboard

`prod-kpi-dashboard.html` is a fully self-contained app (Chart.js, CSV import, manual data entry, localStorage) wrapped in the same portfolio shell. Its internal logic was left untouched; only theme tokens and the topbar were adapted so it matches the rest of the portfolio. Theme changes trigger a chart re-render.

The dashboard's data is embedded as a `KPI_DATA` block near the bottom of the file. The Python script that generates this data (`fetch-prod-kpi.py`) writes between the `KPI_DATA_START` and `KPI_DATA_END` markers — that mechanism still works after wrapping.
