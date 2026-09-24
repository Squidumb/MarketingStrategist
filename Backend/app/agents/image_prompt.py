from app.agents.factory import SimpleAgent
from app.prompts import render_prompt


def build_image_prompt_agent() -> SimpleAgent:
    return SimpleAgent(render_prompt("image_prompt.jinja"), temperature=0.7)
