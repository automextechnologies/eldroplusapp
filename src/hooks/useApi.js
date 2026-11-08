import { useCallback, useMemo } from 'react';
import { useUserStore } from '../store/useUserStore';

const BASE_URL = (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_API_URL) || '';

export function useApi() {
  const token = useUserStore((s) => s.token);

  const request = useCallback(
    async (endpoint, options = {}) => {
      const headers = {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers,
      };

      const url = endpoint.startsWith('http') ? endpoint : `${BASE_URL}${endpoint}`;

      const res = await fetch(url, {
        ...options,
        headers,
        body: options.body ? JSON.stringify(options.body) : undefined,
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        const error = new Error(data.error || `HTTP ${res.status}`);
        error.status = res.status;
        throw error;
      }

      return data;
    },
    [token]
  );

  return useMemo(
    () => ({
      get: (url) => request(url),
      post: (url, body) => request(url, { method: 'POST', body }),
      put: (url, body) => request(url, { method: 'PUT', body }),
      delete: (url, body) => request(url, { method: 'DELETE', body }),
    }),
    [request]
  );
}
