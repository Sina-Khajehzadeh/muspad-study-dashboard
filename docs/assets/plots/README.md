# Plot Gallery Manifest

This directory contains the automatically generated manifest file for the HTML plot gallery.

## Files

- **`manifest.json`** - Auto-generated manifest listing all HTML plots in `docs/plots/`
- **`plotly_manifest.json`** - Manifest for Python-exported Plotly JSON charts (separate system)

## How to Add New Plots

1. **Add your plot HTML file** to the `docs/plots/` directory
   - File should be a standalone HTML file containing a Plotly chart
   - Use descriptive filenames (spaces, hyphens, underscores are all fine)

2. **Automatic manifest update**
   - When you push changes to the `main` branch affecting `docs/plots/**`, the GitHub Actions workflow will automatically:
     - Scan for all `.html` files in `docs/plots/`
     - Generate friendly titles from filenames (e.g., "my-chart.html" → "My Chart")
     - Update `manifest.json` with the new chart list
     - Commit the changes back to the repository

3. **Manual update** (if needed)
   - You can manually trigger the workflow from the GitHub Actions tab
   - Or run the manifest generation script locally:
     ```bash
     cd /path/to/repo
     python3 tools/generate_manifest.py docs/plots docs/assets/plots/manifest.json
     ```

## Manifest Format

The `manifest.json` file follows this structure:

```json
{
  "version": 1,
  "basePath": "plots/",
  "charts": [
    {
      "id": "chart-id",
      "title": "Human Readable Title",
      "file": "filename.html",
      "type": "html"
    }
  ]
}
```

## Plot Viewer Usage

Users can:
- **Browse plots** via the Plot Viewer in the Custom Analytics modal
- **Preview plots** in an embedded iframe
- **Share plots** using deep links like `?plot=filename.html`
- **Open plots** in fullscreen or new windows for detailed viewing

The Plot Viewer automatically loads the manifest and populates the dropdown with all available plots.