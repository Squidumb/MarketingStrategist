"""Chatbot Q&A workflow: validate -> SQL agent (plain-text SQL) -> response agent (interpretation).

Multi-turn: the backend is stateless per request — the frontend sends the recent conversation
`history` with every message, and it's folded into each agent's prompt so follow-ups like
"what about for that segment?" resolve against the prior turn instead of being answered in a vacuum.
"""
import datetime
from typing import TypedDict

from langgraph.graph import END, StateGraph

from app.agents.factory import clean_sql
from app.agents.response_agent import build_response_agent
from app.agents.sql_expert import build_sql_expert_agent
from app.agents.validator import build_validator_agent, is_valid_query
from app.config import get_settings
from app.tools.sql_tool import execute_sql

MAX_HISTORY_TURNS = 6


def format_history(history: list[dict]) -> str:
    if not history:
        return ""
    recent = history[-MAX_HISTORY_TURNS:]
    lines = [f"{'User' if turn.get('sender') == 'user' else 'Assistant'}: {turn.get('text', '')}" for turn in recent]
    return "Previous conversation:\n" + "\n".join(lines)


class ChatState(TypedDict):
    user_input: str
    history: list[dict]
    validation_message: str
    is_valid: bool
    sql_findings: str
    final_response: str


def _validate(state: ChatState) -> ChatState:
    agent = build_validator_agent()
    context = format_history(state["history"])
    message = f"{context}\n\nCurrent question: {state['user_input']}" if context else state["user_input"]
    response = agent.run(message)
    return {**state, "validation_message": response, "is_valid": is_valid_query(response)}


def _route_after_validation(state: ChatState) -> str:
    return "sql_research" if state["is_valid"] else "rejected"


def _sql_research(state: ChatState) -> ChatState:
    agent = build_sql_expert_agent()
    context = format_history(state["history"])
    message = f"{context}\n\nCurrent question: {state['user_input']}" if context else state["user_input"]
    sql_query = clean_sql(agent.run(message))
    findings = execute_sql(sql_query)
    return {**state, "sql_findings": str(findings)}


def _respond(state: ChatState) -> ChatState:
    agent = build_response_agent()
    context = format_history(state["history"])
    message = (
        f"{context}\n\nUser question: {state['user_input']}\n\nQuery results:\n{state['sql_findings']}"
    )
    response = agent.run(message).replace("UPDATE CONTEXT", "")
    return {**state, "final_response": response}


def build_chatbot_graph():
    graph = StateGraph(ChatState)
    graph.add_node("validate", _validate)
    graph.add_node("sql_research", _sql_research)
    graph.add_node("respond", _respond)

    graph.set_entry_point("validate")
    graph.add_conditional_edges("validate", _route_after_validation, {"sql_research": "sql_research", "rejected": END})
    graph.add_edge("sql_research", "respond")
    graph.add_edge("respond", END)
    return graph.compile()


def log_conversation(user_input: str, bot_response: str) -> None:
    path = get_settings().conversation_log_path
    timestamp = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    with open(path, "a", encoding="utf-8") as f:
        f.write(f"[{timestamp}]\nUser: {user_input}\nAssistant: {bot_response}\n\n")


def reset_conversation_log() -> None:
    open(get_settings().conversation_log_path, "w").close()


def run_chatbot(user_input: str, history: list[dict] | None = None) -> str:
    graph = build_chatbot_graph()
    final_state = graph.invoke({"user_input": user_input, "history": history or []})
    if not final_state.get("is_valid"):
        return final_state["validation_message"]
    response = final_state["final_response"]
    log_conversation(user_input, response)
    return response
