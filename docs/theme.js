/**
 * MUSPAD Dashboard - Pro Light Theme
 * 
 * Provides centralized theming for Plotly charts with professional styling.
 * Includes base layout settings, color palette, and typography.
 */

// Professional categorical color palette (Tableau-like)
const COLORWAY = [
  '#1f77b4', // blue
  '#ff7f0e', // orange
  '#2ca02c', // green
  '#d62728', // red
  '#9467bd', // purple
  '#8c564b', // brown
  '#e377c2', // pink
  '#7f7f7f', // gray
  '#bcbd22', // olive
  '#17becf'  // cyan
];

// Theme configuration
const THEME_CONFIG = {
  // Font settings
  fontFamily: 'Inter, Segoe UI, Roboto, -apple-system, BlinkMacSystemFont, sans-serif',
  fontSize: 12,
  titleSize: 16,
  smallSize: 11,
  
  // Colors
  backgroundColor: '#ffffff',
  paperColor: '#ffffff',
  gridColor: '#ECEFF1',
  axisColor: '#B0BEC5',
  textColor: '#2b2f36',
  mutedColor: '#5f6368',
  
  // Current theme - can be changed to 'dark' for future dark mode support
  currentTheme: 'light'
};

/**
 * Get base Plotly layout with professional theme settings
 * @param {Object} overrides - Optional layout overrides to merge with defaults
 * @returns {Object} Plotly layout object with theme defaults
 */
function getBaseLayout(overrides = {}) {
  const baseLayout = {
    // Background and paper
    plot_bgcolor: THEME_CONFIG.backgroundColor,
    paper_bgcolor: THEME_CONFIG.paperColor,
    
    // Typography
    font: {
      family: THEME_CONFIG.fontFamily,
      size: THEME_CONFIG.fontSize,
      color: THEME_CONFIG.textColor
    },
    
    // Title styling - smaller and left-aligned for consistency
    title: {
      font: {
        family: THEME_CONFIG.fontFamily,
        size: THEME_CONFIG.titleSize,
        color: THEME_CONFIG.textColor
      },
      x: 0,  // Left-aligned
      xanchor: 'left',
      pad: { t: 10, b: 10 }
    },
    
    // Margins
    margin: {
      l: 50,
      r: 20,
      b: 50,
      t: 40,
      pad: 4
    },
    
    // X-axis defaults
    xaxis: {
      titlefont: {
        family: THEME_CONFIG.fontFamily,
        size: THEME_CONFIG.fontSize,
        color: THEME_CONFIG.textColor
      },
      tickfont: {
        family: THEME_CONFIG.fontFamily,
        size: THEME_CONFIG.smallSize,
        color: THEME_CONFIG.mutedColor
      },
      gridcolor: THEME_CONFIG.gridColor,
      linecolor: THEME_CONFIG.axisColor,
      tickcolor: THEME_CONFIG.axisColor,
      ticks: 'outside',
      showgrid: true,
      showline: true,
      zeroline: false
    },
    
    // Y-axis defaults
    yaxis: {
      titlefont: {
        family: THEME_CONFIG.fontFamily,
        size: THEME_CONFIG.fontSize,
        color: THEME_CONFIG.textColor
      },
      tickfont: {
        family: THEME_CONFIG.fontFamily,
        size: THEME_CONFIG.smallSize,
        color: THEME_CONFIG.mutedColor
      },
      gridcolor: THEME_CONFIG.gridColor,
      linecolor: THEME_CONFIG.axisColor,
      tickcolor: THEME_CONFIG.axisColor,
      ticks: 'outside',
      showgrid: true,
      showline: true,
      zeroline: false
    },
    
    // Legend defaults - horizontal and below chart
    legend: {
      orientation: 'h',
      x: 0,
      y: -0.2,
      xanchor: 'left',
      yanchor: 'top',
      font: {
        family: THEME_CONFIG.fontFamily,
        size: THEME_CONFIG.smallSize,
        color: THEME_CONFIG.textColor
      }
    },
    
    // Hover label styling
    hoverlabel: {
      bgcolor: 'white',
      bordercolor: THEME_CONFIG.axisColor,
      font: {
        family: THEME_CONFIG.fontFamily,
        size: THEME_CONFIG.fontSize
      }
    },
    
    // Color palette
    colorway: COLORWAY,
    
    // Animation and interaction
    transition: {
      duration: 300,
      easing: 'cubic-in-out'
    },
    
    // Responsive behavior
    autosize: true
  };
  
  // Handle special case for title string overrides
  if (overrides.title && typeof overrides.title === 'string') {
    overrides = {
      ...overrides,
      title: {
        ...baseLayout.title,
        text: overrides.title
      }
    };
  }
  
  // Deep merge with any overrides provided
  return deepMerge(baseLayout, overrides);
}

