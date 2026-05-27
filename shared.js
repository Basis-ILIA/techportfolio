/* ═══════════════════════════════════════════════════════════════
   Basis Tech Portfolio — Shared Behaviour
   - Renders the top nav from NAV_ITEMS (in menu.js)
   - Light / Dark theme toggle (persisted in localStorage)
   - Renders the home page directory if a #directory-root exists
   ═══════════════════════════════════════════════════════════════ */

(function () {
  /* ── THEME ─────────────────────────────────────────────────── */
  const STORAGE_KEY = 'basis-portfolio-theme';

  function getInitialTheme() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved === 'light' || saved === 'dark') return saved;
    } catch (_) { /* localStorage may be unavailable */ }
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    return prefersDark ? 'dark' : 'light';
  }

  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    try { localStorage.setItem(STORAGE_KEY, theme); } catch (_) {}
  }

  // Apply early so we don't get a flash. This runs as <script> is parsed in <head>.
  applyTheme(getInitialTheme());

  /* ── NAV RENDER ────────────────────────────────────────────── */
  function renderNav(activeId) {
    const nav = document.getElementById('nav-root');
    if (!nav || typeof NAV_ITEMS === 'undefined') return;

    const items = NAV_ITEMS.filter(i => i.showInNav !== false);

    const html = `
      <a class="topnav-title" href="index.html">
        <span class="logo-mark">B</span>
        <span>Basis · Tech Portfolio</span>
      </a>
      <div class="topnav-tabs">
        ${items.map(item => {
          const isActive = item.id === activeId ? 'active' : '';
          const target = item.external ? ' target="_blank" rel="noopener"' : '';
          return `<a class="${isActive}" href="${escapeAttr(item.href)}"${target}>${escapeHtml(item.label)}</a>`;
        }).join('')}
      </div>
      <div class="topnav-right">
        <button class="theme-toggle" id="theme-toggle" type="button" aria-label="Toggle theme" title="Toggle light / dark">
          <svg class="icon-moon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
          <svg class="icon-sun" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/></svg>
        </button>
      </div>
    `;
    nav.innerHTML = html;

    const toggle = document.getElementById('theme-toggle');
    if (toggle) {
      toggle.addEventListener('click', () => {
        const current = document.documentElement.getAttribute('data-theme') || 'light';
        applyTheme(current === 'dark' ? 'light' : 'dark');
      });
    }
  }

  /* ── HOME PAGE DIRECTORY ───────────────────────────────────── */
  function renderDirectory() {
    const root = document.getElementById('directory-root');
    if (!root || typeof NAV_ITEMS === 'undefined') return;

    // Group items by their section field. Skip items without one.
    const sections = {};
    const order = [];
    NAV_ITEMS.forEach(item => {
      if (!item.section) return;
      if (!sections[item.section]) {
        sections[item.section] = [];
        order.push(item.section);
      }
      sections[item.section].push(item);
    });

    const splashHtml = (typeof PORTFOLIO_META !== 'undefined') ? `
      <div class="splash">
        ${PORTFOLIO_META.eyebrow ? `<div class="splash-eyebrow">${escapeHtml(PORTFOLIO_META.eyebrow)}</div>` : ''}
        <h1 class="splash-title">${escapeHtml(PORTFOLIO_META.title || 'Tech Portfolio')}</h1>
        <p class="splash-lede">${escapeHtml(PORTFOLIO_META.lede || '')}</p>
        <div class="splash-meta">
          ${PORTFOLIO_META.lastUpdated ? `<span>Updated ${escapeHtml(PORTFOLIO_META.lastUpdated)}</span>` : ''}
          ${PORTFOLIO_META.lastUpdated && PORTFOLIO_META.owner ? `<span class="meta-sep"></span>` : ''}
          ${PORTFOLIO_META.owner ? `<span>${escapeHtml(PORTFOLIO_META.owner)}</span>` : ''}
        </div>
      </div>
    ` : '';

    const directoryHtml = order.length === 0
      ? `<div class="directory"><div class="dir-empty">No sections defined yet. Add items to NAV_ITEMS in menu.js.</div></div>`
      : `<div class="directory">
          ${order.map(section => `
            <div class="dir-section-title">${escapeHtml(section)}</div>
            <div class="dir-grid">
              ${sections[section].map(item => renderCard(item)).join('')}
            </div>
          `).join('')}
        </div>`;

    root.innerHTML = splashHtml + directoryHtml;
  }

  function renderCard(item) {
    const target = item.external ? ' target="_blank" rel="noopener"' : '';
    const statusBadge = item.status ? statusBadgeHtml(item.status) : '';
    const externalIcon = item.external
      ? `<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="margin-left:4px;vertical-align:-1px"><path d="M7 17L17 7M7 7h10v10"/></svg>`
      : `<svg class="dir-card-arrow" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 5l7 7-7 7"/></svg>`;

    return `
      <a class="dir-card" href="${escapeAttr(item.href)}"${target}>
        <div class="dir-card-header">
          <div class="dir-card-title">${escapeHtml(item.label)}${item.external ? externalIcon : ''}</div>
          ${statusBadge}
        </div>
        ${item.desc ? `<div class="dir-card-desc">${escapeHtml(item.desc)}</div>` : ''}
        <div class="dir-card-footer">
          <span>${escapeHtml(item.section)}</span>
          ${item.external ? '' : externalIcon}
        </div>
      </a>
    `;
  }

  function statusBadgeHtml(status) {
    const map = {
      active:   { cls: 'green', text: 'Active' },
      planning: { cls: 'blue',  text: 'Planning' },
      draft:    { cls: 'gray',  text: 'Draft' },
      external: { cls: 'gray',  text: 'External' },
      soon:     { cls: 'amber', text: 'Coming soon' },
    };
    const m = map[status];
    if (!m) return '';
    return `<span class="badge ${m.cls}">${m.text}</span>`;
  }

  /* ── HELPERS ───────────────────────────────────────────────── */
  function escapeHtml(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }
  function escapeAttr(s) { return escapeHtml(s); }

  /* ── EXPOSE ────────────────────────────────────────────────── */
  window.BasisPortfolio = {
    initNav: renderNav,
    initHome: renderDirectory,
  };
})();
