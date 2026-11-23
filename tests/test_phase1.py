"""
tests/test_phase1.py
Rigorous Verification Test:
Asserts 100% calculation parity between original app.py logic and new modular engine.
"""

import sys
import os
import numpy as np
import pandas as pd

# Add workspace to path
sys.path.insert(0, os.path.abspath("."))

from src.data_engine import load_data, prepare_daily
from src.model_engine import (
    FEATURES,
    prepare_model_dataset,
    chronological_split,
    train_model,
    evaluate_model,
    generate_scenario_forecast,
    get_feature_importances
)

def run_legacy_baseline():
    """Runs original code logic from app.py verbatim."""
    raw = pd.read_csv("combined_transactions.csv", parse_dates=["InvoiceDate", "Date"])
    raw["Quantity"] = pd.to_numeric(raw["Quantity"], errors="coerce")
    raw["UnitPrice"] = pd.to_numeric(raw["UnitPrice"], errors="coerce")
    raw["Total Sales"] = pd.to_numeric(raw["Total Sales"], errors="coerce")

    raw_clean = raw.dropna(subset=["InvoiceDate", "StockCode", "Quantity", "UnitPrice"]).copy()
    raw_clean = raw_clean[raw_clean["Quantity"] > 0]
    raw_clean["Date"] = raw_clean["InvoiceDate"].dt.normalize()
    d = (raw_clean.groupby(["Season_Type","StockCode","Description","Date"], as_index=False)
         .agg(Quantity=("Quantity","sum"), UnitPrice=("UnitPrice","mean"),
              Revenue=("Total Sales","sum")))
    blocks = []
    for (season, code, desc), g in d.groupby(["Season_Type","StockCode","Description"]):
        idx = pd.date_range(g.Date.min(), g.Date.max(), freq="D")
        z = g.set_index("Date").reindex(idx)
        z.index.name = "Date"
        z["Quantity"] = z["Quantity"].fillna(0)
        z["Revenue"] = z["Revenue"].fillna(0)
        z["UnitPrice"] = z["UnitPrice"].ffill().bfill()
        z["Season_Type"] = season
        z["StockCode"] = code
        z["Description"] = desc
        blocks.append(z.reset_index())
    daily = pd.concat(blocks, ignore_index=True).sort_values(["Season_Type","StockCode","Date"])
    daily["Season_Code"] = (daily.Season_Type == "Festive").astype(int)
    daily["DayOfWeek"] = daily.Date.dt.dayofweek
    daily["DayOfMonth"] = daily.Date.dt.day
    daily["Month"] = daily.Date.dt.month
    grp = daily.groupby(["Season_Type","StockCode"])
    for lag in [1,7,30]:
        daily[f"Qty_Lag_{lag}"] = grp["Quantity"].shift(lag)
    for win in [7,30]:
        daily[f"Qty_Rolling_Avg_{win}"] = daily.groupby(["Season_Type","StockCode"])["Quantity"].transform(
            lambda s: s.shift(1).rolling(win, min_periods=1).mean())
    daily["Target_Next_7D"] = daily.groupby(["Season_Type","StockCode"])["Quantity"].transform(
        lambda s: s.shift(-1).rolling(7, min_periods=7).sum().shift(-6))

    model_df = daily.dropna(subset=["Target_Next_7D"]).copy()
    model_df[FEATURES] = model_df[FEATURES].fillna(0)

    train_parts, test_parts = [], []
    for season, g in model_df.groupby("Season_Type"):
        dates = sorted(g.Date.unique())
        cutoff = dates[max(1, int(len(dates) * 0.8)) - 1]
        train_parts.append(g[g.Date <= cutoff])
        test_parts.append(g[g.Date > cutoff])
    train = pd.concat(train_parts, ignore_index=True)
    test = pd.concat(test_parts, ignore_index=True)

    from sklearn.ensemble import RandomForestRegressor
    from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score

    model = RandomForestRegressor(n_estimators=300, max_depth=10, min_samples_leaf=2,
                                  random_state=42, n_jobs=-1)
    model.fit(train[FEATURES], train["Target_Next_7D"])
    pred_test = model.predict(test[FEATURES])
    mae = mean_absolute_error(test["Target_Next_7D"], pred_test)
    rmse = mean_squared_error(test["Target_Next_7D"], pred_test) ** 0.5
    r2 = r2_score(test["Target_Next_7D"], pred_test)

    normal_latest = daily[daily.Season_Type=="Normal"].sort_values("Date").groupby("StockCode").tail(1).copy()
    festive_latest = daily[daily.Season_Type=="Festive"].sort_values("Date").groupby("StockCode").tail(1).copy()

    def scenario_predict(frame, season_code, month):
        x = frame.copy()
        x["Season_Code"] = season_code
        x["Month"] = month
        next_dates = x["Date"] + pd.Timedelta(days=1)
        x["DayOfWeek"] = next_dates.dt.dayofweek
        x["DayOfMonth"] = next_dates.dt.day
        x[FEATURES] = x[FEATURES].fillna(0)
        x["Predicted_7D_Quantity"] = np.maximum(0, model.predict(x[FEATURES]))
        return x[["StockCode","Description","Predicted_7D_Quantity"]]

    normal_pred = scenario_predict(normal_latest, 0, 5).rename(columns={"Predicted_7D_Quantity":"Normal_Predicted_7D"})
    festive_pred = scenario_predict(festive_latest, 1, 11).rename(columns={"Predicted_7D_Quantity":"Festive_Predicted_7D"})
    comparison = normal_pred.merge(festive_pred, on=["StockCode","Description"], how="inner")
    comparison["Difference_Units"] = comparison["Festive_Predicted_7D"] - comparison["Normal_Predicted_7D"]
    comparison["Variation_%"] = np.where(comparison["Normal_Predicted_7D"] > 0,
        comparison["Difference_Units"] / comparison["Normal_Predicted_7D"] * 100, np.nan)
    comparison = comparison.sort_values("Festive_Predicted_7D", ascending=False).reset_index(drop=True)

    return {
        "mae": mae,
        "rmse": rmse,
        "r2": r2,
        "normal_total": comparison.Normal_Predicted_7D.sum(),
        "festive_total": comparison.Festive_Predicted_7D.sum(),
        "diff_total": comparison.Difference_Units.sum(),
        "comparison": comparison
    }

