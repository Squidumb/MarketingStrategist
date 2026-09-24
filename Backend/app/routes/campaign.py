from fastapi import APIRouter
from pydantic import BaseModel

from app.workflows.campaign_strategy import generate_image_prompt, run_campaign_strategy

router = APIRouter(tags=["campaign"])


class CampaignRequest(BaseModel):
    product_name: str
    segment: str = ""


@router.post("/campaign-strategy")
def campaign_strategy(payload: CampaignRequest):
    return run_campaign_strategy(payload.product_name, payload.segment)


class ImagePromptRequest(BaseModel):
    content: str
    product_name: str = ""


@router.post("/campaign-strategy/image-prompt")
def campaign_image_prompt(payload: ImagePromptRequest):
    return {"prompt": generate_image_prompt(payload.content, payload.product_name)}
