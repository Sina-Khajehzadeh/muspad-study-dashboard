// Filter Generator: builds the dashboard filter panel from the provided data catalog

const dataCatalog = [
  // Identifiers
  { name: "merge_id", type: "search", section: "Identifiers" },
  { name: "X20_21_user_id", type: "search", section: "Identifiers" },
  { name: "X20_21_check_in_zip_code", type: "search", section: "Identifiers" },

  // Demographics
  { name: "standort", type: "select", section: "Demographics", options: ["reutlingen", "freiburg", "aachen", "magdeburg", "chemnitz", "greifswald", "hannover", "osnabrueck"] },
  { name: "birth_year", type: "slider", min: 1916, max: 2002, section: "Demographics" },
  { name: "birth_month", type: "slider", min: 1, max: 12, section: "Demographics" },
  { name: "sex", type: "select", section: "Demographics", options: ["1", "2", "3"] },
  { name: "age_22", type: "slider", min: 20, max: 106, section: "Demographics" },
  { name: "age_group_22_1", type: "select", section: "Demographics", options: ["18-29", "30-39", "40-49", "50-59", "60-69", "70-79", "80+"] },
  { name: "age_group_22_2", type: "select", section: "Demographics", options: ["18-29", "30-34", "35-39", "40-49", "50-64", "65-79", "80+"] },
  { name: "age_23", type: "slider", min: 21, max: 107, section: "Demographics" },
  { name: "age_group_23_1", type: "select", section: "Demographics", options: ["18-29", "30-39", "40-49", "50-59", "60-69", "70-79", "80+"] },
  { name: "age_group_23_2", type: "select", section: "Demographics", options: ["18-29", "30-34", "35-39", "40-49", "50-64", "65-79", "80+"] },
  { name: "X20_21_education_clean", type: "select", section: "Demographics", options: ["Certificate after 9 years", "Certificate after 10 years", "Higher education certificate", "Missing"] },
  { name: "X20_21_langfragen_income", type: "select", section: "Demographics", options: ["1000 bis unter 2000 Euro", "6000 bis unter 8000 Euro", "2000 bis unter 6000 Euro", "4000 bis unter 6000 Euro", "0 bis unter 1000 Euro", "2000 bis unter 4000 Euro", "8000 bis unter 12000 Euro", "12000 Euro und mehr"] },
  { name: "X20_21_kurzfragen_employment_type_clean", type: "select", section: "Demographics", options: ["0", "1"] },
  { name: "X20_21_kurzfragen_employment_yes_mutated", type: "select", section: "Demographics", options: ["Angestellt", "Selbstständig"] },

  // Household
  { name: "X20_21_household_harmonized", type: "slider", min: 0, max: 35, section: "Household" },
  { name: "s22_kids_under18_count_new", type: "slider", min: 0, max: 10, section: "Household" },
  { name: "w22_kids_under14_count_new", type: "slider", min: 0, max: 10, section: "Household" },
  { name: "s23_kids_under14_count_new", type: "slider", min: 0, max: 4, section: "Household" },
  { name: "s24_kids_under14_new", type: "slider", min: 0, max: 4, section: "Household" },

  // Health/conditions (General + weight)
  { name: "X20_21_kurzfragen_healthstatus_new", type: "slider", min: 1, max: 5, section: "Health/Conditions" },
  { name: "X20_21_kurzfragen_healthstatus_muspad_new", type: "slider", min: 1, max: 5, section: "Health/Conditions" },
  { name: "X20_21_langfragen_change_health_new", type: "select", section: "Health/Conditions", options: ["-1", "0", "1"] },
  { name: "X20_21_wohlbefinden_weight_new", type: "slider", min: 30, max: 190, section: "Health/Conditions" },
  { name: "X20_21_wohlbefinden_weight_change_new", type: "select", section: "Health/Conditions", options: ["-1", "0", "1"] },

  // Chronic conditions per baseline (binary 0/1)
  { name: "X20_21_condition_hypertension", type: "checkbox", section: "Health/Conditions" },
  { name: "X20_21_condition_diabetes", type: "checkbox", section: "Health/Conditions" },
  { name: "X20_21_condition_cardiovascular", type: "checkbox", section: "Health/Conditions" },
  { name: "X20_21_condition_lung_disease", type: "checkbox", section: "Health/Conditions" },
  { name: "X20_21_condition_immunodeficiency", type: "checkbox", section: "Health/Conditions" },
  { name: "X20_21_condition_cancer", type: "checkbox", section: "Health/Conditions" },

  // Wave-specific chronic conditions (binary 0/1)
  { name: "s22_condition_hypertension", type: "checkbox", section: "Health/Conditions" },
  { name: "s22_condition_diabetes", type: "checkbox", section: "Health/Conditions" },
  { name: "s22_condition_cardiovascular", type: "checkbox", section: "Health/Conditions" },
  { name: "s22_condition_lung_disease", type: "checkbox", section: "Health/Conditions" },
  { name: "s22_condition_immunodeficiency", type: "checkbox", section: "Health/Conditions" },
  { name: "s22_condition_cancer", type: "checkbox", section: "Health/Conditions" },
  { name: "s22_condition_post_covid", type: "checkbox", section: "Health/Conditions" },
  { name: "s22_condition_none", type: "checkbox", section: "Health/Conditions" },
  { name: "w22_new_chronic_diseases", type: "checkbox", section: "Health/Conditions" },
  { name: "w22_condition_hypertension", type: "checkbox", section: "Health/Conditions" },
  { name: "w22_condition_diabetes", type: "checkbox", section: "Health/Conditions" },
  { name: "w22_condition_cardiovascular", type: "checkbox", section: "Health/Conditions" },
  { name: "w22_condition_lung_disease", type: "checkbox", section: "Health/Conditions" },
  { name: "w22_condition_immunodeficiency", type: "checkbox", section: "Health/Conditions" },
  { name: "w22_condition_cancer", type: "checkbox", section: "Health/Conditions" },
  { name: "w22_condition_post_covid", type: "checkbox", section: "Health/Conditions" },
  { name: "s23_new_chronic_diseases", type: "checkbox", section: "Health/Conditions" },
  { name: "s23_condition_hypertension", type: "checkbox", section: "Health/Conditions" },
  { name: "s23_condition_diabetes", type: "checkbox", section: "Health/Conditions" },
  { name: "s23_condition_cardiovascular", type: "checkbox", section: "Health/Conditions" },
  { name: "s23_condition_lung_disease", type: "checkbox", section: "Health/Conditions" },
  { name: "s23_condition_immunodeficiency", type: "checkbox", section: "Health/Conditions" },
  { name: "s23_condition_cancer", type: "checkbox", section: "Health/Conditions" },
  { name: "s23_condition_post_covid", type: "checkbox", section: "Health/Conditions" },
  { name: "s24_new_chronic_diseases", type: "checkbox", section: "Health/Conditions" },
  { name: "s24_condition_hypertension", type: "checkbox", section: "Health/Conditions" },
  { name: "s24_condition_diabetes", type: "checkbox", section: "Health/Conditions" },
  { name: "s24_condition_cardiovascular", type: "checkbox", section: "Health/Conditions" },
  { name: "s24_condition_lung_disease", type: "checkbox", section: "Health/Conditions" },
  { name: "s24_condition_immunodeficiency", type: "checkbox", section: "Health/Conditions" },
  { name: "s24_condition_cancer", type: "checkbox", section: "Health/Conditions" },
  { name: "s24_condition_post_covid", type: "checkbox", section: "Health/Conditions" },

  // Respiratory disease by year (binary float64 0/1)
  { name: "w22_respiratory_disease_2022_influenza", type: "checkbox", section: "Health/Conditions" },
  { name: "s23_respiratory_disease_2023_influenza", type: "checkbox", section: "Health/Conditions" },
  { name: "s24_respiratory_disease_2024_influenza", type: "checkbox", section: "Health/Conditions" },
  { name: "s23_respiratory_disease_2023_RSV", type: "checkbox", section: "Health/Conditions" },
  { name: "s24_respiratory_disease_2024_RSV", type: "checkbox", section: "Health/Conditions" },

  // Behaviors
  { name: "x20_21_smoking_new", type: "select", section: "Behaviors", options: ["never", "former", "current", "occasional"] },
  { name: "s22_smoker_en_new", type: "select", section: "Behaviors", options: ["never", "former", "current", "occasional"] },
  { name: "X20_21_langfragen_hand_cleaning_time_new", type: "slider", min: 5, max: 60, section: "Behaviors" },
  { name: "X20_21_handwash_perday_cat", type: "select", section: "Behaviors", options: ["<5", "5–10", "11–20", ">20"] },
  { name: "X20_21_quarantine_ever", type: "checkbox", section: "Behaviors" },
  // Mask usage (binary float64 0/1)
  ...["shop", "walk", "sport", "work", "restaurant", "transport", "building", "public_places", "other", "outdoor", "home", "indoor"].map(name =>
    ({ name: `X20_21_mask_${name}`, type: "checkbox", section: "Behaviors" })
  ),

  // Classification/status
  { name: "X20_21_classification", type: "checkbox", section: "Classification/Status" },
  { name: "X20_21_vacc_inf", type: "select", section: "Classification/Status", options: ["Vaccinated", "Infected"] },

  // Vaccination
  { name: "X20_21_kurzfragen_cov19_vaccination_first_yn", type: "checkbox", section: "Vaccination" },
  { name: "X20_21_vacc_first_date", type: "date", section: "Vaccination" },
  { name: "X20_21_kurzfragen_cov19_vaccination_second_yn", type: "checkbox", section: "Vaccination" },
  { name: "X20_21_vacc_second_date", type: "date", section: "Vaccination" },
  { name: "X20_21_kurzfragen_cov19_vaccination_first_type", type: "select", section: "Vaccination", options: ["Pfizer", "Moderna", "AstraZeneca", "Janssen", "Sputnik V", "Other"] },
  { name: "dose_interval_days", type: "slider", min: 0, max: 7336, section: "Vaccination" },
  { name: "w22_vacc_influenza_2022_2023", type: "checkbox", section: "Vaccination" },
  { name: "s23_vacc_influenza_2022_2023", type: "checkbox", section: "Vaccination" },
  { name: "s24_vacc_influenza_2023_2024", type: "checkbox", section: "Vaccination" },

  // Serology
  { name: "X20_21_serostatus", type: "select", section: "Serology", options: ["seronegative", "seropositive"] },
  { name: "s22_nc_qualitative", type: "checkbox", section: "Serology" },
  { name: "s23_nc_qualitative", type: "checkbox", section: "Serology" },

  // Dates/times
  { name: "X20_21_birth_day", type: "slider", min: 1, max: 31, section: "Dates/Times" },
  { name: "X20_21_check_in_time", type: "date", section: "Dates/Times" },
  { name: "X20_21_blutentnahme_sampling_time_new", type: "date", section: "Dates/Times" },
  { name: "s22_sampling_date_new", type: "date", section: "Dates/Times" },
  { name: "s23_sampling_date_new", type: "date", section: "Dates/Times" },
  { name: "w22_submitdate", type: "date", section: "Dates/Times" },
  { name: "s23_submitdate", type: "date", section: "Dates/Times" },
  { name: "s24_submitdate", type: "date", section: "Dates/Times" }
];

