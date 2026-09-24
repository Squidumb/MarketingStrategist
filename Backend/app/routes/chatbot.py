from fastapi import APIRouter
from pydantic import BaseModel

from app.workflows.chatbot import reset_conversation_log, run_chatbot

router = APIRouter(tags=["chatbot"])


class HistoryItem(BaseModel):
    sender: str
    text: str


class ChatRequest(BaseModel):
    message: str
    history: list[HistoryItem] = []


@router.post("/chatbot")
def chat_assistant(payload: ChatRequest):
    if not payload.message:
        return {"response": "No input received."}
    history = [item.model_dump() for item in payload.history]
    return {"response": run_chatbot(payload.message, history)}


@router.post("/reset")
def reset():
    reset_conversation_log()
    return {"status": "reset successful"}
