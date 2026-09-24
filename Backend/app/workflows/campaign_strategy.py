"""Campaign strategy generation as an explicit, inspectable agent graph.

Unlike a rigid dashboard (fixed queries -> fixed charts), the SQL/research agents here decide
*what* to query/search in plain text, and the graph executes it — this works with any chat model,
including ones without native tool/function-calling support.
"""
from typing import TypedDict

from langgraph.graph import END, StateGraph

from app.agents.content_creator import build_content_creator_agent
from app.agents.factory import clean_sql
from app.agents.image_prompt import build_image_prompt_agent
from app.agents.sql_expert import build_sql_expert_agent
from app.agents.validator import build_validator_agent, is_valid_query
from app.agents.web_researcher import build_web_researcher_agent
from app.cache import cached
from app.tools.sql_tool import execute_sql
from app.tools.web_search_tool import search_web


class CampaignState(TypedDict):
    product_name: str
    segment: str
    validation_message: str
    is_valid: bool
    sql_findings: str
    research_findings: str
    campaign_content: str


def _validate(state: CampaignState) -> CampaignState:
    agent = build_validator_agent()
    message = (
        f"Is this query related to banking or financial services: {state['product_name']}. "
        "Can this be used to market my existing banking products?"
    )
    response = agent.run(message)
    return {**state, "validation_message": response, "is_valid": is_valid_query(response)}


def _route_after_validation(state: CampaignState) -> str:
    return "sql_research" if state["is_valid"] else "rejected"


def _sql_research(state: CampaignState) -> CampaignState:
    agent = build_sql_expert_agent()
    segment_hint = f" for the '{state['segment']}' segment" if state.get("segment") else ""
    message = (
        f"Find relevant product, segment, or campaign information{segment_hint} "
        f"for marketing the product: {state['product_name']}."
    )
    sql_query = clean_sql(agent.run(message))
    findings = execute_sql(sql_query)
    return {**state, "sql_findings": str(findings)}


def _web_research(state: CampaignState) -> CampaignState:
    raw_results = search_web(state["product_name"])
    agent = build_web_researcher_agent()
    message = f"Summarize these web search results into marketing insights for {state['product_name']}:\n{raw_results}"
    findings = agent.run(message)
    return {**state, "research_findings": findings}


def _create_content(state: CampaignState) -> CampaignState:
    agent = build_content_creator_agent()
    message = f"""
    Create marketing content for the product: {state['product_name']}.

    Database insights:
    {state['sql_findings']}

    Web research insights:
    {state['research_findings']}
    """
    content = agent.run(message)
    return {**state, "campaign_content": content}


def build_campaign_strategy_graph():
    graph = StateGraph(CampaignState)
    graph.add_node("validate", _validate)
    graph.add_node("sql_research", _sql_research)
    graph.add_node("web_research", _web_research)
    graph.add_node("create_content", _create_content)

    graph.set_entry_point("validate")
    graph.add_conditional_edges("validate", _route_after_validation, {"sql_research": "sql_research", "rejected": END})
    graph.add_edge("sql_research", "web_research")
    graph.add_edge("web_research", "create_content")
    graph.add_edge("create_content", END)
    return graph.compile()


@cached(ttl_seconds=600)
def run_campaign_strategy(product_name: str, segment: str = "") -> dict:
    graph = build_campaign_strategy_graph()
    final_state = graph.invoke({"product_name": product_name, "segment": segment})
    if not final_state.get("is_valid"):
        return {"response": final_state["validation_message"]}
    return {"response": final_state["campaign_content"]}


@cached(ttl_seconds=600)
def generate_image_prompt(campaign_content: str, product_name: str = "") -> str:
    """Turns generated campaign copy into a ready-to-use text-to-image prompt."""
    agent = build_image_prompt_agent()
    message = f"Product/campaign: {product_name}\n\nCampaign copy:\n{campaign_content}"
    return agent.run(message).strip()
