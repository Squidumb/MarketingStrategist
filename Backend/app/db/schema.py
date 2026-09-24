"""Schema introspection: derives the SQL agent's context directly from the active database instead
of a hand-maintained text file, so swapping the DB doesn't require editing prompts/code.
"""
import sqlite3

_schema_cache: dict[str, str] = {}


def introspect_schema(db_path: str, sample_rows: int = 1, force_refresh: bool = False) -> str:
    if not force_refresh and db_path in _schema_cache:
        return _schema_cache[db_path]

    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    try:
        cursor = conn.cursor()
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'")
        tables = [row["name"] for row in cursor.fetchall()]

        sections = []
        for table in tables:
            cursor.execute(f'PRAGMA table_info("{table}")')
            columns = cursor.fetchall()
            cursor.execute(f'SELECT * FROM "{table}" LIMIT {sample_rows}')
            sample = cursor.fetchone()

            lines = [f'"{table}" Table:']
            for col in columns:
                name, col_type = col["name"], col["type"] or "TEXT"
                example = sample[name] if sample is not None and name in sample.keys() else None
                suffix = f" (e.g. {example!r})" if example is not None else ""
                lines.append(f"{name}: {col_type}{suffix}")
            sections.append("\n".join(lines))

        schema_text = "\n\n".join(sections)
        _schema_cache[db_path] = schema_text
        return schema_text
    finally:
        conn.close()


def list_tables(db_path: str) -> list[str]:
    conn = sqlite3.connect(db_path)
    try:
        cursor = conn.cursor()
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'")
        return [row[0] for row in cursor.fetchall()]
    finally:
        conn.close()


def clear_schema_cache(db_path: str | None = None) -> None:
    if db_path is None:
        _schema_cache.clear()
    else:
        _schema_cache.pop(db_path, None)


def get_data_dictionary() -> str:
    """Schema description for the active database, refreshed automatically when the DB switches."""
    from app.db.connection import get_active_db_path

    return introspect_schema(get_active_db_path())
