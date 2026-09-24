from app.agents.factory import SimpleAgent
from app.prompts import render_prompt


def build_sql_expert_agent() -> SimpleAgent:
    """Writes SQL as plain text; the workflow executes it via execute_sql directly."""
    return SimpleAgent(render_prompt("sql_expert.jinja"), temperature=0.1)
