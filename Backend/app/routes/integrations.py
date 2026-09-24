from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.tools.email_tool import send_campaign_email
from app.tools.twitter_tool import post_tweet

router = APIRouter(tags=["integrations"])


class TweetRequest(BaseModel):
    strategy: str


@router.post("/post-to-twitter")
def tweet_route(payload: TweetRequest):
    if not payload.strategy:
        raise HTTPException(status_code=400, detail="No strategy provided.")
    try:
        post_tweet(payload.strategy)
        return {"message": "Tweet posted successfully!"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


class EmailRequest(BaseModel):
    toEmail: str
    content: str


@router.post("/send-email")
def send_email_via_logic_app(payload: EmailRequest):
    try:
        send_campaign_email(payload.toEmail, payload.content)
        return {"success": True, "message": "Email sent successfully via Logic App"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to send email via Logic App. Error: {str(e)}")
