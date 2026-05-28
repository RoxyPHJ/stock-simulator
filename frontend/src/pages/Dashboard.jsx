import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getPortfolio, getTransactions } from '../api';

export default function Dashboard() {
  const [portfolio,    setPortfolio]    = useState(null);
  const [transactions, setTransactions] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    getPortfolio()   .then(r => setPortfolio(r.data))   .catch(() => {});
    getTransactions().then(r => setTransactions(r.data)).catch(() => {});
  }, []);

  function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  }

  if (!portfolio) return <div className="loading">로딩 중…</div>;

  return (
    <div className="page">
      <div className="page-header">
        <h2>대시보드</h2>
        <nav className="nav">
          <Link to="/market">시장</Link>
          <button onClick={logout}>로그아웃</button>
        </nav>
      </div>

      <div className="balance-card">
        <span>예수금</span>
        <strong>{Number(portfolio.balance).toLocaleString()}원</strong>
      </div>

      <div className="section">
        <h3>보유 종목</h3>
        {portfolio.holdings.length === 0 ? (
          <p className="empty">보유 종목 없음</p>
        ) : (
          <table>
            <thead>
              <tr><th>종목</th><th>수량</th><th>평균단가</th></tr>
            </thead>
            <tbody>
              {portfolio.holdings.map(h => (
                <tr key={h.symbol}>
                  <td><Link to={`/market?symbol=${h.symbol}`}>{h.symbol}</Link></td>
                  <td>{h.quantity.toLocaleString()}</td>
                  <td>${Number(h.avg_price).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="section">
        <h3>최근 거래</h3>
        {transactions.length === 0 ? (
          <p className="empty">거래 내역 없음</p>
        ) : (
          <table>
            <thead>
              <tr><th>일시</th><th>종목</th><th>구분</th><th>수량</th><th>단가</th></tr>
            </thead>
            <tbody>
              {transactions.map(t => (
                <tr key={t.id}>
                  <td>{new Date(t.created_at).toLocaleDateString('ko-KR')}</td>
                  <td>{t.symbol}</td>
                  <td className={t.type === 'BUY' ? 'tag-buy' : 'tag-sell'}>{t.type}</td>
                  <td>{Number(t.quantity).toLocaleString()}</td>
                  <td>${Number(t.price).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
