require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { initDb } = require('./db');

const app = express();
app.use(cors());
app.use(express.json());

app.use('/auth',      require('./routes/auth'));
app.use('/stocks',    require('./routes/stocks'));
app.use('/portfolio', require('./routes/portfolio'));
app.use('/watchlist', require('./routes/watchlist'));
app.use('/exchange',  require('./routes/exchange'));

app.get('/health', (_req, res) => res.json({ status: 'ok' }));

const PORT = process.env.PORT || 4000;

initDb()
  .then(() => app.listen(PORT, () => console.log(`Backend listening on :${PORT}`)))
  .catch((err) => { console.error('Failed to init DB:', err); process.exit(1); });
