const router = require('express').Router();
const { pool } = require('../db');
const auth = require('../middleware/auth');

router.use(auth);

router.get('/', async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT symbol FROM watchlist WHERE user_id = $1 ORDER BY id',
      [req.user.id]
    );
    res.json(rows);
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/', async (req, res) => {
  const { symbol } = req.body;
  if (!symbol) return res.status(400).json({ error: 'symbol required' });
  try {
    await pool.query(
      'INSERT INTO watchlist (user_id, symbol) VALUES ($1, $2) ON CONFLICT DO NOTHING',
      [req.user.id, symbol.toUpperCase()]
    );
    res.status(201).json({ symbol: symbol.toUpperCase() });
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
});

router.delete('/:symbol', async (req, res) => {
  try {
    await pool.query(
      'DELETE FROM watchlist WHERE user_id = $1 AND symbol = $2',
      [req.user.id, req.params.symbol.toUpperCase()]
    );
    res.json({ ok: true });
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
