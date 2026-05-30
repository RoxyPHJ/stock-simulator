const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function initDb() {
  const sql = fs.readFileSync(path.join(__dirname, 'db/init.sql'), 'utf8');
  await pool.query(sql);

  // 일회성 마이그레이션: KRW 환율 체계 도입 전 잔고/보유종목/거래내역 초기화
  const { rows } = await pool.query(
    "SELECT 1 FROM api_cache WHERE key = 'migration:krw_reset'"
  );
  if (!rows.length) {
    await pool.query('UPDATE users SET balance = 10000000');
    await pool.query('DELETE FROM holdings');
    await pool.query('DELETE FROM transactions');
    await pool.query(
      "INSERT INTO api_cache (key, data, expires_at) VALUES ('migration:krw_reset', '{}', '2099-01-01')"
    );
    console.log('Migration krw_reset: all balances reset to 10,000,000');
  }

  console.log('DB initialized');
}

module.exports = { pool, initDb };
