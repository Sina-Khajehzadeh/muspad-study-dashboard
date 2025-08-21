# MUSPAD Dashboard - Pro Light Theme

## Overview

The Pro Light theme provides consistent, professional styling across all dashboard components with reduced chart title font sizes and harmonized typography.

## Files

- `theme.css` - CSS variables, card header styling, and responsive design
- `theme.js` - Plotly layout defaults and theme configuration
- `index.html` - Updated to import theme files and use `getBaseLayout()`

## Key Features

### Typography
- **Font Family**: Inter, Segoe UI, Roboto fallback
- **Chart Titles**: 16px, left-aligned (reduced from default)
- **Axis Titles**: 12px 
- **Tick Labels**: 11px
- **Card Headers**: 14px (desktop), 13px (mobile), font-weight 500

### Colors
- **Professional Palette**: 10 Tableau-like colors for data visualization
- **Neutral Grays**: Light gridlines (#ECEFF1), axis lines (#B0BEC5)
- **Text Colors**: Primary (#2b2f36), muted (#5f6368)

### Layout
- **Chart Titles**: Left-aligned for consistency
- **Legends**: Horizontal, positioned below charts
- **Card Headers**: Visually secondary with lighter weight
- **Edit FABs**: Preserved positioning above chart content

## Usage

### Automatic Integration
All charts created through `drawChart()` automatically use the theme via:
```javascript
let fig = { 
  data: [], 
  layout: window.DashboardTheme.getBaseLayout({
    title: titleFor(cfg)
  }) 
};
```

### Manual Customization
To override theme defaults for specific charts:
```javascript
const customLayout = window.DashboardTheme.getBaseLayout({
  title: "Custom Title",
  xaxis: { title: "Custom X Label" },
  // Theme defaults will be preserved for other properties
});
```

### Future Dark Mode Support
The theme includes a hook for dark mode:
```css
[data-theme="dark"] {
  --chart-bg: #1a1a1a;
  --chart-paper: #2d2d2d;
  /* ... additional dark mode overrides */
}
```

## Customization Guide

### Adjusting Font Sizes
Edit `theme.js` THEME_CONFIG:
```javascript
const THEME_CONFIG = {
  fontSize: 12,        // Base font size
  titleSize: 16,       // Chart title size  
  smallSize: 11,       // Tick label size
  // ...
};
```

### Updating Color Palette
Modify the COLORWAY array in `theme.js`:
```javascript
const COLORWAY = [
  '#1f77b4', // blue
  '#ff7f0e', // orange
  // ... add/modify colors
];
```

### Card Header Styling
Adjust variables in `theme.css`:
```css
:root {
  --font-size-title: 16px;    /* Chart titles */
  --font-weight-medium: 500;  /* Card header weight */
  /* ... */
}
```

## Responsive Design

- **Desktop**: Card headers 14px, 2-column grid layout
- **Mobile**: Card headers 13px, single column layout
- **All sizes**: Edit FABs remain accessible and properly positioned

## Chart Reproducibility and Export

### Deterministic Behavior
All charts produce consistent, reproducible results:
- **Stable sorting**: Categorical variables maintain consistent order
- **Deterministic jitter**: Scatter plots use seed-based randomization
- **Consistent aggregations**: Statistical calculations follow defined rules

### Export Capabilities
Charts support data export for reproducibility:
- **CSV Export**: Aggregated data used to create the chart
- **Full Dataset**: Complete filtered dataset slice
- **Chart Settings**: Configuration JSON for exact reproduction

For detailed guidelines, see [docs/charting-guidelines.md](charting-guidelines.md).

### Recent Changes
- **Removed Color/Group Control**: The optional color/group selector has been removed to simplify the interface and ensure statistical validity
- **Enhanced Variable Type Validation**: Chart types are now dynamically filtered based on X/Y variable combinations

## Compatibility

- ✅ All existing chart types (histogram, bar, scatter, line, pie, box, etc.)
- ✅ Existing features (filters, rangesliders, Edit FAB)
- ✅ User customizations via chart builder
- ✅ Special chart configurations (dose_interval_days rangeslider)
- ⚠️ Color/Group control removed (see charting guidelines for alternatives)