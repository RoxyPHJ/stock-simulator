import axios from 'axios';

const api = axios.create({ baseURL: import.meta.env.VITE_API_URL ?? '/api' });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ─── localStorage 캐시 헬퍼 ──────────────────────────
const TTL = {
  SEARCH: 24 * 60 * 60 * 1000,  // 24시간
  QUOTE:       5 * 60 * 1000,   // 5분
};

function lsGet(key) {
  try {
    const item = JSON.parse(localStorage.getItem(key));
    if (!item) return null;
    if (Date.now() > item.exp) { localStorage.removeItem(key); return null; }
    return item.data;
  } catch { return null; }
}

function lsSet(key, data, ttl) {
  try { localStorage.setItem(key, JSON.stringify({ data, exp: Date.now() + ttl })); } catch {}
}

// ─── Auth ────────────────────────────────────────────
export const register        = (email, password)   => api.post('/auth/register', { email, password });
export const login           = (email, password)   => api.post('/auth/login',    { email, password });

// ─── Portfolio ───────────────────────────────────────
export const getPortfolio    = ()                  => api.get('/portfolio');
export const getTransactions = ()                  => api.get('/portfolio/transactions');
export const buyStock        = (symbol, quantity)  => api.post('/portfolio/buy',  { symbol, quantity });
export const sellStock       = (symbol, quantity)  => api.post('/portfolio/sell', { symbol, quantity });

// ─── Stocks (localStorage 캐시 적용) ─────────────────
export async function searchStocks(q) {
  const key = `av:search:${q.toLowerCase()}`;
  const hit = lsGet(key);
  if (hit) return { data: hit };                          // 캐시 히트 → API 호출 0
  const res = await api.get(`/stocks/search?q=${encodeURIComponent(q)}`);
  if (Array.isArray(res.data) && res.data.length > 0) lsSet(key, res.data, TTL.SEARCH);
  return res;
}

export async function getQuote(symbol) {
  const key = `av:quote:${symbol.toUpperCase()}`;
  const hit = lsGet(key);
  if (hit) return { data: hit };                          // 캐시 히트 → API 호출 0
  const res = await api.get(`/stocks/${symbol}`);
  lsSet(key, res.data, TTL.QUOTE);
  return res;
}

// 캔들은 백엔드 PostgreSQL에서 캐싱 (1시간)
export const getCandles = (symbol) => api.get(`/stocks/${symbol}/candles`);
