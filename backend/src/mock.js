const STOCKS = [
  { symbol: 'AAPL',  name: 'Apple Inc',               price: 185.50,  change:  1.23  },
  { symbol: 'MSFT',  name: 'Microsoft Corporation',   price: 420.30,  change: -0.85  },
  { symbol: 'GOOGL', name: 'Alphabet Inc',             price: 171.20,  change:  2.10  },
  { symbol: 'AMZN',  name: 'Amazon.com Inc',           price: 184.70,  change:  0.95  },
  { symbol: 'TSLA',  name: 'Tesla Inc',                price: 177.50,  change: -3.20  },
  { symbol: 'NVDA',  name: 'NVIDIA Corporation',       price: 875.40,  change: 15.30  },
  { symbol: 'META',  name: 'Meta Platforms Inc',       price: 478.90,  change:  3.45  },
  { symbol: 'NFLX',  name: 'Netflix Inc',              price: 648.20,  change: -1.80  },
  { symbol: 'UBER',  name: 'Uber Technologies Inc',   price:  71.30,  change:  0.65  },
  { symbol: 'BABA',  name: 'Alibaba Group',            price:  78.50,  change:  0.40  },
];

// ─── Seeded PRNG (mulberry32) ────────────────────────
// 동일한 seed → 항상 동일한 값 → 같은 종목은 항상 같은 가격 흐름
function seededRand(seed) {
  let t = (seed + 0x6D2B79F5) >>> 0;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

function symbolSeed(sym) {
  let h = 5381;
  for (const c of sym) h = ((h << 5) + h + c.charCodeAt(0)) | 0;
  return Math.abs(h);
}

// 캔들 인덱스 N → 항상 동일한 난수 3개 반환
function randAt(sym, n) {
  const base = symbolSeed(sym);
  return [
    seededRand(base + n * 3),
    seededRand(base + n * 3 + 1),
    seededRand(base + n * 3 + 2),
  ];
}

function makeCandle(time, prevClose, sym, index) {
  const [r1, r2, r3] = randAt(sym, index);
  const change = (r1 - 0.5) * 10;                                         // -5 ~ +5
  const open   = parseFloat(prevClose.toFixed(2));
  const close  = parseFloat(Math.max(open + change, 1).toFixed(2));
  const high   = parseFloat((Math.max(open, close) * (1 + r2 * 0.006)).toFixed(2));
  const low    = parseFloat((Math.min(open, close) * (1 - r3 * 0.006)).toFixed(2));
  return { time, open, high, low, close };
}

function nextTradingDate(dateStr) {
  const d = new Date(dateStr + 'T00:00:00Z');
  do { d.setUTCDate(d.getUTCDate() + 1); } while (d.getUTCDay() === 0 || d.getUTCDay() === 6);
  return d.toISOString().split('T')[0];
}

// ─── 시간 기반 캔들 진화 ─────────────────────────────
// - 첫 방문: 100개 초기 캔들 생성 → DB 저장
// - 재방문: 경과시간 ÷ 5분 = 추가 캔들 수 → DB 업데이트 후 반환
async function getOrUpdateMockCandles(symbol, pool) {
  const sym      = symbol.toUpperCase();
  const cacheKey = `mock:candles:${sym}`;

  const { rows } = await pool.query(
    'SELECT data FROM api_cache WHERE key = $1',
    [cacheKey]
  );

  const now = Date.now();

  if (!rows.length) {
    // 첫 방문 — 100개 초기 캔들 생성
    const basePrice = STOCKS.find(s => s.symbol === sym)?.price ?? 100;
    let price = basePrice * 0.80;
    const candles = [];

    const start = new Date();
    start.setUTCDate(start.getUTCDate() - 140);
    while (start.getUTCDay() === 0 || start.getUTCDay() === 6) start.setUTCDate(start.getUTCDate() + 1);

    let dateStr = start.toISOString().split('T')[0];
    for (let i = 0; i < 100; i++) {
      const c = makeCandle(dateStr, price, sym, i);
      candles.push(c);
      price   = c.close;
      dateStr = nextTradingDate(dateStr);
    }

    await pool.query(
      `INSERT INTO api_cache (key, data, expires_at)
       VALUES ($1, $2, '2099-01-01')
       ON CONFLICT (key) DO UPDATE SET data = $2`,
      [cacheKey, JSON.stringify({ candles, lastUpdated: now })]
    );
    return candles;
  }

  // 재방문 — 경과 5분 단위마다 캔들 1개 추가
  const { candles, lastUpdated } = rows[0].data;
  const newCount = Math.min(
    Math.floor((now - lastUpdated) / (5 * 60 * 1000)),
    200  // 최대 200개 한 번에 추가
  );

  if (newCount === 0) return candles;

  const updated  = [...candles];
  let price      = candles[candles.length - 1].close;
  let dateStr    = candles[candles.length - 1].time;

  for (let i = 0; i < newCount; i++) {
    dateStr     = nextTradingDate(dateStr);
    const index = candles.length + i;          // 전역 인덱스 → 항상 동일한 값
    const c     = makeCandle(dateStr, price, sym, index);
    updated.push(c);
    price = c.close;
  }

  await pool.query(
    'UPDATE api_cache SET data = $2 WHERE key = $1',
    [cacheKey, JSON.stringify({ candles: updated, lastUpdated: now })]
  );

  return updated;
}

// ─── 검색 / 현재가 ───────────────────────────────────
function mockSearch(q) {
  const lower   = q.toLowerCase();
  const matched = STOCKS.filter(
    s => s.symbol.toLowerCase().includes(lower) || s.name.toLowerCase().includes(lower)
  );
  return (matched.length ? matched : STOCKS).map(s => ({
    '1. symbol': s.symbol,
    '2. name':   s.name,
    '3. type':   'Equity',
    '4. region': 'United States',
    '8. currency': 'USD',
    '9. matchScore': '1.0000',
  }));
}

function mockQuote(symbol) {
  const s = STOCKS.find(s => s.symbol === symbol.toUpperCase());
  if (!s) return null;
  return {
    symbol:        s.symbol,
    price:         s.price,
    change:        s.change,
    changePercent: `${((s.change / s.price) * 100).toFixed(2)}%`,
  };
}

// 차트 종가와 일치하는 현재가 반환 (DB 마지막 캔들 기준)
async function getLastMockPrice(symbol, pool) {
  const candles = await getOrUpdateMockCandles(symbol.toUpperCase(), pool);
  const last    = candles[candles.length - 1];
  const prev    = candles[candles.length - 2];
  const change  = parseFloat((last.close - prev.close).toFixed(2));
  return {
    symbol:        symbol.toUpperCase(),
    price:         last.close,
    change,
    changePercent: `${((change / prev.close) * 100).toFixed(2)}%`,
  };
}

module.exports = { mockSearch, mockQuote, getOrUpdateMockCandles, getLastMockPrice };
