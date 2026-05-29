const router = require('express').Router();
const axios  = require('axios');
const { pool } = require('../db');
const { mockSearch, mockQuote, getOrUpdateMockCandles } = require('../mock');

const AV_BASE = 'https://www.alphavantage.co/query';

function isRateLimited(data) {
  return !!(data.Information || data.Note);
}

// ─── 종목 검색 ───────────────────────────────────────
router.get('/search', async (req, res) => {
  const { q } = req.query;
  if (!q) return res.status(400).json({ error: 'q is required' });

  try {
    const { data } = await axios.get(AV_BASE, {
      params: { function: 'SYMBOL_SEARCH', keywords: q, apikey: process.env.ALPHA_VANTAGE_API_KEY },
    });
    if (isRateLimited(data)) return res.json(mockSearch(q));
    res.json(data.bestMatches ?? []);
  } catch {
    res.json(mockSearch(q));
  }
});

// ─── 캔들 데이터 (PostgreSQL 1시간 캐시) ─────────────
function toCandles(timeSeries) {
  return Object.entries(timeSeries)
    .map(([date, v]) => ({
      time:  date,
      open:  parseFloat(v['1. open']),
      high:  parseFloat(v['2. high']),
      low:   parseFloat(v['3. low']),
      close: parseFloat(v['4. close']),
    }))
    .sort((a, b) => (a.time < b.time ? -1 : 1));
}

router.get('/:symbol/candles', async (req, res) => {
  const sym      = req.params.symbol.toUpperCase();
  const cacheKey = `candles:${sym}`;

  try {
    // 캐시 조회
    const { rows } = await pool.query(
      'SELECT data FROM api_cache WHERE key = $1 AND expires_at > NOW()',
      [cacheKey]
    );
    if (rows.length) return res.json(rows[0].data);

    // Alpha Vantage 호출
    const { data } = await axios.get(AV_BASE, {
      params: { function: 'TIME_SERIES_DAILY', symbol: sym, outputsize: 'compact', apikey: process.env.ALPHA_VANTAGE_API_KEY },
    });

    if (isRateLimited(data)) return res.json(await getOrUpdateMockCandles(sym, pool));

    const series = data['Time Series (Daily)'];
    if (!series) return res.json(await getOrUpdateMockCandles(sym, pool));

    const candles = toCandles(series);

    // 실제 데이터 캐시 저장 (1시간)
    await pool.query(
      `INSERT INTO api_cache (key, data, expires_at)
       VALUES ($1, $2, NOW() + INTERVAL '1 hour')
       ON CONFLICT (key) DO UPDATE SET data = $2, expires_at = NOW() + INTERVAL '1 hour'`,
      [cacheKey, JSON.stringify(candles)]
    );

    res.json(candles);
  } catch {
    res.json(await getOrUpdateMockCandles(sym, pool));
  }
});

// ─── 현재가 조회 ─────────────────────────────────────
router.get('/:symbol', async (req, res) => {
  const sym = req.params.symbol.toUpperCase();
  try {
    const { data } = await axios.get(AV_BASE, {
      params: { function: 'GLOBAL_QUOTE', symbol: sym, apikey: process.env.ALPHA_VANTAGE_API_KEY },
    });

    if (isRateLimited(data)) {
      const mock = mockQuote(sym);
      return mock ? res.json(mock) : res.status(404).json({ error: 'Symbol not found' });
    }

    const q = data['Global Quote'];
    if (!q?.['05. price']) return res.status(404).json({ error: 'Symbol not found' });

    res.json({
      symbol:        q['01. symbol'],
      price:         parseFloat(q['05. price']),
      change:        parseFloat(q['09. change']),
      changePercent: q['10. change percent'],
    });
  } catch {
    const mock = mockQuote(sym);
    return mock ? res.json(mock) : res.status(404).json({ error: 'Symbol not found' });
  }
});

module.exports = router;
