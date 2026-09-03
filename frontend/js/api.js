const API_BASE = '/api';

let isRefreshing = false;
let refreshQueue = [];

function getTokens() {
  return {
    accessToken: localStorage.getItem('accessToken'),
    refreshToken: localStorage.getItem('refreshToken'),
  };
}

function setTokens({ accessToken, refreshToken }) {
  if (accessToken) localStorage.setItem('accessToken', accessToken);
  if (refreshToken) localStorage.setItem('refreshToken', refreshToken);
}

function clearTokens() {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
}

async function doRefresh() {
  const { refreshToken } = getTokens();
  if (!refreshToken) {
    throw new Error('No refresh token available');
  }

  const res = await fetch(`${API_BASE}/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
  });

  if (!res.ok) {
    console.error('[ERR] Refresh token request failed');
    throw new Error('Refresh failed');
  }

  const data = await res.json();
  setTokens(data);
  console.log('[LOG] Access token refreshed successfully');
  return data;
}

async function request(path, opts = {}) {
  const { accessToken } = getTokens();

  const headers = { ...(opts.headers || {}) };
  if (accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`;
  }
  if (!(opts.body instanceof FormData) && opts.body) {
    headers['Content-Type'] = 'application/json';
  }

  const res = await fetch(`${API_BASE}${path}`, { ...opts, headers });

  if (res.status !== 401) {
    return res;
  }

  // Handle 401: refresh once, queue concurrent requests
  console.warn('[WARN] Received 401, attempting token refresh');

  if (isRefreshing) {
    await new Promise((resolve) => refreshQueue.push(resolve));
  } else {
    isRefreshing = true;
    try {
      await doRefresh();
      refreshQueue.forEach((resolve) => resolve());
      refreshQueue = [];
    } catch (err) {
      console.error('[ERR] Refresh failed, redirecting to login');
      clearTokens();
      window.location.href = '/login.html';
      return res;
    } finally {
      isRefreshing = false;
    }
  }

  // Retry original request with new access token
  const { accessToken: newAccessToken } = getTokens();
  const retryHeaders = { ...headers, Authorization: `Bearer ${newAccessToken}` };
  return fetch(`${API_BASE}${path}`, { ...opts, headers: retryHeaders });
}

window.api = { request, getTokens, setTokens, clearTokens };