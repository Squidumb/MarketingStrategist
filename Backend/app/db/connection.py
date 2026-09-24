"""Thread-safe SQLite access, decoupled from any specific route/agent."""
import sqlite3
import threading

from app.config import get_settings


class Database:
    def __init__(self, path: str | None = None):
        self._path = path or get_settings().database_path
        self._local = threading.local()

    def get_connection(self) -> sqlite3.Connection:
        conn = getattr(self._local, "conn", None)
        if conn is None:
            conn = sqlite3.connect(self._path, timeout=20, check_same_thread=False)
            conn.row_factory = sqlite3.Row
            self._local.conn = conn
        return conn

    def run_query(self, query: str, parameters: tuple | None = None) -> list[dict]:
        conn = self.get_connection()
        cursor = conn.cursor()
        try:
            cursor.execute(query, parameters or ())
            try:
                rows = cursor.fetchall()
                return [dict(row) for row in rows]
            except sqlite3.Error:
                conn.commit()
                return [{"affected_rows": cursor.rowcount}]
        except sqlite3.Error as e:
            conn.rollback()
            return [{"error": str(e)}]
        finally:
            cursor.close()


_db: Database | None = None
_active_db_path: str | None = None


def get_active_db_path() -> str:
    global _active_db_path
    if _active_db_path is None:
        _active_db_path = get_settings().database_path
    return _active_db_path


def set_active_db_path(path: str) -> None:
    """Switch the active database at runtime (e.g. after uploading a new .db file)."""
    global _db, _active_db_path
    from app.db.schema import clear_schema_cache

    _active_db_path = path
    _db = Database(path)
    clear_schema_cache()


def get_db() -> Database:
    global _db
    if _db is None:
        _db = Database(get_active_db_path())
    return _db


def get_db() -> Database:
    global _db
    if _db is None:
        _db = Database(get_active_db_path())
    return _db
