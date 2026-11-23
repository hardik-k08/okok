# Retail BI Dashboard - Core Package
import sys
from pathlib import Path

# Ensure project root is always discoverable in Python search path
_ROOT_DIR = Path(__file__).resolve().parent.parent
if str(_ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(_ROOT_DIR))
