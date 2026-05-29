import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getTransactions } from '../api';

export default function Transactions() {
  const [transactions, setTransactions] = useState([]);
  const [tab, setTab] = useState('BUY');

  useEffect(() => {
    getTransactions().then(r => setTransactions(r.data)).catch(() => {});
  }, []);

  const filtered = transactions.filter(t => t.type === tab);

  return (
    <div className="page">
      <div className="page-header">
        <h2>거래내역</h2>
        <nav className="nav">
          <Link to="/">대시보드</Link>
          <Link to="/market">시장</Link>
        </nav>
      </div>

      <div className="tab-row" style={{ marginBottom: '20px' }}>
        <button className={tab === 'BUY'  ? 'active' : ''} onClick={() => setTab('BUY')}>매수</button>
        <button className={tab === 'SELL' ? 'active' : ''} onClick={() => setTab('SELL')}>매도</button>
      </div>

      {filtered.length === 0 ? (
        <p className="empty">{tab === 'BUY' ? '매수' : '매도'} 내역 없음</p>
      ) : (
        <table>
          <thead>
            <tr><th>일시</th><th>종목</th><th>수량</th><th>단가</th><th>총금액</th></tr>
          </thead>
          <tbody>
            {filtered.map(t => (
              <tr key={t.id}>
                <td>{new Date(t.created_at).toLocaleString('ko-KR')}</td>
                <td><Link to={`/market?symbol=${t.symbol}`}>{t.symbol}</Link></td>
                <td>{Number(t.quantity).toLocaleString()}</td>
                <td>${Number(t.price).toLocaleString()}</td>
                <td className={tab === 'BUY' ? 'down' : 'up'}>
                  {tab === 'BUY' ? '-' : '+'}${(t.price * t.quantity).toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
