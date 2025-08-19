from __future__ import annotations
import os
from pathlib import Path
import json
import pandas as pd
import plotly.express as px

DATASET_TAG = "X20_21"  # Fixed per request

def _ensure_out_dir(out_dir: str | os.PathLike) -> Path:
    out_path = Path(out_dir)
    out_path.mkdir(parents=True, exist_ok=True)
    return out_path

def _normalize_serostatus(series: pd.Series) -> pd.Series:
    """
    Map raw serostatus values into exactly two labels:
    - 'seropositive'
    - 'seronegative'
    Drop anything unmapped or NaN.
    """
    def norm(v):
        if pd.isna(v):
            return None
        s = str(v).strip().lower()
        if s in {"1", "true", "t", "yes", "y", "seropositive", "positive", "pos", "+", "reactive"}:
            return "seropositive"
        if s in {"0", "false", "f", "no", "n", "seronegative", "negative", "neg", "-", "non-reactive", "nonreactive"}:
            return "seronegative"
        if s in {"seropositive", "seronegative"}:
            return s
        return None

    mapped = series.map(norm).dropna()
    cat = pd.Categorical(mapped, categories=["seronegative", "seropositive"], ordered=True)
    return pd.Series(cat, index=mapped.index)

def _compute_seroprevalence_fig(df3: pd.DataFrame):
    px.defaults.width = 800
    px.defaults.height = 500

    # Use value_counts(normalize=True) on the raw column directly, then reorder
    sero_counts = df3["X20_21_serostatus"].value_counts(normalize=True) * 100
    
    # Create dataframe with proper ordering: seronegative first, then seropositive
    sero_df = pd.DataFrame({
        "serostatus": ["seronegative", "seropositive"],
        "percent": [sero_counts.get("seronegative", 0), sero_counts.get("seropositive", 0)]
    })

    base_title = "COVID-19 Seroprevalence (%)"
    title = f"{base_title} ({DATASET_TAG})"

    # Add color mapping for per-bar colors
    color_map = {"seronegative": "#636EFA", "seropositive": "#EF553B"}

    fig_sero = px.bar(
        sero_df, x="serostatus", y="percent",
        title=title,
        labels={"serostatus": "Serostatus", "percent": "Percent of Participants"},
        text="percent",
        color="serostatus",
        color_discrete_map=color_map,
    )
    fig_sero.update_traces(texttemplate="%{text:.1f}%", textposition="outside",
                           hovertemplate=" %{x}<br>%{y:.1f}%<extra></extra>")
    fig_sero.update_layout(yaxis_range=[0, 100], margin=dict(t=50, b=50, l=50, r=50))
    return fig_sero

def _compute_vaccination_fig(df3: pd.DataFrame):
    px.defaults.width = 800
    px.defaults.height = 500

    first_numeric = pd.to_numeric(df3["X20_21_kurzfragen_cov19_vaccination_first_yn"], errors="coerce")
    second_numeric = pd.to_numeric(df3["X20_21_kurzfragen_cov19_vaccination_second_yn"], errors="coerce")

    n1_valid = first_numeric.notna().sum()
    n1_yes = (first_numeric == 1).sum()
    first_rate = (n1_yes / n1_valid * 100.0) if n1_valid > 0 else 0.0

    n2_valid = second_numeric.notna().sum()
    n2_yes = (second_numeric == 1).sum()
    second_rate = (n2_yes / n2_valid * 100.0) if n2_valid > 0 else 0.0

    vac_df = pd.DataFrame({"dose": ["First Dose", "Second Dose"], "percent": [first_rate, second_rate]})

    base_title = "COVID-19 Vaccination Coverage (%)"
    title = f"{base_title} ({DATASET_TAG})"

    # Add color mapping for per-bar colors
    color_map = {"First Dose": "#636EFA", "Second Dose": "#EF553B"}

    fig_vac = px.bar(
        vac_df, x="dose", y="percent",
        title=title,
        labels={"dose": "Dose", "percent": "Percent of Participants"},
        text="percent",
        color="dose",
        color_discrete_map=color_map,
    )
    fig_vac.update_traces(texttemplate="%{text:.1f}%", textposition="outside",
                          hovertemplate=" %{x}<br>%{y:.1f}%<extra></extra>")
    fig_vac.update_layout(yaxis_range=[0, 100], margin=dict(t=50, b=50, l=50, r=50))
    return fig_vac, {
        "n1_yes": int(n1_yes), "n1_valid": int(n1_valid),
        "n2_yes": int(n2_yes), "n2_valid": int(n2_valid),
        "first_rate": float(first_rate), "second_rate": float(second_rate),
    }

def export_figures(df3: pd.DataFrame, out_dir: str = "docs/assets/plots") -> dict:
    out_path = _ensure_out_dir(out_dir)

    fig_sero = _compute_seroprevalence_fig(df3)
    fig_vac, stats = _compute_vaccination_fig(df3)

    sero_path = out_path / "serology_seroprevalence.json"
    vac_path = out_path / "vaccination_coverage.json"
    manifest_path = out_path / "plotly_manifest.json"

    sero_path.write_text(fig_sero.to_json(), encoding="utf-8")
    vac_path.write_text(fig_vac.to_json(), encoding="utf-8")

    manifest = {
        "version": 1,
        "basePath": "assets/plots/",
        "charts": [
            { "id": "sero-prevalence", "title": fig_sero.layout.title.text or f"COVID-19 Seroprevalence (%) ({DATASET_TAG})", "file": "serology_seroprevalence.json", "width": 800, "height": 500 },
            { "id": "vaccination-coverage", "title": fig_vac.layout.title.text or f"COVID-19 Vaccination Coverage (%) ({DATASET_TAG})", "file": "vaccination_coverage.json", "width": 800, "height": 500 }
        ]
    }
    manifest_path.write_text(json.dumps(manifest, indent=2), encoding="utf-8")

    return {
        "serology_seroprevalence": str(sero_path),
        "vaccination_coverage": str(vac_path),
        "manifest": str(manifest_path),
        "dataset_tag": DATASET_TAG,
        "stats": stats,
    }

if __name__ == "__main__":
    import sys
    if len(sys.argv) > 1:
        csv_path = sys.argv[1]
        df3 = pd.read_csv(csv_path)
        out = export_figures(df3)
        print(json.dumps(out, indent=2))
    else:
        print("Provide a CSV path for df3 or import and call export_figures(df3) from a notebook.")