def test_phase1():
    print("=" * 70)
    print("PHASE 1 VERIFICATION: Legacy Baseline vs New Modular Engine")
    print("=" * 70)

    # 1. Run Legacy Baseline
    baseline = run_legacy_baseline()
    print("\n[1] Legacy Baseline Results:")
    print(f"  Holdout MAE:        {baseline['mae']:.6f}")
    print(f"  Holdout RMSE:       {baseline['rmse']:.6f}")
    print(f"  Holdout R2:         {baseline['r2']:.6f}")
    print(f"  Normal 7D Total:    {baseline['normal_total']:.6f}")
    print(f"  Festive 7D Total:   {baseline['festive_total']:.6f}")
    print(f"  Net Surge (Units):  {baseline['diff_total']:.6f}")

    # 2. Run New Engine
    raw = load_data("combined_transactions.csv")
    daily = prepare_daily(raw)
    model_df = prepare_model_dataset(daily)
    train, test = chronological_split(model_df, train_ratio=0.8)
    model = train_model(train, random_state=42)
    eval_res = evaluate_model(model, test)
    forecast = generate_scenario_forecast(daily, model)

    new_results = {
        "mae": eval_res["mae"],
        "rmse": eval_res["rmse"],
        "r2": eval_res["r2"],
        "normal_total": forecast["Normal_Predicted_7D"].sum(),
        "festive_total": forecast["Festive_Predicted_7D"].sum(),
        "diff_total": forecast["Difference_Units"].sum(),
        "comparison": forecast
    }

    print("\n[2] Modular Engine Results:")
    print(f"  Holdout MAE:        {new_results['mae']:.6f}")
    print(f"  Holdout RMSE:       {new_results['rmse']:.6f}")
    print(f"  Holdout R2:         {new_results['r2']:.6f}")
    print(f"  Normal 7D Total:    {new_results['normal_total']:.6f}")
    print(f"  Festive 7D Total:   {new_results['festive_total']:.6f}")
    print(f"  Net Surge (Units):  {new_results['diff_total']:.6f}")

    # 3. Assertions
    np.testing.assert_allclose(new_results["mae"], baseline["mae"], rtol=1e-5, err_msg="MAE mismatch")
    np.testing.assert_allclose(new_results["rmse"], baseline["rmse"], rtol=1e-5, err_msg="RMSE mismatch")
    np.testing.assert_allclose(new_results["r2"], baseline["r2"], rtol=1e-5, err_msg="R2 mismatch")
    np.testing.assert_allclose(new_results["normal_total"], baseline["normal_total"], rtol=1e-5, err_msg="Normal total mismatch")
    np.testing.assert_allclose(new_results["festive_total"], baseline["festive_total"], rtol=1e-5, err_msg="Festive total mismatch")
    np.testing.assert_allclose(new_results["diff_total"], baseline["diff_total"], rtol=1e-5, err_msg="Diff total mismatch")

    # Assert product level forecast exact match
    b_comp = baseline["comparison"].sort_values("StockCode").reset_index(drop=True)
    n_comp = new_results["comparison"].sort_values("StockCode").reset_index(drop=True)
    np.testing.assert_allclose(b_comp["Normal_Predicted_7D"], n_comp["Normal_Predicted_7D"], rtol=1e-5)
    np.testing.assert_allclose(b_comp["Festive_Predicted_7D"], n_comp["Festive_Predicted_7D"], rtol=1e-5)

    # Check Feature Importances
    fi = get_feature_importances(model)
    print("\n[3] Feature Importance Breakdown:")
    for _, row in fi.head(5).iterrows():
        print(f"  - {row['Feature_Label']:30s}: {row['Importance']:.4f}")

    print("\n" + "=" * 70)
    print(">>> SUCCESS: 100% Numerical Parity Confirmed across all metrics! <<<")
    print("=" * 70)

if __name__ == "__main__":
    test_phase1()
