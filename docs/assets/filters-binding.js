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
    else el.value = val;
    if (el.type === "range") {
      const span = document.getElementById(`filter-${key}-value`);
      if (span) span.textContent = val;
    }
  });
}

// Whenever a filter changes, update dashboard
function onFilterChange() {
  saveFilters();
  const filters = getCurrentFilters();
  updateKPIs(filters);
  updateCharts(filters);
}

// Example functions: replace with your actual dashboard logic
function updateKPIs(filters) {
  // Apply filters to KPIs (dummy example)
  // document.getElementById("kpi-participants").textContent = ...;
  // document.getElementById("kpi-tests").textContent = ...;
}

function updateCharts(filters) {
  // Apply filters to charts (dummy example)
  // window.timelineChart.filter(filters);
  // window.regionChart.filter(filters);
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
  });
  // Restore from localStorage and bind clear button
  restoreFilters();
  document.getElementById("clear-filters-btn").addEventListener("click", () => {
    saveFilters();
    onFilterChange();
  });
}

// Call when filters are generated
if (document.readyState === "complete" || document.readyState === "interactive") {
  setTimeout(bindFilters, 100); // after sidebar-filters exists
} else {
  window.addEventListener("DOMContentLoaded", () => setTimeout(bindFilters, 100));
}
