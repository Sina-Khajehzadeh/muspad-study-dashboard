#!/usr/bin/env python3
"""
MUSPAD Plotly JSON Exporter

This script exports Plotly charts as JSON files for use in the MUSPAD dashboard.
It creates two charts: seroprevalence and vaccination coverage with the exact 
specifications required by the dashboard.

Usage:
    python3 export_plotly_json.py

Requirements:
    pip install plotly pandas
"""

import json
import os
import pandas as pd
import plotly.graph_objects as go
from pathlib import Path


def normalize_serostatus(value):
    """
    Normalize serostatus values to standard categories.
    
    Seropositive bucket: {1, true/t, yes/y, "seropositive", "positive", "pos", "+", "reactive"}
    Seronegative bucket: {0, false/f, no/n, "seronegative", "negative", "neg", "-", "non-reactive", "nonreactive"}
    """
    if pd.isna(value):
        return None
        
    # Convert to string and normalize
    str_val = str(value).lower().strip()
    
    # Seropositive mappings
    seropositive_values = {'1', 'true', 't', 'yes', 'y', 'seropositive', 'positive', 'pos', '+', 'reactive'}
    if str_val in seropositive_values or (str_val.replace('.0', '') == '1'):
        return 'seropositive'
    
    # Seronegative mappings  
    seronegative_values = {'0', 'false', 'f', 'no', 'n', 'seronegative', 'negative', 'neg', '-', 'non-reactive', 'nonreactive'}
    if str_val in seronegative_values or (str_val.replace('.0', '') == '0'):
        return 'seronegative'
    
    return None


def create_seroprevalence_chart(df=None):
    """Create COVID-19 Seroprevalence chart"""
    
    # If no dataframe provided, use sample data that matches the requirements
    if df is None:
        # Sample data matching the screenshot
        seronegative_count = 256
        seropositive_count = 744
        total = seronegative_count + seropositive_count
        
        seronegative_pct = (seronegative_count / total) * 100
        seropositive_pct = (seropositive_count / total) * 100
    else:
        # Process real data if provided
        if 'serostatus' not in df.columns:
            raise ValueError("DataFrame must contain 'serostatus' column")
            
        # Normalize serostatus values
        df['serostatus_normalized'] = df['serostatus'].apply(normalize_serostatus)
        
        # Count valid serostatus values
        serostatus_counts = df['serostatus_normalized'].value_counts()
        
        # Ensure we have both categories
        seronegative_count = serostatus_counts.get('seronegative', 0)
        seropositive_count = serostatus_counts.get('seropositive', 0)
        total = seronegative_count + seropositive_count
        
        if total == 0:
            raise ValueError("No valid serostatus data found")
            
        seronegative_pct = (seronegative_count / total) * 100
        seropositive_pct = (seropositive_count / total) * 100
    
    # Create the chart
    fig = go.Figure(data=[
        go.Bar(
            x=['seronegative', 'seropositive'],
            y=[seronegative_pct, seropositive_pct],
            marker=dict(
                color=['#E74C3C', '#27AE60'],
                opacity=0.8
            ),
            text=[f'{seronegative_pct:.1f}%', f'{seropositive_pct:.1f}%'],
            textposition='outside',
            textfont=dict(size=14, color='#2C3E50'),
            hovertemplate='%{x}: %{y}%<extra></extra>'
        )
    ])
    
    fig.update_layout(
        title=dict(
            text='COVID-19 Seroprevalence (%) (X20_21)',
            font=dict(size=16, color='#2C3E50'),
            x=0,
            xanchor='left'
        ),
        xaxis=dict(
            title='Serology Status',
            tickfont=dict(size=12)
        ),
        yaxis=dict(
            title='Percentage (%)',
            range=[0, 100],
            tickfont=dict(size=12)
        ),
        plot_bgcolor='white',
        paper_bgcolor='white',
        margin=dict(l=50, r=20, b=50, t=60, pad=4),
        font=dict(
            family="Inter, 'Segoe UI', Roboto, sans-serif",
            size=12,
            color='#2C3E50'
        ),
        showlegend=False,
        width=800,
        height=500
    )
    
    return fig


