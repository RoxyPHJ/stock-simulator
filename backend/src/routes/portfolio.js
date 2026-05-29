const router = require('express').Router();
const axios = require('axios');
const { pool } = require('../db');
const auth = require('../middleware/auth');
const { mockQuote } = require('../mock');

router.use(auth);

async function fetchPrice(symbol) {
  const { data } = await axios.get('https://www.alphavantage.co/query', {
    params: { function: 'GLOBAL_QUOTE', symbol, apikey: process.env.ALPHA_VANTAGE_API_KEY },
  });
  const price = parseFloat(data['Global Quote']?.['05. price']);
  if (!price) {
    // rate limit 또는 미지원 종목 → mock 가격 사용
    const mock = mockQuote(symbol);
    if (mock) return mock.price;
    throw new Error(`Symbol not found: ${symbol}`);
  }
  return price;
}

// 포트폴리오 + 잔고 조회
router.get('/', async (req, res) => {
  try {
    const { rows: users } = await pool.query(
      'SELECT id, email, balance FROM users WHERE id = $1',
      [req.user.id]
    );
    const { rows: holdings } = await pool.query(
      'SELECT symbol, quantity, avg_price FROM holdings WHERE user_id = $1 AND quantity > 0',
      [req.user.id]
    );
    res.json({ ...users[0], holdings });
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
});

// 거래 내역
router.get('/transactions', async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT id, symbol, type, quantity, price, created_at FROM transactions WHERE user_id = $1 ORDER BY created_at DESC LIMIT 50',
      [req.user.id]
    );
    res.json(rows);
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
});

// 매수
router.post('/buy', async (req, res) => {
  const { symbol, quantity } = req.body;
  if (!symbol || !Number.isInteger(quantity) || quantity <= 0)
    return res.status(400).json({ error: 'symbol and positive integer quantity required' });

  const sym = symbol.toUpperCase();
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const price = await fetchPrice(sym);
    const cost = price * quantity;

    const { rows } = await client.query(
      'SELECT balance FROM users WHERE id = $1 FOR UPDATE',
      [req.user.id]
    );
    if (parseFloat(rows[0].balance) < cost)
      throw Object.assign(new Error('Insufficient balance'), { status: 400 });

    await client.query('UPDATE users SET balance = balance - $1 WHERE id = $2', [cost, req.user.id]);

    // avg_price = 가중평균 갱신
    await client.query(`
      INSERT INTO holdings (user_id, symbol, quantity, avg_price)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (user_id, symbol) DO UPDATE SET
        avg_price = (holdings.avg_price * holdings.quantity + $4 * $3) / (holdings.quantity + $3),
        quantity  = holdings.quantity + $3
    `, [req.user.id, sym, quantity, price]);

    await client.query(
      'INSERT INTO transactions (user_id, symbol, type, quantity, price) VALUES ($1, $2, $3, $4, $5)',
      [req.user.id, sym, 'BUY', quantity, price]
    );

    await client.query('COMMIT');
    res.json({ symbol: sym, quantity, price, cost });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(err.status ?? 500).json({ error: err.message });
  } finally {
    client.release();
  }
});

// 매도
router.post('/sell', async (req, res) => {
  const { symbol, quantity } = req.body;
  if (!symbol || !Number.isInteger(quantity) || quantity <= 0)
    return res.status(400).json({ error: 'symbol and positive integer quantity required' });

  const sym = symbol.toUpperCase();
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const price = await fetchPrice(sym);

    const { rows } = await client.query(
      'SELECT quantity FROM holdings WHERE user_id = $1 AND symbol = $2 FOR UPDATE',
      [req.user.id, sym]
    );
    if (!rows.length || rows[0].quantity < quantity)
      throw Object.assign(new Error('Insufficient holdings'), { status: 400 });

    const proceeds = price * quantity;

    await client.query('UPDATE users SET balance = balance + $1 WHERE id = $2', [proceeds, req.user.id]);
    await client.query(
      'UPDATE holdings SET quantity = quantity - $1 WHERE user_id = $2 AND symbol = $3',
      [quantity, req.user.id, sym]
    );
    await client.query(
      'INSERT INTO transactions (user_id, symbol, type, quantity, price) VALUES ($1, $2, $3, $4, $5)',
      [req.user.id, sym, 'SELL', quantity, price]
    );

    await client.query('COMMIT');
    res.json({ symbol: sym, quantity, price, proceeds });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(err.status ?? 500).json({ error: err.message });
  } finally {
    client.release();
  }
});

module.exports = router;
