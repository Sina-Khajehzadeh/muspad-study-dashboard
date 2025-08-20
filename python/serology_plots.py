from __future__ import annotations

import json
import re
from dataclasses import dataclass
from functools import lru_cache
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple


@dataclass(frozen=True)
class PlotEntry:
    key: str
    filename: str  # base name only, files are expected under docs/plots
    fallback_title: str


# Catalog of the 10 plots (filenames must exactly match)
PLOT_ENTRIES: List[PlotEntry] = [
    PlotEntry("third_seroperevalence", "Third Seroperevalence.html", "Third Seroperevalence"),
    PlotEntry("another_histogram_for_participation", "Another Histogram for Participation.html", "Another Histogram for Participation"),
    PlotEntry("interval_days", "Interval days.html", "Interval days"),
    PlotEntry("npi", "NPI.html", "NPI"),
    PlotEntry("number_of_participation", "number of participation.html", "number of participation"),
    PlotEntry("mask_shop_usage", "mask shop usage.html", "mask shop usage"),
    PlotEntry("partixipation", "Partixipation.html", "Partixipation"),
    PlotEntry("prevalence", "Prevalence.html", "Prevalence"),
    PlotEntry("box_plot_health_status", "Box Plot Health Status.html", "Box Plot Health Status"),
    PlotEntry("distribution_level", "distribution_level.html", "Income Distribution (distribution_level)"),
]


def _repo_root() -> Path:
    # Assume this file lives under a subdir (e.g., python/); repo root is a parent dir
    here = Path(__file__).resolve()
    for p in [here.parent, *here.parents]:
        if (p / ".git").exists():
            return p
    # Fallback to two levels up
    return here.parents[1]


def _plots_dir() -> Path:
    return _repo_root() / "docs" / "plots"


def _find_plot_file(filename: str) -> Path:
    # First preference: docs/plots
    primary = _plots_dir() / filename
    if primary.exists():
        return primary

    root = _repo_root()
    # Quick checks in common locations
    candidates = [
        root / filename,
        root / "web" / filename,
        root / "public" / filename,
        root / "docs" / filename,
        root / "static" / filename,
        root / "site" / filename,
        Path(__file__).resolve().parent / filename,
    ]
    for c in candidates:
        if c.exists():
            return c

    # Last resort: search by name (could be slow in very large repos)
    matches = list(root.rglob(filename))
    if matches:
        return matches[0]

    raise FileNotFoundError(f"Could not find plot HTML file: {filename} (searched docs/plots and repo root)")


def _extract_balanced(s: str, open_char: str, close_char: str, start_index: int) -> Tuple[str, int]:
    """Extract a balanced bracketed/brace/paren substring starting at open_char index (inclusive).
    Returns (substring, end_position_after_closing_char)."""
    if s[start_index] != open_char:
        raise ValueError("start_index does not point to the expected opening character")
    depth = 0
    i = start_index
    in_string = False
    string_quote = ""
    escape = False
    while i < len(s):
        ch = s[i]

        if in_string:
            if escape:
                escape = False
            elif ch == "\\":
                escape = True
            elif ch == string_quote:
                in_string = False
            i += 1
            continue

        if ch in ("'", '"'):
            in_string = True
            string_quote = ch
        elif ch == open_char:
            depth += 1
        elif ch == close_char:
            depth -= 1
            if depth == 0:
                return s[start_index : i + 1], i + 1
        i += 1
    raise ValueError("Unbalanced brackets while parsing")


def _extract_plotly_call_args(script_text: str) -> Tuple[str, str, str, Optional[str]]:
    """
    Locate Plotly.newPlot( <div_or_id>, <data>, <layout>[, <config>] ) in the given script text
    and return (div_arg, data_json, layout_json, config_json_or_None) as strings.
    """
    m = re.search(r"Plotly\.newPlot\s*\(", script_text)
    if not m:
        raise ValueError("No Plotly.newPlot(...) call found")

    idx = m.end()  # position after '('
    # Extract first arg up to the first comma that's not inside a string/paren
    first_comma = script_text.find(",", idx)
    if first_comma == -1:
        raise ValueError("Malformed Plotly.newPlot call (no comma after first argument)")
    div_arg = script_text[idx:first_comma].strip()

    # Extract data array
    data_start = script_text.find("[", first_comma + 1)
    if data_start == -1:
        raise ValueError("Could not locate data array '[' after first argument")
    data_str, after_data = _extract_balanced(script_text, "[", "]", data_start)

    # Extract layout object
    layout_start = script_text.find("{", after_data)
    if layout_start == -1:
        raise ValueError("Could not locate layout object '{' after data")
    layout_str, after_layout = _extract_balanced(script_text, "{", "}", layout_start)

    # Optional config object before the closing ')'
    paren_open = script_text.find("(", m.end() - 1)
    call_paren, call_end = _extract_balanced(script_text, "(", ")", paren_open)
    # Search for a '{' between after_layout and call_end
    config_json = None
    brace_pos = script_text.find("{", after_layout)
    if brace_pos != -1 and brace_pos < call_end:
        config_str, _ = _extract_balanced(script_text, "{", "}", brace_pos)
        config_json = config_str

    return div_arg, data_str, layout_str, config_json


