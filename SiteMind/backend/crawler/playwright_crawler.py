"""
SiteMind — Playwright Web Crawler
Async BFS crawler that discovers and fetches pages within a single domain.

Features:
- Same-domain only crawling
- Max 100 pages, max depth 5
- Concurrent page fetching with configurable semaphore
- Skips login/auth/cart/asset URLs
- URL normalization and deduplication
- Graceful error handling (one page failure doesn't stop crawl)
"""
import asyncio
import logging
from collections import deque
from typing import Optional

from bs4 import BeautifulSoup
from playwright.async_api import async_playwright, Browser, Page, TimeoutError as PlaywrightTimeout

from models.domain import Page as CrawledPage
from utils.url_utils import (
    normalize_url,
    is_valid_url,
    is_same_domain,
    should_skip_url,
    resolve_url,
)
from config.settings import settings

logger = logging.getLogger(__name__)


class PlaywrightCrawler:
    """
    Breadth-first web crawler using Playwright for JS-rendered pages.
    Crawls within a single domain up to MAX_PAGES pages at MAX_DEPTH depth.
    """

    def __init__(
        self,
        max_pages: int = settings.crawler_max_pages,
        max_depth: int = settings.crawler_max_depth,
        concurrency: int = settings.crawler_concurrency,
        timeout: int = settings.crawler_timeout,
    ) -> None:
        self.max_pages = max_pages
        self.max_depth = max_depth
        self.concurrency = concurrency
        self.timeout = timeout * 1000  # Playwright uses milliseconds

    async def crawl(
        self,
        start_url: str,
        progress_callback: Optional[callable] = None,
    ) -> list[CrawledPage]:
        """
        Start crawling from start_url.

        Args:
            start_url:         The root URL to begin crawling from.
            progress_callback: Optional callback(pages_done, pages_total).

        Returns:
            List of CrawledPage objects with extracted HTML content.
        """
        import sys
        start_url = normalize_url(start_url)
        if not is_valid_url(start_url):
            raise ValueError(f"Invalid URL: {start_url}")

        if sys.platform == "win32":
            loop = asyncio.get_running_loop()
            return await loop.run_in_executor(
                None,
                self._crawl_in_thread,
                start_url,
                progress_callback,
            )
        return await self._do_crawl(start_url, progress_callback)

    def _crawl_in_thread(
        self,
        start_url: str,
        progress_callback: Optional[callable] = None,
    ) -> list[CrawledPage]:
        import sys
        if sys.platform == "win32":
            asyncio.set_event_loop_policy(asyncio.WindowsProactorEventLoopPolicy())
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        try:
            return loop.run_until_complete(self._do_crawl(start_url, progress_callback))
        finally:
            loop.close()

    async def _do_crawl(
        self,
        start_url: str,
        progress_callback: Optional[callable] = None,
    ) -> list[CrawledPage]:
        pages: list[CrawledPage] = []
        visited: set[str] = set()
        # Queue items: (url, depth)
        queue: deque[tuple[str, int]] = deque([(start_url, 0)])
        semaphore = asyncio.Semaphore(self.concurrency)

        async with async_playwright() as pw:
            browser = await pw.chromium.launch(
                headless=True,
                args=["--no-sandbox", "--disable-dev-shm-usage"],
            )
            try:
                await self._bfs_crawl(
                    browser=browser,
                    start_url=start_url,
                    queue=queue,
                    visited=visited,
                    pages=pages,
                    semaphore=semaphore,
                    progress_callback=progress_callback,
                )
            finally:
                await browser.close()

        logger.info("Crawl complete: %d pages from %s", len(pages), start_url)
        return pages

    async def _bfs_crawl(
        self,
        browser: Browser,
        start_url: str,
        queue: deque,
        visited: set,
        pages: list,
        semaphore: asyncio.Semaphore,
        progress_callback: Optional[callable],
    ) -> None:
        from utils.url_utils import get_url_priority

        """BFS loop — processes the queue level by level with priority sorting."""
        while queue and len(pages) < self.max_pages:
            # Sort queue elements by priority (content pages first, then depth)
            sorted_q = sorted(queue, key=lambda item: (get_url_priority(item[0]), item[1]))
            queue.clear()
            queue.extend(sorted_q)

            # Collect all URLs at the current BFS level
            batch = []
            while queue and len(batch) < self.concurrency * 2:
                url, depth = queue.popleft()
                norm = normalize_url(url)

                if norm in visited:
                    continue
                if not is_same_domain(start_url, norm):
                    continue
                if should_skip_url(norm):
                    continue
                if depth > self.max_depth:
                    continue

                visited.add(norm)
                batch.append((norm, depth))

            if not batch:
                continue

            # Fetch all URLs in the batch concurrently
            tasks = [
                self._fetch_page(browser, url, depth, semaphore)
                for url, depth in batch
            ]
            results = await asyncio.gather(*tasks, return_exceptions=True)

            for result in results:
                if isinstance(result, Exception):
                    logger.warning("Page fetch error: %s", result)
                    continue

                if result is None:
                    continue

                crawled_page, child_links = result
                pages.append(crawled_page)

                # Enqueue discovered child links
                for link in child_links:
                    norm_link = normalize_url(link)
                    if norm_link not in visited and len(pages) < self.max_pages:
                        queue.append((norm_link, crawled_page.depth + 1))

                if progress_callback:
                    res = progress_callback(len(pages), self.max_pages)
                    if asyncio.iscoroutine(res):
                        await res

                if len(pages) >= self.max_pages:
                    break

    async def _fetch_page(
        self,
        browser: Browser,
        url: str,
        depth: int,
        semaphore: asyncio.Semaphore,
    ) -> Optional[tuple[CrawledPage, list[str]]]:
        """
        Fetch a single page using Playwright.

        Returns:
            Tuple of (CrawledPage, list of discovered links), or None on error.
        """
        async with semaphore:
            context = await browser.new_context(
                user_agent=(
                    "Mozilla/5.0 (compatible; SiteMindBot/1.0; "
                    "+https://github.com/sitemind)"
                )
            )
            page: Page = await context.new_page()

            try:
                logger.debug("Fetching: %s (depth=%d)", url, depth)
                response = await page.goto(
                    url,
                    wait_until="domcontentloaded",
                    timeout=self.timeout,
                )

                if response is None or response.status >= 400:
                    logger.debug("Skipping %s: HTTP %s", url, response and response.status)
                    return None

                # Wait briefly for JS to settle
                await page.wait_for_timeout(500)

                # Check if SPA has interactive tabs / timeline buttons that need clicking
                try:
                    inner_len = len(await page.inner_text("body"))
                    if inner_len < 1500:
                        # Click visible tab / timeline / expand buttons to load hidden content
                        clickable = await page.query_selector_all("button, .movie, .year, .tab, .timeline-item, [data-movie], [data-year]")
                        for el in clickable[:20]:
                            try:
                                if await el.is_visible():
                                    await el.click(timeout=800)
                                    await page.wait_for_timeout(100)
                            except Exception:
                                pass
                except Exception:
                    pass

                html = await page.content()
                title = await page.title()

                # Extract all links from the page
                links = await self._extract_links(page, url)

                crawled_page = CrawledPage(
                    url=url,
                    title=title or url,
                    content=html,  # Raw HTML — extraction happens in extractor module
                    depth=depth,
                )

                return crawled_page, links

            except PlaywrightTimeout:
                logger.warning("Timeout fetching: %s", url)
                return None
            except Exception as e:
                logger.warning("Error fetching %s: %s", url, e)
                return None
            finally:
                await page.close()
                await context.close()

    async def _extract_links(self, page: Page, base_url: str) -> list[str]:
        """Extract all <a href> links from the page."""
        try:
            hrefs = await page.eval_on_selector_all(
                "a[href]",
                "els => els.map(el => el.getAttribute('href'))",
            )
            links = []
            for href in hrefs:
                if not href or href.startswith(("#", "mailto:", "tel:", "javascript:")):
                    continue
                resolved = resolve_url(base_url, href)
                if resolved.lower().endswith((".pdf", ".zip", ".png", ".jpg", ".jpeg", ".gif", ".mp4", ".svg")):
                    continue
                if is_valid_url(resolved):
                    links.append(resolved)
            return links
        except Exception:
            return []
