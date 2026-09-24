from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter(tags=["auth"])


class LoginRequest(BaseModel):
    creds: str = ""


@router.post("/login")
def login(payload: LoginRequest):
    # Placeholder — no real auth is implemented; do not treat this as a security boundary.
    return {"creds": "ok"}
