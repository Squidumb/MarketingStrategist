"""Web research: search + page content extraction, called directly by workflow nodes."""
import json

import requests
from bs4 import BeautifulSoup

from app.config import get_settings


def extract_webpage_content(url: str, max_chars: int = 1000) -> str:
    try:
        headers = {
            "User-Agent": (
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
                "(KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
            )
        }
        response = requests.get(url, headers=headers, timeout=10)
        if response.status_code != 200:
            return f"Failed to retrieve content: Status code {response.status_code}"

        soup = BeautifulSoup(response.text, "html.parser")
        for tag in soup(["script", "style", "nav", "footer", "header"]):
            tag.extract()

        text = soup.get_text(separator="\n")
        lines = (line.strip() for line in text.splitlines())
        chunks = (phrase.strip() for line in lines for phrase in line.split("  "))
        cleaned = "\n".join(chunk for chunk in chunks if chunk)

        if len(cleaned) > max_chars:
            cleaned = cleaned[:max_chars] + "... (content truncated)"
        return cleaned
    except Exception as e:
        return f"Error extracting content: {str(e)}"


def search_web(query: str, num_results: int = 3) -> list[dict]:
    num_results = max(3, min(10, num_results))
    settings = get_settings()
    url = "https://google.serper.dev/search"
    payload = json.dumps({"q": query, "num": num_results, "gl": "us", "hl": "en"})
    headers = {"X-API-KEY": settings.serper_api_key, "Content-Type": "application/json"}

    try:
        response = requests.post(url, headers=headers, data=payload, timeout=15)
        response.raise_for_status()
        results = response.json()
        formatted_results = []

        for item in results.get("organic", [])[:num_results]:
            snippet = item.get("snippet", "").strip()
            if snippet and len(snippet) < 150 and item.get("link"):
                expanded = extract_webpage_content(item["link"])
                if expanded and not expanded.startswith(("Error", "Failed")):
                    snippet = expanded
            formatted_results.append(
                {
                    "title": item.get("title", ""),
                    "link": item.get("link", ""),
                    "snippet": snippet,
                    "date": item.get("date"),
                    "type": "organic",
                }
            )

        for item in results.get("news", [])[:3]:
            snippet = item.get("snippet", "").strip()
            if snippet and len(snippet) < 100 and item.get("link"):
                expanded = extract_webpage_content(item["link"])
                if expanded and not expanded.startswith(("Error", "Failed")):
                    snippet = expanded
            formatted_results.append(
                {
                    "title": f"NEWS: {item.get('title', '')}",
                    "link": item.get("link", ""),
                    "snippet": snippet,
                    "date": item.get("date"),
                    "source": item.get("source", ""),
                    "type": "news",
                }
            )
        return formatted_results

    except requests.exceptions.RequestException as e:
        return [{"error": f"API Error: {str(e)}", "retry_after": "5 minutes"}]
    except json.JSONDecodeError:
        return [{"error": "Invalid API response format"}]
    except Exception as e:
        return [{"error": f"Unexpected error: {str(e)}"}]
