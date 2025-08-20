#!/usr/bin/env python3
"""
Carefully add postMessage functionality to Plotly HTML files while preserving existing structure.
"""

import re
from pathlib import Path

def get_post_message_script() -> str:
    """Get the postMessage JavaScript code to inject."""
    return """
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
                    
                    // Listen for pane resize messages from parent
                    window.addEventListener('message', (event) => {
                        if (event.data && event.data.type === 'pane:resized') {
                            const plotDiv = document.querySelector('.plotly-graph-div');
                            if (plotDiv) {
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
                        }
                    });"""

def add_postmessage_to_existing_responsive_code(content: str) -> str:
    """Add postMessage functionality to existing responsive code."""
    post_message_script = get_post_message_script()
    
    # Find the existing resize code and add postHeightToParent() calls
    # Pattern 1: Add postHeightToParent after Plotly.Plots.resize calls
    content = re.sub(
        r'(window\.Plotly\.Plots\.resize\(plotDiv\);)',
        r'\1\n                                postHeightToParent();',
        content
    )
    
    # Pattern 2: Add the postHeightToParent function and message listener
    # Find the spot after the plotDiv declaration but before the resizeObserver
    if '// Set up resize observer' in content:
        content = content.replace(
            '// Set up resize observer',
            f'{post_message_script}\n                    \n                    // Set up resize observer'
        )
    else:
        # Fallback: add after plotDiv is defined
        content = re.sub(
            r'(const plotDiv = document\.querySelector\(\'\.plotly-graph-div\'\);)',
            f'\\1{post_message_script}',
            content
        )
    
    return content

def add_responsive_css(content: str) -> str:
    """Add responsive CSS to the HTML head if not present."""
    css_block = """  <style>
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
    
    # Only add if not already present
    if 'Responsive styling for standalone plots' in content:
        return content
    
    if '<head><meta charset="utf-8" /></head>' in content:
        content = content.replace(
            '<head><meta charset="utf-8" /></head>',
            f'<head>\n  <meta charset="utf-8" />\n{css_block}\n</head>'
        )
    elif '<head>' in content and '</head>' in content:
        content = content.replace('<head>', f'<head>\n{css_block}')
    
    return content

def process_file_safely(file_path: Path) -> bool:
    """Process a single HTML file safely, preserving existing structure."""
    try:
        content = file_path.read_text(encoding='utf-8')
        original_content = content
        
        # Step 1: Add responsive CSS if needed
        content = add_responsive_css(content)
        
        # Step 2: Check if this file already has responsive JavaScript
        has_responsive_js = 'Make plot responsive after creation' in content or 'ResizeObserver' in content
        
        if has_responsive_js:
            # Step 3: Add postMessage functionality to existing responsive code
            if 'postHeightToParent' not in content:
                content = add_postmessage_to_existing_responsive_code(content)
        else:
            print(f"  Warning: {file_path.name} doesn't have existing responsive code")
            return False
        
        # Step 4: Ensure responsive config is set
        if '"responsive": true' not in content:
            # Add responsive config to Plotly.newPlot calls
            content = re.sub(
                r'(\{"responsive": true\})',
                r'{"responsive": true}',
                content
            )
            # If still not found, try to add it
            content = re.sub(
                r'(Plotly\.newPlot\([^)]+\))\s*\)',
                r'\1, {"responsive": true})',
                content
            )
        
        if content != original_content:
            file_path.write_text(content, encoding='utf-8')
            return True
        return False
        
    except Exception as e:
        print(f"  Error processing {file_path.name}: {e}")
        return False

def main():
    """Main function to process all HTML files."""
    plots_dir = Path(__file__).parent.parent / "docs" / "plots"
    html_files = list(plots_dir.glob("*.html"))
    
    print(f"Processing {len(html_files)} HTML files...")
    
    modified_count = 0
    for html_file in html_files:
        print(f"Processing {html_file.name}...")
        if process_file_safely(html_file):
            print(f"  ✓ Successfully modified {html_file.name}")
            modified_count += 1
        else:
            print(f"  - No changes needed for {html_file.name}")
    
    print(f"\nModified {modified_count} out of {len(html_files)} files.")

if __name__ == "__main__":
    main()