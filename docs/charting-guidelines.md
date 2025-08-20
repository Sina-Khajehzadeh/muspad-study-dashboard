# MUSPAD Dashboard - Charting Guidelines

## Overview

This document provides comprehensive guidelines for creating statistically sound, reproducible charts in the MUSPAD dashboard. It defines which chart types are valid for different variable type combinations and specifies the data processing rules that ensure reliable visualizations.

## Chart Type Matrix

The following matrix shows valid chart types for different combinations of X and Y variable types:

### Single Variable Charts (Y absent)

| X Variable Type | Valid Chart Types | Notes |
|----------------|------------------|-------|
| **Numeric** | Histogram, Box Plot | Histogram with configurable bins (default: 30). Box plot shows distribution summary |
| **Categorical** | Bar Chart (counts) | Shows frequency of each category |
| **Date** | Time Series (counts), Bar Chart | Aggregate counts by time period (day/week/month/quarter/year) |

### Two Variable Charts

| X Type | Y Type | Valid Chart Types | Aggregations | Notes |
|--------|--------|------------------|--------------|-------|
| **Categorical** | **Numeric** | Bar (mean/sum/count), Box Plot, Violin, Strip/Beeswarm | mean, median, sum, count | Bar shows aggregated values per category. Box plot shows distribution per category |
| **Numeric** | **Numeric** | Scatter, Hexbin, Line (if X ordered) | none (raw points) | Scatter for correlation. Line only if X has meaningful order |
| **Date** | **Numeric** | Time Series, Bar (aggregated) | mean, median, sum, count | Aggregate Y values by time periods. Line chart with time on X-axis |
| **Categorical** | **Categorical** | Mosaic, Heatmap (counts), Stacked Bar | count, proportion | Cross-tabulation visualizations |
| **Date** | **Categorical** | Stacked Area, Bar (counts per period) | count | Show categorical breakdown over time |
| **Numeric** | **Categorical** | Box Plot, Violin, Bar (aggregated) | count, mode | Box plot shows numeric distribution per category |

### Invalid Combinations

- **Line Charts**: Only valid when X-axis has meaningful ordering (time series or ordered categorical)
- **Pie Charts**: Only for categorical X with numeric Y (aggregated) or categorical X with counts
- **Bubble Charts**: Require numeric X, Y, and size variables
- **Heatmaps**: Need two categorical variables or binned numeric data

## Data Preprocessing Requirements

### Type Detection and Coercion

```javascript
// Column type detection (already implemented)
function getColumnType(col) {
  if (isDateCol(col)) return 'date';
  if (looksNumericColumn(col)) return 'numeric'; // 70%+ values are numbers
  if (looksCategoricalColumn(col)) return 'categorical'; // 2-20 unique non-numeric values
  return 'other';
}

// Numeric coercion utility (recommended addition)
function coerceNumericArray(values) {
  return values
    .filter(v => v != null && v !== '') // Remove nulls/empty first
    .map(v => Number(v))                // Convert to number
    .filter(v => Number.isFinite(v));   // Keep only finite numbers
}
```

### Missing Value Handling

- **Drop by default**: Remove rows with missing values in chart variables
- **User choice**: Provide UI option for imputation methods:
  - Numeric: mean, median, or custom value
  - Categorical: mode or "(Missing)" category
  - Date: interpolation or forward-fill

### Minimum Sample Size Requirements

| Chart Type | Minimum N | Warning Threshold |
|------------|-----------|-------------------|
| Histogram | 10 | < 30 |
| Box Plot | 5 per group | < 10 per group |
| Scatter | 10 | < 20 |
| Bar Chart | 1 per category | < 3 per category |
| Time Series | 3 time points | < 5 time points |

### Categorical Variable Ordering

1. **Preserve factor order** if provided in data
2. **Default alphabetical** for text categories
3. **Frequency-based options**:
   - `frequency_desc`: Most frequent first
   - `frequency_asc`: Least frequent first
4. **Custom ordering** via UI drag-and-drop (future feature)

### Deterministic Jitter Rules

```javascript
// Consistent jitter for reproducibility
function deterministicJitter(values, seed = 12345, amplitude = 0.2) {
  // Use seed-based random for consistent results
  const seededRandom = (seed) => {
    let x = Math.sin(seed++) * 10000;
    return x - Math.floor(x);
  };
  
  return values.map((v, i) => 
    v == null ? null : v + (seededRandom(seed + i) - 0.5) * amplitude
  );
}
```

