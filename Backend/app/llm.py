"""Single place that builds LLM clients so every agent shares the same provider wiring."""
from langchain_core.caches import BaseCache  # noqa: F401 - resolves ChatOpenAI's forward ref, prevents PydanticUserError
from langchain_openai import ChatOpenAI

from app.config import get_settings

ChatOpenAI.model_rebuild()


def get_chat_model(temperature: float = 0.2) -> ChatOpenAI:
    settings = get_settings()
    return ChatOpenAI(
        model=settings.llm_model,
        api_key=settings.llm_api_key,
        base_url=settings.llm_base_url,
        temperature=temperature,
        timeout=60,
    )
