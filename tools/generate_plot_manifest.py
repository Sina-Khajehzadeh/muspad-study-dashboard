#!/usr/bin/env python3
"""
Generate manifest.json for HTML plot files in docs/plots/

Usage:
    python3 generate_plot_manifest.py [plots_dir] [output_path]
    
Default:
    python3 generate_plot_manifest.py docs/plots docs/assets/plots/manifest.json
"""
import os
import json
import re
from pathlib import Path

def title_from_filename(filename):
    """Convert filename to friendly title"""
    # Remove .html extension
    name = filename.replace('.html', '')
    # Replace hyphens, underscores, and dots with spaces
    name = re.sub(r'[-_.]+', ' ', name)
    # Title case
    return name.title()

def generate_manifest(plots_dir, output_path):
    """Generate manifest.json for HTML plots"""
    plots_path = Path(plots_dir)
    
    if not plots_path.exists():
        print(f"Plots directory not found: {plots_dir}")
        return
        
    # Find all .html files
    html_files = list(plots_path.glob('*.html'))
    
    if not html_files:
        print(f"No HTML files found in {plots_dir}")
        return
        
    # Create manifest entries
    charts = []
    for html_file in sorted(html_files):
        filename = html_file.name
        title = title_from_filename(filename)
        
        chart_entry = {
            "id": filename.replace('.html', '').replace(' ', '-').lower(),
            "title": title,
            "file": filename,
            "type": "html"
        }
        charts.append(chart_entry)
    
    # Create manifest
    manifest = {
        "version": 1,
        "basePath": "plots/",
        "charts": charts
    }
    
    # Write manifest
    output_path = Path(output_path)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(manifest, f, indent=2, ensure_ascii=False)
    
    print(f"Generated manifest with {len(charts)} charts:")
    for chart in charts:
        print(f"  - {chart['title']} ({chart['file']})")
    
    return manifest

if __name__ == "__main__":
    import sys
    plots_dir = sys.argv[1] if len(sys.argv) > 1 else "docs/plots"
    output_path = sys.argv[2] if len(sys.argv) > 2 else "docs/assets/plots/manifest.json"
    
    generate_manifest(plots_dir, output_path)