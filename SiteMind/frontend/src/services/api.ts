/**
 * SiteMind API service layer
 * All communication with the FastAPI backend goes through this module.
 */

const BASE_URL = "/api";

// ── Types ───────────────────────────────────────────────────────────────────

export interface IndexStatus {
  state:
    | "idle"
    | "crawling"
    | "extracting"
    | "chunking"
    | "embedding"
    | "saving"
    | "done"
    | "error";
  message: string;
  progress: number;
  pages_crawled: number;
  pages_total: number;
  chunks_created: number;
  error: string | null;
}

export interface WebsiteMetadata {
  url: string;
  title: string;
  total_pages: number;
  total_chunks: number;
  indexed_at: number;
}

export interface WebsiteResponse {
  indexed: boolean;
  website: WebsiteMetadata | null;
}

export interface ChatSource {
  title: string;
  url: string;
}

export type SSEEvent =
  | { type: "token"; content: string }
  | { type: "sources"; sources: ChatSource[] }
  | { type: "error"; content: string };

// ── Helpers ──────────────────────────────────────────────────────────────────

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.detail || `HTTP ${res.status}`);
  }
  return res.json() as Promise<T>;
}

// ── Index API ────────────────────────────────────────────────────────────────

export async function startIndexing(
  url: string,
  force: boolean = false,
): Promise<{ message: string }> {
  return request("/index", {
    method: "POST",
    body: JSON.stringify({ url, force }),
  });
}

export async function getIndexStatus(): Promise<IndexStatus> {
  return request("/index/status");
}

export async function deleteIndex(): Promise<{ message: string }> {
  return request("/index", { method: "DELETE" });
}

// ── Website API ──────────────────────────────────────────────────────────────

export async function getWebsite(): Promise<WebsiteResponse> {
  return request("/website");
}

// ── Chat API (SSE streaming) ─────────────────────────────────────────────────

export function streamChat(
  question: string,
  onToken: (token: string) => void,
  onSources: (sources: ChatSource[]) => void,
  onError: (err: string) => void,
  onDone: () => void,
  history?: { role: string; content: string }[],
): () => void {
  let cancelled = false;

  const run = async () => {
    try {
      const res = await fetch(`${BASE_URL}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question, history }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        onError(body.detail || `HTTP ${res.status}`);
        onDone();
        return;
      }

      const reader = res.body?.getReader();
      if (!reader) {
        onError("No response body");
        onDone();
        return;
      }

      const decoder = new TextDecoder();
      let buffer = "";

      while (!cancelled) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const data = line.slice(6).trim();
          if (data === "[DONE]") {
            onDone();
            return;
          }
          try {
            const event: SSEEvent = JSON.parse(data);
            if (event.type === "token") onToken(event.content);
            else if (event.type === "sources") onSources(event.sources);
            else if (event.type === "error") onError(event.content);
          } catch {
            // Ignore malformed SSE lines
          }
        }
      }
    } catch (err) {
      if (!cancelled) {
        onError(err instanceof Error ? err.message : "Unknown error");
        onDone();
      }
    }
  };

  run();

  // Return cancel function
  return () => {
    cancelled = true;
  };
}
