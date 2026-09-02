"""
SiteMind — Text Utilities
Text sanitization and cleaning helpers.
"""
import re
import html


def clean_text(text: str) -> str:
    """
    Clean raw extracted text:
    - Decode HTML entities
    - Remove control characters
    - Collapse whitespace
    - Strip leading/trailing whitespace
    """
    if not text:
        return ""

    # Decode HTML entities
    text = html.unescape(text)

    # Remove null bytes and control characters (except newlines/tabs)
    text = re.sub(r"[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]", "", text)

    # Collapse multiple blank lines into at most two
    text = re.sub(r"\n{3,}", "\n\n", text)

    # Collapse multiple spaces/tabs into a single space
    text = re.sub(r"[ \t]+", " ", text)

    # Strip leading/trailing whitespace per line
    lines = [line.strip() for line in text.splitlines()]
    text = "\n".join(lines)

    return text.strip()


def truncate_text(text: str, max_chars: int = 5000) -> str:
    """Truncate text to max_chars, appending ellipsis if truncated."""
    if len(text) <= max_chars:
        return text
    return text[:max_chars].rsplit(" ", 1)[0] + "…"


def sanitize_for_embedding(text: str) -> str:
    """
    Prepare text for embedding:
    - Remove non-printable characters
    - Limit length to avoid token overflow
    """
    text = clean_text(text)
    # Gemini embedding limit is ~2048 tokens; ~8000 chars is safe
    return truncate_text(text, max_chars=8000)
