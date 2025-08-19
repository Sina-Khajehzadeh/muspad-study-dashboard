#!/usr/bin/env python3
"""
Export Plotly JSON for MUSPAD Dashboard

This script exports Plotly figures to JSON format for use with the
MUSPAD Dashboard's manifest-backed Python Plotly JSON feature.

Usage:
    python tools/export_plotly_json.py

Prerequisites:
    - pandas
    - plotly
    - Prepared df3 dataframe with serology and vaccination data

The script will generate:
    - docs/assets/plots/serology_seroprevalence.json
    - docs/assets/plots/vaccination_coverage.json
    - docs/assets/plots/plotly_manifest.json (updated)
"""

import json
import os
import pandas as pd
import plotly.graph_objects as go
from datetime import datetime


def create_seroprevalence_chart(df):
    """Create COVID-19 seroprevalence chart"""
    # Example data - replace with your actual df3 processing
    # Process X20_21_serostatus column or equivalent
    
    fig_sero = go.Figure(data=[
        go.Bar(
            x=["Seronegative", "Seropositive"],
            y=[74.4, 25.6],
            text=["74.4%", "25.6%"],
            textposition='outside',
            textfont=dict(size=14),
            marker=dict(
                color=['#2E86AB', '#A23B72'],
                line=dict(color='rgba(0,0,0,0.3)', width=1)
            ),
            name="Seroprevalence"
        )
    ])
    
    fig_sero.update_layout(
        title=dict(
            text="COVID-19 Seroprevalence (%)",
            font=dict(size=18),
            x=0.5,
            xanchor="center"
        ),
        xaxis=dict(
            title=dict(text="Serology Status", font=dict(size=14)),
            tickfont=dict(size=12)
        ),
        yaxis=dict(
            title=dict(text="Percentage (%)", font=dict(size=14)),
            range=[0, 100],
            tickfont=dict(size=12)
        ),
        width=800,
        height=500,
        margin=dict(l=80, r=60, t=80, b=80),
        showlegend=False,
        plot_bgcolor="white",
        paper_bgcolor="white"
    )
    
    return fig_sero


def create_vaccination_coverage_chart(df):
    """Create COVID-19 vaccination coverage chart"""
    # Example data - replace with your actual df3 processing
    
    fig_vac = go.Figure(data=[
        go.Bar(
            x=["First Dose Only", "Second Dose Completed"],
            y=[41.4, 57.5],
            text=["41.4%", "57.5%"],
            textposition='outside',
            textfont=dict(size=14),
            marker=dict(
                color=['#F18F01', '#C73E1D'],
                line=dict(color='rgba(0,0,0,0.3)', width=1)
            ),
            name="Vaccination Coverage"
        )
    ])
    
    fig_vac.update_layout(
        title=dict(
            text="COVID-19 Vaccination Coverage (%)",
            font=dict(size=18),
            x=0.5,
            xanchor="center"
        ),
        xaxis=dict(
            title=dict(text="Vaccination Status", font=dict(size=14)),
            tickfont=dict(size=12)
        ),
        yaxis=dict(
            title=dict(text="Percentage (%)", font=dict(size=14)),
            range=[0, 100],
            tickfont=dict(size=12)
        ),
        width=800,
        height=500,
        margin=dict(l=80, r=60, t=80, b=80),
        showlegend=False,
        plot_bgcolor="white",
        paper_bgcolor="white"
    )
    
    return fig_vac


def export_charts(df3=None):
    """Export charts and update manifest"""
    
    # Create output directory if it doesn't exist
    output_dir = "docs/assets/plots"
    os.makedirs(output_dir, exist_ok=True)
    
    print("Creating charts...")
    
    # Create charts
    fig_sero = create_seroprevalence_chart(df3)
    fig_vac = create_vaccination_coverage_chart(df3)
    
    # Export to JSON
    sero_path = os.path.join(output_dir, "serology_seroprevalence.json")
    vac_path = os.path.join(output_dir, "vaccination_coverage.json")
    
    print(f"Exporting {sero_path}...")
    with open(sero_path, 'w') as f:
        f.write(fig_sero.to_json())
    
    print(f"Exporting {vac_path}...")
    with open(vac_path, 'w') as f:
        f.write(fig_vac.to_json())
    
    # Update manifest
    manifest = {
        "version": 1,
        "basePath": "assets/plots/",
        "charts": [
            {
                "id": "sero-prevalence",
                "title": "COVID-19 Seroprevalence (%)",
                "file": "serology_seroprevalence.json",
                "width": 800,
                "height": 500
            },
            {
                "id": "vaccination-coverage",
                "title": "COVID-19 Vaccination Coverage (%)",
                "file": "vaccination_coverage.json",
                "width": 800,
                "height": 500
            }
        ]
    }
    
    manifest_path = os.path.join(output_dir, "plotly_manifest.json")
    print(f"Updating {manifest_path}...")
    with open(manifest_path, 'w') as f:
        json.dump(manifest, f, indent=2)
    
    print("Export completed successfully!")
    print(f"Charts exported to: {output_dir}")
    print("You can now use these charts in the MUSPAD Dashboard.")


if __name__ == "__main__":
    # Example usage
    print("MUSPAD Dashboard - Plotly JSON Export Tool")
    print("=" * 50)
    
    # If you have your df3 dataframe ready, pass it here:
    # export_charts(df3)
    
    # For now, export with example data
    export_charts()