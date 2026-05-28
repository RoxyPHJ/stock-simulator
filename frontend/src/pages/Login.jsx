import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login, register } from '../api';

export default function Login() {
  const [mode, setMode]       = useState('login');
  const [email, setEmail]     = useState('');
  const [password, setPass]   = useState('');
  const [error, setError]     = useState('');
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    try {
      const fn = mode === 'login' ? login : register;
      const { data } = await fn(email, password);
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error ?? '오류가 발생했습니다');
    }
  }

  return (
    <div className="auth-wrap">
      <div className="auth-card">
        <h1>모의투자</h1>
        <div className="tab-row">
          <button className={mode === 'login'    ? 'active' : ''} onClick={() => setMode('login')}>로그인</button>
          <button className={mode === 'register' ? 'active' : ''} onClick={() => setMode('register')}>회원가입</button>
        </div>
        <form className="auth-form" onSubmit={handleSubmit}>
          <input type="email"    placeholder="이메일"  value={email}    onChange={e => setEmail(e.target.value)}  required />
          <input type="password" placeholder="비밀번호" value={password} onChange={e => setPass(e.target.value)}   required />
          {error && <p className="error">{error}</p>}
          <button type="submit" className="btn-primary">
            {mode === 'login' ? '로그인' : '회원가입'}
          </button>
        </form>
        {mode === 'register' && <p className="hint">가입 시 초기 자금 10,000,000원 지급</p>}
      </div>
    </div>
  );
}
