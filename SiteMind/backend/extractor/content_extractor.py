"""
SiteMind — Content Extractor
Extracts clean readable text from raw HTML.

Strategy:
1. Primary:  trafilatura.extract() — state-of-the-art boilerplate removal
2. Fallback: BeautifulSoup extraction of semantic elements

Both paths remove navigation, footer, ads, scripts, and CSS.
"""
import logging
from typing import Optional

import trafilatura
from bs4 import BeautifulSoup

from models.domain import Page as CrawledPage
from utils.text_utils import clean_text

logger = logging.getLogger(__name__)

# HTML elements that are semantic content (used by BS4 fallback)
CONTENT_TAGS = ["h1", "h2", "h3", "h4", "h5", "h6", "p", "li", "td", "th", "blockquote", "pre", "code"]

# Elements to remove entirely before extraction
NOISE_TAGS = [
    "nav", "header", "footer", "aside", "script", "style",
    "noscript", "form", "iframe", "button", "input", "select",
    "textarea", "label", "meta", "link",
    # Cookie banners and ads (common class/id patterns)
]


class ContentExtractor:
    """
    Extracts clean text from HTML using trafilatura with a BeautifulSoup fallback.
    """

    def extract(self, page: CrawledPage) -> CrawledPage:
        """
        Extract clean text from a crawled page's HTML content.

        Returns:
            Updated CrawledPage with `content` replaced by clean text.
        """
        html = page.content
        if not html:
            return page

        text = self._extract_with_trafilatura(html)

        if not text or len(text) < 100:
            logger.debug(
                "trafilatura yielded insufficient text for %s, using BS4 fallback",
                page.url,
            )
            text = self._extract_with_beautifulsoup(html)

        page.content = clean_text(text or "")
        return page

    def _extract_with_trafilatura(self, html: str) -> Optional[str]:
        """Use trafilatura to extract main content."""
        try:
            result = trafilatura.extract(
                html,
                include_tables=True,
                include_links=False,
                include_images=False,
                no_fallback=False,
                favor_recall=True,
            )
            return result
        except Exception as e:
            logger.warning("trafilatura extraction failed: %s", e)
            return None

    def _extract_with_beautifulsoup(self, html: str) -> str:
        """BeautifulSoup fallback: removes noise and extracts semantic text."""
        try:
            soup = BeautifulSoup(html, "lxml")

            # Remove noise elements
            for tag in NOISE_TAGS:
                for element in soup.find_all(tag):
                    element.decompose()

            # Remove elements by common noise class/id patterns
            noise_patterns = [
                "cookie", "banner", "advertisement", "ads", "sidebar",
                "modal", "popup", "newsletter", "social", "share",
            ]
            for pattern in noise_patterns:
                for element in soup.find_all(
                    attrs={"class": lambda c: c and pattern in " ".join(c).lower()}
                ):
                    element.decompose()
                for element in soup.find_all(
                    attrs={"id": lambda i: i and pattern in i.lower()}
                ):
                    element.decompose()

            # Collect text from semantic elements
            parts = []
            for element in soup.find_all(CONTENT_TAGS):
                text = element.get_text(separator=" ", strip=True)
                if text and len(text) > 10:
                    parts.append(text)

            return "\n".join(parts)
        except Exception as e:
            logger.warning("BeautifulSoup extraction failed: %s", e)
            # Last resort: strip all tags
            try:
                soup = BeautifulSoup(html, "lxml")
                return soup.get_text(separator="\n", strip=True)
            except Exception:
                return ""
