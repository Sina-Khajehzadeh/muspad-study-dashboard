#!/usr/bin/env python3
"""
Make all Plotly HTML files in docs/plots/ responsive with postMessage height communication.

This script ensures all HTML files have:
1. Responsive CSS with width: 100%
2. Plotly config with responsive: true and autosize: true
3. ResizeObserver and window resize handlers
4. PostMessage communication to parent iframe with height updates
"""

import re
from pathlib import Path
from typing import List

def get_responsive_css() -> str:
    """Get the CSS for responsive behavior."""
    return """  <style>
    /* Responsive styling for standalone plots */
    html, body {
      margin: 0;
      padding: 0;
      width: 100%;
      height: 100%;
      font-family: Arial, sans-serif;
    }
    .plotly-graph-div {
      width: 100% !important;
      height: 100vh !important;
    }
  </style>"""

def get_responsive_js() -> str:
    """Get the JavaScript for responsive behavior and postMessage communication."""
    return """        // Make plot responsive after creation
        setTimeout(function() {
            if (window.Plotly && window.ResizeObserver) {
                const plotDiv = document.querySelector('.plotly-graph-div');
                if (plotDiv) {
                    // Remove any fixed dimensions from layout
                    if (plotDiv._fullLayout) {
                        delete plotDiv._fullLayout.width;
                        delete plotDiv._fullLayout.height;
                        plotDiv._fullLayout.autosize = true;
                    }
                    
                    // Function to post height to parent
                    function postHeightToParent() {
                        try {
                            const height = Math.max(
                                document.body.scrollHeight,
                                document.body.offsetHeight,
                                document.documentElement.clientHeight,
                                document.documentElement.scrollHeight,
                                document.documentElement.offsetHeight
                            );
                            window.parent.postMessage({
                                type: 'plot:height',
                                height: height
                            }, '*');
                        } catch (e) {
                            // Silent fail for standalone use
                        }
                    }
                    
                    // Set up resize observer
                    const resizeObserver = new ResizeObserver(() => {
                        clearTimeout(plotDiv._resizeTimeout);
                        plotDiv._resizeTimeout = setTimeout(() => {
                            try {
                                window.Plotly.Plots.resize(plotDiv);
                                postHeightToParent();
                            } catch (e) {
                                console.warn('Error resizing plot:', e);
                            }
                        }, 50);
                    });
                    
                    resizeObserver.observe(document.body);
                    
                    // Listen for window resize
                    window.addEventListener('resize', () => {
                        clearTimeout(plotDiv._resizeTimeout);
                        plotDiv._resizeTimeout = setTimeout(() => {
                            try {
                                window.Plotly.Plots.resize(plotDiv);
                                postHeightToParent();
                            } catch (e) {
                                console.warn('Error resizing plot:', e);
                            }
                        }, 100);
                    });
                    
                    // Listen for pane resize messages from parent
                    window.addEventListener('message', (event) => {
                        if (event.data && event.data.type === 'pane:resized') {
                            clearTimeout(plotDiv._resizeTimeout);
                            plotDiv._resizeTimeout = setTimeout(() => {
                                try {
                                    window.Plotly.Plots.resize(plotDiv);
                                    postHeightToParent();
                                } catch (e) {
                                    console.warn('Error resizing plot:', e);
                                }
                            }, 100);
                        }
                    });
                    
                    // Initial resize and height post
                    setTimeout(() => {
                        try {
                            window.Plotly.Plots.resize(plotDiv);
                            postHeightToParent();
                        } catch (e) {
                            console.warn('Error with initial resize:', e);
                        }
                    }, 100);
                }
            }
        }, 500);"""

