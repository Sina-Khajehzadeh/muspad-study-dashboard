# MUSPAD Python Plotly JSON Integration

This document describes the Python Plotly JSON integration feature that allows users to add pre-generated Plotly charts from JSON files to the Insights dashboard.

## Overview

The feature replaces the previous single "Import chart from Python Plotly JSON" option with a manifest-backed system that can list and load multiple charts from JSON files.

## How it Works

1. **Manifest System**: Charts are defined in `docs/assets/plots/plotly_manifest.json`
2. **Chart Selection**: Users can select multiple charts from an accordion interface
3. **Interactive Loading**: Charts are loaded as interactive Plotly visualizations
4. **Preserved Styling**: Charts maintain their exact styling from the JSON files

## File Structure

```
docs/assets/plots/
├── plotly_manifest.json          # Chart manifest
├── serology_seroprevalence.json  # Seroprevalence chart data
└── vaccination_coverage.json     # Vaccination coverage chart data

tools/
├── export_plotly_json.py         # Python script to generate charts
└── requirements.txt              # Python dependencies
```

## Manifest Schema

```json
{
  "version": 1,
  "basePath": "assets/plots/",
  "charts": [
    {
      "id": "chart-id",
      "title": "Chart Title (X20_21)",
      "file": "chart_data.json",
      "width": 800,
      "height": 500
    }
  ]
}
```

## Using the Python Exporter

The `tools/export_plotly_json.py` script generates charts and the manifest:

```bash
# Install dependencies
pip install -r tools/requirements.txt

# Run the exporter
python3 tools/export_plotly_json.py
```

### Script Features

- **Robust serostatus mapping**: Handles various formats (1/0, yes/no, positive/negative, etc.)
- **Vaccination logic**: Treats value==1 as yes, computes percentages over non-NaN values
- **Fixed dataset tag**: Always uses X20_21 in titles
- **Sample data fallback**: Works without input data for testing

### Custom Data Usage

```python
import pandas as pd
from tools.export_plotly_json import main

# Load your data
df = pd.read_csv('your_data.csv')

# Export charts with your data
main(df)
```

## User Interface

1. **Access**: Click "Custom Analytics" in the Insights panel
2. **Expand**: Click the "Python Plotly JSON" accordion
3. **Select**: Choose charts using checkboxes
4. **Add**: Click "Add to Insights (N)" to add selected charts

## Chart Features

- **Interactive**: Full Plotly interactivity (zoom, hover, etc.)
- **Responsive**: Automatically resize with container
- **Exact styling**: Preserves original chart appearance
- **No editing**: Edit FAB is hidden to maintain chart integrity
- **Removable**: Charts can be removed from Insights panel

## Error Handling

- **Loading state**: Shows spinner while loading manifest
- **Error state**: Displays error message with retry button
- **Empty state**: Shows message when no charts available
- **Network errors**: Graceful handling of failed requests

## Technical Details

- Charts are stored as `type: 'plotlyjson'` in the insights system
- Uses `Plotly.newPlot()` with exact JSON data and layout
- ResizeObserver ensures responsive behavior
- Manifest loading is triggered when accordion is first opened
- Multi-select state is managed with JavaScript Set