def _parse_json_like(text: str) -> Any:
    """
    Parse a JSON-like string (as emitted in saved Plotly HTML).
    Assumes it's valid JSON. Raises json.JSONDecodeError on failure.
    """
    return json.loads(text)


@lru_cache(maxsize=64)
def load_plot_json_from_html(path: Path) -> Dict[str, Any]:
    """
    Return a dict with keys: data (list), layout (dict), and optional config (dict)
    by parsing the Plotly.newPlot(...) call inside the HTML file.
    """
    html = path.read_text(encoding="utf-8", errors="replace")
    if "Plotly.newPlot" not in html:
        raise ValueError(f"No Plotly.newPlot call found in {path}")
    _, data_str, layout_str, config_str = _extract_plotly_call_args(html)
    data = _parse_json_like(data_str)
    layout = _parse_json_like(layout_str)
    result: Dict[str, Any] = {"data": data, "layout": layout}
    if config_str:
        try:
            config = _parse_json_like(config_str)
            if isinstance(config, dict):
                result["config"] = config
        except json.JSONDecodeError:
            pass
    return result


def list_plots() -> List[Dict[str, str]]:
    """
    Returns a list of available plot options:
    [{key, title, filename}, ...]
    """
    items: List[Dict[str, str]] = []
    for e in PLOT_ENTRIES:
        try:
            plot_path = _find_plot_file(e.filename)
            fig_json = load_plot_json_from_html(plot_path)
            # Use layout.title.text if present; otherwise fallback
            title = e.fallback_title
            layout = fig_json.get("layout", {})
            layout_title = layout.get("title")
            if isinstance(layout_title, dict):
                title = layout_title.get("text", title) or title
            elif isinstance(layout_title, str) and layout_title.strip():
                title = layout_title.strip()
            items.append({"key": e.key, "title": title, "filename": str(plot_path.relative_to(_repo_root()))})
        except Exception:
            items.append({"key": e.key, "title": e.fallback_title, "filename": f"docs/plots/{e.filename}"})
    return items


def get_figure_json(key: str) -> Dict[str, Any]:
    """
    Returns a JSON-compatible dict for the requested plot key:
    {"data": [...], "layout": {...}, "config": {...?}}
    Raises KeyError if the key is unknown, FileNotFoundError/ValueError if the HTML is missing or malformed.
    """
    entry = next((e for e in PLOT_ENTRIES if e.key == key), None)
    if not entry:
        raise KeyError(f"Unknown plot key: {key}")
    path = _find_plot_file(entry.filename)
    return load_plot_json_from_html(path)


def get_all_figures_json() -> Dict[str, Dict[str, Any]]:
    """
    Returns a mapping {key: figure_json} for all plots.
    """
    out: Dict[str, Dict[str, Any]] = {}
    for e in PLOT_ENTRIES:
        try:
            out[e.key] = get_figure_json(e.key)
        except Exception as ex:
            out[e.key] = {"error": str(ex), "filename": f"docs/plots/{e.filename}"}
    return out


if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser(description="Aggregate Plotly figures from saved HTML files.")
    parser.add_argument("--list", action="store_true", help="List available plots")
    parser.add_argument("--key", type=str, help="Print JSON for a single plot key")
    parser.add_argument("--all", action="store_true", help="Print JSON for all plots")
    args = parser.parse_args()

    if args.list:
        print(json.dumps(list_plots(), indent=2, ensure_ascii=False))
    elif args.key:
        print(json.dumps(get_figure_json(args.key), indent=2, ensure_ascii=False))
    elif args.all:
        print(json.dumps(get_all_figures_json(), indent=2, ensure_ascii=False))
    else:
        parser.print_help()