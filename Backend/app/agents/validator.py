from app.agents.factory import SimpleAgent
from app.prompts import render_prompt


def build_validator_agent() -> SimpleAgent:
    return SimpleAgent(render_prompt("validator.jinja"), temperature=0.1)


def is_valid_query(response_text: str) -> bool:
    return "valid banking query. proceed" in response_text.lower()
