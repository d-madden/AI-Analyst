const express = require('express');
const pool = require('./db');
const router = express.Router();

// Home data route
router.get('/home', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM home_stocks');
    res.json(result.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// S&P 500 data route
router.get('/sp500', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM sp500_stocks');
    res.json(result.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
