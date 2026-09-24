"""SQL execution, reusable outside of any single agent/workflow."""
from app.db.connection import get_db


def execute_sql(sql_query: str) -> list[dict]:
    """Run a read/write SQL query against the marketing SQLite database and return the rows."""
    return get_db().run_query(sql_query)
