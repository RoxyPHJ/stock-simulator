const router = require('express').Router();
const axios = require('axios');

const AV_BASE = 'https://www.alphavantage.co/query';

router.get('/search', async (req, res) => {
  const { q } = req.query;
  if (!q) return res.status(400).json({ error: 'q is required' });

  try {
    const { data } = await axios.get(AV_BASE, {
      params: { function: 'SYMBOL_SEARCH', keywords: q, apikey: process.env.ALPHA_VANTAGE_API_KEY },
    });
    console.log('[AV search raw]', JSON.stringify(data));
    res.json(data.bestMatches ?? []);
  } catch (err) {
    console.error('[AV search error]', err.message);
    res.status(500).json({ error: 'Failed to search stocks' });
  }
});

// Alpha Vantage TIME_SERIES_DAILY → lightweight-charts 형식으로 변환
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
  try {
    const { data } = await axios.get(AV_BASE, {
      params: {
        function: 'TIME_SERIES_DAILY',
        symbol: req.params.symbol,
        outputsize: 'compact',
        apikey: process.env.ALPHA_VANTAGE_API_KEY,
      },
    });
    const series = data['Time Series (Daily)'];
    if (!series) return res.status(404).json({ error: 'No data for symbol' });
    res.json(toCandles(series));
  } catch {
    res.status(500).json({ error: 'Failed to fetch candles' });
  }
});

router.get('/:symbol', async (req, res) => {
  try {
    const { data } = await axios.get(AV_BASE, {
      params: { function: 'GLOBAL_QUOTE', symbol: req.params.symbol, apikey: process.env.ALPHA_VANTAGE_API_KEY },
    });
    const q = data['Global Quote'];
    if (!q?.['05. price']) return res.status(404).json({ error: 'Symbol not found' });

    res.json({
      symbol: q['01. symbol'],
      price: parseFloat(q['05. price']),
      change: parseFloat(q['09. change']),
      changePercent: q['10. change percent'],
    });
  } catch {
    res.status(500).json({ error: 'Failed to fetch quote' });
  }
});

module.exports = router;
