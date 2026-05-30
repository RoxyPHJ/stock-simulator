import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getPortfolio, getQuote, getWatchlist, removeWatchlist } from '../api';

export default function Dashboard() {
  const [portfolio,   setPortfolio]   = useState(null);
  const [prices,      setPrices]      = useState({});
  const [watchlist,   setWatchlist]   = useState([]);
  const [watchPrices, setWatchPrices] = useState({});
  const navigate = useNavigate();

  useEffect(() => {
    getPortfolio().then(r => setPortfolio(r.data)).catch(() => {});
    getWatchlist().then(r => setWatchlist(r.data)).catch(() => {});
  }, []);

  // 보유 종목 현재가
  useEffect(() => {
    if (!portfolio?.holdings?.length) return;
    Promise.all(
      portfolio.holdings.map(h =>
        getQuote(h.symbol).then(r => ({ symbol: h.symbol, price: r.data.price })).catch(() => null)
      )
    ).then(results => {
      const map = {};
      results.forEach(r => { if (r) map[r.symbol] = r.price; });
      setPrices(map);
    });
  }, [portfolio]);

  // 관심종목 현재가
  useEffect(() => {
    if (!watchlist.length) return;
    Promise.all(
      watchlist.map(w =>
        getQuote(w.symbol).then(r => ({ symbol: w.symbol, data: r.data })).catch(() => null)
      )
    ).then(results => {
      const map = {};
      results.forEach(r => { if (r) map[r.symbol] = r.data; });
      setWatchPrices(map);
    });
  }, [watchlist]);

  async function handleRemoveWatch(symbol) {
    await removeWatchlist(symbol).catch(() => {});
    setWatchlist(prev => prev.filter(w => w.symbol !== symbol));
  }

  function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  }

  function profitInfo(h) {
    const cur = prices[h.symbol];
    if (!cur) return null;
    const amount = (cur - Number(h.avg_price)) * h.quantity;
    const rate   = ((cur - Number(h.avg_price)) / Number(h.avg_price)) * 100;
    return { amount, rate };
  }

  if (!portfolio) return <div className="loading">로딩 중…</div>;

  return (
    <div className="page">
      <div className="page-header">
        <div className="page-title">
          <h2>대시보드</h2>
          <span className="disclaimer">실제 가격과는 무관한 모의투자 프로그램입니다</span>
        </div>
        <nav className="nav">
          <Link to="/market">시장</Link>
          <Link to="/transactions">거래내역</Link>
          <button onClick={logout}>로그아웃</button>
        </nav>
      </div>

      <div className="balance-card">
        <span>예수금</span>
        <strong>{Number(portfolio.balance).toLocaleString()}원</strong>
      </div>

      {/* 보유 종목 */}
      <div className="section">
        <h3>보유 종목</h3>
        {portfolio.holdings.length === 0 ? (
          <p className="empty">보유 종목 없음</p>
        ) : (
          <table>
            <thead>
              <tr><th>종목</th><th>수량</th><th>평균단가</th><th>현재가</th><th>수익금</th><th>수익률</th></tr>
            </thead>
            <tbody>
              {portfolio.holdings.map(h => {
                const info = profitInfo(h);
                const isPos = info?.amount >= 0;
                return (
                  <tr key={h.symbol}>
                    <td><Link to={`/market?symbol=${h.symbol}`}>{h.symbol}</Link></td>
                    <td>{h.quantity.toLocaleString()}</td>
                    <td>${Number(h.avg_price).toLocaleString()}</td>
                    <td>{prices[h.symbol] ? `$${prices[h.symbol].toLocaleString()}` : '—'}</td>
                    <td className={info ? (isPos ? 'up' : 'down') : ''}>
                      {info ? `${isPos ? '+' : ''}$${info.amount.toFixed(2)}` : '—'}
                    </td>
                    <td className={info ? (isPos ? 'up' : 'down') : ''}>
                      {info ? `${isPos ? '+' : ''}${info.rate.toFixed(2)}%` : '—'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* 관심종목 */}
      <div className="section">
        <h3>관심종목</h3>
        {watchlist.length === 0 ? (
          <p className="empty">관심종목 없음 — 시장에서 ★ 버튼으로 추가하세요</p>
        ) : (
          <table>
            <thead>
              <tr><th>종목</th><th>현재가</th><th>등락</th><th></th></tr>
            </thead>
            <tbody>
              {watchlist.map(w => {
                const q = watchPrices[w.symbol];
                const isPos = q?.change >= 0;
                return (
                  <tr key={w.symbol}>
                    <td><Link to={`/market?symbol=${w.symbol}`}>{w.symbol}</Link></td>
                    <td>{q ? `$${q.price.toLocaleString()}` : '—'}</td>
                    <td className={q ? (isPos ? 'up' : 'down') : ''}>
                      {q ? `${isPos ? '▲' : '▼'} ${q.changePercent}` : '—'}
                    </td>
                    <td>
                      <button className="btn-watch-remove" onClick={() => handleRemoveWatch(w.symbol)}>✕</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
