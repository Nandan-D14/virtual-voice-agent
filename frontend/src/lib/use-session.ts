"use client";

import { useState, useCallback } from "react";
import type { SessionData } from "./message-types";

/**
 * Base path for Next.js API routes that proxy to the Python backend.
 * In production this avoids CORS by keeping the browser talking to the
 * same origin; the Next.js route handler forwards the request.
 */
const API_BASE = "/api";

export interface UseSessionReturn {
  /** The current session, or null if none is active. */
  session: SessionData | null;
  /** Create a new session via POST /api/sessions. */
  createSession: () => Promise<SessionData | null>;
  /** Destroy the active session via DELETE /api/sessions/{id}. */
  destroySession: () => Promise<void>;
  /** Whether a request is currently in flight. */
  isLoading: boolean;
  /** Human-readable error from the last failed request, or null. */
  error: string | null;
}

/**
 * React hook for managing the session lifecycle.
 *
 * - `createSession()` -- POST /api/sessions
 *   Returns the new session data and stores it in state.
 *
 * - `destroySession()` -- DELETE /api/sessions/{id}
 *   Best-effort deletion; clears local state regardless.
 *
 * The Next.js `/api/sessions` route is expected to proxy to the Python
 * FastAPI backend.
 */
export function useSession(): UseSessionReturn {
  const [session, setSession] = useState<SessionData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createSession = useCallback(async (): Promise<SessionData | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch(`${API_BASE}/sessions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      if (!res.ok) {
        // Try to extract a detail message from the backend.
        const body = await res.json().catch(() => ({}));
        const detail =
          typeof body === "object" && body !== null && "detail" in body
            ? String((body as Record<string, unknown>).detail)
            : `HTTP ${res.status}`;
        throw new Error(detail);
      }

      const data: SessionData = await res.json();
      setSession(data);
      return data;
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Failed to create session";
      setError(msg);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const destroySession = useCallback(async (): Promise<void> => {
    if (!session) return;

    const id = session.session_id;

    // Optimistically clear local state so the UI reacts immediately.
    setSession(null);
    setError(null);

    try {
      await fetch(`${API_BASE}/sessions/${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
    } catch {
      // Best-effort -- the session may have already expired server-side.
      console.warn("[useSession] DELETE request failed (best-effort).");
    }
  }, [session]);

  return { session, createSession, destroySession, isLoading, error };
}