## Date Variable Handling

### Date Parsing Rules

```javascript
// Robust date parsing (recommended enhancement)
function parseFlexibleDate(value) {
  // Try common formats: ISO, US, EU, timestamps
  const formats = [
    new Date(value),                    // ISO and most formats
    new Date(value.replace(/[-/]/g, '/')), // Normalize separators
    new Date(parseInt(value))           // Unix timestamps
  ];
  
  for (const date of formats) {
    if (!isNaN(date.getTime()) && 
        date.getFullYear() >= 2010 && 
        date.getFullYear() <= 2030) {
      return date;
    }
  }
  return null;
}
```

### Time Aggregation Options

| Period | Use Case | Code Example |
|--------|----------|--------------|
| **Day** | Daily tracking | `d.toISOString().slice(0, 10)` |
| **Week** | Weekly trends | Start of week calculation |
| **Month** | Monthly reports | `${year}-${month.padStart(2, '0')}` |
| **Quarter** | Quarterly analysis | `Q${Math.floor((month-1)/3)+1} ${year}` |
| **Year** | Annual comparisons | `year.toString()` |

### Choosing Aggregation Frequency

| Time Span | Recommended Period | Rationale |
|-----------|-------------------|-----------|
| < 30 days | Day | Preserve daily patterns |
| 1-6 months | Week | Balance detail and readability |
| 6 months - 2 years | Month | Standard business reporting |
| 2-10 years | Quarter | Reduce seasonal noise |
| > 10 years | Year | Focus on long-term trends |

## Statistical Choices and Defaults

### Aggregation Defaults

- **Count**: Default for categorical variables
- **Mean**: Default for numeric aggregations
- **Error bars**: 95% Confidence Interval (not SEM or SD)

### When to Use Different Statistics

| Statistic | Use When | UI Label |
|-----------|----------|----------|
| **Mean** | Normal distribution, no extreme outliers | "Average" |
| **Median** | Skewed data, presence of outliers | "Median" |
| **Sum** | Totals are meaningful (e.g., revenue, counts) | "Total" |
| **Count** | Frequency analysis | "Count" |

### Error Bar Guidelines

```javascript
// Confidence interval calculation
function computeMeanCI(values, confidence = 0.95) {
  const n = values.length;
  const mean = values.reduce((a, b) => a + b, 0) / n;
  const variance = values.reduce((a, b) => a + (b - mean) ** 2, 0) / (n - 1);
  const stderr = Math.sqrt(variance / n);
  const tValue = getTValue(n - 1, confidence); // t-distribution
  
  return {
    mean: mean,
    lower: mean - tValue * stderr,
    upper: mean + tValue * stderr,
    n: n
  };
}
```

### Sample Size Warnings

Display warnings when:
- Any group has n < 10 for means
- Any group has n < 5 for box plots  
- Any group has n < 3 for any aggregation
- Total sample size < 30 for statistical tests

## Chart Rendering Rules

### Point Connection Rules

- **Line charts**: Connect only when X-axis is ordered (dates, sequential numbers)
- **Time series**: Always connect chronologically ordered points
- **Scatter plots**: Never connect points unless explicitly requested
- **Box plots**: Show individual points when n < 20 per group

### Error Bar Display

- **Bar charts**: Show error bars extending from top of bars
- **Line charts**: Show error bars at each point (symmetric)
- **Box plots**: Use whiskers for IQR, outliers as separate points

### Small Sample Group Handling

```javascript
// Visual indicators for small samples
function addSampleSizeWarning(fig, groupCounts) {
  const smallGroups = Object.entries(groupCounts)
    .filter(([group, n]) => n < 10)
    .map(([group, n]) => `${group} (n=${n})`);
  
  if (smallGroups.length > 0) {
    fig.layout.annotations = fig.layout.annotations || [];
    fig.layout.annotations.push({
      text: `Small samples: ${smallGroups.join(', ')}`,
      xref: 'paper', yref: 'paper',
      x: 1, y: 1,
      showarrow: false,
      bgcolor: 'rgba(255,255,0,0.8)',
      font: {size: 10}
    });
  }
}
```

## Accessibility and Reproducibility

### Deterministic Behavior

