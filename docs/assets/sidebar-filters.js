// Sidebar Filters behavior: expand/collapse dropdown and open Global Filters modal
document.addEventListener('DOMContentLoaded', function () {
  const toggle = document.getElementById('sidebar-filter-toggle');
  const dropdown = document.getElementById('sidebar-filters-dropdown');

  if (!toggle || !dropdown) return;

  // friendly styles/initialization
  dropdown.style.overflow = 'hidden';
  dropdown.style.transition = 'max-height 220ms ease, opacity 180ms ease';
  // make dropdown visually compact and scrollable (will be applied to DOM element too)
  dropdown.style.maxHeight = toggle.getAttribute('aria-expanded') === 'true' ? dropdown.scrollHeight + 'px' : '0px';
  dropdown.style.opacity = toggle.getAttribute('aria-expanded') === 'true' ? '1' : '0';

  const setExpanded = (expanded) => {
    toggle.setAttribute('aria-expanded', String(expanded));
    dropdown.setAttribute('aria-hidden', String(!expanded));
    if (expanded) {
      dropdown.style.maxHeight = dropdown.scrollHeight + 'px';
      dropdown.style.opacity = '1';
    } else {
      dropdown.style.maxHeight = '0px';
      dropdown.style.opacity = '0';
    }
    const chevron = toggle.querySelector('.chevron');
    if (chevron) chevron.style.transform = expanded ? 'rotate(-180deg)' : '';
  };

  // click / keyboard on the parent toggle
  toggle.addEventListener('click', (e) => {
    e.preventDefault();
    const expanded = toggle.getAttribute('aria-expanded') === 'true';
    setExpanded(!expanded);
  });

  toggle.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      toggle.click();
    }
  });

  // If the user clicks a child filter item: open Filters modal and show the field
  // (note: items may be added dynamically below; existing handler kept for immediate items)
  function onSidebarFilterItemClick(e) {
    e.preventDefault();
    const btn = e.currentTarget;
    const field = btn.dataset.field;
    if (typeof openFiltersModal === 'function') {
      openFiltersModal();
      setTimeout(() => {
        if (field && typeof gf_showField === 'function') {
          gf_showField(field);
        }
      }, 120);
    } else {
      // fallback - show legacy panel
      const panel = document.getElementById('panelFilters');
      if (panel) panel.style.display = panel.style.display === 'block' ? 'none' : 'block';
      console.warn('openFiltersModal() not available. Ensure Global Filters scripts are loaded.');
    }
  }

  // Keep maxHeight correct if layout resizes while expanded
  window.addEventListener('resize', () => {
    if (toggle.getAttribute('aria-expanded') === 'true') {
      dropdown.style.maxHeight = dropdown.scrollHeight + 'px';
    }
  });

  // --- Utility: small CSS injection for dropdown styling ---
  (function injectSidebarFilterStyles() {
    if (document.getElementById('sidebar-filters-inline-style')) return;
    const css = `
      /* compact dropdown list */
      #sidebar-filters-dropdown {
        box-sizing: border-box;
        background: var(--surface-card, #0f1724);
        border-radius: 8px;
        padding: 8px;
        width: 240px;
      }
      #sidebar-filters-dropdown .sf-group {
        margin-bottom: 8px;
        font-size: 0.88rem;
        color: var(--text-muted, #9ca3af);
      }
      #sidebar-filters-dropdown .sf-group h4 {
        margin: 6px 6px 6px 6px;
        font-size: 0.92rem;
        color: var(--theme-primary, #60a5fa);
        font-weight: 600;
      }
      #sidebar-filters-dropdown .sf-items {
        max-height: 260px;
        overflow-y: auto;
        padding: 6px;
        display: flex;
        flex-direction: column;
        gap: 6px;
      }
      #sidebar-filters-dropdown .sf-item {
        display: block;
        text-align: left;
        padding: 6px 8px;
        border-radius: 6px;
        background: transparent;
        border: none;
        color: var(--text-primary, #e6eef8);
        font-size: 0.85rem;
        cursor: pointer;
      }
      #sidebar-filters-dropdown .sf-item:hover {
        background: rgba(255,255,255,0.03);
      }
      #sidebar-filters-dropdown .sf-item small {
        display:block;
        color: var(--text-muted, #9ca3af);
        font-size: 0.75rem;
      }
    `;
    const s = document.createElement('style');
    s.id = 'sidebar-filters-inline-style';
    s.textContent = css;
    document.head.appendChild(s);
  })();

  // --- Build sidebar grouped lists from GF.meta or from columns ---
  function buildSidebarFilters() {
    if (!dropdown) return;

    // If user provided explicit grouping in their filter-generator or similar, reuse it:
    // expected format (optional): { "Identifiers": ["merge_id","user_id"], "Demographics": [...] }
    const explicitGroups = (window.FIELD_GROUPS && typeof window.FIELD_GROUPS === 'object') ? window.FIELD_GROUPS : null;

    // Ensure GF.meta exists (if your Global Filters system uses GF.meta)
    const ensureGFMeta = () => {
      if (window.GF && window.GF.meta && Object.keys(window.GF.meta).length) return true;
      // If gf_buildMeta exists we call it (only if rawData/columns are already loaded)
      if (typeof gf_buildMeta === 'function') {
        try { gf_buildMeta(); } catch (e) { /* ignore */ }
      }
      return !!(window.GF && window.GF.meta && Object.keys(window.GF.meta).length);
    };

    // Source columns: prefer GF.meta, fallback to global columns array
    const hasMeta = ensureGFMeta();
    const allColumns = hasMeta ? Object.keys(window.GF.meta) : (window.columns || window.rawData && window.rawData[0] ? Object.keys(window.rawData[0]) : []);

    // Build groups: explicit groups (preferred) or auto grouping by regex
    let groups = [];
    if (explicitGroups) {
      for (const name of Object.keys(explicitGroups)) {
        const list = explicitGroups[name].filter(Boolean);
        groups.push({ name, fields: list.filter(f => allColumns.includes(f)) });
      }
      // Add extra fields not included in explicit groups
      const assigned = new Set(groups.flatMap(g => g.fields));
      const rest = allColumns.filter(c => !assigned.has(c));
      if (rest.length) groups.push({ name: 'Other', fields: rest });
    } else {
      // Auto-group heuristics (identifiers, demographics, dates, other)
      const idRE = /(id$|_id$|merge|user|uuid|code|guid|person)/i;
      const demoRE = /(age|sex|birth|standort|region|zip|city|country|ethnic|education|income)/i;
      const dateRE = /(date|time|_dt|_time|timestamp|submitdate|sampling)/i;

      const ids = [], demos = [], dates = [], others = [];
      (allColumns || []).forEach(col => {
        if (idRE.test(col)) ids.push(col);
        else if (demoRE.test(col)) demos.push(col);
        else if (dateRE.test(col)) dates.push(col);
        else others.push(col);
      });

      if (ids.length) groups.push({ name: 'Identifiers', fields: ids });
      if (demos.length) groups.push({ name: 'Demographics', fields: demos });
      if (dates.length) groups.push({ name: 'Dates', fields: dates });
      if (others.length) groups.push({ name: 'Other', fields: others });
    }

    // Render groups into the dropdown element
    dropdown.innerHTML = '';
    groups.forEach(group => {
      const gwrap = document.createElement('div');
      gwrap.className = 'sf-group';
      const title = document.createElement('h4');
      title.textContent = group.name;
      gwrap.appendChild(title);

      const itemsWrap = document.createElement('div');
      itemsWrap.className = 'sf-items';

      group.fields.forEach(f => {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'sf-item sidebar-filter-item';
        b.dataset.field = f;
        b.textContent = f;
        // If GF.meta exists show small counts (optional)
        if (hasMeta && window.GF && window.GF.meta && window.GF.meta[f]) {
          const cnt = (window.GF.meta[f].uniques && window.GF.meta[f].uniques.length) || 0;
          const small = document.createElement('small');
          small.textContent = `${window.GF.meta[f].type || ''} • ${cnt} values`;
          b.appendChild(small);
        }
        itemsWrap.appendChild(b);
      });

      gwrap.appendChild(itemsWrap);
      dropdown.appendChild(gwrap);
    });

    // Re-bind click handlers for the dynamically created items
    dropdown.querySelectorAll('.sidebar-filter-item').forEach(btn => {
      btn.removeEventListener('click', onSidebarFilterItemClick);
      btn.addEventListener('click', onSidebarFilterItemClick);
    });

    // If the dropdown is expanded, ensure its maxHeight covers new content
    if (toggle.getAttribute('aria-expanded') === 'true') {
      dropdown.style.maxHeight = dropdown.scrollHeight + 'px';
    }
  }

  // Try to build the sidebar filters once immediately and again after a short delay.
  // If your data is loaded asynchronously (PapaParse), we keep trying until columns/rawData exist.
  (function scheduleBuild() {
    buildSidebarFilters();
    // Try again when GF is initialized (initGlobalFilters calls gf_buildMeta); many flows call initGlobalFilters after data load
    if (typeof initGlobalFilters === 'function') {
      // Hook into it by wrapping if possible (safe guard)
      const original = initGlobalFilters;
      initGlobalFilters = function () {
        try { original(); } catch (e) { console.warn(e); }
        // After GF has initialized, rebuild sidebar
        setTimeout(buildSidebarFilters, 80);
      };
    }
    // Fallback: attempt to rebuild when columns/rawData are available
    const retryInterval = setInterval(() => {
      const haveCols = (window.columns && window.columns.length) || (window.GF && window.GF.meta && Object.keys(window.GF.meta).length);
      if (haveCols) {
        buildSidebarFilters();
        clearInterval(retryInterval);
      }
    }, 300);
    // Also rebuild after 2 seconds in case of delayed CSV parsing
    setTimeout(buildSidebarFilters, 2000);
  })();

  // List of your section/group names:
const sectionOrder = [
  "All", "Identifiers", "Demographics", "Household", "Health/Conditions",
  "Behaviors", "Classification/Status", "Vaccination", "Serology", "Dates/Times"
];

// This function renders the group buttons in the modal.
function renderGroupButtons(activeSection = "All") {
  const groupsContainer = document.getElementById("gf-groups");
  if (!groupsContainer) return;
  groupsContainer.innerHTML = "";
  sectionOrder.forEach(section => {
    const btn = document.createElement("button");
    btn.textContent = section;
    btn.className = "btn btn-xs btn-outline-secondary" + (section === activeSection ? " active" : "");
    btn.dataset.group = section;
    btn.onclick = () => {
      groupsContainer.querySelectorAll("button").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      renderFieldList(section); // Call your field filtering here
    };
    groupsContainer.appendChild(btn);
  });
}

// Example placeholder for field list rendering
function renderFieldList(section = "All") {
  const fieldListContainer = document.getElementById("gf-field-list");
  if (!fieldListContainer) return;
  // Replace this with your real filtering logic
  fieldListContainer.innerHTML = `<div>Fields for: ${section}</div>`;
}

// Call these functions when your modal opens
renderGroupButtons("All");
renderFieldList("All");
});


