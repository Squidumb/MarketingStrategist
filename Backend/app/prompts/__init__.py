"""Renders prompt templates with domain config + schema, so agent code never contains brand/business text."""
from functools import lru_cache
from pathlib import Path

from jinja2 import Environment, FileSystemLoader

from app.config import get_domain_config
from app.db.schema import get_data_dictionary

PROMPTS_DIR = Path(__file__).resolve().parent


@lru_cache
def _env() -> Environment:
    return Environment(loader=FileSystemLoader(str(PROMPTS_DIR)))


def render_prompt(template_name: str, **extra) -> str:
    template = _env().get_template(template_name)
    context = {
        "domain": get_domain_config(),
        "data_dictionary": get_data_dictionary(),
        **extra,
    }
    return template.render(**context)