def create_vaccination_coverage_chart(df=None):
    """Create COVID-19 Vaccination Coverage chart"""
    
    # If no dataframe provided, use sample data that matches the requirements
    if df is None:
        # Sample data matching the screenshot
        first_dose_pct = 82.3
        second_dose_pct = 67.8
    else:
        # Process real data if provided
        required_cols = ['first_dose', 'second_dose']
        missing_cols = [col for col in required_cols if col not in df.columns]
        if missing_cols:
            raise ValueError(f"DataFrame must contain columns: {missing_cols}")
        
        # Calculate vaccination percentages (treat value==1 as yes)
        first_dose_valid = df['first_dose'].notna()
        first_dose_yes = (df['first_dose'] == 1).sum()
        first_dose_pct = (first_dose_yes / first_dose_valid.sum()) * 100 if first_dose_valid.sum() > 0 else 0
        
        second_dose_valid = df['second_dose'].notna()
        second_dose_yes = (df['second_dose'] == 1).sum()
        second_dose_pct = (second_dose_yes / second_dose_valid.sum()) * 100 if second_dose_valid.sum() > 0 else 0
    
    # Create the chart
    fig = go.Figure(data=[
        go.Bar(
            x=['First Dose', 'Second Dose'],
            y=[first_dose_pct, second_dose_pct],
            marker=dict(
                color=['#3498DB', '#9B59B6'],
                opacity=0.8
            ),
            text=[f'{first_dose_pct:.1f}%', f'{second_dose_pct:.1f}%'],
            textposition='outside',
            textfont=dict(size=14, color='#2C3E50'),
            hovertemplate='%{x}: %{y}%<extra></extra>'
        )
    ])
    
    fig.update_layout(
        title=dict(
            text='COVID-19 Vaccination Coverage (%) (X20_21)',
            font=dict(size=16, color='#2C3E50'),
            x=0,
            xanchor='left'
        ),
        xaxis=dict(
            title='Vaccination Dose',
            tickfont=dict(size=12)
        ),
        yaxis=dict(
            title='Coverage (%)',
            range=[0, 100],
            tickfont=dict(size=12)
        ),
        plot_bgcolor='white',
        paper_bgcolor='white',
        margin=dict(l=50, r=20, b=50, t=60, pad=4),
        font=dict(
            family="Inter, 'Segoe UI', Roboto, sans-serif",
            size=12,
            color='#2C3E50'
        ),
        showlegend=False,
        width=800,
        height=500
    )
    
    return fig


def create_manifest():
    """Create the plotly manifest file"""
    manifest = {
        "version": 1,
        "basePath": "assets/plots/",
        "charts": [
            {
                "id": "sero-prevalence",
                "title": "COVID-19 Seroprevalence (%) (X20_21)",
                "file": "serology_seroprevalence.json",
                "width": 800,
                "height": 500
            },
            {
                "id": "vaccination-coverage", 
                "title": "COVID-19 Vaccination Coverage (%) (X20_21)",
                "file": "vaccination_coverage.json",
                "width": 800,
                "height": 500
            }
        ]
    }
    return manifest


def main(df=None):
    """
    Main function to export Plotly charts and manifest
    
    Args:
        df (pandas.DataFrame, optional): Input dataframe with serology data.
                                       If None, uses sample data.
    """
    
    # Create output directory
    output_dir = Path("docs/assets/plots")
    output_dir.mkdir(parents=True, exist_ok=True)
    
    print("Exporting Plotly charts for MUSPAD dashboard...")
    
    # Create and export seroprevalence chart
    print("Creating seroprevalence chart...")
    sero_fig = create_seroprevalence_chart(df)
    sero_json = sero_fig.to_json()
    
    sero_path = output_dir / "serology_seroprevalence.json"
    with open(sero_path, 'w') as f:
        f.write(sero_json)
    print(f"✓ Exported: {sero_path}")
    
    # Create and export vaccination coverage chart  
    print("Creating vaccination coverage chart...")
    vacc_fig = create_vaccination_coverage_chart(df)
    vacc_json = vacc_fig.to_json()
    
    vacc_path = output_dir / "vaccination_coverage.json"
    with open(vacc_path, 'w') as f:
        f.write(vacc_json)
    print(f"✓ Exported: {vacc_path}")
    
    # Create and export manifest
    print("Creating manifest...")
    manifest = create_manifest()
    
    manifest_path = output_dir / "plotly_manifest.json"
    with open(manifest_path, 'w') as f:
        json.dump(manifest, f, indent=2)
    print(f"✓ Exported: {manifest_path}")
    
    print("\nExport complete! Charts are ready for use in the MUSPAD dashboard.")
    print(f"Charts exported to: {output_dir.absolute()}")


if __name__ == "__main__":
    # Example usage with sample data
    main()
    
    # Example usage with real data (uncomment and modify as needed):
    # df = pd.read_csv('your_data.csv')
    # main(df)