/**
 * Get color palette for manual color assignment
 * @returns {Array} Array of color strings
 */
function getColorway() {
  return [...COLORWAY];  // Return a copy to prevent modification
}

/**
 * Deep merge two objects, with the second object taking precedence
 * @param {Object} target - Target object to merge into
 * @param {Object} source - Source object to merge from
 * @returns {Object} Merged object
 */
function deepMerge(target, source) {
  const result = { ...target };
  
  for (const key in source) {
    if (source.hasOwnProperty(key)) {
      if (typeof source[key] === 'object' && source[key] !== null && !Array.isArray(source[key])) {
        result[key] = deepMerge(target[key] || {}, source[key]);
      } else {
        result[key] = source[key];
      }
    }
  }
  
  return result;
}

/**
 * Apply theme to existing Plotly figure layout
 * Merges theme defaults with existing layout settings
 * @param {Object} layout - Existing Plotly layout object
 * @returns {Object} Updated layout with theme applied
 */
function applyTheme(layout) {
  return getBaseLayout(layout);
}

/**
 * Get theme configuration for advanced customization
 * @returns {Object} Current theme configuration
 */
function getThemeConfig() {
  return { ...THEME_CONFIG };
}

// Hook for future theme switching (light/dark mode)
window.dashboardTheme = THEME_CONFIG.currentTheme;

/**
 * Plot Viewer functionality for HTML plot gallery
 * Handles manifest loading, plot selection, and iframe display
 */
