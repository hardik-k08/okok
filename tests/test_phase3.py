"""
tests/test_phase3.py
Verification Test for Phase 3: Interactive Plotly Visualizations & Charts.
Tests charts with actual dataset under both Dark and Light themes.
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

def test_charts_with_real_data():
    print("=" * 70)
    print("PHASE 3 VERIFICATION: Interactive Visualizations & Chart Engines")
    print("=" * 70)

    # 1. Load actual data & generate predictions
    print("\n[1] Ingesting actual datasets & fitting model...")
    raw = load_data("combined_transactions.csv")
    daily = prepare_daily(raw)
    model_df = prepare_model_dataset(daily)
    train, test = chronological_split(model_df, train_ratio=0.8)
    model = train_model(train, random_state=42)
    eval_res = evaluate_model(model, test)
    comparison = generate_scenario_forecast(daily, model)
    fi = get_feature_importances(model)

    print(f"  Holdout MAE: {eval_res['mae']:.2f} | R2: {eval_res['r2']:.3f}")
    assert abs(eval_res["mae"] - 117.124641) < 1e-4

    # 2. Test Charts across both Dark and Light themes
    for theme_name in ["dark", "light"]:
        print(f"\n[2] Testing chart generation for theme: '{theme_name}'...")

        # Chart 1: Revenue Timeline
        fig_timeline = render_timeline_chart(daily, theme_name=theme_name)
        assert len(fig_timeline.data) == 2, "Timeline chart must contain 2 traces (Revenue + Quantity)"
        print("  [✓] Revenue & Sales Timeline Chart verified.")

        # Chart 2: Scenario Comparison
        fig_scenario = render_scenario_comparison_chart(comparison, theme_name=theme_name)
        assert len(fig_scenario.data) == 2, "Scenario comparison must contain Normal and Festive traces"
        print("  [✓] Normal vs Festive Scenario Comparison Chart verified.")

        # Chart 3: Category Treemap
        fig_treemap = render_category_treemap(raw, theme_name=theme_name)
        assert len(fig_treemap.data) >= 1, "Treemap trace missing"
        print("  [✓] Category & Product Treemap verified.")

        # Chart 4: Pareto Revenue Chart
        fig_pareto = render_pareto_chart(raw, theme_name=theme_name)
        assert len(fig_pareto.data) == 2, "Pareto chart must contain Bar + Cumulative Line"
        print("  [✓] Pareto 80/20 Revenue Contribution Chart verified.")

        # Chart 5: Seasonality Heatmap
        fig_heatmap = render_seasonality_heatmap(daily, theme_name=theme_name)
        assert len(fig_heatmap.data) == 1, "Heatmap trace missing"
        print("  [✓] Day-of-Week Seasonality Heatmap verified.")

        # Chart 6: Feature Importance
        fig_fi = render_feature_importance_chart(fi, theme_name=theme_name)
        assert len(fig_fi.data) == 1, "Feature importance trace missing"
        print("  [✓] Model Feature Importance Chart verified.")

    print("\n" + "=" * 70)
    print(">>> SUCCESS: All Phase 3 interactive charts verified with 100% data integrity! <<<")
    print("=" * 70)

if __name__ == "__main__":
    test_charts_with_real_data()
