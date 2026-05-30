const router = require('express').Router();
const { pool } = require('../db');
const { mockSearch, getOrUpdateMockCandles, getLastMockPrice } = require('../mock');

router.get('/search', async (req, res) => {
  const { q } = req.query;
  if (!q) return res.status(400).json({ error: 'q is required' });
  res.json(mockSearch(q));
});

router.get('/:symbol/candles', async (req, res) => {
  try {
    res.json(await getOrUpdateMockCandles(req.params.symbol.toUpperCase(), pool));
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/:symbol', async (req, res) => {
  try {
    res.json(await getLastMockPrice(req.params.symbol.toUpperCase(), pool));
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
