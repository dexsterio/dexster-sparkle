/**
 * Dexster API Client
 *
 * - Base URL configurable via VITE_API_BASE_URL (default: https://dexster.io/api)
 * - credentials: 'include' on every request (auth_token + refresh_token cookies)
 * - CSRF double-submit: attaches X-CSRF-Token header on POST/PUT/PATCH/DELETE
 * - 401 handling: attempts POST /api/auth/refresh once, then redirects to /login
 * - Typed helpers: api.get<T>(), api.post<T>(), api.put<T>(), api.patch<T>(), api.delete<T>(), api.upload<T>()
 * - Cursor-based pagination helper
 */

import { getCsrfToken } from './csrf';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://dexster.io/api';

const MUTATING_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

let isRefreshing = false;
let refreshPromise: Promise<boolean> | null = null;

// ── Error class ───────────────────────────────────────────────────────

export class ApiError extends Error {
  constructor(
    public status: number,
    public statusText: string,
    public body: unknown,
  ) {
    super(`API ${status}: ${statusText}`);
    this.name = 'ApiError';
  }
}

// ── Token refresh ─────────────────────────────────────────────────────

async function attemptRefresh(): Promise<boolean> {
  try {
    const res = await fetch(`${BASE_URL}/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-Token': getCsrfToken(),
      },
    });
    return res.ok;
  } catch {
    return false;
  }
}

async function refreshOnce(): Promise<boolean> {
  if (isRefreshing && refreshPromise) return refreshPromise;
  isRefreshing = true;
  refreshPromise = attemptRefresh().finally(() => {
    isRefreshing = false;
    refreshPromise = null;
  });
  return refreshPromise;
}

// ── Core fetch wrapper ────────────────────────────────────────────────

interface FetchOptions extends Omit<RequestInit, 'body'> {
  body?: unknown;
  /** Skip automatic JSON content-type (used for multipart uploads) */
  raw?: boolean;
}

async function apiFetch<T>(
  path: string,
  options: FetchOptions = {},
  _isRetry = false,
): Promise<T> {
  const { body, raw, headers: customHeaders, ...rest } = options;
  const method = (rest.method ?? 'GET').toUpperCase();

  const headers: Record<string, string> = { ...(customHeaders as Record<string, string>) };

  // Add JSON content-type for non-raw, non-GET requests with a body
  if (!raw && body !== undefined) {
    headers['Content-Type'] = 'application/json';
  }

  // Attach CSRF token on mutating methods
  if (MUTATING_METHODS.has(method)) {
    const csrf = getCsrfToken();
    if (csrf) headers['X-CSRF-Token'] = csrf;
  }

  const res = await fetch(`${BASE_URL}${path}`, {
    ...rest,
    method,
    credentials: 'include',
    headers,
    body: raw ? (body as BodyInit) : body !== undefined ? JSON.stringify(body) : undefined,
  });

  // Handle 401 — attempt refresh once
  if (res.status === 401 && !_isRetry) {
    const refreshed = await refreshOnce();
    if (refreshed) {
      return apiFetch<T>(path, options, true);
    }
    // Refresh failed — redirect to login
    window.location.href = '/login';
    throw new ApiError(401, 'Unauthorized', null);
  }

  // Handle non-OK responses
  if (!res.ok) {
    let errorBody: unknown = null;
    try {
      errorBody = await res.json();
    } catch {
      // ignore parse errors
    }
    throw new ApiError(res.status, res.statusText, errorBody);
  }

  // Handle 204 No Content
  if (res.status === 204) return undefined as T;

  // Parse JSON
  return res.json() as Promise<T>;
}

// ── Typed helpers ─────────────────────────────────────────────────────

export const api = {
  get<T>(path: string, headers?: Record<string, string>): Promise<T> {
    return apiFetch<T>(path, { method: 'GET', headers });
  },

  post<T>(path: string, body?: unknown, headers?: Record<string, string>): Promise<T> {
    return apiFetch<T>(path, { method: 'POST', body, headers });
  },

  put<T>(path: string, body?: unknown, headers?: Record<string, string>): Promise<T> {
    return apiFetch<T>(path, { method: 'PUT', body, headers });
  },

  patch<T>(path: string, body?: unknown, headers?: Record<string, string>): Promise<T> {
    return apiFetch<T>(path, { method: 'PATCH', body, headers });
  },

  delete<T>(path: string, body?: unknown, headers?: Record<string, string>): Promise<T> {
    return apiFetch<T>(path, { method: 'DELETE', body, headers });
  },

  /** Multipart upload (FormData). Does NOT set Content-Type — browser handles boundary. */
  upload<T>(path: string, formData: FormData, method: 'POST' | 'PUT' = 'POST'): Promise<T> {
    return apiFetch<T>(path, { method, body: formData as unknown as BodyInit, raw: true });
  },
};

// ── Cursor-based pagination helper ────────────────────────────────────

export interface CursorPage<T> {
  data: T[];
  nextCursor: string | null;
  hasMore: boolean;
}

/**
 * Fetches a single page of cursor-paginated data.
 * @param path Base path (e.g. '/messages/conversations')
 * @param cursor Cursor string for next page (undefined for first page)
 * @param limit Page size (default 50)
 * @param extraParams Additional query params
 */
export async function fetchPage<T>(
  path: string,
  cursor?: string,
  limit = 50,
  extraParams?: Record<string, string>,
): Promise<CursorPage<T>> {
  const params = new URLSearchParams({ limit: String(limit) });
  if (cursor) params.set('cursor', cursor);
  if (extraParams) {
    for (const [k, v] of Object.entries(extraParams)) {
      params.set(k, v);
    }
  }
  const separator = path.includes('?') ? '&' : '?';
  return api.get<CursorPage<T>>(`${path}${separator}${params.toString()}`);
}

export default api;
