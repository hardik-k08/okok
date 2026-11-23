# Retail Sales & Demand Forecasting

## Files
- `app.py` — Streamlit dashboard with one Random Forest model and normal/festival scenario comparison.
- `combined_transactions.csv` — cleaned combined transaction-level data (2,675 rows).
- `daily_product_features.csv` — product-by-calendar-day data with recalculated lag features.
- `requirements.txt` — Python dependencies.

## Run on Windows
1. Install Python 3.10+ and VS Code (or use Command Prompt).
2. Extract this ZIP into a folder.
3. Open Command Prompt in that folder.
4. Run:
   ```bash
   pip install -r requirements.txt
   streamlit run app.py
   ```
5. Streamlit opens the dashboard in your browser.

## Project method
The two files are tagged `Normal` (April-May 2025) and `Festive` (October-November 2025), then combined. The app aggregates transactions by product and date, recomputes lag/rolling features independently within each seasonal window, and trains one Random Forest Regressor to predict next-7-day product quantity. It then creates two scenario estimates and compares the results.

## Important limitations
This is a Class 12 educational prototype. There are only 10 products and one 61-day window for each season. The normal window is April-May 2025 (not May-June). The scenario difference should not be described as a proven causal festival effect. For stronger results, add multiple years and more products, then evaluate on a later unseen season/year.
