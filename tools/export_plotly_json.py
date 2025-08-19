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

    # Create bar chart without color parameter to get single trace
    fig_sero = px.bar(
        sero_df, x="serostatus", y="percent",
        title=title,
        labels={"serostatus": "Serostatus", "percent": "Percent of Participants"},
        text="percent",
    )
    
    # Manually set colors after creation
    colors = ["#636EFA", "#EF553B"]  # seronegative, seropositive
    fig_sero.update_traces(
        texttemplate="%{text:.1f}%", 
        textposition="outside",
        hovertemplate=" %{x}<br>%{y:.1f}%<extra></extra>",
        marker_color=colors
    )
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

    # Create bar chart without color parameter to get single trace
    fig_vac = px.bar(
        vac_df, x="dose", y="percent",
        title=title,
        labels={"dose": "Dose", "percent": "Percent of Participants"},
        text="percent",
    )
    
    # Manually set colors after creation
    colors = ["#636EFA", "#EF553B"]  # First Dose, Second Dose
    fig_vac.update_traces(
        texttemplate="%{text:.1f}%", 
        textposition="outside",
        hovertemplate=" %{x}<br>%{y:.1f}%<extra></extra>",
        marker_color=colors
    )
    fig_vac.update_layout(yaxis_range=[0, 100], margin=dict(t=50, b=50, l=50, r=50))
    return fig_vac, {
        "n1_yes": int(n1_yes), "n1_valid": int(n1_valid),
        "n2_yes": int(n2_yes), "n2_valid": int(n2_valid),
        "first_rate": float(first_rate), "second_rate": float(second_rate),
    }

def _compute_vaccine_brand_mix_fig(df3: pd.DataFrame):
    px.defaults.width = 800
    px.defaults.height = 600

    # Use value_counts(normalize=True) to compute brand proportions
    brand_counts = df3['X20_21_kurzfragen_cov19_vaccination_first_type'].value_counts(normalize=True)
    
    # Build a DataFrame with columns: brand, proportion, percent
    brand_df = pd.DataFrame({
        'brand': brand_counts.index,
        'proportion': brand_counts.values,
        'percent': brand_counts.values * 100
    })

    # Plot with px.bar
    fig_brand = px.bar(
        brand_df, 
        x='brand', 
        y='percent',
        title='COVID-19 Vaccine Brand Distribution (%)',
        labels={'brand': 'Vaccine Brand', 'percent': 'Percent of Participants'},
        text='percent'
    )
    
    # Update traces with formatting
    fig_brand.update_traces(
        texttemplate='%{text:.1f}%', 
        textposition='outside'
    )
    
    # Update layout
    fig_brand.update_layout(
        xaxis_tickangle=45,
        yaxis_range=[0, 100],
        margin=dict(t=50, b=150, l=50, r=50)
    )
    
    return fig_brand

