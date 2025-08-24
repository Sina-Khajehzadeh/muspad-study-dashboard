// Sidebar Filters behavior: expand/collapse dropdown and open Global Filters modal
document.addEventListener('DOMContentLoaded', function () {
  const toggle = document.getElementById('sidebar-filter-toggle');
  const dropdown = document.getElementById('sidebar-filters-dropdown');

  if (!toggle || !dropdown) return;

  // friendly styles/initialization
  dropdown.style.overflow = 'hidden';
  dropdown.style.transition = 'max-height 220ms ease, opacity 180ms ease';
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
  document.querySelectorAll('.sidebar-filter-item').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const field = btn.dataset.field;
      // Try to open the existing Global Filters modal
      if (typeof openFiltersModal === 'function') {
        openFiltersModal();
        // small delay to let modal render
        setTimeout(() => {
          if (field && typeof gf_showField === 'function') {
            gf_showField(field);
          }
        }, 120);
      } else {
        // fallback: if panelFilters exists and gf_showField not available, toggle panel
        const panel = document.getElementById('panelFilters');
        if (panel) {
          panel.style.display = panel.style.display === 'block' ? 'none' : 'block';
        }
        console.warn('openFiltersModal() not available. Make sure Global Filters code (filters-ui, filter-generator, filters-binding) is loaded.');
      }
    });
  });

  // Keep maxHeight correct if layout resizes while expanded
  window.addEventListener('resize', () => {
    if (toggle.getAttribute('aria-expanded') === 'true') {
      dropdown.style.maxHeight = dropdown.scrollHeight + 'px';
    }
  });
});
