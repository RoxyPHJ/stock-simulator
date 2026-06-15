# 📈 주식 모의투자 시뮬레이터

실제 주식 데이터를 기반으로 가상 매수·매도를 경험할 수 있는 모의투자 플랫폼입니다.

🌐 **배포 URL**: [https://project-peup6.vercel.app]

---

## 주요 기능

- **회원가입 / 로그인** — JWT 기반 인증, 초기 자본금 1,000만 원 지급
- **종목 검색** — Alpha Vantage API 연동, 검색 결과 24시간 localStorage 캐시
- **캔들 차트** — Seeded PRNG로 생성한 일관된 모의 가격 데이터 시각화
- **매수 / 매도** — PostgreSQL 트랜잭션(FOR UPDATE · ROLLBACK)으로 원자성 보장
- **대시보드** — 보유 종목, 잔고, 수익률 현황
- **거래 내역** — 전체 매수·매도 기록 조회
- **USD/KRW 환율** — 실시간 환율 적용해 원화 환산 표시

---

## 기술 스택

| 구분     | 기술                                      |
| -------- | ----------------------------------------- |
| Frontend | React 18, Vite, Axios, Lightweight Charts |
| Backend  | Node.js, Express, JSON Web Token, bcrypt  |
| Database | PostgreSQL 16                             |
| Infra    | Docker, Nginx (리버스 프록시)             |
| CI/CD    | GitHub Actions                            |
| 배포     | Vercel (Frontend) · Render (Backend + DB) |
