# MUSPAD Study Dashboard

MUSPAD Study Dashboard is a static web application for analyzing epidemiological study data with interactive charts and data visualization. Built with vanilla HTML/CSS/JavaScript using Plotly.js for charts and PapaParse for CSV data processing.

**Always reference these instructions first and fallback to search or bash commands only when you encounter unexpected information that does not match the info here.**

## Working Effectively

### Serving the Application
- **NEVER CANCEL**: Start the development server and wait for it to fully load:
  - `cd docs && python3 -m http.server 8000` -- takes 1-2 seconds to start. NEVER CANCEL. Set timeout to 30+ seconds.
  - Access at `http://localhost:8000/`
  - Alternative ports: `python3 -m http.server 3000` or `python3 -m http.server 8080`

### Python Utilities
- **Serology plot analysis**:
  - `python3 python/serology_plots.py --list` -- lists available plot data (instant)
  - `python3 python/serology_plots.py --key <key>` -- get JSON for specific plot (instant)
  - `python3 python/serology_plots.py --all` -- get JSON for all plots (takes ~1-2 seconds)
- **Plot manifest generation**:
  - `python3 tools/generate_plot_manifest.py docs/plots docs/assets/plots/manifest.json` -- generates manifest (instant if plots exist, reports "directory not found" if no plots directory)

### GitHub Actions Workflow
- **NEVER CANCEL**: Workflow runs automatically on `docs/plots/**` changes:
  - Duration: 9 seconds typical completion time. NEVER CANCEL. Set timeout to 60+ seconds.
  - Generates plot manifest automatically
  - Manual trigger: GitHub Actions tab → "Update Plot Manifest" → "Run workflow"

## Validation

### Manual Application Testing
After making any changes, **ALWAYS** validate the application by:

1. **Start the server**: `cd docs && python3 -m http.server 8000`
2. **Load main dashboard**: Verify `http://localhost:8000/` loads without errors
3. **Test data loading**: Confirm CSV data loads (check browser console for errors)
4. **Test chart functionality**: 
   - Create at least one chart using the Chart Builder
   - Verify filters work (age, sex, location)
   - Test responsive behavior by resizing browser window
5. **Test alternative dashboards**:
   - `http://localhost:8000/test-dashboard.html` - test version with sample data
   - `http://localhost:8000/serology-insights.html` - specialized serology dashboard
   - `http://localhost:8000/responsive_test.html` - responsive behavior test

### Essential User Scenarios
Always test these complete workflows after changes:
1. **Data Exploration**: Load dashboard → select variables → create bar chart → apply age filter → verify filtered results
2. **Chart Building**: Open Chart Builder → select X/Y variables → change chart type → verify chart updates correctly
3. **Plot Gallery**: Access Custom Analytics → open Plot Viewer → select a plot → verify iframe loads correctly

### Data Validation
- **CSV endpoint test**: `curl -s http://localhost:8000/data/df3_full_for_pivot.csv | head -5` should return data headers
- **Data discovery test**: Dashboard auto-detects CSV files in `docs/data/` via GitHub API
- **Sample data**: Main dataset has ~100+ columns including demographics, health status, and vaccination data

## Project Structure

### Key Directories
```
docs/                    # Main application and GitHub Pages content
├── index.html          # Primary dashboard (257KB single-file app)
├── test-dashboard.html # Test version with sample data  
├── assets/             # CSS, JavaScript, and other assets
├── data/               # CSV data files for analysis
└── plots/              # HTML plot files (may not exist)

python/                  # Python utilities
└── serology_plots.py   # Serology data analysis functions

tools/                   # Build and utility scripts  
└── generate_plot_manifest.py  # Plot manifest generator

.github/workflows/       # GitHub Actions
└── update-plot-manifest.yml   # Auto-updates plot manifests
```

### Core Files
- **`docs/index.html`**: Main dashboard application (self-contained with embedded CSS/JS)
- **`docs/theme.js`**: Plotly theme configuration and dashboard theming
- **`docs/assets/layout-bridge.js`**: Navigation and responsive layout management
- **`docs/data/df3_full_for_pivot.csv`**: Main dataset (epidemiological study data)

## Common Tasks

### Adding New CSV Data
1. Place CSV file in `docs/data/` directory
2. Dashboard will auto-discover files with names containing "latest", "current", "final", "full", or "pivot"
3. No restart required - refresh browser to load new data

### Modifying Charts and Visualization
- Edit `docs/theme.js` for Plotly theme changes
- Edit `docs/assets/layout-bridge.js` for navigation and responsiveness  
- Main chart logic is embedded in `docs/index.html`
- All changes take effect immediately on browser refresh

### Working with Plot Gallery
- HTML plots should be placed in `docs/plots/` directory
- GitHub Actions will automatically generate `docs/assets/plots/manifest.json`
- Manual generation: `python3 tools/generate_plot_manifest.py docs/plots docs/assets/plots/manifest.json`

### Testing Responsive Behavior
- Use `docs/responsive_test.html` to test iframe responsive behavior
- Test at multiple screen sizes: desktop (1200px+), tablet (768px), mobile (360px)
- Verify charts resize correctly with browser window changes

## Technology Details

### No Build System Required
- **Static files**: No webpack, npm, or build process needed
- **Direct editing**: Modify HTML/CSS/JS files directly
- **Immediate changes**: Refresh browser to see updates
- **Dependencies**: All loaded via CDN (Bootstrap, Plotly.js, PapaParse)

### Data Processing
- **Client-side only**: All processing happens in browser
- **CSV parsing**: PapaParse library handles CSV data
- **Dynamic loading**: Data loaded via GitHub API or direct HTTP requests
- **No server**: Pure static hosting (GitHub Pages compatible)

### Chart System
- **Plotly.js**: All charts use Plotly for visualization
- **Theme system**: Consistent styling via `docs/theme.js`
- **Interactive**: Charts support filtering, zooming, and export
- **Responsive**: Charts auto-resize with container changes

## Troubleshooting

### Server Won't Start
- **Port in use**: Try different port: `python3 -m http.server 3000`  
- **Permission denied**: Ensure you're in the `docs/` directory
- **Python missing**: Verify `python3 --version` returns 3.x

### Charts Not Loading
- **Check browser console**: Look for JavaScript errors
- **Verify data endpoint**: Test `http://localhost:8000/data/df3_full_for_pivot.csv`
- **Check Plotly**: Ensure CDN resources load (check Network tab)

### GitHub Actions Failing
- **Workflow duration**: Normal completion is ~9 seconds
- **Plots directory**: Workflow expects `docs/plots/` to exist with .html files
- **Python errors**: Check workflow logs for script errors

### Common File Paths
```bash
# Repository root
ls -la /home/runner/work/muspad-study-dashboard/muspad-study-dashboard

# Main application files  
docs/index.html
docs/test-dashboard.html
docs/theme.js

# Data files
docs/data/df3_full_for_pivot.csv

# Python utilities
python/serology_plots.py
tools/generate_plot_manifest.py

# Configuration
.github/workflows/update-plot-manifest.yml
.gitignore
```

This is a mature, stable application focused on data visualization and analysis. Changes should be minimal and always tested thoroughly using the validation scenarios above.