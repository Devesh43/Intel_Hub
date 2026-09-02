/**
 * useIndexing hook
 * Manages the indexing flow: start → poll status → done/error
 */
import { useState, useRef, useCallback } from "react";
import {
  startIndexing,
  getIndexStatus,
  deleteIndex,
  IndexStatus,
} from "@/services/api";

export type IndexingPhase = "idle" | "indexing" | "done" | "error";

export interface UseIndexingReturn {
  phase: IndexingPhase;
  status: IndexStatus | null;
  error: string | null;
  startIndex: (url: string, force?: boolean) => Promise<void>;
  deleteCurrentIndex: () => Promise<void>;
  reIndex: (url: string) => Promise<void>;
}

const POLL_INTERVAL = 1200; // ms

export function useIndexing(): UseIndexingReturn {
  const [phase, setPhase] = useState<IndexingPhase>("idle");
  const [status, setStatus] = useState<IndexStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopPolling = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, []);

  const startPolling = useCallback(() => {
    stopPolling();
    pollRef.current = setInterval(async () => {
      try {
        const s = await getIndexStatus();
        setStatus(s);
        if (s.state === "done") {
          stopPolling();
          setPhase("done");
        } else if (s.state === "error") {
          stopPolling();
          setError(s.error ?? "Unknown error");
          setPhase("error");
        }
      } catch (e) {
        // Continue polling on transient errors
      }
    }, POLL_INTERVAL);
  }, [stopPolling]);

  const startIndex = useCallback(
    async (url: string, force: boolean = false) => {
      setError(null);
      setPhase("indexing");
      setStatus(null);
      try {
        await startIndexing(url, force);
        startPolling();
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Failed to start indexing";
        setError(msg);
        setPhase("error");
      }
    },
    [startPolling],
  );

  const deleteCurrentIndex = useCallback(async () => {
    stopPolling();
    try {
      await deleteIndex();
      setPhase("idle");
      setStatus(null);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to delete index");
    }
  }, [stopPolling]);

  const reIndex = useCallback(
    async (url: string) => {
      stopPolling();
      setPhase("idle");
      setStatus(null);
      setError(null);
      await startIndex(url, true);
    },
    [stopPolling, startIndex],
  );

  return { phase, status, error, startIndex, deleteCurrentIndex, reIndex };
}
