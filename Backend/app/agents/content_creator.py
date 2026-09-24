from app.agents.factory import SimpleAgent
from app.prompts import render_prompt


def build_content_creator_agent() -> SimpleAgent:
    return SimpleAgent(render_prompt("content_creator.jinja"), temperature=0.6)
