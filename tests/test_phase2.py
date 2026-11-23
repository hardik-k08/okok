"""
tests/test_phase2.py
Verification Test for Phase 2: Theme System, Layout, Navbar, and KPI Card Components.
"""

import sys
import os

# Add workspace to path
sys.path.insert(0, os.path.abspath("."))

from src.theme import THEMES, get_plotly_layout
from src.components.kpi_cards import render_kpi_card
from src.data_engine import load_data, prepare_daily
from src.model_engine import (
    prepare_model_dataset,
    chronological_split,
    train_model,
    evaluate_model
)

def test_themes():
    print("Testing Theme Definitions...")
    for theme_name in ["dark", "light"]:
        assert theme_name in THEMES, f"Missing theme: {theme_name}"
        t = THEMES[theme_name]
        for key in ["bg_primary", "bg_secondary", "bg_card", "border_color", "text_primary", "accent_primary"]:
            assert key in t, f"Missing key {key} in theme {theme_name}"
        
        layout = get_plotly_layout(theme_name)
        assert "paper_bgcolor" in layout
        assert "plot_bgcolor" in layout
        assert "font" in layout
        assert "xaxis" in layout
        assert "yaxis" in layout
    print("  [✓] Dark and Light themes & Plotly layouts verified.")

def test_kpi_card_markup():
    print("Testing KPI Card Markup Generator...")
    card_html = render_kpi_card(
        title="Total Revenue",
        value="$269,667",
        delta="+212.5%",
        delta_type="positive",
        delta_label="vs Normal",
        icon="💰",
        badge="FY2025"
    )
    assert "Total Revenue" in card_html
    assert "$269,667" in card_html
    assert "+212.5%" in card_html
    assert "kpi-delta-positive" in card_html
    assert "kpi-card" in card_html
    print("  [✓] KPI card HTML markup verified.")

def test_model_preservation_in_phase2():
    print("Verifying Model Preserved In Phase 2...")
    raw = load_data("combined_transactions.csv")
    daily = prepare_daily(raw)
    model_df = prepare_model_dataset(daily)
    train, test = chronological_split(model_df, train_ratio=0.8)
    model = train_model(train, random_state=42)
    metrics = evaluate_model(model, test)
    
    assert abs(metrics["mae"] - 117.124641) < 1e-4, f"MAE shifted: {metrics['mae']}"
    assert abs(metrics["rmse"] - 163.766831) < 1e-4, f"RMSE shifted: {metrics['rmse']}"
    assert abs(metrics["r2"] - 0.676116) < 1e-4, f"R2 shifted: {metrics['r2']}"
    print(f"  [✓] Model calculations perfectly intact (MAE={metrics['mae']:.2f}, R2={metrics['r2']:.3f}).")

if __name__ == "__main__":
    test_themes()
    test_kpi_card_markup()
    test_model_preservation_in_phase2()
    print("\n>>> ALL PHASE 2 TESTS PASSED! <<<")
