import { STORAGE_KEYS } from '@/lib/constants';
import type { ApiResponse } from '@/types/api';

export class ApiError extends Error {
  constructor(
    message: string,
    public code: number,
    public errors: string[] = [],
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(STORAGE_KEYS.USER_TOKEN);
}

function triggerLogout() {
  if (typeof window === 'undefined') return;
  Object.values(STORAGE_KEYS).forEach((key) => localStorage.removeItem(key));
  window.location.href = '/login';
}

/** GET via proxy to avoid CORS */
export async function apiGet<T>(endpoint: string): Promise<T> {
  const token = getToken();

  const res = await fetch(`/api/proxy?endpoint=${encodeURIComponent(endpoint)}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const text = await res.text();

  if (text === 'Unauthorized' || res.status === 401) {
    triggerLogout();
    throw new ApiError('Unauthorized', 401);
  }

  let json: ApiResponse<T>;
  try {
    json = JSON.parse(text);
  } catch {
    throw new ApiError(`Invalid response from server: ${text.slice(0, 100)}`, 0);
  }

  if (json.code !== 0) {
    throw new ApiError(
      json.errors?.[0] || 'Request failed',
      json.code,
      json.errors,
    );
  }

  return json.data;
}

/** POST via proxy to avoid CORS */
export async function apiPost<T>(
  endpoint: string,
  body: Record<string, string>,
  options?: { noAuth?: boolean },
): Promise<ApiResponse<T>> {
  const reqHeaders: Record<string, string> = {};

  if (!options?.noAuth) {
    const token = getToken();
    if (token) reqHeaders.Authorization = `Bearer ${token}`;
  }

  const formBody = new URLSearchParams(body).toString();

  const res = await fetch('/api/proxy', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      endpoint,
      body: formBody,
      headers: reqHeaders,
    }),
  });

  const text = await res.text();

  if (text === 'Unauthorized' || res.status === 401) {
    triggerLogout();
    throw new ApiError('Unauthorized', 401);
  }

  let json: ApiResponse<T>;
  try {
    json = JSON.parse(text);
  } catch {
    throw new ApiError(`Invalid response from server: ${text.slice(0, 100)}`, 0);
  }

  if (json.code !== 0) {
    throw new ApiError(
      json.errors?.[0] || 'Request failed',
      json.code,
      json.errors,
    );
  }

  return json;
}