def process_html_file(file_path: Path) -> bool:
    """
    Process a single HTML file to make it responsive.
    Returns True if the file was modified, False otherwise.
    """
    try:
        content = file_path.read_text(encoding='utf-8')
        original_content = content
        
        # Ensure CSS is in the head section
        responsive_css = get_responsive_css()
        
        # Handle different head structures
        if '<head><meta charset="utf-8" /></head>' in content:
            # Replace the minimal head with our responsive head
            content = content.replace(
                '<head><meta charset="utf-8" /></head>',
                f'<head>\n  <meta charset="utf-8" />\n{responsive_css}\n</head>'
            )
        elif '<head>' in content and responsive_css not in content:
            # Add CSS after the opening head tag
            content = content.replace('<head>', f'<head>\n{responsive_css}')
        elif responsive_css not in content:
            # Try to insert CSS after any existing head content
            if '<meta charset="utf-8" />' in content and '</head>' in content:
                content = content.replace('</head>', f'{responsive_css}\n</head>')
        
        # Fix malformed head structures where meta is after style
        if '<style>' in content and '</style><meta charset="utf-8" /></head>' in content:
            # Fix the structure by moving meta before style
            content = re.sub(
                r'<head>\s*<style>',
                '<head>\n  <meta charset="utf-8" />\n  <style>',
                content
            )
            content = content.replace('</style><meta charset="utf-8" /></head>', '</style>\n</head>')
        
        # Ensure responsive JavaScript with postMessage is present
        responsive_js = get_responsive_js()
        
        # Check if we need to add or update the postMessage functionality
        has_post_height_func = 'postHeightToParent' in content
        has_new_responsive_js = 'Function to post height to parent' in content
        
        # Look for existing responsive code and replace/enhance it
        plotly_config_pattern = r'window\.PlotlyConfig\s*=\s*\{[^}]+\};?'
        
        if re.search(plotly_config_pattern, content):
            if not has_new_responsive_js:
                # Replace old responsive JS with new version that includes postMessage
                if 'Make plot responsive after creation' in content:
                    # Replace the entire responsive block
                    old_responsive_pattern = r'// Make plot responsive after creation\s*setTimeout\(function\(\)\s*\{.*?\},\s*\d+\);'
                    content = re.sub(old_responsive_pattern, responsive_js, content, flags=re.DOTALL)
                else:
                    # Add our responsive JS after PlotlyConfig
                    content = re.sub(
                        r'(window\.PlotlyConfig\s*=\s*\{[^}]+\};?)',
                        f'\\1\n{responsive_js}',
                        content
                    )
        else:
            # No PlotlyConfig found, add it before the Plotly script
            plotly_script_pattern = r'<script[^>]*src="[^"]*plotly[^"]*\.min\.js"[^>]*></script>'
            if re.search(plotly_script_pattern, content):
                content = re.sub(
                    plotly_script_pattern,
                    f'<script type="text/javascript">window.PlotlyConfig = {{MathJaxConfig: \'local\'}};\n{responsive_js}</script>\n\\g<0>',
                    content
                )
        
        # Ensure Plotly.newPlot calls use responsive: true config
        # Look for Plotly.newPlot calls and make sure they have responsive config
        newplot_pattern = r'(Plotly\.newPlot\(\s*"[^"]+",\s*\[[^\]]+\],\s*\{[^}]+\}),\s*(\{[^}]*\}|\{[^}]*responsive[^}]*\})'
        
        def ensure_responsive_config(match):
            plot_call = match.group(1)
            config = match.group(2) if len(match.groups()) > 1 else '{}'
            
            # Parse the config to ensure it has responsive: true
            if 'responsive' not in config:
                if config.strip() == '{}':
                    config = '{"responsive": true}'
                else:
                    # Insert responsive: true into existing config
                    config = config.rstrip('}') + ', "responsive": true}'
            
            return f'{plot_call}, {config}'
        
        # Apply the responsive config fix
        content = re.sub(newplot_pattern, ensure_responsive_config, content)
        
        # If no config was found, add it to any Plotly.newPlot calls
        if '"responsive": true' not in content:
            # Find Plotly.newPlot calls without a config parameter and add one
            simple_newplot_pattern = r'(Plotly\.newPlot\(\s*"[^"]+",\s*\[[^\]]+\],\s*\{[^}]+\})\s*\)'
            content = re.sub(simple_newplot_pattern, r'\1, {"responsive": true})', content)
        
        # Clean up any duplicate closing braces/semicolons from our replacements
        # Fix cases where we might have added extra }); sequences
        content = re.sub(r'}\s*\);\s*}\s*\);', '});', content)
        content = re.sub(r'}\s*,\s*\d+\s*\);\s*}\s*\);', '}, 500);', content)
        
        # Remove any existing fixed width/height from layout objects in the JavaScript
        # This is more complex as we need to be careful not to break JSON structure
        # For now, we'll rely on the JavaScript code to remove these at runtime
        
        # Write the file back if it was modified
        if content != original_content:
            file_path.write_text(content, encoding='utf-8')
            return True
        return False
        
    except Exception as e:
        print(f"Error processing {file_path}: {e}")
        return False

def make_plots_responsive(plots_dir: Path = None) -> None:
    """Make all HTML files in the plots directory responsive."""
    if plots_dir is None:
        plots_dir = Path(__file__).parent.parent / "docs" / "plots"
    
    if not plots_dir.exists():
        print(f"Plots directory not found: {plots_dir}")
        return
    
    html_files = list(plots_dir.glob("*.html"))
    if not html_files:
        print(f"No HTML files found in {plots_dir}")
        return
    
    print(f"Processing {len(html_files)} HTML files in {plots_dir}...")
    
    modified_files = []
    for html_file in html_files:
        print(f"Processing {html_file.name}...")
        if process_html_file(html_file):
            modified_files.append(html_file.name)
            print(f"  ✓ Modified {html_file.name}")
        else:
            print(f"  - No changes needed for {html_file.name}")
    
    print(f"\nCompleted processing {len(html_files)} files.")
    if modified_files:
        print(f"Modified files: {', '.join(modified_files)}")
    else:
        print("No files were modified.")

if __name__ == "__main__":
    make_plots_responsive()