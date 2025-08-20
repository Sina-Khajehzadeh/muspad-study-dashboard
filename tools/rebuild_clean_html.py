#!/usr/bin/env python3
"""
Create clean, working responsive HTML files from the existing Plotly HTML files.
This script identifies the core Plotly plot configuration and wraps it with proper responsive behavior.
"""

import re
from pathlib import Path

def get_responsive_html_template():
    """Get the clean responsive HTML template."""
    return '''<html>
<head>
  <meta charset="utf-8" />
  <style>
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
  </style>
</head>
<body>
    <div>
        <script type="text/javascript">window.PlotlyConfig = {MathJaxConfig: 'local'};</script>
        <script charset="utf-8" src="https://cdn.plot.ly/plotly-2.35.2.min.js"></script>
        <div id="{plot_id}" class="plotly-graph-div"></div>
        <script type="text/javascript">
            window.PLOTLYENV = window.PLOTLYENV || {};
            if (document.getElementById("{plot_id}")) {
                Plotly.newPlot(
                    "{plot_id}",
                    {plot_data},
                    {plot_layout},
                    {{"responsive": true}}
                );
                
                // Make plot responsive after creation
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
                                    window.parent.postMessage({{
                                        type: 'plot:height',
                                        height: height
                                    }}, '*');
                                } catch (e) {{
                                    // Silent fail for standalone use
                                }}
                            }}
                            
                            // Set up resize observer
                            const resizeObserver = new ResizeObserver(() => {{
                                clearTimeout(plotDiv._resizeTimeout);
                                plotDiv._resizeTimeout = setTimeout(() => {{
                                    try {{
                                        window.Plotly.Plots.resize(plotDiv);
                                        postHeightToParent();
                                    }} catch (e) {{
                                        console.warn('Error resizing plot:', e);
                                    }}
                                }}, 50);
                            }});
                            
                            resizeObserver.observe(document.body);
                            
                            // Listen for window resize
                            window.addEventListener('resize', () => {{
                                clearTimeout(plotDiv._resizeTimeout);
                                plotDiv._resizeTimeout = setTimeout(() => {{
                                    try {{
                                        window.Plotly.Plots.resize(plotDiv);
                                        postHeightToParent();
                                    }} catch (e) {{
                                        console.warn('Error resizing plot:', e);
                                    }}
                                }}, 100);
                            }});
                            
                            // Listen for pane resize messages from parent
                            window.addEventListener('message', (event) => {{
                                if (event.data && event.data.type === 'pane:resized') {{
                                    clearTimeout(plotDiv._resizeTimeout);
                                    plotDiv._resizeTimeout = setTimeout(() => {{
                                        try {{
                                            window.Plotly.Plots.resize(plotDiv);
                                            postHeightToParent();
                                        }} catch (e) {{
                                            console.warn('Error resizing plot:', e);
                                        }}
                                    }}, 100);
                                }}
                            }});
                            
                            // Initial resize and height post
                            setTimeout(() => {{
                                try {{
                                    window.Plotly.Plots.resize(plotDiv);
                                    postHeightToParent();
                                }} catch (e) {{
                                    console.warn('Error with initial resize:', e);
                                }}
                            }}, 100);
                        }}
                    }}
                }}, 500);
            }}
        </script>
    </div>
</body>
</html>'''

def extract_plot_components(content: str):
    """Extract the plot ID, data, and layout from existing HTML content."""
    # Extract plot ID
    plot_id_pattern = r'document\.getElementById\("([^"]+)"\)'
    plot_id_match = re.search(plot_id_pattern, content)
    plot_id = plot_id_match.group(1) if plot_id_match else "plot"
    
    # Find the Plotly.newPlot call and extract its components more carefully
    # Look for the pattern: Plotly.newPlot("id", [data], {layout}, {config})
    newplot_start = content.find('Plotly.newPlot(')
    if newplot_start == -1:
        print(f"  Could not find Plotly.newPlot call")
        return None
    
    # Extract the full newPlot call by matching brackets
    start_pos = content.find('(', newplot_start) + 1
    bracket_count = 1
    pos = start_pos
    
    while bracket_count > 0 and pos < len(content):
        if content[pos] == '(':
            bracket_count += 1
        elif content[pos] == ')':
            bracket_count -= 1
        pos += 1
    
    if bracket_count != 0:
        print(f"  Could not properly parse Plotly.newPlot call")
        return None
    
    # Extract the parameters part
    params_str = content[start_pos:pos-1].strip()
    
    # Split by commas at the top level (not inside brackets/braces)
    params = []
    current_param = ""
    bracket_depth = 0
    brace_depth = 0
    
    for char in params_str:
        if char == '[':
            bracket_depth += 1
        elif char == ']':
            bracket_depth -= 1
        elif char == '{':
            brace_depth += 1
        elif char == '}':
            brace_depth -= 1
        elif char == ',' and bracket_depth == 0 and brace_depth == 0:
            params.append(current_param.strip())
            current_param = ""
            continue
        current_param += char
    
    if current_param.strip():
        params.append(current_param.strip())
    
    if len(params) < 3:
        print(f"  Not enough parameters in Plotly.newPlot call: {len(params)}")
        return None
    
    # Remove quotes from plot_id if present
    plot_id_param = params[0].strip()
    if plot_id_param.startswith('"') and plot_id_param.endswith('"'):
        plot_id = plot_id_param[1:-1]
    
    plot_data = params[1].strip()
    plot_layout = params[2].strip()
    
    return {
        'plot_id': plot_id,
        'plot_data': plot_data, 
        'plot_layout': plot_layout
    }

def rebuild_html_file(file_path: Path) -> bool:
    """Rebuild the HTML file with clean responsive structure."""
    try:
        content = file_path.read_text(encoding='utf-8')
        
        # Extract the core plot components
        components = extract_plot_components(content)
        if not components:
            return False
        
        # Generate clean HTML using template
        template = get_responsive_html_template()
        clean_html = template.format(**components)
        
        # Write the clean HTML back to the file
        file_path.write_text(clean_html, encoding='utf-8')
        return True
        
    except Exception as e:
        print(f"  Error rebuilding {file_path.name}: {e}")
        return False

def main():
    """Main function to rebuild all HTML files."""
    plots_dir = Path(__file__).parent.parent / "docs" / "plots"
    html_files = list(plots_dir.glob("*.html"))
    
    print(f"Rebuilding {len(html_files)} HTML files with clean responsive structure...")
    
    rebuilt_count = 0
    for html_file in html_files:
        print(f"Rebuilding {html_file.name}...")
        if rebuild_html_file(html_file):
            print(f"  ✓ Successfully rebuilt {html_file.name}")
            rebuilt_count += 1
        else:
            print(f"  ✗ Failed to rebuild {html_file.name}")
    
    print(f"\nSuccessfully rebuilt {rebuilt_count} out of {len(html_files)} files.")

if __name__ == "__main__":
    main()