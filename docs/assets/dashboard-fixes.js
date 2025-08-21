/**
 * MUSPAD Dashboard Fixes - Non-invasive monkey-patch overrides
 * Addresses chart logic and integration gaps without refactoring the main codebase
 */

(function() {
  'use strict';

  // Utility functions first
  function isFiniteNumber(v) {
    return typeof v === 'number' && isFinite(v);
  }

  // ---- Fix 6: Unified date validity windows (2015–2100) ----
  const _orig_parseValidDate = window.parseValidDate;
  window.parseValidDate = function(val) {
    if (!val) return null;
    const d = new Date(val);
    if (isNaN(d)) return null;
    const y = d.getUTCFullYear();
    return (y >= 2015 && y <= 2100) ? d : null;
  };

  const _orig_isDateCol = window.isDateCol;
  window.isDateCol = function(col) {
    if (col === window.dateCol) return true;
    const nameHint = /(date|time|_dt|_time|timestamp)/i;
    if (!nameHint.test(col)) return false;
    const vals = (window.sampleValues?.(col, 100) || []).slice(0, 30);
    let parsed = 0;
    for (const v of vals) {
      if (window.parseValidDate(v)) parsed++;
    }
    return vals.length ? (parsed / vals.length >= 0.7) : false;
  };

  const _orig_scoreDateColumn = window.scoreDateColumn;
  window.scoreDateColumn = function(col) {
    const vals = window.sampleValues?.(col, 300) || [];
    let parsed = 0, withinRange = 0;
    for (const v of vals) {
      const d = window.parseValidDate(v);
      if (d) {
        parsed++;
        withinRange++; // parseValidDate already enforces 2015-2100 range
      }
    }
    const rate = vals.length ? parsed / vals.length : 0;
    const rangeRate = vals.length ? withinRange / vals.length : 0;
    const valid = rate >= 0.7 && rangeRate >= 0.7;
    const confidence = (rate + rangeRate) / 2 + (/(date|time|timestamp)/i.test(col) ? 0.1 : 0);
    return { valid, confidence };
  };

  // ---- Fix 5: ISO week (Monday start) for weekly bins ----
  const _orig_binDates = window.binDates;
  window.binDates = function(values, period = 'month') {
    const groups = new Map();
    values.forEach(v => {
      const d = window.parseValidDate(v);
      if (!d) return;
      let key;
      const year = d.getUTCFullYear();
      const month = String(d.getUTCMonth() + 1).padStart(2, '0');
      switch (period) {
        case 'day': key = d.toISOString().slice(0, 10); break;
        case 'week': {
          // ISO week: Monday start
          const day = d.getUTCDay();
          const mondayOffset = (day === 0 ? -6 : 1 - day);
          const monday = new Date(d);
          monday.setUTCDate(d.getUTCDate() + mondayOffset);
          key = monday.toISOString().slice(0, 10);
          break;
        }
        case 'month': key = `${year}-${month}`; break;
        case 'quarter': {
          const q = Math.floor(d.getUTCMonth() / 3) + 1;
          key = `Q${q} ${year}`;
          break;
        }
        case 'year': key = String(year); break;
        default: key = `${year}-${month}`;
      }
      groups.set(key, (groups.get(key) || 0) + 1);
    });
    const labels = Array.from(groups.keys()).sort();
    const counts = labels.map(l => groups.get(l));
    return { labels, counts };
  };

  // ---- Fix 7: Dynamic step for numeric filters ----
  const _orig_gf_showField = window.gf_showField;
  window.gf_showField = function(field, state) {
    if (typeof _orig_gf_showField === 'function') _orig_gf_showField(field, state);
    
    // Apply dynamic step for numeric fields
    const col = window.getColumnType?.(field);
    if (col === 'numeric' && state && typeof state === 'object') {
      const range = state.max - state.min;
      const step = computeNiceStep(range, state.min, state.max);
      
      // Update slider steps
      const sMin = document.querySelector(`#gf-${field}-min-slider`);
      const sMax = document.querySelector(`#gf-${field}-max-slider`);
      if (sMin) sMin.step = step;
      if (sMax) sMax.step = step;
      
      // Update input steps  
      const minEl = document.querySelector(`#gf-${field}-min`);
      const maxEl = document.querySelector(`#gf-${field}-max`);
      if (minEl) minEl.step = step;
      if (maxEl) maxEl.step = step;
    }
  };

  // ---- Fix 9: Hide Plot Viewer if not loaded ----
  const _orig_show = window.show;
  window.show = function(id, visible) {
    if (typeof _orig_show === 'function') _orig_show(id, visible);
    if (id === 'panelPlotViewer' && visible && typeof window.PlotViewer === 'undefined') {
      // Plot Viewer not loaded, keep it hidden
      const el = document.getElementById(id);
      if (el) el.style.display = 'none';
    }
  };

  // Helper functions for chart fixes
  function getPeriodKey(dateVal, period) {
    const d = window.parseValidDate(dateVal);
    if (!d) return null;
    const year = d.getUTCFullYear();
    const month = String(d.getUTCMonth() + 1).padStart(2, '0');
    switch (period) {
      case 'day': return d.toISOString().slice(0, 10);
      case 'week': {
        const day = d.getUTCDay();
        const mondayOffset = (day === 0 ? -6 : 1 - day);
        const monday = new Date(d);
        monday.setUTCDate(d.getUTCDate() + mondayOffset);
        return monday.toISOString().slice(0, 10);
      }
      case 'month': return `${year}-${month}`;
      case 'quarter': {
        const q = Math.floor((d.getUTCMonth()) / 3) + 1;
        return `Q${q} ${year}`;
      }
      case 'year': return String(year);
      default: return `${year}-${month}`;
    }
  }

  function sortPeriodLabels(period, labels) {
    if (!Array.isArray(labels)) return [];
    if (period === 'quarter') {
      return labels.slice().sort((a,b)=>{
        const [qa, ya] = a.split(' ');
        const [qb, yb] = b.split(' ');
        const ia = parseInt(qa.replace('Q',''),10);
        const ib = parseInt(qb.replace('Q',''),10);
        if (ya !== yb) return parseInt(ya,10) - parseInt(yb,10);
        return ia - ib;
      });
    }
    // ISO weeks (YYYY-MM-DD of Monday), dates, months, years will sort lexicographically
    return labels.slice().sort((a,b)=> String(a).localeCompare(String(b)));
  }

  function aggRows(cfg, rows) {
    if (!rows || !rows.length) return 0;
    if (cfg.agg === 'count' || !cfg.y) return rows.length;
    const vs = rows.map(r => Number(r[cfg.y])).filter(isFiniteNumber);
    if (!vs.length) return 0;
    if (cfg.agg === 'sum') return vs.reduce((a,b)=>a+b,0);
    // mean
    return vs.reduce((a,b)=>a+b,0)/vs.length;
  }

  function computeNiceStep(range, minVal, maxVal) {
    if (!isFinite(range) || range <= 0) return 1;
    
    // Check if values are integers
    const sampleVals = [minVal, maxVal, (minVal + maxVal) / 2];
    const allIntegers = sampleVals.every(v => Number.isInteger(v));
    
    if (allIntegers && range <= 100) return 1;
    
    // Compute step as power of 10
    const magnitude = Math.floor(Math.log10(range));
    const normalized = range / Math.pow(10, magnitude);
    
    let baseStep;
    if (normalized <= 2) baseStep = 0.1;
    else if (normalized <= 5) baseStep = 0.2;
    else baseStep = 0.5;
    
    return baseStep * Math.pow(10, magnitude);
  }

  // ---- Fix 2: Enhanced drawHistogram with color support ----
  const _orig_drawHistogram = window.drawHistogram;
  window.drawHistogram = function(cfg, data, fig) {
    const xField = cfg.x;
    if (!xField) return;
    const xType = window.getColumnType?.(xField);
    const colorField = cfg.color;
    const colorType = colorField ? window.getColumnType?.(colorField) : null;

    if (colorField && colorType === 'categorical') {
      if (xType === 'numeric') {
        // Numeric X: overlay histograms per category
        const xs = data.map(r => r[xField]).filter(isFiniteNumber);
        if (!xs.length) return;
        const bn = (window.binNumeric ? window.binNumeric(xs, cfg.xBins || 30) : null);
        if (!bn) return;
        
        const cats = Array.from(new Set(data.map(r => String(r[colorField] ?? '(empty)'))));
        for (const cat of cats) {
          const catRows = data.filter(r => String(r[colorField] ?? '(empty)') === cat);
          const catXs = catRows.map(r => r[xField]).filter(isFiniteNumber);
          const counts = bn.bins.map((center, i) => {
            const min = center - bn.binWidth/2;
            const max = center + bn.binWidth/2;
            return catXs.filter(v => i === bn.bins.length-1 ? v >= min && v <= max : v >= min && v < max).length;
          });
          fig.data.push({ x: bn.bins, y: counts, type: 'bar', name: cat });
        }
        fig.layout.barmode = 'overlay';
        fig.layout.xaxis = Object.assign({ title: `${xField} (${cfg.xBins || 30} bins)` }, fig.layout.xaxis || {});
        fig.layout.yaxis = Object.assign({ title: 'Count' }, fig.layout.yaxis || {});
        return;
      } else if (xType === 'date') {
        // Date X: grouped bars per category  
        const period = cfg.xPeriod || 'month';
        const labels = sortPeriodLabels(period, Array.from(new Set(
          data.map(r => getPeriodKey(r[xField], period)).filter(Boolean)
        )));
        const cats = Array.from(new Set(data.map(r => String(r[colorField] ?? '(empty)'))));
        for (const cat of cats) {
          const rows = data.filter(r => String(r[colorField] ?? '(empty)') === cat);
          const counts = labels.map(l => rows.reduce((acc,r)=> acc + (getPeriodKey(r[xField], period) === l ? 1 : 0), 0));
          fig.data.push({ x: labels, y: counts, type: 'bar', name: cat });
        }
        fig.layout.barmode = 'group';
        fig.layout.xaxis = Object.assign({ title: `${xField} (${period})` }, fig.layout.xaxis || {});
        fig.layout.yaxis = Object.assign({ title: 'Count' }, fig.layout.yaxis || {});
        return;
      }
    }

    // Categorical
    const labels = Array.from(new Set(data.map(r => String(r[xField] ?? '(empty)')))).sort();
    const cats = Array.from(new Set(data.map(r => String(r[colorField] ?? '(empty)'))));
    for (const cat of cats) {
      const rows = data.filter(r => String(r[colorField] ?? '(empty)') === cat);
      const counts = labels.map(l => rows.reduce((acc,r)=> acc + (String(r[xField] ?? '(empty)') === l ? 1 : 0), 0));
      fig.data.push({ x: labels, y: counts, type: 'bar', name: cat });
    }
    fig.layout.barmode = 'group';
    fig.layout.xaxis = Object.assign({ title: xField }, fig.layout.xaxis || {});
    fig.layout.yaxis = Object.assign({ title: 'Count' }, fig.layout.yaxis || {});
  };

  // ---- Override drawBar: fix single-series bin aggregation ----
  const _orig_drawBar = window.drawBar;
  window.drawBar = function(cfg, data, fig) {
    const xField = cfg.x;
    if (!xField) return;
    const xType = window.getColumnType?.(xField);
    const colorField = cfg.color;
    const colorType = colorField ? window.getColumnType?.(colorField) : null;

    if (xType === 'numeric' || xType === 'date') {
      // Colored path in original code is fine; we fix the single-series path
      let handledColored = false;
      if (colorField && colorType === 'categorical') {
        // Delegate to original for colored case (it already aggregates per bin)
        if (typeof _orig_drawBar === 'function') return _orig_drawBar(cfg, data, fig);
        handledColored = true;
      }
      if (!handledColored) {
        if (xType === 'numeric') {
          const xs = data.map(r => r[xField]).filter(isFiniteNumber);
          const bn = (window.binNumeric ? window.binNumeric(xs, cfg.xBins || 30) : null);
          if (!bn) return;
          const y = bn.bins.map((center, i) => {
            const min = center - bn.binWidth/2;
            const max = center + bn.binWidth/2;
            const rows = data.filter(r => {
              const v = r[xField];
              return isFiniteNumber(v) && v >= min && (i === bn.bins.length-1 ? v <= max : v < max);
            });
            return aggRows(cfg, rows);
          });
          fig.data.push({
            x: bn.bins,
            y,
            type: 'bar',
            name: cfg.y ? `${cfg.agg}(${cfg.y})` : 'Count'
          });
          fig.layout.xaxis = Object.assign({ title: `${xField} (${cfg.xBins || 30} bins)` }, fig.layout.xaxis || {});
          fig.layout.yaxis = Object.assign({ title: cfg.y ? `${cfg.agg}(${cfg.y})` : 'Count' }, fig.layout.yaxis || {});
          return;
        } else {
          // date path with period grouping
          const period = cfg.xPeriod || 'month';
          const labels = sortPeriodLabels(period, Array.from(new Set(
            data.map(r => getPeriodKey(r[xField], period)).filter(Boolean)
          )));
          const y = labels.map(l => {
            const rows = data.filter(r => getPeriodKey(r[xField], period) === l);
            return aggRows(cfg, rows);
          });
          fig.data.push({
            x: labels,
            y,
            type: 'bar',
            name: cfg.y ? `${cfg.agg}(${cfg.y})` : 'Count'
          });
          fig.layout.xaxis = Object.assign({ title: `${xField} (${period})` }, fig.layout.xaxis || {});
          fig.layout.yaxis = Object.assign({ title: cfg.y ? `${cfg.agg}(${cfg.y})` : 'Count' }, fig.layout.yaxis || {});
          return;
        }
      }
    }

    // All other cases -> original
    if (typeof _orig_drawBar === 'function') return _orig_drawBar(cfg, data, fig);
  };

  // ---- Override drawScatter: set tick labels when encoding ----
  const _orig_drawScatter = window.drawScatter;
  window.drawScatter = function(cfg, data, fig) {
    if (typeof _orig_drawScatter === 'function') _orig_drawScatter(cfg, data, fig);

    try {
      const xField = cfg.x, yField = cfg.y;
      if (!xField || !yField) return;
      const xType = window.getColumnType?.(xField);
      const yType = window.getColumnType?.(yField);

      if (xType === 'categorical' && cfg.encodeCategorical) {
        const xVals = data.map(r => r[xField]);
        const enc = window.encodeCategorical?.(xVals);
        if (enc && enc.ticks) {
          fig.layout.xaxis = Object.assign({}, fig.layout.xaxis, {
            tickvals: enc.ticks.map(t=>t.value),
            ticktext: enc.ticks.map(t=>t.label)
          });
        }
      }
      if (yType === 'categorical' && cfg.encodeCategorical) {
        const yVals = data.map(r => r[yField]);
        const enc = window.encodeCategorical?.(yVals);
        if (enc && enc.ticks) {
          fig.layout.yaxis = Object.assign({}, fig.layout.yaxis, {
            tickvals: enc.ticks.map(t=>t.value),
            ticktext: enc.ticks.map(t=>t.label)
          });
        }
      }
    } catch {}
  };

  // ---- Override drawLine: add period grouping + clearer overlay axes ----
  const _orig_drawLine = window.drawLine;
  window.drawLine = function(cfg, data, fig) {
    const xField = cfg.x;
    if (!xField) return;
    const xType = window.getColumnType?.(xField);
    const colorField = cfg.color;
    const colorType = colorField ? window.getColumnType?.(colorField) : null;

    // Handle date period grouping if requested
    if (xType === 'date') {
      const period = cfg.xPeriod || null;
      if (period) {
        if (colorField && colorType === 'categorical') {
          const labels = sortPeriodLabels(period, Array.from(new Set(
            data.map(r => getPeriodKey(r[xField], period)).filter(Boolean)
          )));
          const cats = Array.from(new Set(data.map(r => String(r[colorField] ?? '(empty)'))));
          for (const cat of cats) {
            const rows = data.filter(r => String(r[colorField] ?? '(empty)') === cat);
            const y = labels.map(l => aggRows(cfg, rows.filter(r => getPeriodKey(r[xField], period) === l)));
            fig.data.push({ x: labels, y, type: 'scatter', mode: 'lines+markers', name: cat });
          }
        } else {
          const labels = sortPeriodLabels(period, Array.from(new Set(
            data.map(r => getPeriodKey(r[xField], period)).filter(Boolean)
          )));
          const y = labels.map(l => aggRows(cfg, data.filter(r => getPeriodKey(r[xField], period) === l)));
          fig.data.push({ x: labels, y, type: 'scatter', mode: 'lines+markers', name: cfg.y || 'count' });
        }
        fig.layout.xaxis = Object.assign({ title: `${xField} (${period})` }, fig.layout.xaxis || {});
        fig.layout.yaxis = Object.assign({ title: cfg.y ? `${cfg.agg}(${cfg.y})` : 'Count' }, fig.layout.yaxis || {});
      } else {
        // No period selected -> fall back to original
        if (typeof _orig_drawLine === 'function') return _orig_drawLine(cfg, data, fig);
      }
    } else {
      // Non-date X -> original behavior
      if (typeof _orig_drawLine === 'function') return _orig_drawLine(cfg, data, fig);
    }

    // If histogram overlay requested, add explicit axis titles
    if (cfg.histOverlay) {
      fig.layout.grid = { rows: 1, columns: 2, pattern: 'independent' };
      fig.layout.xaxis2 = Object.assign({ title: cfg.y || 'Value' }, fig.layout.xaxis2 || {});
      fig.layout.yaxis2 = Object.assign({ title: 'Count' }, fig.layout.yaxis2 || {});
    }
  };

  // ---- Override drawBox: clearer overlay axes ----
  const _orig_drawBox = window.drawBox;
  window.drawBox = function(cfg, data, fig) {
    if (typeof _orig_drawBox === 'function') _orig_drawBox(cfg, data, fig);
    if (cfg && cfg.histOverlay) {
      fig.layout.grid = { rows: 1, columns: 2, pattern: 'independent' };
      fig.layout.xaxis2 = Object.assign({ title: cfg.y || 'Value' }, fig.layout.xaxis2 || {});
      fig.layout.yaxis2 = Object.assign({ title: 'Count' }, fig.layout.yaxis2 || {});
    }
  };

})();