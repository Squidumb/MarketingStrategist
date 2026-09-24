from app.agents.factory import SimpleAgent
from app.prompts import render_prompt


def build_data_cleaner_agent() -> SimpleAgent:
    return SimpleAgent(render_prompt("data_cleaner.jinja"), temperature=0.1)
