/* ═══════════════════════════════════════════════════════════════
   BASIS TECH PORTFOLIO — MENU CONFIGURATION
   ═══════════════════════════════════════════════════════════════

   Edit this file to add / remove / reorder pages in the sidebar.

   ── ITEM FIELDS ──────────────────────────────────────────────
     id        Unique identifier. Used for active highlighting.
     label     Text shown in the sidebar (required).
     href      Relative path or URL (required unless `children`).
     external  true → opens in new tab + external icon.
     children  Array of child items (collapsible parent).
     section   Sidebar section label. Items sharing the same
               string are grouped under one heading.
     status    'active' | 'planning' | 'draft' | 'external'
               Shows a colored dot next to the item.
     hideFromSidebar  true → skip rendering in sidebar.
   ═══════════════════════════════════════════════════════════════ */

const NAV_ITEMS = [

  // ─── Home ────────────────────────────────────────────────────
  {
    id: 'home',
    label: 'Home',
    href: 'index.html',
    section: null,
  },

  // ─── Roadmap ─────────────────────────────────────────────────
  {
    id: 'roadmap',
    label: 'Technology Roadmap',
    href: 'tech-roadmap.html',
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

  // ─── Add new sections / pages below ──────────────────────────
  //
  // {
  //   id: 'example',
  //   label: 'New Page',
  //   href: 'new-page.html',
  //   section: 'Programs',
  //   status: 'planning',
  // },

];

/* ═══════════════════════════════════════════════════════════════
   PORTFOLIO METADATA — home page splash + footer
   ═══════════════════════════════════════════════════════════════ */
const PORTFOLIO_META = {
  eyebrow: 'Basis Technology',
  title: 'Tech Portfolio',
  lede: 'A single destination for technology strategy and execution visibility across the Basis product engineering organization. Browse the Q2–Q3 2026 technology roadmap across 15 product streams and 173 projects, review active program status updates from high-level overviews to granular workstream detail, track production health metrics, and access supporting reference materials — all in one place.',
  lastUpdated: 'May 27, 2026',
  owner: '© 2026 Basis Global Technologies, LLC',
};

/* ═══════════════════════════════════════════════════════════════
   STATUS PILL DEFINITIONS
   ═══════════════════════════════════════════════════════════════ */
const STATUS_DEFS = {
  active:   { label: 'Active',   className: 'green' },
  planning: { label: 'Planning', className: 'blue'  },
  draft:    { label: 'Draft',    className: 'gray'  },
  external: { label: 'External', className: 'gray'  },
  soon:     { label: 'Soon',     className: 'amber' },
};
