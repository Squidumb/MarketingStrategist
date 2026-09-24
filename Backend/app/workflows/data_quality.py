"""Check + auto-remediate data quality issues, one table at a time.

Graph: check -> (issues found? clean : done) -> clean(recommend) -> apply(SQL fixes) -> recheck.
"""
import json
from typing import TypedDict

from langgraph.graph import END, StateGraph

from app.agents.data_cleaner import build_data_cleaner_agent
from app.agents.data_quality_sql_expert import build_data_quality_sql_agent
from app.agents.factory import clean_sql
from app.tools.data_quality_tool import NumpyEncoder, check_table
from app.tools.sql_tool import execute_sql

TABLES = [
    "customer_data",
    "products_data",
    "interactions",
    "applications",
    "channel_performance",
    "customer_segments",
]


class QualityState(TypedDict):
    table_name: str
    report: dict
    cleaning_plan: str
    sql_result: str
    post_report: dict


def _check(state: QualityState) -> QualityState:
    return {**state, "report": check_table(state["table_name"])}


def _route_after_check(state: QualityState) -> str:
    return "clean" if state["report"]["issues"] else "done"


def _recommend_cleaning(state: QualityState) -> QualityState:
    agent = build_data_cleaner_agent()
    message = (
        f"Data quality issues in {state['table_name']}:\n"
        f"{json.dumps(state['report']['issues'], cls=NumpyEncoder)}\nRecommend fixes."
    )
    return {**state, "cleaning_plan": agent.run(message)}


def _apply_fixes(state: QualityState) -> QualityState:
    agent = build_data_quality_sql_agent()
    message = (
        f"Table: {state['table_name']}. Write ONE SQL UPDATE statement to apply these recommended fixes:\n"
        f"{state['cleaning_plan']}"
    )
    sql_query = clean_sql(agent.run(message))
    return {**state, "sql_result": str(execute_sql(sql_query))}


def _recheck(state: QualityState) -> QualityState:
    return {**state, "post_report": check_table(state["table_name"])}


def build_data_quality_graph():
    graph = StateGraph(QualityState)
    graph.add_node("check", _check)
    graph.add_node("recommend", _recommend_cleaning)
    graph.add_node("apply_fixes", _apply_fixes)
    graph.add_node("recheck", _recheck)

    graph.set_entry_point("check")
    graph.add_conditional_edges("check", _route_after_check, {"clean": "recommend", "done": END})
    graph.add_edge("recommend", "apply_fixes")
    graph.add_edge("apply_fixes", "recheck")
    graph.add_edge("recheck", END)
    return graph.compile()


def check_and_fix_table(table_name: str) -> dict:
    graph = build_data_quality_graph()
    final_state = graph.invoke({"table_name": table_name})
    if "post_report" in final_state:
        return {"status": "success", "original_report": final_state["report"], "new_report": final_state["post_report"]}
    return {"status": "clean", "report": final_state["report"]}


def check_all_tables() -> dict:
    return {table: check_and_fix_table(table) for table in TABLES}
