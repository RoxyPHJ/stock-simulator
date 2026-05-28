CREATE TABLE IF NOT EXISTS users (
  id            SERIAL PRIMARY KEY,
  email         VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  balance       NUMERIC(15, 2) NOT NULL DEFAULT 10000000,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS holdings (
  id         SERIAL PRIMARY KEY,
  user_id    INTEGER REFERENCES users(id) ON DELETE CASCADE,
  symbol     VARCHAR(20) NOT NULL,
  quantity   INTEGER NOT NULL DEFAULT 0,
  avg_price  NUMERIC(12, 4) NOT NULL DEFAULT 0,
  UNIQUE(user_id, symbol)
);

CREATE TABLE IF NOT EXISTS transactions (
  id         SERIAL PRIMARY KEY,
  user_id    INTEGER REFERENCES users(id) ON DELETE CASCADE,
  symbol     VARCHAR(20) NOT NULL,
  type       VARCHAR(4) NOT NULL CHECK (type IN ('BUY', 'SELL')),
  quantity   INTEGER NOT NULL,
  price      NUMERIC(12, 4) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
