
import streamlit as st
import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score

st.set_page_config(page_title="Retail Demand Forecasting", page_icon="📦", layout="wide")
st.title("📦 Retail Sales & Demand Forecasting")
st.caption("One Random Forest model • Normal vs Festival demand scenarios")

DATA_PATH = "combined_transactions.csv"
FEATURES = ["Season_Code", "DayOfWeek", "DayOfMonth", "Month", "UnitPrice",
            "Qty_Lag_1", "Qty_Lag_7", "Qty_Lag_30",
            "Qty_Rolling_Avg_7", "Qty_Rolling_Avg_30"]

@st.cache_data
def load_data():
    df = pd.read_csv(DATA_PATH, parse_dates=["InvoiceDate", "Date"])
    df["Quantity"] = pd.to_numeric(df["Quantity"], errors="coerce")
    df["UnitPrice"] = pd.to_numeric(df["UnitPrice"], errors="coerce")
    df["Total Sales"] = pd.to_numeric(df["Total Sales"], errors="coerce")
    return df

@st.cache_data
def prepare_daily(raw):
    raw = raw.dropna(subset=["InvoiceDate", "StockCode", "Quantity", "UnitPrice"]).copy()
    raw = raw[raw["Quantity"] > 0]
    raw["Date"] = raw["InvoiceDate"].dt.normalize()
    d = (raw.groupby(["Season_Type","StockCode","Description","Date"], as_index=False)
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
    return daily

raw = load_data()
daily = prepare_daily(raw)
# Missing lag values mean there is not yet enough history; zero is a transparent start-of-period fallback.
model_df = daily.dropna(subset=["Target_Next_7D"]).copy()
model_df[FEATURES] = model_df[FEATURES].fillna(0)

# Chronological holdout: last 20% of dates in each season are test data.
train_parts, test_parts = [], []
for season, g in model_df.groupby("Season_Type"):
    dates = sorted(g.Date.unique())
    cutoff = dates[max(1, int(len(dates) * 0.8)) - 1]
    train_parts.append(g[g.Date <= cutoff])
    test_parts.append(g[g.Date > cutoff])
train = pd.concat(train_parts)
test = pd.concat(test_parts)

model = RandomForestRegressor(n_estimators=300, max_depth=10, min_samples_leaf=2,
                              random_state=42, n_jobs=-1)
model.fit(train[FEATURES], train["Target_Next_7D"])
pred_test = model.predict(test[FEATURES])
mae = mean_absolute_error(test["Target_Next_7D"], pred_test)
rmse = mean_squared_error(test["Target_Next_7D"], pred_test) ** 0.5
r2 = r2_score(test["Target_Next_7D"], pred_test) if len(test) > 1 else float("nan")

st.info("Forecast target: total product quantity over the NEXT 7 days. The model is trained once on both seasonal datasets; the season flag is changed to compare scenarios.")
c1,c2,c3,c4 = st.columns(4)
c1.metric("Transactions", f"{len(raw):,}")
c2.metric("Product-day rows", f"{len(daily):,}")
c3.metric("Products", f"{raw.StockCode.nunique():,}")
c4.metric("Model test MAE", f"{mae:.2f} units")
st.caption(f"Chronological holdout metrics — RMSE: {rmse:.2f} units | R²: {r2:.3f}. Small dataset: treat metrics and forecasts as an educational prototype, not a guaranteed business forecast.")

st.subheader("Normal vs Festival scenario prediction")
st.write("For each product, the app uses the latest available history within each season, then predicts the next 7-day demand with the same trained model.")
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

# Forecast each scenario using the matching season's latest product history.
normal_pred = scenario_predict(normal_latest, 0, 5).rename(columns={"Predicted_7D_Quantity":"Normal_Predicted_7D"})
festive_pred = scenario_predict(festive_latest, 1, 11).rename(columns={"Predicted_7D_Quantity":"Festive_Predicted_7D"})
comparison = normal_pred.merge(festive_pred, on=["StockCode","Description"], how="inner")
comparison["Difference_Units"] = comparison["Festive_Predicted_7D"] - comparison["Normal_Predicted_7D"]
comparison["Variation_%"] = np.where(comparison["Normal_Predicted_7D"] > 0,
    comparison["Difference_Units"] / comparison["Normal_Predicted_7D"] * 100, np.nan)
comparison = comparison.sort_values("Festive_Predicted_7D", ascending=False)

total_normal = comparison.Normal_Predicted_7D.sum()
total_festive = comparison.Festive_Predicted_7D.sum()
total_diff = total_festive - total_normal
a,b,c = st.columns(3)
a.metric("Normal predicted demand (7 days)", f"{total_normal:,.1f} units")
b.metric("Festival predicted demand (7 days)", f"{total_festive:,.1f} units")
c.metric("Festival − Normal", f"{total_diff:+,.1f} units",
         delta=f"{(total_diff/total_normal*100):+.1f}%" if total_normal else None)
st.dataframe(comparison.style.format({
    "Normal_Predicted_7D":"{:.1f}", "Festive_Predicted_7D":"{:.1f}",
    "Difference_Units":"{:+.1f}", "Variation_%":"{:+.1f}%"
}), use_container_width=True)

st.subheader("Demand comparison chart")
chart = comparison.set_index("Description")[["Normal_Predicted_7D","Festive_Predicted_7D"]]
st.bar_chart(chart)

st.subheader("Revenue and quantity overview")
season_summary = raw.groupby("Season_Type", as_index=False).agg(
    Total_Quantity=("Quantity","sum"), Total_Revenue=("Total Sales","sum"),
    Transactions=("InvoiceNo","count"))
st.dataframe(season_summary, use_container_width=True)
st.bar_chart(season_summary.set_index("Season_Type")[["Total_Revenue"]])

st.download_button("Download product-wise comparison CSV",
    comparison.to_csv(index=False).encode("utf-8"),
    file_name="normal_vs_festival_prediction.csv", mime="text/csv")

with st.expander("Methodology and limitations"):
    st.markdown("""
    - Raw transactions are aggregated to **product + calendar date**.
    - Missing dates within each product-season window are filled with zero quantity.
    - Lag and rolling features are recalculated separately within each season to prevent April/May history leaking into October/November.
    - The target is the sum of the **next 7 calendar days**, not the current day's quantity.
    - One Random Forest model is trained on both seasons with `Season_Code` (Normal = 0, Festival = 1).
    - The last 20% of dates in each season are held out chronologically for a basic evaluation.
    - The two scenario forecasts use each season's latest available product history. They are scenario estimates from limited historical windows, not proof that festivals caused the difference.
    - With only 10 products and two 61-day windows, results are suitable for a school prototype; more years of data are needed for robust seasonal conclusions.
    """)
