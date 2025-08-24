// --- SECTION: Render group buttons + section-based field list ---
// List/order of your section/group names:
const sectionOrder = [
  "All",
  "Identifiers",
  "Demographics",
  "Household",
  "Health/Conditions",
  "Behaviors",
  "Classification/Status",
  "Vaccination",
  "Serology",
  "Dates/Times"
];

// Heuristic patterns for assigning columns to a section.
// Tweak these regexes to improve grouping for your dataset.
const sectionPatterns = {
  "Identifiers": /\b(id|participant|pid|uid|subject|code)\b/i,
  "Demographics": /\b(age|sex|gender|birth|region|standort|city|zipcode|zip|country|ethnic|ethnicity)\b/i,
  "Household": /\b(house|hh|household|family|kids|children|members)\b/i,
  "Health/Conditions": /\b(condition|disease|chronic|illness|health|comorbidity|symptom)\b/i,
  "Behaviors": /\b(smoke|smoking|alcohol|exercise|behav|behavior|lifestyle)\b/i,
  "Classification/Status": /\b(status|classification|group|cat|class)\b/i,
  "Vaccination": /\b(vacc|dose|vaccination|vaccine|booster|immun)\b/i,
  "Serology": /\b(sero|serology|antibody|seropositive|seronegative|igg|igm|nc_qualitative)\b/i,
  "Dates/Times": /\b(date|time|_dt|timestamp|submitdate|sampling|blutentnahme|sampling_time)\b/i
};

// assign a section name (from sectionOrder) to a column name using the heuristics
function assignSectionForColumn(colName) {
  if (!colName) return "Other";
  for (const sec of sectionOrder) {
    if (sec === "All") continue;
    const pat = sectionPatterns[sec];
    if (pat && pat.test(colName)) return sec;
  }
  return "Other";
}

// Render the section buttons into #gf-groups (shows under search box)
function renderGroupButtons(activeSection = "All") {
  const groupsContainer = document.getElementById("gf-groups");
  if (!groupsContainer) return;
  groupsContainer.innerHTML = "";

  sectionOrder.forEach(section => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.textContent = section;
    btn.className = "btn btn-sm gf-group-btn " + (section === activeSection ? " active" : "");
    btn.dataset.section = section;
    btn.onclick = () => {
      // set active styling
      groupsContainer.querySelectorAll("button").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");

      // remember current section in GF._group (keep lowercase for compatibility)
      GF._group = section.toLowerCase();

      // render fields for this section (if GF.meta ready)
      if (window.GF && GF.meta && columns && columns.length) {
        gf_renderFieldListBySection(section, document.getElementById('gf-field-search')?.value || '');
      } else {
        // if meta not ready yet, just show placeholder and defer actual rendering
        const wrap = document.getElementById('gf-field-list');
        if (wrap) wrap.innerHTML = `<div style="padding:8px;color:var(--gf-muted,#6b7280)">Fields for: ${section} (loading metadata…)</div>`;
      }
    };
    groupsContainer.appendChild(btn);
  });
}

// Render field list filtered by section name + optional needle
function gf_renderFieldListBySection(section = "All", needle = "") {
  if (!columns || !Array.isArray(columns)) return;
  const wrap = document.getElementById('gf-field-list');
  if (!wrap) return;

  wrap.innerHTML = '';
  const list = [];

  for (const col of columns) {
    // filter by needle (search) first
    if (needle && !col.toLowerCase().includes(needle.toLowerCase())) continue;

    // if section is All, include everything; otherwise match assigned section
    if (section === "All" || assignSectionForColumn(col) === section) {
      const t = GF.meta?.[col]?.type || 'cat';
      list.push({ col, t });
    }
  }

  // sort by name (you can change ordering)
  list.sort((a, b) => a.col.localeCompare(b.col));

  if (!list.length) {
    wrap.innerHTML = `<div style="padding:10px; color:var(--gf-muted,#6b7280)">No fields in "${section}" matching "${needle}"</div>`;
    return;
  }

  for (const { col, t } of list) {
    const a = document.createElement('div');
    a.className = 'gf-field-item';
    a.style.setProperty('--stripe', chipColors(hueFromString(col)).stripe);
    a.textContent = `${col}  ·  ${t}`;
    a.onclick = () => {
      GF.activeField = col;
      gf_showField(col);
      wrap.querySelectorAll('.gf-field-item').forEach(x => x.classList.remove('active'));
      a.classList.add('active');
    };
    a.innerHTML = `<span class="gf-name">${col}</span>` +
      `<span class="gf-count">${GF.meta?.[col]?.uniques?.length ?? ''}</span>`;
    wrap.appendChild(a);
  }
}

// Hook the search input to filter within the current section
(function hookSearchToSection() {
  const fs = document.getElementById('gf-field-search');
  if (!fs) return;
  fs.oninput = (e) => {
    const currentSection = (GF && GF._group && typeof GF._group === 'string') ? (GF._group === 'all' ? 'All' : sectionOrder.find(s => s.toLowerCase() === GF._group) || 'All') : 'All';
    gf_renderFieldListBySection(currentSection, e.target.value || '');
  };
})();

// Ensure we render buttons when DOM and library loaded.
// If metadata is already available, show fields immediately for 'All'.
document.addEventListener('DOMContentLoaded', () => {
  renderGroupButtons("All");
  if (GF && GF.meta && columns && columns.length) {
    gf_renderFieldListBySection("All", "");
  } else {
    // keep placeholder; gf_initUI/initGlobalFilters will trigger a real render after metadata
  }
});
