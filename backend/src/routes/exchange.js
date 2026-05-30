const router = require('express').Router();
const { getExchangeRate } = require('../exchange');

router.get('/', async (req, res) => {
  try {
    res.json({ rate: await getExchangeRate() });
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
