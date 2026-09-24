"""One-shot project onboarding: upload a database + domain config and the whole agent stack
re-points itself at them — no restart, no code edits.
"""
import re
from pathlib import Path

import yaml
from fastapi import APIRouter, HTTPException, UploadFile

from app.config import (
    get_active_domain_config_path,
    get_domain_config,
    get_settings,
    set_active_domain_config_path,
    validate_domain_config,
)
from app.db.connection import get_active_db_path, set_active_db_path
from app.db.schema import introspect_schema, list_tables

router = APIRouter(prefix="/setup", tags=["setup"])

_SAFE_DB_NAME = re.compile(r"^[A-Za-z0-9_\-]+\.db$")
_SAFE_YAML_NAME = re.compile(r"^[A-Za-z0-9_\-]+\.ya?ml$")


@router.get("/status")
def setup_status():
    """What the agent stack is currently configured with — useful right after an upload."""
    db_path = get_active_db_path()
    domain = get_domain_config()
    return {
        "database": {
            "active": Path(db_path).name,
            "tables": list_tables(db_path),
        },
        "domain_config": {
            "active": Path(get_active_domain_config_path()).name,
            "brand_name": domain.get("brand", {}).get("name"),
            "industry_scope": domain.get("domain", {}).get("industry_scope"),
            "segments": [s.get("name") for s in domain.get("segments", [])],
        },
    }


@router.post("/upload")
async def setup_upload(database: UploadFile | None = None, domain_config: UploadFile | None = None):
    """Upload a .db file and/or a domain_config.yaml. Whatever is provided is activated immediately."""
    if database is None and domain_config is None:
        raise HTTPException(status_code=400, detail="Provide at least one of 'database' or 'domain_config'.")

    result: dict = {}

    if database is not None:
        if not database.filename or not database.filename.endswith(".db"):
            raise HTTPException(status_code=400, detail="'database' must be a .db file.")
        safe_name = Path(database.filename).name
        if not _SAFE_DB_NAME.match(safe_name):
            raise HTTPException(status_code=400, detail="Database filename must match '<name>.db'.")

        db_dir = Path(get_settings().database_dir)
        db_dir.mkdir(parents=True, exist_ok=True)
        dest = db_dir / safe_name
        dest.write_bytes(await database.read())
        set_active_db_path(str(dest))
        result["database"] = {"filename": safe_name, "tables": list_tables(str(dest))}

    if domain_config is not None:
        if not domain_config.filename or not re.search(r"\.ya?ml$", domain_config.filename):
            raise HTTPException(status_code=400, detail="'domain_config' must be a .yaml/.yml file.")
        safe_name = Path(domain_config.filename).name
        if not _SAFE_YAML_NAME.match(safe_name):
            raise HTTPException(status_code=400, detail="Domain config filename must match '<name>.yaml'.")

        raw = await domain_config.read()
        try:
            parsed = yaml.safe_load(raw)
        except yaml.YAMLError as e:
            raise HTTPException(status_code=400, detail=f"Invalid YAML: {e}")

        try:
            validate_domain_config(parsed)
        except ValueError as e:
            raise HTTPException(status_code=400, detail=str(e))

        config_dir = Path(get_settings().database_dir)
        config_dir.mkdir(parents=True, exist_ok=True)
        dest = config_dir / safe_name
        dest.write_bytes(raw)
        set_active_domain_config_path(str(dest))
        result["domain_config"] = {
            "filename": safe_name,
            "brand_name": parsed.get("brand", {}).get("name"),
            "segments": [s.get("name") for s in parsed.get("segments", [])],
        }

    return {"status": "configured", **result}