def _compute_seroprevalence_by_age_waves_fig(df3: pd.DataFrame):
    px.defaults.width = 1200
    px.defaults.height = 800
    
    # Define waves
    waves = ['X20_21_serostatus', 's22_nc_qualitative', 's23_nc_qualitative']
    
    # Age group column mapping for all waves to 'age_group_22_1' (as provided)
    age_column_mapping = {
        'X20_21_serostatus': 'age_group_22_1',
        's22_nc_qualitative': 'age_group_22_1', 
        's23_nc_qualitative': 'age_group_22_1'
    }
    
    # Melt df3 into long form with id_vars age column(s) and value_vars waves; dropna on sero flag
    long_df = pd.melt(df3, 
                      id_vars=['age_group_22_1'], 
                      value_vars=waves,
                      var_name='wave', 
                      value_name='status')
    
    # Drop rows with missing status values
    long_df = long_df.dropna(subset=['status'])
    
    # Attach correct age_group per row using the mapping (already using age_group_22_1)
    long_df['age_group'] = long_df['age_group_22_1']
    
    # Drop rows with missing age groups
    long_df = long_df.dropna(subset=['age_group'])
    
    # Crosstab normalize by (wave, age_group) to get percentages per status
    crosstab_result = pd.crosstab([long_df['wave'], long_df['age_group']], long_df['status'], normalize='index') * 100
    
    # Reshape to long with columns wave, age_group, status, percent
    percent_df = crosstab_result.reset_index()
    percent_df = pd.melt(percent_df, 
                        id_vars=['wave', 'age_group'], 
                        var_name='status', 
                        value_name='percent')
    
    # Relabel status: {0:'Negative',1:'Positive','seronegative':'Negative','seropositive':'Positive'}
    status_mapping = {
        0: 'Negative', '0': 'Negative', 0.0: 'Negative', '0.0': 'Negative',
        1: 'Positive', '1': 'Positive', 1.0: 'Positive', '1.0': 'Positive',
        'seronegative': 'Negative', 
        'seropositive': 'Positive'
    }
    percent_df['status'] = percent_df['status'].map(status_mapping)
    
    # Define age group order
    age_groups = ['18-29', '30-39', '40-49', '50-59', '60-69', '70-79', '80+']
    
    # Plot with px.bar
    fig_sero_age = px.bar(
        percent_df,
        x='age_group',
        y='percent',
        color='status',
        facet_col='wave',
        barmode='group',
        category_orders={
            'wave': waves,
            'age_group': age_groups
        },
        labels={
            'age_group': 'Age Group',
            'percent': 'Percent of Participants',
            'status': 'Serostatus',
            'wave': 'Wave'
        },
        title='Seroprevalence by Age Group Across Waves'
    )
    
    # Update layout
    fig_sero_age.update_layout(
        xaxis_tickangle=45,
        margin=dict(t=80, b=100)
    )
    
    return fig_sero_age

def export_figures(df3: pd.DataFrame, out_dir: str = "docs/assets/plots") -> dict:
    out_path = _ensure_out_dir(out_dir)

    fig_sero = _compute_seroprevalence_fig(df3)
    fig_vac, stats = _compute_vaccination_fig(df3)
    fig_brand = _compute_vaccine_brand_mix_fig(df3)
    fig_sero_age = _compute_seroprevalence_by_age_waves_fig(df3)

    sero_path = out_path / "serology_seroprevalence.json"
    vac_path = out_path / "vaccination_coverage.json"
    brand_path = out_path / "vaccine_brand_distribution.json"
    sero_age_path = out_path / "seroprevalence_age_waves.json"
    manifest_path = out_path / "plotly_manifest.json"

    sero_path.write_text(fig_sero.to_json(), encoding="utf-8")
    vac_path.write_text(fig_vac.to_json(), encoding="utf-8")
    brand_path.write_text(fig_brand.to_json(), encoding="utf-8")
    sero_age_path.write_text(fig_sero_age.to_json(), encoding="utf-8")

    manifest = {
        "version": 1,
        "basePath": "assets/plots/",
        "charts": [
            { "id": "sero-prevalence", "title": fig_sero.layout.title.text or f"COVID-19 Seroprevalence (%) ({DATASET_TAG})", "file": "serology_seroprevalence.json", "width": 800, "height": 500 },
            { "id": "vaccination-coverage", "title": fig_vac.layout.title.text or f"COVID-19 Vaccination Coverage (%) ({DATASET_TAG})", "file": "vaccination_coverage.json", "width": 800, "height": 500 },
            { "id": "vaccine-brand-distribution", "title": fig_brand.layout.title.text or "COVID-19 Vaccine Brand Distribution (%)", "file": "vaccine_brand_distribution.json", "width": 800, "height": 600 },
            { "id": "seroprevalence-age-waves", "title": fig_sero_age.layout.title.text or "Seroprevalence by Age Group Across Waves", "file": "seroprevalence_age_waves.json", "width": 1200, "height": 800 }
        ]
    }
    manifest_path.write_text(json.dumps(manifest, indent=2), encoding="utf-8")

    return {
        "serology_seroprevalence": str(sero_path),
        "vaccination_coverage": str(vac_path),
        "vaccine_brand_distribution": str(brand_path),
        "seroprevalence_age_waves": str(sero_age_path),
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