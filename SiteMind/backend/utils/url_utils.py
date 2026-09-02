"""
SiteMind — URL Utilities
URL normalization, validation, and filtering helpers.
"""
import re
from urllib.parse import urlparse, urljoin, urlunparse


# URLs containing these path segments are skipped during crawling
SKIP_PATH_PATTERNS = re.compile(
    r"/(login|logout|signup|sign-up|sign_up|register|cart|checkout|"
    r"payment|search|admin|wp-admin|wp-login|feed|rss|sitemap|"
    r"\.xml|\.pdf|\.jpg|\.jpeg|\.png|\.gif|\.svg|\.ico|\.css|\.js|"
    r"\.zip|\.tar|\.gz|\.mp4|\.mp3|\.avi|\.mov)(/|$|\?)",
    re.IGNORECASE,
)


def normalize_url(url: str) -> str:
    """
    Normalize a URL by:
    - Lowercasing scheme and host
    - Removing fragments (#)
    - Removing trailing slashes on the path
    - Removing default ports
    """
    try:
        parsed = urlparse(url.strip())
        scheme = parsed.scheme.lower()
        netloc = parsed.netloc.lower()

        # Strip default ports
        if netloc.endswith(":80") and scheme == "http":
            netloc = netloc[:-3]
        elif netloc.endswith(":443") and scheme == "https":
            netloc = netloc[:-4]

        path = parsed.path.rstrip("/") or "/"
        # Remove fragment, keep query
        normalized = urlunparse((scheme, netloc, path, "", parsed.query, ""))
        return normalized
    except Exception:
        return url


def is_valid_url(url: str) -> bool:
    """Check if a string is a valid HTTP/HTTPS URL."""
    try:
        parsed = urlparse(url)
        return parsed.scheme in ("http", "https") and bool(parsed.netloc)
    except Exception:
        return False


def is_same_domain(base_url: str, target_url: str) -> bool:
    """Return True if target_url is on the same domain as base_url."""
    try:
        base_host = urlparse(base_url).netloc.lower().lstrip("www.")
        target_host = urlparse(target_url).netloc.lower().lstrip("www.")
        return base_host == target_host
    except Exception:
        return False


def should_skip_url(url: str) -> bool:
    """
    Return True if the URL should be skipped (login pages, assets, social sharing popups, etc.).
    """
    try:
        parsed = urlparse(url)
        path = parsed.path
        query = parsed.query.lower()

        if any(param in query for param in ["share=", "nb=1", "facebook", "twitter", "pinterest", "linkedin", "utm_"]):
            return True

        return bool(SKIP_PATH_PATTERNS.search(path))
    except Exception:
        return True


def resolve_url(base: str, href: str) -> str:
    """Resolve a relative href against a base URL."""
    return urljoin(base, href)


def get_domain(url: str) -> str:
    """Extract the domain (netloc) from a URL."""
    return urlparse(url).netloc.lower()


def get_url_priority(url: str) -> int:
    """
    Return a priority score for URL crawling (lower is higher priority).
    Prioritizes tutorial, docs, library, and guide pages over index/version/license pages.
    """
    path = urlparse(url).path.lower()

    # Top priority: content paths
    if any(p in path for p in ["/tutorial/", "/guide/", "/library/", "/docs/", "/reference/", "/learn/"]):
        return 1
    # Standard pages
    if len(path.split("/")) > 2:
        return 2
    # Root or shallow index pages
    return 3


def get_collection_name(url: str) -> str:
    """
    Derive a stable, Qdrant-safe collection name from a URL's domain.
    Each distinct domain gets its own persistent collection, so indexing a
    new site never overwrites the vectors of a previously indexed one.
    """
    domain = get_domain(url)
    safe = re.sub(r"[^a-zA-Z0-9_]", "_", domain)
    return f"site_{safe}"