All charts must produce identical results when run multiple times with the same data:

- **Jitter**: Use seed-based randomization
- **Color assignment**: Consistent mapping based on category names
- **Category ordering**: Stable sort algorithms
- **Aggregation**: Well-defined handling of ties and missing values

### Export Capabilities

Each chart should support export of:
1. **Aggregated data**: CSV of the values used in the chart
2. **Full dataset slice**: All rows that contributed to the chart
3. **Chart configuration**: JSON of all settings for reproduction

```javascript
// Export functionality (recommended addition)
function exportChartData(cfg, data) {
  return {
    config: cfg,
    rawData: data,
    aggregatedData: computeAggregatedData(cfg, data),
    timestamp: new Date().toISOString(),
    version: '1.0'
  };
}
```

## Code Examples

### Participant Counts Per Wave

```javascript
// Example: Count participants by study wave from date column
function computeParticipantCountsByWave(data, dateColumn, aggregationPeriod = 'month') {
  const waveCounts = new Map();
  
  data.forEach(row => {
    const dateValue = row[dateColumn];
    if (!dateValue) return;
    
    const date = parseFlexibleDate(dateValue);
    if (!date) return;
    
    let waveKey;
    const year = date.getUTCFullYear();
    const month = date.getUTCMonth() + 1;
    
    switch (aggregationPeriod) {
      case 'month':
        waveKey = `${year}-${month.toString().padStart(2, '0')}`;
        break;
      case 'quarter':
        const quarter = Math.floor((month - 1) / 3) + 1;
        waveKey = `Q${quarter} ${year}`;
        break;
      case 'year':
        waveKey = year.toString();
        break;
      default:
        waveKey = date.toISOString().slice(0, 10); // daily
    }
    
    waveCounts.set(waveKey, (waveCounts.get(waveKey) || 0) + 1);
  });
  
  const sortedWaves = Array.from(waveCounts.keys()).sort();
  return {
    labels: sortedWaves,
    counts: sortedWaves.map(wave => waveCounts.get(wave)),
    total: Array.from(waveCounts.values()).reduce((a, b) => a + b, 0)
  };
}

// Usage example for time series chart
function createParticipantWaveChart(data, dateColumn = 'participation_date') {
  const waveData = computeParticipantCountsByWave(data, dateColumn, 'month');
  
  return {
    type: 'timeseries',
    title: 'Participant Counts by Study Wave',
    x: dateColumn,
    y: null, // computed counts
    data: [{
      x: waveData.labels,
      y: waveData.counts,
      type: 'scatter',
      mode: 'lines+markers',
      name: 'Participants'
    }],
    layout: {
      xaxis: { title: 'Study Wave (Month)' },
      yaxis: { title: 'Number of Participants' }
    }
  };
}
```

### Grouping and Aggregation Utilities

```javascript
// Generic grouping function (already exists, enhanced version)
function groupAggregate(data, groupByCols, valueCols, aggType = 'mean') {
  const groups = new Map();
  
  data.forEach(row => {
    const key = groupByCols.map(col => String(row[col] || '(missing)')).join('¦');
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(row);
  });
  
  const results = [];
  for (const [key, rows] of groups.entries()) {
    const keyParts = key.split('¦');
    const result = {};
    
    // Add group identifiers
    groupByCols.forEach((col, i) => {
      result[col] = keyParts[i] === '(missing)' ? null : keyParts[i];
    });
    
    // Add aggregated values
    valueCols.forEach(col => {
      const values = rows.map(r => r[col]).filter(v => v != null && v !== '');
      const numericValues = coerceNumericArray(values);
      
      switch (aggType) {
        case 'count':
          result[`${col}_count`] = rows.length;
          break;
        case 'mean':
          result[`${col}_mean`] = numericValues.length > 0 
            ? numericValues.reduce((a, b) => a + b, 0) / numericValues.length 
            : null;
          break;
        case 'median':
          if (numericValues.length > 0) {
            const sorted = numericValues.sort((a, b) => a - b);
            const mid = Math.floor(sorted.length / 2);
            result[`${col}_median`] = sorted.length % 2 
              ? sorted[mid] 
              : (sorted[mid - 1] + sorted[mid]) / 2;
          } else {
            result[`${col}_median`] = null;
          }
          break;
        case 'sum':
          result[`${col}_sum`] = numericValues.reduce((a, b) => a + b, 0);
          break;
      }
    });
    
    result._n = rows.length; // Always include sample size
    results.push(result);
  }
  
  return results;
}
```

