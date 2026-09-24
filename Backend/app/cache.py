"""Minimal in-memory TTL cache — avoids re-running expensive agent workflows for repeat requests.

No external dependency: this is intentionally simple (portfolio-friendly), thread-safe, and easy
to swap for Redis later if this ever needs to run across multiple processes.
"""
import hashlib
import json
import threading
import time
from functools import wraps

_store: dict[str, tuple[float, object]] = {}
_lock = threading.Lock()


def _make_key(prefix: str, args: tuple, kwargs: dict) -> str:
    raw = json.dumps({"args": args, "kwargs": kwargs}, sort_keys=True, default=str)
    digest = hashlib.sha256(raw.encode("utf-8")).hexdigest()
    return f"{prefix}:{digest}"


def cached(ttl_seconds: int = 300):
    """Cache a function's return value for ttl_seconds, keyed by its arguments."""

    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            key = _make_key(func.__qualname__, args, kwargs)
            now = time.time()
            with _lock:
                cached_entry = _store.get(key)
                if cached_entry and cached_entry[0] > now:
                    return cached_entry[1]

            result = func(*args, **kwargs)

            with _lock:
                _store[key] = (now + ttl_seconds, result)
            return result

        return wrapper

    return decorator


def clear_cache() -> None:
    with _lock:
        _store.clear()
