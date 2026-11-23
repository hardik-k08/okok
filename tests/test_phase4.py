"""
tests/test_phase4.py
Verification Test for Phase 4: Dynamic AI Business Insights & Inventory Advisor.
Tests calculation accuracy, risk assignment, and statistical integrity against actual data.
"""

import sys
import os
import pandas as pd
import numpy as np

# Add workspace to path
sys.path.insert(0, os.path.abspath("."))

from src.data_engine import load_data, prepare_daily
from src.model_engine import (
    prepare_model_dataset,
    chronological_split,
    train_model,
    evaluate_model,
    generate_scenario_forecast
)
from src.components.ai_insights import (
    generate_executive_ai_summary,
    generate_replenishment_table
)

def test_ai_insights_integrity():
    print("=" * 70)
    print("PHASE 4 VERIFICATION: Dynamic AI Business Insights & Inventory Advisor")
    print("=" * 70)

    # 1. Ingest actual data & run model
    raw = load_data("combined_transactions.csv")
    daily = prepare_daily(raw)
    model_df = prepare_model_dataset(daily)
    train, test = chronological_split(model_df, train_ratio=0.8)
    model = train_model(train, random_state=42)
    eval_res = evaluate_model(model, test)
    comparison = generate_scenario_forecast(daily, model)

    # Verify model accuracy preserved
    assert abs(eval_res["mae"] - 117.124641) < 1e-4
    print(f"[1] Model Holdout MAE: {eval_res['mae']:.2f} | R2: {eval_res['r2']:.3f} (Verified)")

    # 2. Test Executive AI Summary calculations
    summary = generate_executive_ai_summary(raw, daily, comparison)
    print("\n[2] Executive AI Summary Metrics:")
    print(f"  Total Historical Revenue:      ${summary['total_revenue']:,.2f}")
    print(f"  Total Historical Units:        {summary['total_quantity']:,}")
    print(f"  Total Transactions:            {summary['total_transactions']:,}")
    print(f"  Avg Order Value (AOV):         ${summary['aov']:.2f}")
    print(f"  Predicted Normal 7D Demand:    {summary['total_normal_7d']:,.1f} units")
    print(f"  Predicted Festive 7D Demand:   {summary['total_festive_7d']:,.1f} units")
    print(f"  Predicted Net Surge:           {summary['diff_units']:+,.1f} units ({summary['surge_pct']:+.1f}%)")
    print(f"  Projected Incremental Rev:     ${summary['projected_incremental_rev']:+,.2f}")
    print(f"  Top Surge SKU:                 {summary['top_surge_sku']} ({summary['top_surge_pct']:+.1f}%)")
    print(f"  Top 1 SKU Revenue Share:       {summary['top1_share']:.1f}%")
    print(f"  Top 3 SKUs Revenue Share:      {summary['top3_share']:.1f}%")

    assert summary["total_transactions"] == 2675
    assert abs(summary["total_normal_7d"] - 2274.95) < 0.1
    assert abs(summary["total_festive_7d"] - 7108.48) < 0.1
    assert abs(summary["surge_pct"] - 212.47) < 0.1
    assert summary["projected_incremental_rev"] > 0
    print("  [✓] Executive Summary dynamic calculations verified.")

    # 3. Test Inventory Replenishment & Stockout Risk Table
    rep_df = generate_replenishment_table(comparison, raw)
    print("\n[3] Product Replenishment & Vulnerability Analysis:")
    for _, r in rep_df.iterrows():
        print(f"  - {r['StockCode']:6s} | {r['Description'][:25]:25s} | Mult: {r['Surge_Multiplier']:.2f}x | Var: {r['Variation_%']:+6.1f}% | Risk: {r['Stockout_Risk']:8s}")

    # Verify Risk Classification
    high_risk_skus = rep_df[rep_df["Stockout_Risk"] == "High"]["StockCode"].tolist()
    assert "22633" in high_risk_skus   # Hand Warmer (+391.5%)
    assert "22728" in high_risk_skus   # Pink Alarm Clock (+278.4%)
    assert "22727" in high_risk_skus   # Red Alarm Clock (+237.0%)
    assert len(rep_df) == 10
    assert not rep_df["Daily_Run_Rate"].isna().any()
    assert not rep_df["Surge_Multiplier"].isna().any()
    print("  [✓] Stockout Vulnerability classification logic verified.")

    print("\n" + "=" * 70)
    print(">>> SUCCESS: Phase 4 AI Business Insights & Inventory Advisor verified! <<<")
    print("=" * 70)

if __name__ == "__main__":
    test_ai_insights_integrity()
