"""Lets a user point the whole agent stack at a different SQLite database at runtime, and
inspect exactly what schema the SQL agent currently sees (explainability for the demo).
"""
import re
from pathlib import Path

from fastapi import APIRouter, HTTPException, UploadFile
from pydantic import BaseModel

from app.config import get_settings
from app.db.connection import get_active_db_path, set_active_db_path
from app.db.schema import introspect_schema, list_tables

router = APIRouter(prefix="/database", tags=["database"])

_SAFE_NAME = re.compile(r"^[A-Za-z0-9_\-]+\.db$")


def _resolve_db_file(filename: str) -> Path:
    if not _SAFE_NAME.match(filename):
        raise HTTPException(status_code=400, detail="Invalid filename. Only '<name>.db' is allowed.")
    path = Path(get_settings().database_dir) / filename
    if not path.exists():
        raise HTTPException(status_code=404, detail=f"Database file '{filename}' not found.")
    return path


@router.get("/list")
def list_databases():
    db_dir = Path(get_settings().database_dir)
    files = sorted(p.name for p in db_dir.glob("*.db"))
    return {"databases": files, "active": Path(get_active_db_path()).name}


@router.get("/schema")
def get_schema():
    """The exact schema description currently grounding the SQL agent — for explainability/debugging."""
    active_path = get_active_db_path()
    return {
        "active_database": Path(active_path).name,
        "tables": list_tables(active_path),
        "schema_description": introspect_schema(active_path),
    }


class SwitchRequest(BaseModel):
    filename: str


@router.post("/switch")
def switch_database(payload: SwitchRequest):
    path = _resolve_db_file(payload.filename)
    set_active_db_path(str(path))
    return {"status": "switched", "active": path.name}


@router.post("/upload")
async def upload_database(file: UploadFile, activate: bool = True):
    if not file.filename or not file.filename.endswith(".db"):
        raise HTTPException(status_code=400, detail="Only .db files are accepted.")
    safe_name = Path(file.filename).name  # strip any path components
    if not _SAFE_NAME.match(safe_name):
        raise HTTPException(status_code=400, detail="Filename must match '<name>.db' (letters, numbers, _, -).")

    db_dir = Path(get_settings().database_dir)
    db_dir.mkdir(parents=True, exist_ok=True)
    dest = db_dir / safe_name

    contents = await file.read()
    dest.write_bytes(contents)

    if activate:
        set_active_db_path(str(dest))

    return {"status": "uploaded", "filename": safe_name, "activated": activate}
