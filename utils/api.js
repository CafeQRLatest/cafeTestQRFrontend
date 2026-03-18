import axios from 'axios';
import Cookies from 'js-cookie';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  withCredentials: true, 
});

// Request interceptor: Attach context meta-data headers
api.interceptors.request.use(
  (config) => {
    // Read context from cookies (synced in AuthContext)
    const clientId = Cookies.get('orgId'); // Wait, the backend calls it X-Client-ID but AuthContext stores it as orgId? No, AuthContext has clientId.
    // Let me check AuthContext stores: orgId, clientId, userId, etc.
    
    config.headers['X-Client-ID'] = Cookies.get('clientId') || '0';
    config.headers['X-Org-ID'] = Cookies.get('orgId') || '0';
    config.headers['X-Terminal-ID'] = Cookies.get('terminalId') || '0';
    config.headers['X-User-ID'] = Cookies.get('userId') || '0';
    config.headers['X-User-Email'] = Cookies.get('userEmail') || '';
    config.headers['X-User-Role'] = Cookies.get('userRole') || '';
    config.headers['X-Client-Name'] = Cookies.get('clientName') || '';
    config.headers['X-Org-Name'] = Cookies.get('orgName') || '';
    config.headers['X-Terminal-Name'] = Cookies.get('terminalName') || '';
    config.headers['X-Currency'] = Cookies.get('currency') || 'INR';
    config.headers['X-Country'] = Cookies.get('country') || '';

    return config;
  },
  (error) => Promise.reject(error)
);

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });

  failedQueue = [];
};

/**
 * Enterprise-grade Response Interceptor
 * 
 * Handles 401 (Unauthorized) and 403 (Forbidden) responses by attempting
 * a silent token refresh using the HttpOnly refresh_token cookie.
 * 
 * Key features:
 * - Queues concurrent failed requests during refresh to avoid duplicate refreshes
 * - Retries all queued requests after a successful refresh
 * - Redirects to /login only if the refresh itself fails
 * - Skips refresh attempts for auth endpoints (to prevent infinite loops)
 */
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const status = error.response?.status;

    // Only attempt refresh for 401/403 and NOT for auth endpoints (prevents infinite loop)
    const isAuthEndpoint = originalRequest.url?.includes('/api/v1/auth/');
    const isRefreshable = (status === 401 || status === 403) && !originalRequest._retry && !isAuthEndpoint;

    if (!isRefreshable) {
      return Promise.reject(error);
    }

    // If already refreshing, queue this request
    if (isRefreshing) {
      return new Promise(function (resolve, reject) {
        failedQueue.push({ resolve, reject });
      })
        .then(() => {
          return api(originalRequest);
        })
        .catch((err) => {
          return Promise.reject(err);
        });
    }

    originalRequest._retry = true;
    isRefreshing = true;

    try {
      // Attempt to refresh the token using the HttpOnly refresh_token cookie
      await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/auth/refresh`,
        {},
        { withCredentials: true }
      );

      // Success: new access_token and refresh_token cookies are now set by the backend
      processQueue(null);

      // Small delay to ensure browser has processed the new Set-Cookie headers
      await new Promise((resolve) => setTimeout(resolve, 100));

      return api(originalRequest);
    } catch (refreshError) {
      processQueue(refreshError);
      
      // Refresh failed => session truly expired, redirect to login
      console.error('[Auth] Token refresh failed, redirecting to login:', refreshError?.response?.data?.message || refreshError.message);
      
      // Clear any frontend metadata cookies
      if (typeof document !== 'undefined') {
        document.cookie = 'userRole=; Path=/; Max-Age=0';
        document.cookie = 'userEmail=; Path=/; Max-Age=0';
        document.cookie = 'subscriptionStatus=; Path=/; Max-Age=0';
        document.cookie = 'subscriptionExpiryDate=; Path=/; Max-Age=0';
      }
      
      window.location.href = '/login';
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);

export default api;
