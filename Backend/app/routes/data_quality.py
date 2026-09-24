from fastapi import APIRouter

from app.workflows.data_quality import check_all_tables, check_and_fix_table

router = APIRouter(tags=["data-quality"])


@router.post("/data-quality/{table_name}")
def run_table_check(table_name: str):
    return check_and_fix_table(table_name)


@router.post("/data-quality")
def run_all_checks():
    return check_all_tables()
