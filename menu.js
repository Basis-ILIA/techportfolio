/* ═══════════════════════════════════════════════════════════════
   BASIS TECH PORTFOLIO — MENU CONFIGURATION
   ═══════════════════════════════════════════════════════════════

   ↓ EDIT THIS FILE TO ADD / REMOVE / REORDER MENU ITEMS ↓

   The NAV_ITEMS array drives the sidebar nav on every page.

   ── ITEM FIELDS ───────────────────────────────────────────────
     id        Unique identifier. Used for active highlighting.
     label     Text shown in the nav (required).
     href      URL or relative file path (required, unless `children`).
     external  true → opens in new tab + shows external icon.
     children  Array of child items (creates a collapsible parent).
     section   Sidebar section label this item belongs under.
               Items with the same `section` are grouped together.
     hideFromSidebar  true → do not show in sidebar (rare).

   ── SECTIONS ──────────────────────────────────────────────────
     Sections are derived from the `section` field on items.
     Just set the same string on multiple items and they'll be
     grouped under a single header. Order = first appearance.

   ── TO ADD A NEW PAGE ─────────────────────────────────────────
     1. Copy any block in NAV_ITEMS.
     2. Edit fields. Save. Refresh browser. Done — no build step.

   ── TO ADD A SUB-MENU ─────────────────────────────────────────
     Add a `children: [...]` array (see Mediaocean below).
     The parent expands/collapses; children are full nav items.
   ═══════════════════════════════════════════════════════════════ */

const NAV_ITEMS = [

  // ─── Home ────────────────────────────────────────────────────
  {
    id: 'home',
    label: 'Home',
    href: 'index.html',
    section: null,   // null = appears at the top, above sections
  },

  // ─── Roadmap ─────────────────────────────────────────────────
  {
    id: 'roadmap',
    label: 'Technology Roadmap',
    href: 'https://orange-coast-06b045110.4.azurestaticapps.net/2026-summer-roadmap.html',
    external: true,
    section: 'Roadmap',
    status: 'active',
  },

  // ─── Programs ────────────────────────────────────────────────
  {
    id: 'mediaocean',
    label: 'Mediaocean',
    href: 'mediaocean-overview.html',
    section: 'Programs',
    status: 'active',
    children: [
      {
        id: 'prisma',
        label: 'Prisma Integration',
        href: 'prisma-integration-status.html',
        status: 'active',
      },
      {
        id: 'innovid',
        label: 'Innovid Ad Server',
        href: 'innovid-integration-status.html',
        status: 'active',
      },
      {
        id: 'sam',
        label: 'SAM (Social Ads Mgr)',
        href: 'sam-status.html',
        status: 'active',
      },
    ],
  },

  // ─── Dashboards ──────────────────────────────────────────────
  {
    id: 'prod-kpi',
    label: 'Production KPI Dashboard',
    href: 'prod-kpi-dashboard.html',
    section: 'Dashboards',
    status: 'active',
  },

  // ─── Add new pages below this line ───────────────────────────
  //
  // Example: a new program with sub-workstreams
  // {
  //   id: 'sam',
  //   label: 'New Program',
  //   href: 'new-program-overview.html',
  //   section: 'Programs',
  //   status: 'planning',
  //   children: [
  //     { id: 'sub1', label: 'Workstream 1', href: 'sub1.html', status: 'planning' },
  //     { id: 'sub2', label: 'Workstream 2', href: 'sub2.html', status: 'draft' },
  //   ],
  // },
  //
  // Example: an external resource link
  // {
  //   id: 'architecture',
  //   label: 'Architecture Docs',
  //   href: 'https://example.com/...',
  //   external: true,
  //   section: 'Resources',
  //   status: 'external',
  // },

];

/* ═══════════════════════════════════════════════════════════════
   PORTFOLIO METADATA — shown on the home page splash + footer
   ═══════════════════════════════════════════════════════════════ */
const PORTFOLIO_META = {
  eyebrow: 'Basis Technology',
  title: 'Tech Portfolio',
  lede: 'Roadmap, program statuses, and other reference materials for the Basis Technology sector.',
  lastUpdated: 'May 27, 2026',
  owner: '© 2026 Basis Global Technologies, LLC',
};

/* ═══════════════════════════════════════════════════════════════
   STATUS PILL DEFINITIONS
   Used for sidebar dots and home page status counts.
   You can add custom statuses here.
   ═══════════════════════════════════════════════════════════════ */
const STATUS_DEFS = {
  active:   { label: 'Active',   className: 'green' },
  planning: { label: 'Planning', className: 'blue'  },
  draft:    { label: 'Draft',    className: 'gray'  },
  external: { label: 'External', className: 'gray'  },
  soon:     { label: 'Soon',     className: 'amber' },
};
