import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import type { ApiResponse, LoginResponse } from '../types';

// ─── Axios instance ────────────────────────────────────────────────────────────
const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true, // Required for HttpOnly refresh cookie
  timeout: 15000,
});

// In-memory access token storage (NOT localStorage — XSS protection)
let accessToken: string | null = null;
let isRefreshing = false;
let refreshSubscribers: ((token: string) => void)[] = [];

export function setAccessToken(token: string): void {
  accessToken = token;
}

export function clearAccessToken(): void {
  accessToken = null;
}

function subscribeToRefresh(callback: (token: string) => void): void {
  refreshSubscribers.push(callback);
}

function notifyRefreshSubscribers(token: string): void {
  refreshSubscribers.forEach((cb) => cb(token));
  refreshSubscribers = [];
}

// ─── Request interceptor — attach access token ─────────────────────────────────
api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

// ─── Response interceptor — handle 401, auto-refresh token ────────────────────
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<ApiResponse>) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // If 401 and not already retried and not a refresh/login request
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url?.includes('/auth/refresh') &&
      !originalRequest.url?.includes('/auth/login')
    ) {
      if (isRefreshing) {
        // Queue this request until refresh completes
        return new Promise((resolve, reject) => {
          subscribeToRefresh((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            resolve(api(originalRequest));
          });
          // If refresh fails, reject all queued requests
          setTimeout(() => reject(error), 10000);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const response = await api.post<ApiResponse<LoginResponse>>('/auth/refresh');
        const newToken = response.data.data.accessToken;
        setAccessToken(newToken);
        notifyRefreshSubscribers(newToken);
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        clearAccessToken();
        refreshSubscribers = [];
        window.dispatchEvent(new CustomEvent('auth:logout'));
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default api;
