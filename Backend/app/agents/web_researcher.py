from app.agents.factory import SimpleAgent
from app.prompts import render_prompt


def build_web_researcher_agent() -> SimpleAgent:
    """Summarizes search results already fetched by the workflow (search_web)."""
    return SimpleAgent(render_prompt("web_researcher.jinja"), temperature=0.3)
