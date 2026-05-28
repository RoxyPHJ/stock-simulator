const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function initDb() {
  const sql = fs.readFileSync(path.join(__dirname, 'db/init.sql'), 'utf8');
  await pool.query(sql);
  console.log('DB initialized');
}

module.exports = { pool, initDb };