const sectionOrder = [
  "Identifiers", "Demographics", "Household", "Health/Conditions", "Behaviors", "Classification/Status", "Vaccination", "Serology", "Dates/Times"
];

// Generate filter sidebar HTML and inject into sidebar-filters-dropdown
function generateFilters() {
  // Build HTML in memory
  const wrapper = document.createElement('div');
  wrapper.id = 'sidebar-filters';
  wrapper.className = 'sidebar-filters';

  sectionOrder.forEach(section => {
    const sectionFields = dataCatalog.filter(f => f.section === section);
    if (!sectionFields.length) return;
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
        case "date":
          filterControl = `
            <label>${field.name}</label>
            <input type="date" id="filter-${field.name}" />
          `;
          break;
        default:
          filterControl = `<span><!-- Unknown filter type --></span>`;
      }
      const wrapperDiv = document.createElement("div");
      wrapperDiv.className = "filter-control";
      wrapperDiv.innerHTML = filterControl;
      sectionDiv.appendChild(wrapperDiv);
    });
    wrapper.appendChild(sectionDiv);
  });

  // Clear filters button
  const clearBtn = document.createElement("button");
  clearBtn.innerText = "Clear all filters";
  clearBtn.id = "clear-filters-btn";
  clearBtn.className = "btn btn-sm btn-outline-secondary";
  clearBtn.onclick = function() {
    wrapper.querySelectorAll('select, input').forEach(el => {
      if (el.type === "checkbox") el.checked = false;
      else if (el.type === "range") el.value = el.min;
      else el.value = "";
    });
    window.dispatchEvent(new CustomEvent('filters:cleared'));
  };
  wrapper.appendChild(clearBtn);

  // Inject into sidebar-filters-dropdown if present
  const dropdownTarget = document.getElementById('sidebar-filters-dropdown');
  if (dropdownTarget) {
    dropdownTarget.innerHTML = '';
    while (wrapper.firstChild) {
      dropdownTarget.appendChild(wrapper.firstChild);
    }
    window.dispatchEvent(new CustomEvent('filters:generated'));
  } else {
    // Fallback for legacy or debugging
    const sidebar = document.querySelector('.sidebar') || document.body;
    sidebar.appendChild(wrapper);
  }
}

// Call on page load
if (document.readyState === "complete" || document.readyState === "interactive") {
  generateFilters();
} else {
  window.addEventListener("DOMContentLoaded", generateFilters);
}
