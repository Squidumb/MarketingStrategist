from app.agents.factory import SimpleAgent
from app.prompts import render_prompt


def build_data_quality_sql_agent() -> SimpleAgent:
    return SimpleAgent(render_prompt("data_quality_sql_expert.jinja"), temperature=0.1)
