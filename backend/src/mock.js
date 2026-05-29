// Alpha Vantage rate limit 초과 시 fallback 데이터
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

function mockSearch(q) {
  const lower = q.toLowerCase();
  const matched = STOCKS.filter(
    s => s.symbol.toLowerCase().includes(lower) || s.name.toLowerCase().includes(lower)
  );
  // 매칭 없으면 전체 반환
  const list = matched.length ? matched : STOCKS;
  return list.map(s => ({
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

function mockCandles(symbol) {
  const s     = STOCKS.find(s => s.symbol === symbol.toUpperCase());
  const base  = s?.price ?? 100;
  const result = [];
  let   price  = base * 0.85;
  const today  = new Date();

  for (let i = 100; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    if (d.getDay() === 0 || d.getDay() === 6) continue; // 주말 제외

    const delta = (Math.random() - 0.48) * price * 0.02;
    const open  = parseFloat(price.toFixed(2));
    const close = parseFloat(Math.max(price + delta, 1).toFixed(2));
    const high  = parseFloat((Math.max(open, close) * (1 + Math.random() * 0.008)).toFixed(2));
    const low   = parseFloat((Math.min(open, close) * (1 - Math.random() * 0.008)).toFixed(2));

    result.push({ time: d.toISOString().split('T')[0], open, high, low, close });
    price = close;
  }
  return result;
}

module.exports = { mockSearch, mockQuote, mockCandles };
