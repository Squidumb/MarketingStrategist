"""Twitter/X posting tool. Credentials are read from settings only — never hardcoded."""
import tweepy

from app.config import get_settings


def post_tweet(text: str) -> str:
    settings = get_settings()
    if not settings.twitter_api_key:
        raise RuntimeError("Twitter credentials are not configured (see .env.example).")

    client = tweepy.Client(
        bearer_token=settings.twitter_bearer_token,
        consumer_key=settings.twitter_api_key,
        consumer_secret=settings.twitter_api_secret,
        access_token=settings.twitter_access_token,
        access_token_secret=settings.twitter_access_token_secret,
    )

    if len(text) > 280:
        text = text[:277] + "..."

    client.create_tweet(text=text)
    return text
