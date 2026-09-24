from app.agents.factory import SimpleAgent
from app.prompts import render_prompt


def build_response_agent() -> SimpleAgent:
    return SimpleAgent(render_prompt("response_agent.jinja"), temperature=0.4)
