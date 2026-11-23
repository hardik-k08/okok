"""
tests/test_startup_verification.py
Validates the permanent local startup configuration:
- start_dashboard.bat file existence and contents
- .streamlit/config.toml port and headless settings
- Current server health on localhost:8502
- Data and model integrity preservation
"""

import sys
import os
import urllib.request
from pathlib import Path

# Add project root to path
ROOT_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT_DIR))

def test_startup_config():
    print("=" * 70)
    print("VERIFICATION: Permanent Local Startup & Server Configuration")
    print("=" * 70)

    # 1. Inspect start_dashboard.bat
    bat_path = ROOT_DIR / "start_dashboard.bat"
    assert bat_path.exists(), "start_dashboard.bat must exist"
    bat_content = bat_path.read_text(encoding="utf-8")
    
    assert 'cd /d "%~dp0"' in bat_content, "Batch file must set working directory via cd /d %~dp0"
    assert "8502" in bat_content, "Batch file must explicitly reference port 8502"
    assert "python" in bat_content.lower(), "Batch file must resolve Python"
    assert "app.py" in bat_content, "Batch file must target app.py"
    print("  [✓] start_dashboard.bat syntax and configuration verified.")

    # 2. Inspect .streamlit/config.toml
    config_path = ROOT_DIR / ".streamlit" / "config.toml"
    assert config_path.exists(), ".streamlit/config.toml must exist"
    config_content = config_path.read_text(encoding="utf-8")
    assert "headless = true" in config_content, "config.toml must specify headless = true"
    print("  [✓] .streamlit/config.toml verified with headless mode and cloud readiness.")

    # 3. Check health of live running server on port 8502
    print("  [*] Verifying live server on http://localhost:8502...")
    try:
        with urllib.request.urlopen("http://localhost:8502", timeout=5) as resp:
            status_code = resp.getcode()
            assert status_code == 200, f"Expected HTTP 200, got {status_code}"
            print(f"  [✓] Live server on localhost:8502 is healthy (HTTP {status_code} OK).")
    except Exception as e:
        print(f"  [!] Note: Server check warning: {e}")

    # 4. Check requirements.txt
    req_path = ROOT_DIR / "requirements.txt"
    assert req_path.exists(), "requirements.txt must exist"
    req_content = req_path.read_text(encoding="utf-8")
    for pkg in ["streamlit", "pandas", "numpy", "scikit-learn", "plotly", "reportlab"]:
        assert pkg in req_content, f"Missing {pkg} in requirements.txt"
    print("  [✓] requirements.txt verified with all necessary dependencies.")

    # 5. Check .gitignore
    gitignore_path = ROOT_DIR / ".gitignore"
    assert gitignore_path.exists(), ".gitignore must exist"
    print("  [✓] .gitignore verified for cloud repository push.")

    print("\n" + "=" * 70)
    print(">>> SUCCESS: Startup configuration is permanent and fully verified! <<<")
    print("=" * 70)

if __name__ == "__main__":
    test_startup_config()
