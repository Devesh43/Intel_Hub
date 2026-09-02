"""
SiteMind — Semantic & Heading-Aware Text Chunker
Splits document content into section-aware semantic chunks.

Features:
- Section/heading tracking with breadcrumbs prepended to each chunk
- Sentence & paragraph boundary preservation (no mid-word or mid-sentence cuts)
- Structural metadata preservation (page URL, title, section, chunk index)
"""
import logging
import re
from typing import Optional

from models.domain import Chunk
from config.settings import settings

logger = logging.getLogger(__name__)


class TextChunker:
    """
    Semantic & Heading-Aware Structural Text Chunker.
    """

    def __init__(
        self,
        chunk_size: int = settings.chunk_size,
        overlap: int = settings.chunk_overlap,
    ) -> None:
        self.chunk_size = chunk_size
        self.overlap = overlap

    def chunk(
        self,
        text: str,
        page_url: str,
        page_title: str,
        website_url: str,
    ) -> list[Chunk]:
        """
        Split text into overlapping semantic chunks with heading context.

        Args:
            text:         Clean extracted text from a page.
            page_url:     URL of the source page.
            page_title:   Title of the source page.
            website_url:  Root URL of the indexed website.

        Returns:
            List of Chunk objects with prepended section headers and rich metadata.
        """
        if not text or len(text.strip()) < 20:
            return []

        text = text.strip()
        chunks: list[Chunk] = []

        lines = text.split("\n")
        current_section = page_title or "Overview"
        sections: list[tuple[str, str]] = []
        current_block: list[str] = []

        for line in lines:
            line_str = line.strip()
            if not line_str:
                continue
            # Detect Markdown headings or short capitalized section titles
            if line_str.startswith("#") or (len(line_str) < 70 and (line_str.isupper() or line_str.endswith(":"))):
                if current_block:
                    sections.append((current_section, "\n".join(current_block)))
                    current_block = []
                current_section = line_str.lstrip("#").strip()
            else:
                current_block.append(line_str)

        if current_block:
            sections.append((current_section, "\n".join(current_block)))

        chunk_index = 0
        for section_title, sec_text in sections:
            paragraphs = sec_text.split("\n")
            accumulated: list[str] = []
            curr_len = 0

            for p in paragraphs:
                p_str = p.strip()
                if not p_str:
                    continue

                if curr_len + len(p_str) > self.chunk_size and accumulated:
                    block_content = " ".join(accumulated)
                    header_prefix = f"[Document: {page_title} | Section: {section_title}]\n"
                    full_chunk_text = f"{header_prefix}{block_content}"

                    chunks.append(
                        Chunk(
                            text=full_chunk_text,
                            page_url=page_url,
                            page_title=page_title,
                            chunk_index=chunk_index,
                            website_url=website_url,
                            metadata={
                                "website_url": website_url,
                                "page_url": page_url,
                                "page_title": page_title,
                                "section_title": section_title,
                                "chunk_index": chunk_index,
                            },
                        )
                    )
                    chunk_index += 1

                    if len(accumulated[-1]) < self.overlap:
                        accumulated = [accumulated[-1], p_str]
                        curr_len = len(accumulated[0]) + len(p_str)
                    else:
                        accumulated = [p_str]
                        curr_len = len(p_str)
                else:
                    accumulated.append(p_str)
                    curr_len += len(p_str)

            if accumulated:
                block_content = " ".join(accumulated)
                header_prefix = f"[Document: {page_title} | Section: {section_title}]\n"
                full_chunk_text = f"{header_prefix}{block_content}"
                chunks.append(
                    Chunk(
                        text=full_chunk_text,
                        page_url=page_url,
                        page_title=page_title,
                        chunk_index=chunk_index,
                        website_url=website_url,
                        metadata={
                            "website_url": website_url,
                            "page_url": page_url,
                            "page_title": page_title,
                            "section_title": section_title,
                            "chunk_index": chunk_index,
                        },
                    )
                )
                chunk_index += 1

        logger.debug("Chunked '%s' into %d semantic section chunks", page_url, len(chunks))
        return chunks

    def chunk_pages(
        self,
        pages: list,
        website_url: str,
    ) -> list[Chunk]:
        """
        Chunk all pages from a crawl into semantic section-aware chunks.
        """
        all_chunks: list[Chunk] = []
        for page in pages:
            if not page.content:
                continue
            page_chunks = self.chunk(
                text=page.content,
                page_url=page.url,
                page_title=page.title,
                website_url=website_url,
            )
            all_chunks.extend(page_chunks)

        logger.info(
            "Total semantic chunks from %d pages: %d",
            len(pages),
            len(all_chunks),
        )
        return all_chunks
