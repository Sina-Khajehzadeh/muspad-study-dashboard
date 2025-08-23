// Filter Generator: builds the dashboard filter panel from the provided data catalog

// Example data catalog (replace with your actual catalog if needed)
const dataCatalog = [
  { name: "standort", type: "select", section: "Identifiers", options: ["Hannover", "Reutlingen", "Freiburg", "Aachen", "Osnabrück", "Magdeburg", "Chemnitz", "Erfurt", "Kiel", "Schwerin"] },
  { name: "birth_year", type: "slider", min: 1920, max: 2022, section: "Demographics" },
  { name: "sex", type: "select", section: "Demographics", options: ["male", "female", "diverse"] },
  { name: "zip", type: "search", section: "Identifiers" },
  { name: "mask_public", type: "checkbox", section: "Behaviors" },
  { name: "mask_work", type: "checkbox", section: "Behaviors" },
  { name: "vaccinated", type: "checkbox", section: "Vaccination" }
  // Add more fields as needed, following your catalog
];

// Sections order for grouping
const sectionOrder = [
  "Identifiers", "Demographics", "Household", "Health/Conditions", "Behaviors", "Classification/Status", "Vaccination", "Serology", "Dates/Times"
];

// Generate filter sidebar HTML
function generateFilters() {
  const sidebar = document.getElementById("sidebar-filters") || document.createElement("div");
  sidebar.id = "sidebar-filters";
  sidebar.className = "sidebar-filters";

  // Clear previous filters
  sidebar.innerHTML = "";

  // Group fields by section
  sectionOrder.forEach(section => {
    const sectionFields = dataCatalog.filter(f => f.section === section);
    if (sectionFields.length === 0) return;

    const sectionDiv = document.createElement("div");
    sectionDiv.className = "filter-section";
    sectionDiv.innerHTML = `<h4>${section}</h4>`;

    sectionFields.forEach(field => {
      let filterControl = "";
      switch (field.type) {
        case "select":
          filterControl = `
            <label>${field.name}</label>
            <select id="filter-${field.name}">
              <option value="">All</option>
              ${field.options.map(opt => `<option value="${opt}">${opt}</option>`).join("")}
            </select>
          `;
          break;
        case "slider":
          filterControl = `
            <label>${field.name}</label>
            <input type="range" id="filter-${field.name}" min="${field.min}" max="${field.max}" step="1" />
            <span id="filter-${field.name}-value"></span>
          `;
          break;
        case "checkbox":
          filterControl = `
            <label>
              <input type="checkbox" id="filter-${field.name}" />
              ${field.name}
            </label>
          `;
          break;
        case "search":
          filterControl = `
            <label>${field.name}</label>
            <input type="search" id="filter-${field.name}" placeholder="Search..." />
          `;
          break;
        default:
          filterControl = `<span><!-- Unknown filter type --></span>`;
      }
      const wrapper = document.createElement("div");
      wrapper.className = "filter-control";
      wrapper.innerHTML = filterControl;
      sectionDiv.appendChild(wrapper);
    });

    sidebar.appendChild(sectionDiv);
  });

  // Add clear filters button
  const clearBtn = document.createElement("button");
  clearBtn.innerText = "Clear all filters";
  clearBtn.id = "clear-filters-btn";
  clearBtn.onclick = function() {
    document.querySelectorAll('.sidebar-filters select, .sidebar-filters input').forEach(el => {
      if (el.type === "checkbox") el.checked = false;
      else if (el.type === "range") el.value = el.min;
      else el.value = "";
    });
    // Optionally trigger dashboard refresh here
  };
  sidebar.appendChild(clearBtn);

  // Add to sidebar wrapper (replace sidebar-nav if needed)
  const sidebarWrapper = document.querySelector(".sidebar") || document.body;
  sidebarWrapper.appendChild(sidebar);
}

// Call on page load
if (document.readyState === "complete" || document.readyState === "interactive") {
  generateFilters();
} else {
  window.addEventListener("DOMContentLoaded", generateFilters);
}