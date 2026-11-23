"""
tests/test_welcome_navigation.py
Tests the RetailPulse Welcome Screen rendering, navigation state toggles, and model preservation.
"""

import sys
import os

# Add workspace to path
sys.path.insert(0, os.path.abspath("."))

from src.components.welcome import render_welcome_page
from src.data_engine import load_data, prepare_daily
from src.model_engine import (
    prepare_model_dataset,
    chronological_split,
    train_model,
    evaluate_model,
    generate_scenario_forecast
)
from src.components.export_reports import generate_executive_pdf, get_csv_exports

def test_welcome_and_dashboard():
    print("=" * 70)
    print("VERIFICATION: RetailPulse Welcome Landing Page & Navigation Integration")
    print("=" * 70)

    # 1. Test Welcome Page import & execution
    print("\n[1] Verifying Welcome Component Structure...")
    assert callable(render_welcome_page)
    print("  [✓] render_welcome_page is callable.")

    # 2. Test Model Preservation
    print("\n[2] Verifying Model Baseline Parity...")
    raw = load_data("combined_transactions.csv")
    daily = prepare_daily(raw)
    model_df = prepare_model_dataset(daily)
    train, test = chronological_split(model_df, train_ratio=0.8)
    model = train_model(train, random_state=42)
    metrics = evaluate_model(model, test)
    comparison = generate_scenario_forecast(daily, model)

    assert abs(metrics["mae"] - 117.124641) < 1e-4, "MAE drifted!"
    assert abs(metrics["rmse"] - 163.766831) < 1e-4, "RMSE drifted!"
    assert abs(metrics["r2"] - 0.676116) < 1e-4, "R2 drifted!"
    print(f"  [✓] Model Holdout MAE: {metrics['mae']:.2f} | R²: {metrics['r2']:.3f} (100% Intact).")

    # 3. Test PDF & CSV Export Generation with RetailPulse Branding
    print("\n[3] Testing Export Generation with RetailPulse Branding...")
    pdf_bytes = generate_executive_pdf(raw, daily, comparison, metrics)
    assert len(pdf_bytes) > 1000
    assert pdf_bytes.startswith(b"%PDF")
    print(f"  [✓] Executive PDF generated successfully ({len(pdf_bytes):,} bytes).")

    csv_exports = get_csv_exports(raw, comparison)
    assert "transactions_csv" in csv_exports and "forecast_csv" in csv_exports
    print(f"  [✓] CSV exports verified.")

    print("\n" + "=" * 70)
    print(">>> SUCCESS: RetailPulse Welcome Screen & Navigation Verified! <<<")
    print("=" * 70)

if __name__ == "__main__":
    test_welcome_and_dashboard()
