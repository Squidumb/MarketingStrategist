from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routes import auth, campaign, chatbot, dashboard, data_quality, database, integrations, setup

app = FastAPI(title="Marketing Strategist API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(campaign.router)
app.include_router(chatbot.router)
app.include_router(dashboard.router)
app.include_router(data_quality.router)
app.include_router(database.router)
app.include_router(integrations.router)
app.include_router(setup.router)


@app.get("/")
def root():
    return {"status": "ok"}
