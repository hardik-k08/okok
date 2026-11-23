"""
tests/test_phase5_integration.py
Comprehensive End-to-End Integration Test for NexusBI Retail Intelligence Platform.
Validates:
- Baseline Model Preservation (MAE, RMSE, R²)
- All 5 Analytical Dashboard Views
- Dynamic Multi-criteria Filtering
- PDF & CSV Export Generation
"""

import sys
import os
import pandas as pd
import numpy as np

# Add workspace to path
sys.path.insert(0, os.path.abspath("."))

from src.data_engine import load_data, prepare_daily, filter_transactions
from src.model_engine import (
    prepare_model_dataset,
    chronological_split,
    train_model,
    evaluate_model,
    generate_scenario_forecast,
    get_feature_importances
)
from src.components.charts import (
    render_timeline_chart,
    render_scenario_comparison_chart,
    render_category_treemap,
    render_pareto_chart,
    render_seasonality_heatmap,
    render_feature_importance_chart
)
from src.components.ai_insights import (
    generate_executive_ai_summary,
    generate_replenishment_table
)
from src.components.export_reports import generate_executive_pdf, get_csv_exports
from src.theme import THEMES, get_plotly_layout

def test_full_application():
    print("=" * 75)
    print("PHASE 5 COMPREHENSIVE INTEGRATION & ACCURACY TEST")
    print("=" * 75)

    # 1. Ingestion & Preprocessing
    print("\n[Step 1] Loading raw transactions & generating daily features...")
    raw = load_data("combined_transactions.csv")
    assert len(raw) == 2675, f"Expected 2675 transactions, got {len(raw)}"
    assert "Category" in raw.columns, "Category column must be enriched"
    assert raw["StockCode"].nunique() == 10, "Expected 10 unique SKUs"
    print(f"  [✓] Loaded {len(raw):,} transactions across {raw['Category'].nunique()} categories.")

    daily = prepare_daily(raw)
    assert len(daily) == 1217, f"Expected 1217 daily product records, got {len(daily)}"
    print(f"  [✓] Prepared {len(daily):,} daily feature records.")

    # 2. Model Training & Accuracy Parity Check
    print("\n[Step 2] Executing Random Forest Regressor & Holdout Evaluation...")
    model_df = prepare_model_dataset(daily)
    train, test = chronological_split(model_df, train_ratio=0.8)
    model = train_model(train, random_state=42)
    metrics = evaluate_model(model, test)
    fi_df = get_feature_importances(model)
    comparison = generate_scenario_forecast(daily, model)

    print(f"  Holdout MAE:  {metrics['mae']:.6f} (Target baseline: 117.124641)")
    print(f"  Holdout RMSE: {metrics['rmse']:.6f} (Target baseline: 163.766831)")
    print(f"  Holdout R²:   {metrics['r2']:.6f} (Target baseline: 0.676116)")

    # Assert exact match to baseline
    np.testing.assert_allclose(metrics["mae"], 117.124641, rtol=1e-5, err_msg="MAE drifted from baseline!")
    np.testing.assert_allclose(metrics["rmse"], 163.766831, rtol=1e-5, err_msg="RMSE drifted from baseline!")
    np.testing.assert_allclose(metrics["r2"], 0.676116, rtol=1e-5, err_msg="R2 drifted from baseline!")
    print("  [✓] 100% Numerical Parity Confirmed against original project baseline.")

    # 3. Dynamic Filter Simulation
    print("\n[Step 3] Simulating user filter interactions...")
    # Filter by 2 categories: Seasonal Warmth and Clocks & Decor
    test_cats = ["Seasonal Warmth", "Clocks & Decor"]
    filtered_raw = filter_transactions(raw, categories=test_cats)
    filtered_daily = daily[daily["Category"].isin(test_cats)]
    filtered_codes = filtered_raw["StockCode"].unique()
    filtered_comp = comparison[comparison["StockCode"].isin(filtered_codes)]

    assert len(filtered_raw) > 0, "Filtered slice is empty"
    assert len(filtered_comp) == 6, f"Expected 6 SKUs for 2 categories, got {len(filtered_comp)}"
    
    # Check that summary computes correctly on filtered slice
    filtered_summary = generate_executive_ai_summary(filtered_raw, filtered_daily, filtered_comp)
    assert filtered_summary["total_transactions"] == len(filtered_raw)
    assert filtered_summary["total_revenue"] == filtered_raw["Total Sales"].sum()
    print(f"  [✓] Filter reactivity verified on {len(filtered_raw):,} orders across {len(filtered_comp)} SKUs.")

    # 4. Interactive Visualizations under Both Themes
    print("\n[Step 4] Verifying all chart renderers with theme harmonization...")
    for theme_name in ["dark", "light"]:
        fig1 = render_timeline_chart(daily, theme_name=theme_name)
        fig2 = render_scenario_comparison_chart(comparison, theme_name=theme_name)
        fig3 = render_category_treemap(raw, theme_name=theme_name)
        fig4 = render_pareto_chart(raw, theme_name=theme_name)
        fig5 = render_seasonality_heatmap(daily, theme_name=theme_name)
        fig6 = render_feature_importance_chart(fi_df, theme_name=theme_name)
        assert fig1 and fig2 and fig3 and fig4 and fig5 and fig6
    print("  [✓] All 6 interactive charts render cleanly in both Dark and Light themes.")

    # 5. Executive PDF & CSV Exports
    print("\n[Step 5] Testing Corporate PDF and CSV Export Engines...")
    pdf_bytes = generate_executive_pdf(raw, daily, comparison, metrics)
    assert len(pdf_bytes) > 1000, "PDF bytes should be non-empty"
    assert pdf_bytes.startswith(b"%PDF"), "Generated file is not a valid PDF binary"
    print(f"  [✓] Generated valid Executive PDF ({len(pdf_bytes):,} bytes).")

    csv_dict = get_csv_exports(raw, comparison)
    assert "transactions_csv" in csv_dict and len(csv_dict["transactions_csv"]) > 0
    assert "forecast_csv" in csv_dict and len(csv_dict["forecast_csv"]) > 0
    print(f"  [✓] Generated Filtered Transactions CSV ({len(csv_dict['transactions_csv']):,} bytes).")
    print(f"  [✓] Generated 7-Day Forecast & Replenishment CSV ({len(csv_dict['forecast_csv']):,} bytes).")

    print("\n" + "=" * 75)
    print(">>> FINAL INTEGRATION SUCCESS: 100% Tests Passed, Zero Regressions! <<<")
    print("=" * 75)

if __name__ == "__main__":
    test_full_application()
