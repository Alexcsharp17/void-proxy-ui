/**
 * Axios API client for SSPanel. Token is set by AuthContext; 401 triggers onUnauthorized callback.
 */
import axios from 'axios';

const BASE_URL =
  typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_BASE_URL
    ? String(import.meta.env.VITE_API_BASE_URL).replace(/\/$/, '')
    : 'http://localhost:3000/api/v2';

let apiToken: string | null = null;
let onUnauthorized: (() => void) | null = null;

export function setApiToken(token: string | null): void {
  apiToken = token;
}

export function getApiToken(): string | null {
  return apiToken;
}

export function setOnUnauthorized(callback: (() => void) | null): void {
  onUnauthorized = callback;
}

const REQUEST_TIMEOUT_MS = 15000;

function createClient() {
  const client = axios.create({
    baseURL: BASE_URL,
    headers: { 'Content-Type': 'application/json' },
    timeout: REQUEST_TIMEOUT_MS,
  });

  client.interceptors.request.use((config) => {
    const token = getApiToken();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });

  client.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error.response?.status === 401) {
        const requestUrl = error.config?.url ?? '';
        const isAuthEndpoint = requestUrl.includes('/auth/');
        if (!isAuthEndpoint && onUnauthorized) {
          onUnauthorized();
        }
      }
      return Promise.reject(error);
    }
  );

  return client;
}

export const api = createClient();
export { BASE_URL };
