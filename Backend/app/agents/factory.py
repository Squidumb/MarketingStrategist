"""Shared helpers for building agents so each role file stays a thin, declarative definition.

Agents generate plain text (SQL, search queries, summaries) which the workflow executes directly —
deliberately avoiding provider tool/function-calling, since many free/open-source models don't
support it. This keeps the stack working with any OpenAI-compatible chat model.
"""
from langchain_core.messages import HumanMessage, SystemMessage

from app.llm import get_chat_model


class SimpleAgent:
    """A single LLM call bound to a fixed system prompt."""

    def __init__(self, system_prompt: str, temperature: float = 0.2):
        self._system_prompt = system_prompt
        self._llm = get_chat_model(temperature=temperature)

    def run(self, user_message: str) -> str:
        messages = [SystemMessage(content=self._system_prompt), HumanMessage(content=user_message)]
        response = self._llm.invoke(messages)
        return response.content


def clean_sql(text: str) -> str:
    """Strips code fences / language hints the model may add around a SQL query."""
    text = text.strip()
    if text.startswith("```"):
        text = text.strip("`")
        if "\n" in text:
            first_line, rest = text.split("\n", 1)
            text = rest if first_line.strip().lower() in ("sql", "sqlite", "") else text
    return text.strip()
