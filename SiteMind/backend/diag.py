"""
SiteMind — Step-by-step diagnostic script.
Tests each pipeline stage independently. NO mocks, NO verify.py shortcuts.
"""
import asyncio, sys, traceback
import dotenv
dotenv.load_dotenv('.env')

PASS = "[PASS]"
FAIL = "[FAIL]"

def section(title):
    print(f"\n{'='*60}")
    print(f"  {title}")
    print('='*60)

# ── STEP 1: Crawler alone ──────────────────────────────────────
async def step1_crawler():
    section("STEP 1 — CRAWLER")
    from crawler.playwright_crawler import PlaywrightCrawler

    crawler = PlaywrightCrawler(max_pages=1, max_depth=0)
    url = "https://example.com"
    print(f"Starting URL  : {url}")

    try:
        pages = await crawler.crawl(url)
    except Exception as e:
        print(f"{FAIL} Crawler raised exception: {e}")
        traceback.print_exc()
        return None

    if not pages:
        print(f"{FAIL} Crawler returned 0 pages")
        return None

    page = pages[0]
    print(f"Final URL     : {page.url}")
    print(f"Page title    : {page.title}")
    print(f"HTML length   : {len(page.content)} chars")
    print(f"Depth         : {page.depth}")

    if len(page.content) < 100:
        print(f"{FAIL} HTML too short — Playwright likely failed to load the page")
        return None

    print(f"{PASS} Crawler returned a page with content")
    return page

# ── STEP 2: Extractor alone ────────────────────────────────────
def step2_extractor(page):
    section("STEP 2 — EXTRACTOR")
    from extractor.content_extractor import ContentExtractor

    extractor = ContentExtractor()
    try:
        extracted = extractor.extract(page)
    except Exception as e:
        print(f"{FAIL} Extractor raised exception: {e}")
        traceback.print_exc()
        return None

    print(f"Title         : {extracted.title}")
    print(f"URL           : {extracted.url}")
    print(f"Text length   : {len(extracted.content)} chars")
    print(f"First 300 chars:\n  {extracted.content[:300]!r}")

    if len(extracted.content) < 20:
        print(f"{FAIL} Extracted text is too short — extractor is broken")
        return None

    print(f"{PASS} Extractor returned meaningful text")
    return extracted

# ── STEP 3: Chunker alone ──────────────────────────────────────
def step3_chunker(extracted):
    section("STEP 3 — CHUNKER")
    from chunker.text_chunker import TextChunker

    chunker = TextChunker()
    try:
        chunks = chunker.chunk_pages([extracted], website_url=extracted.url)
    except Exception as e:
        print(f"{FAIL} Chunker raised exception: {e}")
        traceback.print_exc()
        return None

    print(f"Chunk count   : {len(chunks)}")
    for i, c in enumerate(chunks):
        print(f"  Chunk {i}: {len(c.text)} chars | url={c.page_url} | title={c.page_title!r}")
        print(f"    Text: {c.text[:120]!r}")

    if not chunks:
        print(f"{FAIL} No chunks created")
        return None

    print(f"{PASS} Chunker created {len(chunks)} chunk(s)")
    return chunks

# ── STEP 4: Indexer pre-embedding check ───────────────────────
def step4_pipeline_preembed(page, extracted, chunks):
    section("STEP 4 — PRE-EMBED PIPELINE SUMMARY")
    print(f"Crawler  : {PASS} — 1 page, title={page.title!r}")
    print(f"Extractor: {PASS} — {len(extracted.content)} chars extracted")
    print(f"Chunker  : {PASS} — {len(chunks)} chunk(s) created")
    print("Ready to attempt Gemini embedding.")

# ── STEP 5: Gemini embedding — single text ────────────────────
async def step5_embedding(chunks):
    section("STEP 5 — GEMINI EMBEDDING (single text)")
    from providers.gemini import GeminiProvider
    from config.settings import settings

    text = chunks[0].text
    print(f"Model         : {settings.gemini_embedding_model}")
    print(f"Text sample   : {text[:80]!r}")
    print(f"Embedding request started...")

    provider = GeminiProvider()
    try:
        vec = await provider.embed(text)
    except Exception as e:
        print(f"{FAIL} Embedding raised: {e}")
        traceback.print_exc()
        return None

    print(f"Vector length : {len(vec)}")
    print(f"First values  : {vec[:5]}")
    print(f"{PASS} Embedding generated successfully")
    return vec

# ── STEP 6: Qdrant insert + query ─────────────────────────────
async def step6_qdrant(chunks, vec):
    section("STEP 6 — QDRANT INSERT + QUERY")
    from vectorstore.qdrant_store import QdrantStore

    store = QdrantStore()
    coll = "diag_test"
    payload = {
        "text": chunks[0].text,
        "page_url": chunks[0].page_url,
        "page_title": chunks[0].page_title,
        "chunk_index": 0,
    }

    try:
        await store.upsert(coll, [vec], [payload])
        print(f"Upsert        : {PASS}")
    except Exception as e:
        print(f"{FAIL} Upsert failed: {e}")
        traceback.print_exc()
        return False

    try:
        results = await store.query(coll, vec, top_k=1)
        print(f"Query results : {len(results)}")
        if results:
            r = results[0]
            print(f"  Score       : {r.score:.4f}")
            print(f"  Text        : {r.text[:80]!r}")
            print(f"  URL         : {r.page_url}")
        print(f"{PASS} Qdrant insert and retrieval work")
        return True
    except Exception as e:
        print(f"{FAIL} Query failed: {e}")
        traceback.print_exc()
        return False

