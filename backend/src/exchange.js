const { pool } = require('./db');

const CACHE_KEY    = 'exchange:USD/KRW';
const FALLBACK     = 1380;

async function getExchangeRate() {
  try {
    const { rows } = await pool.query(
      'SELECT data FROM api_cache WHERE key = $1 AND expires_at > NOW()',
      [CACHE_KEY]
    );
    if (rows.length) return rows[0].data.rate;

    const res  = await fetch('https://open.er-api.com/v6/latest/USD');
    const data = await res.json();
    const rate = data.rates?.KRW;
    if (!rate) return FALLBACK;

    await pool.query(
      `INSERT INTO api_cache (key, data, expires_at)
       VALUES ($1, $2, NOW() + INTERVAL '24 hours')
       ON CONFLICT (key) DO UPDATE SET data = $2, expires_at = NOW() + INTERVAL '24 hours'`,
      [CACHE_KEY, JSON.stringify({ rate })]
    );
    return rate;
  } catch {
    return FALLBACK;
  }
}

module.exports = { getExchangeRate };
