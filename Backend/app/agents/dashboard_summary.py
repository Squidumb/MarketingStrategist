from app.agents.factory import SimpleAgent
from app.prompts import render_prompt


def build_dashboard_summary_agent() -> SimpleAgent:
    return SimpleAgent(render_prompt("dashboard_summary.jinja"), temperature=0.3)