### Box Plot Statistics

```javascript
// Box plot computation (enhanced version of existing)
function computeBoxStats(values) {
  const numericValues = coerceNumericArray(values);
  if (numericValues.length === 0) return null;
  
  const sorted = numericValues.sort((a, b) => a - b);
  const n = sorted.length;
  
  const q1 = sorted[Math.floor(n * 0.25)];
  const median = sorted[Math.floor(n * 0.5)];
  const q3 = sorted[Math.floor(n * 0.75)];
  const iqr = q3 - q1;
  
  const lowerFence = q1 - 1.5 * iqr;
  const upperFence = q3 + 1.5 * iqr;
  
  const outliers = sorted.filter(v => v < lowerFence || v > upperFence);
  const inliers = sorted.filter(v => v >= lowerFence && v <= upperFence);
  
  return {
    min: Math.min(...inliers),
    q1: q1,
    median: median,
    q3: q3,
    max: Math.max(...inliers),
    outliers: outliers,
    n: n
  };
}
```

## Implementation Guidelines

### Edit Chart Modal Specification

The following changes should be implemented in the UI:

#### 1. Remove Color/Group Control
- **Delete HTML element**: Remove the `fldColor` select div and label (lines ~807-810 in index.html)
- **Remove JavaScript references**: Clean up all `id('fldColor')` references in:
  - Chart configuration building (line ~1225)
  - Modal population (line ~5114) 
  - Field updates and resets (line ~1356)
  - Drawing functions that use `cfg.color`

```javascript
// Current code to remove/modify:
color: id('fldColor')?.value || null,  // Remove this line

// In drawing functions, remove color-based grouping:
const colorField = cfg.color;  // Remove
const colorType = colorField ? getColumnType(colorField) : null;  // Remove
```

#### 2. Dynamic Chart Type Validation
Replace the static chart type dropdown with a dynamic one:

```javascript
function updateChartTypeOptions(xType, yType) {
  const typeSelect = id('fldType');
  const validTypes = getValidChartTypes(xType, yType);
  
  // Disable invalid options and add tooltips
  Array.from(typeSelect.options).forEach(option => {
    const isValid = validTypes.includes(option.value);
    option.disabled = !isValid;
    option.title = isValid ? '' : 
      `Not valid for ${xType || 'no X'} × ${yType || 'no Y'} combination`;
  });
}

// Call this when X or Y fields change
id('fldX')?.addEventListener('change', () => updateChartTypeOptions());
id('fldY')?.addEventListener('change', () => updateChartTypeOptions());
```

#### 3. Conditional Aggregation Options
Show aggregation controls only when relevant:

```javascript
function updateAggregationVisibility(chartType, yType) {
  const aggDiv = document.querySelector('[data-role="needsAgg"]');
  const showAgg = (yType === 'numeric' && ['bar', 'timeseries'].includes(chartType)) ||
                  (yType === null && chartType === 'bar');
  aggDiv.style.display = showAgg ? 'block' : 'none';
  
  // Update aggregation options based on context
  const aggSelect = id('fldAgg');
  if (yType === null) {
    // Only count makes sense for categorical/no Y
    aggSelect.innerHTML = '<option value="count">Count</option>';
  } else if (yType === 'numeric') {
    aggSelect.innerHTML = `
      <option value="count">Count</option>
      <option value="mean">Mean</option>
      <option value="median">Median</option>
      <option value="sum">Sum</option>
    `;
  }
}
```

#### 4. Sample Size Warnings
Add warning display in modal and on charts:

```javascript
function checkSampleSizes(cfg, data) {
  const warnings = [];
  
  if (!cfg.x) return warnings;
  
  const xType = getColumnType(cfg.x);
  if (xType === 'categorical') {
    const groups = new Map();
    data.forEach(row => {
      const key = String(row[cfg.x] || '(empty)');
      groups.set(key, (groups.get(key) || 0) + 1);
    });
    
    for (const [group, count] of groups.entries()) {
      if (count < 10) {
        warnings.push(`Small sample: ${group} (n=${count})`);
      }
    }
  } else if (data.length < 30) {
    warnings.push(`Small total sample: n=${data.length}`);
  }
  
  return warnings;
}

// Display warnings in modal
function showSampleWarnings(warnings) {
  const warningEl = id('sampleWarnings') || createWarningElement();
  if (warnings.length > 0) {
    warningEl.innerHTML = `
      <div class="alert alert-warning alert-sm">
        <strong>Sample size warnings:</strong><br>
        ${warnings.join('<br>')}
      </div>
    `;
    warningEl.style.display = 'block';
  } else {
    warningEl.style.display = 'none';
  }
}
```

