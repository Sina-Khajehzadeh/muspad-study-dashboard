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

// Export functions for use in chart creation
if (typeof module !== 'undefined' && module.exports) {
  // Node.js/CommonJS
  module.exports = { getBaseLayout, getColorway, applyTheme, getThemeConfig };
} else {
  // Browser global
  window.DashboardTheme = { getBaseLayout, getColorway, applyTheme, getThemeConfig };
}