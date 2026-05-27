/* ═══════════════════════════════════════════════════════════════
   Basis Tech Portfolio — Shared Behaviour (v2)
   - Renders sidebar nav from NAV_ITEMS (in menu.js)
   - Light / Dark theme toggle (persisted in localStorage)
   - Renders splash + status summary on the home page
   - Hamburger menu for mobile
   ═══════════════════════════════════════════════════════════════ */

(function () {
  /* ── THEME ─────────────────────────────────────────────────── */
  const STORAGE_KEY = 'basis-portfolio-theme';

  function getInitialTheme() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved === 'light' || saved === 'dark') return saved;
    } catch (_) {}
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    return prefersDark ? 'dark' : 'light';
  }

  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    try { localStorage.setItem(STORAGE_KEY, theme); } catch (_) {}
    // Let pages react to theme changes (e.g. dashboards re-render charts)
    window.dispatchEvent(new CustomEvent('themechange', { detail: { theme } }));
  }

  // Apply early to prevent flash
  applyTheme(getInitialTheme());

  /* ── ICONS ─────────────────────────────────────────────────── */
  const ICONS = {
    moon: `<svg class="icon-moon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>`,
    sun: `<svg class="icon-sun" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/></svg>`,
    menu: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>`,
    external: `<svg class="nav-item-external" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M7 17L17 7M7 7h10v10"/></svg>`,
    chevron: `<svg class="nav-parent-chevron" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18l6-6-6-6"/></svg>`,
  };

  /* ── BUILD LAYOUT ──────────────────────────────────────────── */
  function buildLayout(activeId, opts) {
    opts = opts || {};
    // If a #layout-root exists, use it. Otherwise wrap body content.
    let root = document.getElementById('layout-root');
    if (!root) {
      // Move all body children into a new content wrapper.
      root = document.createElement('div');
      root.id = 'layout-root';
      root.className = 'layout';
      // Move existing children into a content wrapper inside layout
      const contentInner = document.createElement('div');
      contentInner.className = 'content';
      contentInner.id = 'content-root';
      while (document.body.firstChild) {
        contentInner.appendChild(document.body.firstChild);
      }
      root.appendChild(buildSidebar(activeId));
      root.appendChild(buildTopbar(opts));
      root.appendChild(contentInner);
      root.appendChild(buildFooter());
      document.body.appendChild(root);
      // Overlay for mobile
      const overlay = document.createElement('div');
      overlay.className = 'sidebar-overlay';
      overlay.id = 'sidebar-overlay';
      overlay.addEventListener('click', closeSidebar);
      document.body.appendChild(overlay);
    } else {
      // Caller has explicit slots
      const sidebarSlot = root.querySelector('[data-slot="sidebar"]');
      const topbarSlot = root.querySelector('[data-slot="topbar"]');
      const footerSlot = root.querySelector('[data-slot="footer"]');
      if (sidebarSlot) sidebarSlot.replaceWith(buildSidebar(activeId));
      if (topbarSlot) topbarSlot.replaceWith(buildTopbar(opts));
      if (footerSlot) footerSlot.replaceWith(buildFooter());
    }

    bindThemeToggle();
    bindHamburger();
  }

  /* ── SIDEBAR ───────────────────────────────────────────────── */
  function buildSidebar(activeId) {
    const aside = document.createElement('aside');
    aside.className = 'sidebar';
    aside.id = 'sidebar';

    const items = NAV_ITEMS.filter(i => !i.hideFromSidebar);

    // Brand
    aside.innerHTML = `
      <a class="sidebar-brand" href="index.html">
        <span class="logo-mark">B</span>
        <span class="brand-text">
          <span class="brand-name">Basis</span>
          <span class="brand-sub">Tech Portfolio</span>
        </span>
      </a>
    `;

    // Group by section. null section = top-level (above first section).
    const topLevel = [];
    const sections = {};
    const sectionOrder = [];
    items.forEach(item => {
      if (item.section == null) {
        topLevel.push(item);
      } else {
        if (!sections[item.section]) {
          sections[item.section] = [];
          sectionOrder.push(item.section);
        }
        sections[item.section].push(item);
      }
    });

    // Render top-level items first (no section header)
    if (topLevel.length) {
      const wrap = document.createElement('div');
      wrap.className = 'sidebar-nav';
      wrap.style.paddingTop = '10px';
      topLevel.forEach(item => wrap.appendChild(renderNavEntry(item, activeId)));
      aside.appendChild(wrap);
    }

    // Then each section
    sectionOrder.forEach(name => {
      const header = document.createElement('div');
      header.className = 'sidebar-section';
      header.textContent = name;
      aside.appendChild(header);

      const wrap = document.createElement('div');
      wrap.className = 'sidebar-nav';
      sections[name].forEach(item => wrap.appendChild(renderNavEntry(item, activeId)));
      aside.appendChild(wrap);
    });

    return aside;
  }

  function renderNavEntry(item, activeId) {
    // Item with children = expandable parent (button + nested list)
    if (item.children && item.children.length) {
      const childActive = item.children.some(c => c.id === activeId);
      const isActive = item.id === activeId || childActive;

      const container = document.createElement('div');

      const btn = document.createElement('button');
      btn.className = 'nav-parent' + (isActive ? ' has-active' : '') + (isActive ? ' open' : '');
      btn.type = 'button';
      btn.setAttribute('aria-expanded', String(isActive));
      btn.innerHTML = `
        ${ICONS.chevron}
        <span class="nav-item-label">${escapeHtml(item.label)}</span>
      `;
      btn.addEventListener('click', () => {
        const opening = !btn.classList.contains('open');
        btn.classList.toggle('open', opening);
        btn.setAttribute('aria-expanded', String(opening));
      });
      container.appendChild(btn);

      // If the parent itself has an href, add it as the first child link
      const childrenWrap = document.createElement('div');
      childrenWrap.className = 'nav-children';

      if (item.href) {
        const overview = {
          id: item.id,
          label: 'Overview',
          href: item.href,
          external: item.external,
        };
        childrenWrap.appendChild(renderLeaf(overview, activeId));
      }

      item.children.forEach(c => childrenWrap.appendChild(renderLeaf(c, activeId)));

      container.appendChild(childrenWrap);
      return container;
    }

    return renderLeaf(item, activeId);
  }

  function renderLeaf(item, activeId) {
    const a = document.createElement('a');
    a.className = 'nav-item' + (item.id === activeId ? ' active' : '');
    a.href = item.href;
    if (item.external) {
      a.target = '_blank';
      a.rel = 'noopener';
    }
    a.innerHTML = `
      <span class="nav-item-label">${escapeHtml(item.label)}</span>
      ${item.external ? ICONS.external : ''}
    `;
    return a;
  }

  /* ── TOPBAR ────────────────────────────────────────────────── */
  function buildTopbar(opts) {
    const header = document.createElement('header');
    header.className = 'topbar';
    header.innerHTML = `
      <div class="topbar-left">
        <button class="hamburger" id="hamburger" aria-label="Open menu" type="button">${ICONS.menu}</button>
        <div class="topbar-context">${opts.context || ''}</div>
      </div>
      <div class="topbar-right">
        <button class="theme-toggle" id="theme-toggle" type="button" aria-label="Toggle theme" title="Toggle light / dark">
          ${ICONS.moon}${ICONS.sun}
        </button>
      </div>
    `;
    return header;
  }

  /* ── FOOTER ────────────────────────────────────────────────── */
  function buildFooter() {
    const meta = (typeof PORTFOLIO_META !== 'undefined') ? PORTFOLIO_META : {};
    const f = document.createElement('footer');
    f.className = 'footer';
    f.innerHTML = `
      <div class="footer-left">
        ${meta.lastUpdated ? `<span>Updated ${escapeHtml(meta.lastUpdated)}</span>` : ''}
      </div>
      <div class="footer-right">
        ${meta.owner ? `<span>${escapeHtml(meta.owner)}</span>` : ''}
      </div>
    `;
    return f;
  }

  /* ── THEME TOGGLE BINDING ──────────────────────────────────── */
  function bindThemeToggle() {
    const toggle = document.getElementById('theme-toggle');
    if (!toggle) return;
    toggle.addEventListener('click', () => {
      const current = document.documentElement.getAttribute('data-theme') || 'light';
      applyTheme(current === 'dark' ? 'light' : 'dark');
    });
  }

  /* ── HAMBURGER ─────────────────────────────────────────────── */
  function bindHamburger() {
    const btn = document.getElementById('hamburger');
    if (!btn) return;
    btn.addEventListener('click', openSidebar);
  }
  function openSidebar() {
    const sb = document.getElementById('sidebar');
    const ov = document.getElementById('sidebar-overlay');
    if (sb) sb.classList.add('open');
    if (ov) ov.classList.add('open');
  }
  function closeSidebar() {
    const sb = document.getElementById('sidebar');
    const ov = document.getElementById('sidebar-overlay');
    if (sb) sb.classList.remove('open');
    if (ov) ov.classList.remove('open');
  }

  /* ── HOME PAGE ─────────────────────────────────────────────── */
  function renderHome() {
    const root = document.getElementById('home-root');
    if (!root) return;

    const meta = (typeof PORTFOLIO_META !== 'undefined') ? PORTFOLIO_META : {};

    // Count items by status
    const counts = {};
    function walk(items) {
      items.forEach(item => {
        if (item.id === 'home') return;
        if (item.status) counts[item.status] = (counts[item.status] || 0) + 1;
        if (item.children) walk(item.children);
      });
    }
    walk(NAV_ITEMS);

    const defs = (typeof STATUS_DEFS !== 'undefined') ? STATUS_DEFS : {};
    const summaryCells = Object.keys(counts).map(s => {
      const d = defs[s] || { label: s, className: 'gray' };
      return `
        <div class="summary-cell">
          <div class="summary-count ${d.className}">${counts[s]}</div>
          <div class="summary-label">${escapeHtml(d.label)}</div>
        </div>
      `;
    }).join('');

    root.innerHTML = `
      <div class="splash">
        ${meta.eyebrow ? `<div class="splash-eyebrow">${escapeHtml(meta.eyebrow)}</div>` : ''}
        <h1 class="splash-title">${escapeHtml(meta.title || 'Tech Portfolio')}</h1>
        ${meta.lede ? `<p class="splash-lede">${escapeHtml(meta.lede)}</p>` : ''}
      </div>
      ${summaryCells ? `
        <div class="status-summary">
          <div class="status-summary-inner">${summaryCells}</div>
        </div>
      ` : ''}
      <div class="home-hint">Use the sidebar to navigate.</div>
    `;
  }

  /* ── HELPERS ───────────────────────────────────────────────── */
  function escapeHtml(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  /* ── EXPOSE ────────────────────────────────────────────────── */
  window.BasisPortfolio = {
    init: function (activeId, opts) {
      buildLayout(activeId, opts || {});
      if (document.getElementById('home-root')) renderHome();
    },
    closeSidebar: closeSidebar,
    openSidebar: openSidebar,
  };
})();
