/* ═══════════════════════════════════════════════════════════════
   BASIS TECH PORTFOLIO — MENU CONFIGURATION
   ═══════════════════════════════════════════════════════════════

   ↓ EDIT THIS FILE TO ADD / REMOVE / REORDER MENU ITEMS ↓

   Each item in NAV_ITEMS becomes a link in the top navigation.

   Fields:
     label   — Text shown in the nav (required)
     href    — URL or relative path (required)
     id      — Unique identifier for "active" highlighting (required)
     section — Optional grouping label, shown on the home page
               (e.g. "Roadmap", "Programs", "Resources")
     desc    — Optional one-line description for the home-page card
     status  — Optional pill shown on the home card:
               "active" | "planning" | "draft" | "external" | "soon"
     external — true to open in a new tab (e.g. external URLs)

   To add a new item: copy any block, change the fields, save.
   To remove: delete the block. To reorder: drag it up/down.
   No build step. Refresh the page.
   ═══════════════════════════════════════════════════════════════ */

const NAV_ITEMS = [

  {
    id: 'home',
    label: 'Home',
    href: 'index.html',
    section: null,           // Home is excluded from the directory listing
    showInNav: true,
  },

  {
    id: 'roadmap',
    label: 'Technology Roadmap',
    href: 'https://orange-coast-06b045110.4.azurestaticapps.net/2026-summer-roadmap.html',
    external: true,
    section: 'Roadmap',
    desc: 'Summer 2026 roadmap — streams, pillars, objectives, key results, and project delivery.',
    status: 'active',
  },

  {
    id: 'mediaocean',
    label: 'Mediaocean',
    href: 'prisma-integration-status.html',
    section: 'Program Status',
    desc: 'Automated two-way ERP integration between Basis and Prisma (Mediaocean). Pilot and PSD phase.',
    status: 'active',
  },
  
    {
    id: 'prod-kpi',
    label: 'Production KPI Dashboard',
    href: 'prod-kpi-dashboard.html',
    section: 'Production KPI Dashboard',
    desc: 'Dashboard for Prod support & incident KPIs',
    status: 'active',
  },

  // ─── Add new program status pages below this line ───
  //
  // Example template:
  // {
  //   id: 'sam',
  //   label: 'SAM',
  //   href: 'sam-status.html',
  //   section: 'Program Status',
  //   desc: 'Short description here.',
  //   status: 'planning',
  // },

  // ─── Add other resource/reference links below this line ───
  //
  // Example:
  // {
  //   id: 'architecture',
  //   label: 'Architecture Docs',
  //   href: 'https://example.com/...',
  //   external: true,
  //   section: 'Resources',
  //   desc: 'System architecture documentation.',
  //   status: 'external',
  // },

];

/* ═══════════════════════════════════════════════════════════════
   PORTFOLIO METADATA — shown on the home page splash
   ═══════════════════════════════════════════════════════════════ */
const PORTFOLIO_META = {
  eyebrow: 'Basis Technology',
  title: 'Tech Portfolio',
  lede: 'Roadmap, program statuses, and other reference materials for the Basis Technology sector.',
  lastUpdated: 'May 27, 2026',
  owner: '© 2026 Basis Global Technologies, LLC',
};