#### 5. Enhanced Date Period Controls
For date variables, add intelligent period selection:

```javascript
function updateDatePeriodDefaults(dateField, data) {
  if (!dateField || getColumnType(dateField) !== 'date') return;
  
  // Calculate time span to suggest appropriate aggregation
  const dates = data.map(r => new Date(r[dateField]))
    .filter(d => !isNaN(d.getTime()));
  
  if (dates.length === 0) return;
  
  const minDate = new Date(Math.min(...dates));
  const maxDate = new Date(Math.max(...dates));
  const daysDiff = (maxDate - minDate) / (1000 * 60 * 60 * 24);
  
  const periodSelect = id('fldXPeriod');
  let recommendedPeriod;
  
  if (daysDiff < 30) recommendedPeriod = 'day';
  else if (daysDiff < 180) recommendedPeriod = 'week';
  else if (daysDiff < 730) recommendedPeriod = 'month';
  else if (daysDiff < 3650) recommendedPeriod = 'quarter';
  else recommendedPeriod = 'year';
  
  periodSelect.value = recommendedPeriod;
  
  // Add explanatory text
  const explanation = id('periodExplanation') || createPeriodExplanation();
  explanation.textContent = `Recommended based on ${Math.round(daysDiff)} day span`;
}
```

### Required HTML Changes

Add warning display element to the modal:

```html
<!-- Add this after the transformation summary section -->
<div id="sampleWarnings" style="display: none;"></div>

<!-- Add period explanation for date fields -->
<div id="periodExplanation" class="form-text" style="display: none;"></div>
```

### CSS Updates for Disabled Chart Types

```css
/* Add to theme.css or inline styles */
select option:disabled {
  color: #999;
  background-color: #f5f5f5;
  font-style: italic;
}

.alert-sm {
  padding: 0.375rem 0.75rem;
  margin-bottom: 0.5rem;
  font-size: 0.875rem;
}

.form-text {
  margin-top: 0.25rem;
  font-size: 0.875em;
  color: #6c757d;
}
```

### Required Utility Functions

The following utility functions should be added to support the guidelines:

```javascript
// Recommended additions to index.html
function getValidChartTypes(xType, yType) {
  const matrix = {
    'categorical_numeric': ['bar', 'box'],
    'numeric_numeric': ['scatter', 'line'],
    'date_numeric': ['timeseries', 'bar'],
    'categorical_categorical': ['heatmap'],
    'categorical_null': ['bar'],
    'numeric_null': ['histogram'],
    'date_null': ['timeseries', 'bar']
  };
  
  const key = `${xType || 'null'}_${yType || 'null'}`;
  return matrix[key] || [];
}

function validateChartConfig(cfg) {
  const xType = cfg.x ? getColumnType(cfg.x) : null;
  const yType = cfg.y ? getColumnType(cfg.y) : null;
  const validTypes = getValidChartTypes(xType, yType);
  
  if (!validTypes.includes(cfg.type)) {
    return {
      valid: false,
      message: `${cfg.type} is not valid for ${xType} × ${yType} variables`
    };
  }
  
  return { valid: true };
}

function getRecommendedAggregation(xType, yType, sampleSize) {
  if (!yType || yType !== 'numeric') return 'count';
  if (sampleSize < 30) return 'median'; // More robust for small samples
  return 'mean';
}
```

## Migration Notes

When implementing these guidelines:

1. **Preserve existing charts**: All existing chart configurations should continue to work
2. **Gradual enforcement**: Implement validation warnings before hard restrictions  
3. **User education**: Show tooltips explaining why certain combinations are invalid
4. **Fallback behavior**: When invalid combinations are detected, suggest valid alternatives

This specification ensures that the MUSPAD dashboard produces reliable, reproducible visualizations while maintaining statistical integrity across all variable type combinations.