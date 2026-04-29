import Constants from 'expo-constants';

// ── Token + credential store (survives Fast Refresh via global) ───────
let _token: string | null       = (global as any).__dx_token    ?? null;
let _username: string | null    = (global as any).__dx_username ?? null;
let _password: string | null    = (global as any).__dx_password ?? null;
let _refreshing                 = false;   // prevent concurrent re-login loops

export function setAuthToken(token: string) {
  _token = token;
  (global as any).__dx_token = token;
}
export function setCredentials(username: string, password: string) {
  _username = username;
  _password = password;
  (global as any).__dx_username = username;
  (global as any).__dx_password = password;
}
export function getAuthToken() { return _token; }

// ── Base URL: auto-detect from Expo Metro host ────────────────────────
const getBaseUrl = () => {
  const hostUri = Constants.expoConfig?.hostUri;
  const host = hostUri ? hostUri.split(':')[0] : 'localhost';
  return `http://${host}:8000`;
};
export const BASE_URL = getBaseUrl();

function authHeaders(): Record<string, string> {
  return {
    'Content-Type': 'application/json',
    ...(_token ? { Authorization: `Bearer ${_token}` } : {}),
  };
}

// ── Silent re-login when token is expired ─────────────────────────────
async function reLogin(): Promise<boolean> {
  if (_refreshing || !_username || !_password) return false;
  _refreshing = true;
  try {
    const res = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `username=${encodeURIComponent(_username)}&password=${encodeURIComponent(_password)}`,
    });
    if (!res.ok) return false;
    const data = await res.json();
    if (data.access_token) {
      setAuthToken(data.access_token);
      console.log('[API] Token refreshed silently.');
      return true;
    }
    return false;
  } catch {
    return false;
  } finally {
    _refreshing = false;
  }
}

// ── Core GET with automatic 401 retry ────────────────────────────────
async function get(path: string, retry = true): Promise<any> {
  const res = await fetch(`${BASE_URL}${path}`, { headers: authHeaders() });

  if (res.status === 401 && retry) {
    // Token expired — silently re-authenticate and retry once
    const ok = await reLogin();
    if (ok) return get(path, false);   // one retry only
    throw new Error(`401 ${path} — login required`);
  }

  if (!res.ok) throw new Error(`${res.status} ${path}`);
  return res.json();
}

// ── Auth (called from login screen) ──────────────────────────────────
export async function login(username: string, password: string) {
  const res = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}`,
  });
  if (!res.ok) throw new Error('Login failed');
  const data = await res.json();
  if (data.access_token) {
    setAuthToken(data.access_token);
    setCredentials(username, password);   // store for silent refresh
  }
  return data;
}

// ── Dashboard endpoints ───────────────────────────────────────────────
export const fetchDashboardStats = () => get('/dashboard/stats');
export const fetchRecentAlerts   = () => get('/dashboard/recent-alerts');
export const fetchTrafficHistory = () => get('/dashboard/analytics/traffic');
export const fetchTopSources     = () => get('/dashboard/analytics/top-sources');
