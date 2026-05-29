import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { searchStocks, getQuote, getCandles, buyStock, sellStock, getWatchlist, addWatchlist, removeWatchlist } from '../api';
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

  // 관심종목 로드
  useEffect(() => {
    getWatchlist().then(r => setWatchlist(r.data.map(w => w.symbol))).catch(() => {});
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

  const inWatchlist = watchlist.includes(symbol);

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

      {quote && (
        <div className="quote-card">
          <h3>{quote.symbol}</h3>
          <span className="quote-price">${quote.price.toLocaleString()}</span>
          <span className={quote.change >= 0 ? 'up' : 'down'}>
            {quote.change >= 0 ? '▲' : '▼'} {quote.changePercent}
          </span>
          <button className={`btn-watch ${inWatchlist ? 'active' : ''}`} onClick={handleWatchToggle}>
            {inWatchlist ? '★' : '☆'}
          </button>
        </div>
      )}

      {candles.length > 0 && <CandleChart data={candles} />}

      {symbol && !loading && (
        <div className="trade-row">
          <input type="number" min="1" value={qty} onChange={e => setQty(e.target.value)} />
          <button className="btn-buy"  onClick={() => handleTrade('BUY')}>매수</button>
          <button className="btn-sell" onClick={() => handleTrade('SELL')}>매도</button>
          {msg && <span className="trade-msg">{msg}</span>}
        </div>
      )}
    </div>
  );
}