const PlotViewer = {
  manifest: null,
  currentPlot: null,
  
  /**
   * Load the plot manifest from assets/plots/manifest.json
   */
  async loadManifest() {
    const loadingEl = document.getElementById('plotViewerLoading');
    const errorEl = document.getElementById('plotViewerError');
    const controlsEl = document.getElementById('plotViewerControls');
    
    if (!loadingEl || !errorEl || !controlsEl) return;
    
    // Show loading state
    loadingEl.style.display = 'block';
    errorEl.style.display = 'none';
    controlsEl.style.display = 'none';
    
    try {
      const response = await fetch('assets/plots/manifest.json');
      if (!response.ok) {
        throw new Error(`Failed to load manifest: ${response.status} ${response.statusText}`);
      }
      
      this.manifest = await response.json();
      
      // Validate manifest structure
      if (!this.manifest.charts || !Array.isArray(this.manifest.charts)) {
        throw new Error('Invalid manifest format: missing charts array');
      }
      
      this.populateDropdown();
      this.handleURLParameter();
      
      // Show controls
      loadingEl.style.display = 'none';
      controlsEl.style.display = 'block';
      
    } catch (error) {
      console.error('Error loading plot manifest:', error);
      this.showError(error.message);
    }
  },
  
  /**
   * Populate the dropdown with available plots
   */
  populateDropdown() {
    const selectEl = document.getElementById('plotViewerSelect');
    if (!selectEl || !this.manifest) return;
    
    // Clear existing options (keep the first "Choose a plot..." option)
    selectEl.innerHTML = '<option value="">Choose a plot...</option>';
    
    // Add plots to dropdown
    this.manifest.charts.forEach(chart => {
      const option = document.createElement('option');
      option.value = chart.file;
      option.textContent = chart.title;
      selectEl.appendChild(option);
    });
  },
  
  /**
   * Handle URL parameter for deep linking (?plot=filename.html)
   */
  handleURLParameter() {
    const urlParams = new URLSearchParams(window.location.search);
    const plotParam = urlParams.get('plot');
    
    if (plotParam) {
      const selectEl = document.getElementById('plotViewerSelect');
      if (selectEl) {
        // Find matching option
        const option = Array.from(selectEl.options).find(opt => opt.value === plotParam);
        if (option) {
          selectEl.value = plotParam;
          this.selectPlot(plotParam);
        }
      }
    }
  },
  
  /**
   * Select and display a plot
   */
  selectPlot(filename) {
    if (!filename || !this.manifest) {
      this.hidePlot();
      return;
    }
    
    const chart = this.manifest.charts.find(c => c.file === filename);
    if (!chart) {
      console.warn('Plot not found in manifest:', filename);
      return;
    }
    
    this.currentPlot = chart;
    this.displayPlot(chart);
    this.updateURL(filename);
  },
  
  /**
   * Display the selected plot in iframe
   */
  displayPlot(chart) {
    const iframeEl = document.getElementById('plotViewerIframe');
    const frameEl = document.getElementById('plotViewerFrame');
    const placeholderEl = document.getElementById('plotViewerPlaceholder');
    
    if (!iframeEl || !frameEl || !placeholderEl) return;
    
    // Build plot URL using manifest basePath
    const plotUrl = this.manifest.basePath + chart.file;
    
    // Update iframe source
    iframeEl.src = plotUrl;
    
    // Show iframe, hide placeholder
    frameEl.style.display = 'block';
    placeholderEl.style.display = 'none';
    
    // Update iframe load handlers
    iframeEl.onload = () => {
      console.log('Plot loaded successfully:', chart.title);
    };
    
    iframeEl.onerror = () => {
      console.error('Failed to load plot:', chart.title);
      this.showError(`Failed to load plot: ${chart.title}`);
    };
  },
  
  /**
   * Hide the plot display
   */
  hidePlot() {
    const frameEl = document.getElementById('plotViewerFrame');
    const placeholderEl = document.getElementById('plotViewerPlaceholder');
    const iframeEl = document.getElementById('plotViewerIframe');
    
    if (frameEl) frameEl.style.display = 'none';
    if (placeholderEl) placeholderEl.style.display = 'block';
    if (iframeEl) iframeEl.src = '';
    
    this.currentPlot = null;
    this.updateURL('');
  },
  
  /**
   * Update URL with plot parameter
   */
  updateURL(filename) {
    const url = new URL(window.location);
    
    if (filename) {
      url.searchParams.set('plot', filename);
    } else {
      url.searchParams.delete('plot');
    }
    
    // Update URL without reloading page
    window.history.replaceState({}, '', url);
  },
  
  /**
   * Open current plot in fullscreen
   */
  openFullscreen() {
    const iframeEl = document.getElementById('plotViewerIframe');
    if (!iframeEl || !this.currentPlot) return;
    
    if (iframeEl.requestFullscreen) {
      iframeEl.requestFullscreen();
    } else if (iframeEl.webkitRequestFullscreen) {
      iframeEl.webkitRequestFullscreen();
    } else if (iframeEl.msRequestFullscreen) {
      iframeEl.msRequestFullscreen();
    }
  },
  
  /**
   * Open current plot in new window
   */
  openNewWindow() {
    if (!this.currentPlot || !this.manifest) return;
    
    const plotUrl = this.manifest.basePath + this.currentPlot.file;
    window.open(plotUrl, '_blank', 'width=1200,height=800,scrollbars=yes,resizable=yes');
  },
  
  /**
   * Show error message
   */
  showError(message) {
    const loadingEl = document.getElementById('plotViewerLoading');
    const errorEl = document.getElementById('plotViewerError');
    const controlsEl = document.getElementById('plotViewerControls');
    const messageEl = document.getElementById('plotViewerErrorMessage');
    
    if (loadingEl) loadingEl.style.display = 'none';
    if (controlsEl) controlsEl.style.display = 'none';
    if (errorEl) errorEl.style.display = 'block';
    if (messageEl) messageEl.textContent = message;
  }
};

// Make PlotViewer globally available
window.PlotViewer = PlotViewer;

// Export functions for use in chart creation
if (typeof module !== 'undefined' && module.exports) {
  // Node.js/CommonJS
  module.exports = { getBaseLayout, getColorway, applyTheme, getThemeConfig };
} else {
  // Browser global
  window.DashboardTheme = { getBaseLayout, getColorway, applyTheme, getThemeConfig };
}