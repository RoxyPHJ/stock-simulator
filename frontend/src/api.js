import axios from 'axios';

const api = axios.create({ baseURL: import.meta.env.VITE_API_URL ?? '/api' });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const register        = (email, password)   => api.post('/auth/register', { email, password });
export const login           = (email, password)   => api.post('/auth/login',    { email, password });

export const getPortfolio    = ()                  => api.get('/portfolio');
export const getTransactions = ()                  => api.get('/portfolio/transactions');
export const buyStock        = (symbol, quantity)  => api.post('/portfolio/buy',  { symbol, quantity });
export const sellStock       = (symbol, quantity)  => api.post('/portfolio/sell', { symbol, quantity });

export const searchStocks    = (q)                 => api.get(`/stocks/search?q=${encodeURIComponent(q)}`);
export const getQuote        = (symbol)            => api.get(`/stocks/${symbol}`);
export const getCandles      = (symbol)            => api.get(`/stocks/${symbol}/candles`);
