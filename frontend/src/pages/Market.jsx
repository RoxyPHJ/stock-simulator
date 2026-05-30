import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { searchStocks, getQuote, getCandles, buyStock, sellStock,
         getWatchlist, addWatchlist, removeWatchlist,
         getPortfolio, getExchangeRate } from '../api';
import CandleChart from '../components/CandleChart';

export default function Market() {
  const [searchParams]              = useSearchParams();
  const [query,     setQuery]       = useState('');
  const [results,   setResults]     = useState([]);
  const [symbol,    setSymbol]      = useState(searchParams.get('symbol') ?? '');
  const [quote,     setQuote]       = useState(null);
  const [candles,   setCandles]     = useState([]);
  const [qty,       setQty]         = useState(1);
  const [msg,       setMsg]         = useState('');
  const [loading,   setLoading]     = useState(false);
  const [watchlist, setWatchlist]   = useState([]);
  const [balance,      setBalance]      = useState(null);
  const [exchangeRate, setExchangeRate] = useState(1380);
  const [currency,     setCurrency]     = useState('KRW');

  useEffect(() => {
    getWatchlist().then(r => setWatchlist(r.data.map(w => w.symbol))).catch(() => {});
    getPortfolio().then(r => setBalance(Number(r.data.balance))).catch(() => {});
    getExchangeRate().then(r => setExchangeRate(r.data.rate)).catch(() => {});
  }, []);

  useEffect(() => {
    if (symbol) loadSymbol(symbol);
  }, [symbol]);

  async function handleSearch(e) {
    e.preventDefault();
    if (!query.trim()) return;
    try {
      const { data } = await searchStocks(query);
      setResults(data);
    } catch {
      setMsg('검색 실패');
    }
  }

  async function loadSymbol(sym) {
    setLoading(true);
    setMsg('');
    setQuote(null);
    setCandles([]);
    try {
      const [q, c] = await Promise.all([getQuote(sym), getCandles(sym)]);
      setQuote(q.data);
      setCandles(c.data);
    } catch {
      setMsg('데이터를 불러올 수 없습니다');
    } finally {
      setLoading(false);
    }
  }

  function selectSymbol(sym) {
    setResults([]);
    setSymbol(sym);
  }

  async function handleTrade(type) {
    setMsg('');
    try {
      const fn = type === 'BUY' ? buyStock : sellStock;
      await fn(symbol, Number(qty));
      setMsg(`${type === 'BUY' ? '매수' : '매도'} 완료`);
      getPortfolio().then(r => setBalance(Number(r.data.balance))).catch(() => {});
    } catch (err) {
      setMsg(err.response?.data?.error ?? '거래 실패');
    }
  }

  async function handleWatchToggle() {
    const inWatch = watchlist.includes(symbol);
    try {
      if (inWatch) {
        await removeWatchlist(symbol);
        setWatchlist(prev => prev.filter(s => s !== symbol));
      } else {
        await addWatchlist(symbol);
        setWatchlist(prev => [...prev, symbol]);
      }
    } catch {
      setMsg('관심종목 처리 실패');
    }
  }

  // USD 가격 → 선택된 통화로 포맷
  function fmt(usdVal) {
    if (usdVal == null) return '—';
    if (currency === 'USD') return `$${Number(usdVal).toLocaleString()}`;
    return `₩${Math.round(Number(usdVal) * exchangeRate).toLocaleString()}`;
  }

  const inWatchlist = watchlist.includes(symbol);
  const totalCost   = quote ? quote.price * Number(qty) : null;

  return (
    <div className="page">
      <div className="page-header">
        <h2>시장</h2>
        <nav className="nav">
          <Link to="/">대시보드</Link>
          <Link to="/transactions">거래내역</Link>
        </nav>
      </div>

      <form className="search-row" onSubmit={handleSearch}>
        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="종목명 또는 티커 검색 (예: Apple, AAPL)"
        />
        <button type="submit">검색</button>
      </form>

      {results.length > 0 && (
        <ul className="result-list">
          {results.map(r => (
            <li key={r['1. symbol']} onClick={() => selectSymbol(r['1. symbol'])}>
              <strong>{r['1. symbol']}</strong> — {r['2. name']}
            </li>
          ))}
        </ul>
      )}

      {loading && <p className="empty">차트 로딩 중…</p>}

      {symbol && !loading && balance !== null && (
        <div className="market-balance">
          <span>잔고</span>
          <strong>
            {balance.toLocaleString()}원
            <span className="balance-usd">(${Math.round(balance / exchangeRate).toLocaleString()})</span>
          </strong>
        </div>
      )}

      {quote && (
        <div className="quote-card">
          <h3>{quote.symbol}</h3>
          <span className="quote-price">{fmt(quote.price)}</span>
          <span className={quote.change >= 0 ? 'up' : 'down'}>
            {quote.change >= 0 ? '▲' : '▼'} {quote.changePercent}
          </span>
          <button className={`btn-watch ${inWatchlist ? 'active' : ''}`} onClick={handleWatchToggle}>
            {inWatchlist ? '★' : '☆'}
          </button>
          <div className="rate-toggle-group">
            <span className="exchange-rate-label">$1 = ₩{Math.round(exchangeRate).toLocaleString()}</span>
            <div className="currency-toggle">
              <button className={currency === 'KRW' ? 'active' : ''} onClick={() => setCurrency('KRW')}>원화</button>
              <button className={currency === 'USD' ? 'active' : ''} onClick={() => setCurrency('USD')}>달러</button>
            </div>
          </div>
        </div>
      )}

      {candles.length > 0 && <CandleChart data={candles} />}

      {symbol && !loading && (
        <div className="trade-row">
          <div className="qty-control">
            <button className="btn-qty" onClick={() => setQty(q => Math.max(1, Number(q) - 1))}>−</button>
            <input type="number" min="1" value={qty} onChange={e => setQty(e.target.value)} />
            <button className="btn-qty" onClick={() => setQty(q => Number(q) + 1)}>+</button>
          </div>
          {totalCost !== null && (
            <span className="trade-total">{fmt(totalCost)}</span>
          )}
          <button className="btn-buy"  onClick={() => handleTrade('BUY')}>매수</button>
          <button className="btn-sell" onClick={() => handleTrade('SELL')}>매도</button>
          {msg && <span className="trade-msg">{msg}</span>}
        </div>
      )}
    </div>
  );
}