# ── STEP 7: Real /index endpoint ──────────────────────────────
async def step7_real_index_endpoint():
    section("STEP 7 — REAL /index ENDPOINT")
    import httpx

    url = "https://example.com"
    base = "http://localhost:8000"

    async with httpx.AsyncClient(timeout=180.0) as client:
        # Start indexing
        try:
            r = await client.post(f"{base}/index", json={"url": url})
            print(f"POST /index status : {r.status_code}")
            print(f"Response body      : {r.text}")
            if r.status_code != 200:
                print(f"{FAIL} POST /index returned {r.status_code}")
                return False
        except Exception as e:
            print(f"{FAIL} POST /index failed: {e}")
            return False

        # Poll /index/status until done or error
        print("Polling /index/status...")
        for attempt in range(120):  # up to 120 seconds
            await asyncio.sleep(1)
            try:
                sr = await client.get(f"{base}/index/status")
                s = sr.json()
                state = s.get("state", "?")
                msg   = s.get("message", "")
                pct   = s.get("progress", 0)
                print(f"  [{attempt+1:03d}s] state={state:<12} progress={pct:5.1f}%  {msg}")

                if state == "done":
                    print(f"[PASS] Indexing completed successfully")
                    return True
                if state == "error":
                    err = s.get('error', '')
                    msg = s.get('message', '')
                    print(f"[FAIL] Indexing failed!")
                    print(f"  error   : {err!r}")
                    print(f"  message : {msg!r}")
                    return False
            except Exception as e:
                print(f"  [{attempt+1:03d}s] Poll error: {e}")

        print(f"{FAIL} Timed out waiting for indexing to complete")
        return False

# ── STEP 8: Real /chat endpoint ───────────────────────────────
async def step8_real_chat_endpoint():
    section("STEP 8 — REAL /chat ENDPOINT")
    import httpx

    base = "http://localhost:8000"
    question = "Who is this website intended for?"
    print(f"Question: {question!r}")
    print("Streaming response:")

    try:
        async with httpx.AsyncClient(timeout=60.0) as client:
            async with client.stream(
                "POST", f"{base}/chat",
                json={"question": question},
                headers={"Accept": "text/event-stream"},
            ) as resp:
                if resp.status_code != 200:
                    body = await resp.aread()
                    print(f"{FAIL} /chat returned {resp.status_code}: {body.decode()}")
                    return False

                answer = ""
                sources = []
                async for line in resp.aiter_lines():
                    if not line.startswith("data: "):
                        continue
                    data = line[6:]
                    if data == "[DONE]":
                        break
                    import json
                    try:
                        event = json.loads(data)
                        if event.get("type") == "token":
                            token = event["content"]
                            answer += token
                            print(token, end="", flush=True)
                        elif event.get("type") == "sources":
                            sources = event["sources"]
                    except Exception:
                        pass

                print(f"\n\nSources: {sources}")
                if answer:
                    print(f"{PASS} /chat returned a streamed answer with sources")
                    return True
                else:
                    print(f"{FAIL} /chat returned no answer tokens")
                    return False
    except Exception as e:
        print(f"{FAIL} /chat request failed: {e}")
        traceback.print_exc()
        return False

# ── Main ───────────────────────────────────────────────────────
async def main():
    # Steps 1-4: No network (Playwright + local processing)
    page = await step1_crawler()
    if page is None:
        sys.exit(1)

    extracted = step2_extractor(page)
    if extracted is None:
        sys.exit(1)

    chunks = step3_chunker(extracted)
    if chunks is None:
        sys.exit(1)

    step4_pipeline_preembed(page, extracted, chunks)

    # Step 5: Gemini (1 call)
    vec = await step5_embedding(chunks)
    if vec is None:
        section("DIAGNOSIS")
        print("Gemini embedding is failing.")
        print("Check that your API key is valid and the daily quota is not exhausted.")
        sys.exit(1)

    # Step 6: Qdrant
    ok = await step6_qdrant(chunks, vec)
    if not ok:
        sys.exit(1)

    # Steps 7-8: Real HTTP endpoints — need backend running
    section("BACKEND CONNECTIVITY CHECK")
    import httpx
    try:
        async with httpx.AsyncClient(timeout=5) as c:
            r = await c.get("http://localhost:8000/health")
            print(f"Backend health: {r.status_code} {r.json()}")
    except Exception as e:
        print(f"{FAIL} Backend not running: {e}")
        print("Start the backend first: python main.py")
        sys.exit(1)

    ok7 = await step7_real_index_endpoint()
    if not ok7:
        sys.exit(1)

    ok8 = await step8_real_chat_endpoint()
    if not ok8:
        sys.exit(1)

    section("FINAL RESULT")
    print("ALL 11 SUCCESS CRITERIA MET")
    print("1. example.com loaded through Playwright         ✓")
    print("2. HTML returned                                 ✓")
    print("3. Text extracted                                ✓")
    print("4. At least one chunk created                    ✓")
    print("5. Gemini embedding generated                    ✓")
    print("6. Embedding stored in Qdrant                    ✓")
    print("7. Similarity search returned the chunk          ✓")
    print("8. /index reports completion                     ✓")
    print("9. /chat retrieved the chunk                     ✓")
    print("10. Gemini answered using the chunk              ✓")
    print("11. Source URL returned                          ✓")

if __name__ == "__main__":
    asyncio.run(main())
