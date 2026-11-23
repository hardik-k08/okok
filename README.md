# RetailPulse | Sales Intelligence & Demand Forecasting Platform
**Enterprise Business Intelligence & Machine Learning Demand Simulation System**

---

## 🌟 Overview
**RetailPulse** is an enterprise-grade Business Intelligence platform and Random Forest demand forecasting system. It greets users with an interactive landing page and leads into a comprehensive analytics suite featuring temporal revenue timelines, seasonal holiday scenario modeling, dynamic inventory buffering advice, model explainability diagnostics, and publication-ready PDF/CSV export reporting.

---

## 📂 Project Structure
```
RetailPulse/
├── app.py                          # Main Streamlit Application (Routes between Welcome & Analytics Dashboard)
├── app_original.py                 # Untouched baseline snapshot of the original project
├── start_dashboard.bat             # One-click Windows launcher (Auto-detects Python, checks port 8502, opens Chrome)
├── combined_transactions.csv       # Source transaction-level dataset (2,675 rows)
├── daily_product_features.csv      # Daily product feature dataset (1,217 rows)
├── requirements.txt                # Required Python packages with cloud-compatible versions
├── .gitignore                      # Git exclusion rules for clean repository pushes
├── .streamlit/
│   └── config.toml                 # Streamlit theme & fixed port 8502 configuration
├── README.md                       # Comprehensive platform documentation & deployment guide
├── README.txt                      # Original project readme
├── src/
│   ├── __init__.py
│   ├── theme.py                    # Dual-theme design tokens (Dark Obsidian & Light Studio), CSS, & Plotly styles
│   ├── data_engine.py              # Ingestion, feature recalculation, taxonomy mapping, & dynamic filter engine
│   ├── model_engine.py             # Preserved Random Forest model (RF-300), 80/20 chronological holdout, & scenario predictor
│   └── components/
│       ├── __init__.py
│       ├── html_utils.py           # Robust HTML rendering utility avoiding Markdown code-block traps
│       ├── welcome.py              # RetailPulse Welcome / Landing Page with animated visual accents & hero CTA
│       ├── navbar.py               # Executive top navigation bar with live status indicator
│       ├── sidebar.py              # Collapsible sidebar with theme toggle, navigation, & multi-select filters
│       ├── kpi_cards.py            # Executive KPI metric cards with growth badges & micro-interactions
│       ├── charts.py               # Plotly interactive visualizations (Timeline, Treemap, Pareto, Scenario, Heatmap, MDI)
│       ├── ai_insights.py          # Data-driven executive business summary & inventory replenishment advisor
│       └── export_reports.py       # Corporate ReportLab PDF briefing generator & structured CSV data exporter
└── tests/
    ├── test_phase1.py              # Numerical parity test (Baseline vs Modular Engine)
    ├── test_phase2.py              # Theme system, Plotly layout, & KPI markup test
    ├── test_phase3.py              # Interactive chart generation & data integrity test
    ├── test_phase4.py              # Dynamic AI insights & stockout risk logic test
    ├── test_phase5_integration.py  # Full end-to-end integration & export validation test
    ├── test_welcome_navigation.py  # Welcome screen rendering & two-way navigation test
    ├── test_theme_contrast.py       # WCAG AAA contrast & visibility audit
    └── test_html_rendering.py       # HTML rendering & code block trap prevention test
```

---

## ⚡ How to Run Locally on Windows (Permanent One-Click Launcher)

You do **not** need to type complex terminal commands every time you want to open the dashboard.

1. Double-click **`start_dashboard.bat`** in the project folder.
2. The launcher script will automatically:
   - Set the working directory to the project folder.
   - Locate the system Python installation.
   - Clean up any stale or lingering processes on port `8502`.
   - Verify all required Python packages.
   - Launch Streamlit pinned to port `8502`.
   - Automatically open Google Chrome / default browser to **`http://localhost:8502`**.
3. Keep the launcher window open while using the dashboard. When you are done, close the terminal window or press `Ctrl+C`.

---

## 🌐 Permanent Cloud Deployment (Access from School or Any Computer)

Deploying to **Streamlit Community Cloud** is completely free, takes 2 minutes, and gives you a permanent HTTPS URL (e.g., `https://retailpulse-demand.streamlit.app`) that works from any computer without running Python locally.

### Step 1: Create a GitHub Repository
1. Go to [github.com](https://github.com) and sign in (or create a free account).
2. Click the **`+`** icon in the top right corner $\rightarrow$ select **New repository**.
3. Name the repository: `retailpulse` (set to **Public** or **Private**).
4. Do NOT initialize with a README, .gitignore, or license (we already have them).
5. Click **Create repository**.

### Step 2: Push Project Files to GitHub
#### Option A: Using GitHub Web Interface (Drag & Drop)
1. On your newly created GitHub repository page, click the link: **"uploading an existing file"**.
2. Select all files and folders in `c:\Users\DELL\Desktop\backup- Copy` and drag them into the browser.
3. Commit the files.

#### Option B: Using Git / GitHub Desktop
```bash
git init
git add .
git commit -m "Deploy RetailPulse Dashboard"
git branch -M main
git remote add origin https://github.com/<YOUR-USERNAME>/retailpulse.git
git push -u origin main
```

### Step 3: Deploy on Streamlit Community Cloud
1. Go to [share.streamlit.io](https://share.streamlit.io) and click **Sign in with GitHub**.
2. Click **Create app** (or **Deploy an app**).
3. Fill in the fields:
   - **Repository**: `<YOUR-USERNAME>/retailpulse`
   - **Branch**: `main`
   - **Main file path**: `app.py`
   - **App URL**: Choose your custom URL (e.g., `retailpulse-forecast.streamlit.app`).
4. Click **Deploy!**
5. Within 60 seconds, your app will be live at its permanent HTTPS URL, accessible from your home PC, school computer, and mobile phone!

---

## 🔬 Mathematical Parity & Baseline Verification
All underlying forecasting and machine learning logic was strictly preserved:

| Metric / Forecast Output | Original Legacy Code | RetailPulse Platform | Numerical Variance | Status |
| :--- | :---: | :---: | :---: | :---: |
| **Holdout MAE** | `117.124641` | `117.124641` | `0.000000` | ✅ Exact Parity |
| **Holdout RMSE** | `163.766831` | `163.766831` | `0.000000` | ✅ Exact Parity |
| **Holdout $R^2$** | `0.676116` | `0.676116` | `0.000000` | ✅ Exact Parity |
| **Normal 7D Demand** | `2,274.951430` | `2,274.951430` | `0.000000` | ✅ Exact Parity |
| **Festive 7D Demand** | `7,108.481487` | `7,108.481487` | `0.000000` | ✅ Exact Parity |
| **Festive Surge ($\Delta$ Units)** | `+4,833.530056` | `+4,833.530056` | `0.000000` | ✅ Exact Parity |
| **Surge Percentage** | `+212.47%` | `+212.47%` | `0.00%` | ✅ Exact Parity |

---

## 🛠️ Required Dependencies (`requirements.txt`)
* `streamlit>=1.35.0`
* `pandas>=2.0.0`
* `numpy>=1.24.0`
* `scikit-learn>=1.3.0`
* `openpyxl>=3.1.0`
* `plotly>=5.15.0`
* `reportlab>=4.0.0`
