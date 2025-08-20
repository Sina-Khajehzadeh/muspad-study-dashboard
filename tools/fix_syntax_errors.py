#!/usr/bin/env python3
"""
Fix syntax errors in HTML files caused by duplicate closing braces.
"""

import re
from pathlib import Path

def fix_syntax_errors(plots_dir: Path = None):
    """Fix JavaScript syntax errors in HTML files."""
    if plots_dir is None:
        plots_dir = Path(__file__).parent.parent / "docs" / "plots"
    
    html_files = list(plots_dir.glob("*.html"))
    
    for html_file in html_files:
        print(f"Checking {html_file.name}...")
        content = html_file.read_text(encoding='utf-8')
        original_content = content
        
        # Fix duplicate closing sequences
        # Pattern: }, 500);     });  -> }, 500);
        content = re.sub(r'},\s*\d+\s*\);\s*}\s*\);', '}, 500);', content)
        
        # Pattern: extra }); after setTimeout
        content = re.sub(r'(setTimeout\([^}]+}, \d+\);\s*}\s*}\s*}, \d+\);)\s*}\s*\);', r'\1', content)
        
        # More general cleanup of duplicate });
        content = re.sub(r'}\s*\);\s*}\s*\);(?=\s*</script>)', '});', content)
        
        if content != original_content:
            html_file.write_text(content, encoding='utf-8')
            print(f"  ✓ Fixed syntax errors in {html_file.name}")
        else:
            print(f"  - No syntax errors found in {html_file.name}")

if __name__ == "__main__":
    fix_syntax_errors()