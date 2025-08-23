// Filters Binding Logic: connects filter controls to dashboard charts and KPIs

// Utility: get current filter values from controls
function getCurrentFilters() {
  const filters = {};
  document.querySelectorAll('.sidebar-filters [id^="filter-"]').forEach(el => {
    let key = el.id.replace('filter-', '');
    if (el.type === "checkbox") {
      filters[key] = el.checked;
    } else if (el.type === "range") {
      filters[key] = Number(el.value);
    } else if (el.type === "date") {
      filters[key] = el.value ? new Date(el.value) : null;
    } else {
      filters[key] = el.value;
    }
  });
  return filters;
}

// Persist filter state in localStorage
function saveFilters() {
  localStorage.setItem("dashboardFilters", JSON.stringify(getCurrentFilters()));
}

// Restore filters from localStorage
function restoreFilters() {
  const saved = JSON.parse(localStorage.getItem("dashboardFilters") || "{}");
  Object.entries(saved).forEach(([key, val]) => {
    const el = document.getElementById("filter-" + key);
    if (!el) return;
    if (el.type === "checkbox") el.checked = val;
    else if (el.type === "range") {
      el.value = val;
      const span = document.getElementById(`filter-${key}-value`);
      if (span) span.textContent = val;
    }
    else if (el.type === "date") el.value = val ? new Date(val).toISOString().split('T')[0] : "";
    else el.value = val;
  });
}

// Whenever a filter changes, update dashboard
function onFilterChange() {
  saveFilters();
  const filters = getCurrentFilters();
  // Call your update logic for KPIs/charts/tables
  if (typeof updateKPIs === "function") updateKPIs(filters);
  if (typeof updateCharts === "function") updateCharts(filters);
  if (typeof updateSerology === "function") updateSerology(filters);
  if (typeof updateTable === "function") updateTable(filters); // If you have a table preview
}

// Add event listeners to filter controls
function bindFilters() {
  document.querySelectorAll('.sidebar-filters [id^="filter-"]').forEach(el => {
    el.addEventListener("change", () => {
      if (el.type === "range") {
        const span = document.getElementById(el.id + "-value");
        if (span) span.textContent = el.value;
      }
      onFilterChange();
    });
    // If slider, update value live
    if (el.type === "range") {
      const span = document.getElementById(el.id + "-value");
      if (span) span.textContent = el.value;
    }
  });
  restoreFilters();
  const clearBtn = document.getElementById("clear-filters-btn");
  if (clearBtn) {
    clearBtn.addEventListener("click", () => {
      document.querySelectorAll('.sidebar-filters [id^="filter-"]').forEach(el => {
        if (el.type === "checkbox") el.checked = false;
        else if (el.type === "range") {
          el.value = el.min;
          const span = document.getElementById(el.id + "-value");
          if (span) span.textContent = el.min;
        }
        else el.value = "";
      });
      saveFilters();
      onFilterChange();
    });
  }
  // Initial trigger to show dashboard on load
  onFilterChange();
}

// Call when filters are generated
if (document.readyState === "complete" || document.readyState === "interactive") {
  setTimeout(bindFilters, 150); // after sidebar-filters exists
} else {
  window.addEventListener("DOMContentLoaded", () => setTimeout(bindFilters, 150));
}
