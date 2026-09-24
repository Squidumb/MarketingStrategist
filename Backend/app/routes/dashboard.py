from fastapi import APIRouter
from pydantic import BaseModel

from app.agents.dashboard_summary import build_dashboard_summary_agent
from app.repositories import dashboard_repo

router = APIRouter(tags=["dashboard"])


@router.get("/get-dashboard-data")
def summary_stats():
    return dashboard_repo.get_summary_stats()


@router.get("/get-filtered-data")
def get_filtered_data():
    return dashboard_repo.get_filtered_data()


class DashboardSummaryRequest(BaseModel):
    type: str = "short"
    data: dict = {}


@router.post("/get-dashboard-summary")
def get_dashboard_summary(payload: DashboardSummaryRequest):
    agent = build_dashboard_summary_agent()
    message = f"Please provide a {payload.type} summary of this card data:\n{payload.data}"
    return {"summary": agent.run(message), "type": payload.type}
