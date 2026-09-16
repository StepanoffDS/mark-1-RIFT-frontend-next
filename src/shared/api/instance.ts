import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

import { CONFIG } from '@/shared/model/config';

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);
const AUTH_PATHS = new Set([
  '/auth/csrf',
  '/auth/register',
  '/auth/login',
  '/auth/refresh',
  '/auth/logout',
]);

type RetriableConfig = InternalAxiosRequestConfig & {
  _csrfRetried?: boolean;
  _authRetried?: boolean;
};

export const api = axios.create({
  baseURL: CONFIG.API_BASE_URL,
  withCredentials: true,
});

const csrfCookieName =
  CONFIG.NODE_ENV === 'production' ? '__Host-rift_csrf' : 'rift_csrf';

function readCsrfToken() {
  const prefix = `${csrfCookieName}=`;
  const cookie = document.cookie
    .split('; ')
    .find((item) => item.startsWith(prefix));

  return cookie ? decodeURIComponent(cookie.slice(prefix.length)) : null;
}

let csrfPromise: Promise<void> | null = null;

export function initCsrf() {
  csrfPromise ??= api
    .get('/auth/csrf')
    .then(() => undefined)
    .finally(() => {
      csrfPromise = null;
    });

  return csrfPromise;
}

let refreshPromise: Promise<void> | null = null;

function refreshSession() {
  refreshPromise ??= api
    .post('/auth/refresh')
    .then(() => undefined)
    .finally(() => {
      refreshPromise = null;
    });

  return refreshPromise;
}

api.interceptors.request.use(async (config) => {
  const method = (config.method ?? 'GET').toUpperCase();

  if (SAFE_METHODS.has(method)) return config;

  let csrfToken = readCsrfToken();

  if (!csrfToken) {
    await initCsrf();
    csrfToken = readCsrfToken();
  }

  if (!csrfToken) throw new Error('CSRF cookie is missing');

  config.headers.set('X-CSRF-Token', csrfToken);
  return config;
});

api.interceptors.response.use(undefined, async (error: AxiosError) => {
  const config = error.config as RetriableConfig | undefined;
  const path = config?.url?.split('?')[0];
  const method = (config?.method ?? 'GET').toUpperCase();

  if (!config) return Promise.reject(error);

  if (
    error.response?.status === 403 &&
    !SAFE_METHODS.has(method) &&
    !config._csrfRetried
  ) {
    config._csrfRetried = true;
    await initCsrf();
    return api(config);
  }

  if (
    error.response?.status !== 401 ||
    config._authRetried ||
    !path ||
    AUTH_PATHS.has(path)
  ) {
    return Promise.reject(error);
  }

  config._authRetried = true;

  try {
    await refreshSession();
    return api(config);
  } catch {
    return Promise.reject(error);
  }
});
