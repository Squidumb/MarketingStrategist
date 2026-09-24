"""Data-quality checks, ported from the old check.py — pure pandas logic, framework-agnostic."""
import json

import numpy as np
import pandas as pd

from app.db.connection import get_db


class NumpyEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, (np.integer, int)):
            return int(obj)
        if isinstance(obj, (np.floating, float)):
            return float(obj)
        if isinstance(obj, np.ndarray):
            return obj.tolist()
        return super().default(obj)


def check_data_quality(df: pd.DataFrame, table_name: str) -> dict:
    quality_report = {"table_name": table_name, "row_count": len(df), "issues": []}

    if table_name != "products_data":
        for col, count in df.isnull().sum().items():
            if count > 0:
                quality_report["issues"].append({"issue": f"Missing values detected in {col} ({count} records)"})

    if table_name == "customer_data":
        if not df[df.duplicated()].empty:
            quality_report["issues"].append({"issue": f"Duplicate rows detected ({len(df[df.duplicated()])} records)"})
        for col in ("user_id", "email", "phone_number"):
            if col in df.columns:
                dupes = df[df[col].duplicated(keep=False)]
                if not dupes.empty:
                    quality_report["issues"].append({"issue": f"Non-unique values detected in {col} ({len(dupes)} records)"})
        if "age" in df.columns:
            outliers = df[(df["age"] < 1) | (df["age"] > 100)]
            if not outliers.empty:
                quality_report["issues"].append({"issue": f"Outliers detected in age ({len(outliers)} records)"})
        if "gender" in df.columns:
            bad = df[~df["gender"].isin(["M", "F"])]
            if not bad.empty:
                quality_report["issues"].append({"issue": f"Invalid values detected in gender ({len(bad)} records)"})
        if "marital_status" in df.columns:
            bad = df[~df["marital_status"].isin(["M", "S"])]
            if not bad.empty:
                quality_report["issues"].append({"issue": f"Invalid values detected in marital_status ({len(bad)} records)"})

    if table_name == "products_data":
        for col in ("product_id", "product_name"):
            if col in df.columns:
                dupes = df[df[col].duplicated(keep=False)]
                if not dupes.empty:
                    quality_report["issues"].append({"issue": f"Non-unique values detected in {col} ({len(dupes)} records)"})

    if table_name == "interactions":
        if not df[df.duplicated()].empty:
            quality_report["issues"].append({"issue": f"Duplicate rows detected ({len(df[df.duplicated()])} records)"})
        if "interaction_id" in df.columns:
            dupes = df[df["interaction_id"].duplicated(keep=False)]
            if not dupes.empty:
                quality_report["issues"].append({"issue": f"Non-unique values detected in interaction_id ({len(dupes)} records)"})

    if table_name == "applications":
        today = pd.to_datetime("today").date()
        if "application_date" in df.columns:
            outliers = df[pd.to_datetime(df["application_date"], format="%d/%m/%y", errors="coerce").dt.date >= today]
            if not outliers.empty:
                quality_report["issues"].append({"issue": f"Outliers detected in application_date ({len(outliers)} records)"})
        if "application_amount" in df.columns:
            negatives = df[df["application_amount"] < 0]
            if not negatives.empty:
                quality_report["issues"].append({"issue": f"Negative values detected in application_amount ({len(negatives)} records)"})

    if table_name == "channel_performance":
        for col in (
            "budget", "application_revenue", "clicks", "impressions", "cost_per_mille",
            "click_through_rate_percentage", "conversions", "conversion_rate",
        ):
            if col in df.columns:
                negatives = df[df[col] < 0]
                if not negatives.empty:
                    quality_report["issues"].append({"issue": f"Negative values detected in {col} ({len(negatives)} records)"})

    return quality_report


def check_table(table_name: str) -> dict:
    df = pd.read_sql(f"SELECT * FROM {table_name}", get_db().get_connection())
    return check_data_quality(df, table_name)
