const express = require('express');
const router = express.Router();
const dataFetcher = require('./dataFetcher');
const dcfModel = require('./dcfModel');
const pool = require('./db');


// Home data route
router.get('/home', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM stocks');
    console.log('Home data result:', result.rows);
    res.json(result.rows); // Return rows as an array
  } catch (err) {
    console.error('Error fetching home data:', err);
    res.status(500).send('Server Error');
  }
});

// S&P 500 data route
router.get('/sp500', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM stocks');
    console.log('S&P 500 data result:', result.rows);
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching S&P 500 data:', err.stack);
    res.status(500).json({ error: 'Server Error' });
  }
});

router.get('/stock_details/:ticker', async (req, res) => {
  const { ticker } = req.params;
  console.log('Fetching stock details for:', ticker);

  try {
      // Fetch details from the database
      await dataFetcher.fetchStockDetails(ticker);

      const result = await pool.query('SELECT * FROM company_metrics WHERE ticker = $1', [ticker]);
      
      if (result.rows.length === 0) {
          return res.status(404).send('Stock details not found');
      }

      res.json(result.rows[0]);
  } catch (error) {
      console.error('Error fetching stock details:', error);
      res.status(500).send('Server error');
  }
});

router.get('/stock_news/:ticker', async (req, res) => {
  const { ticker } = req.params;
  console.log(`Fetching news for ${ticker}`);
  try {
    // Fetch news from the database
    const result = await pool.query('SELECT * FROM stock_news WHERE ticker = $1 ORDER BY datetime DESC LIMIT 10', [ticker]);

    if (result.rows.length === 0) {
      // If no news is found in the database, fetch from Finnhub and store it
      await dataFetcher.fetchStockNews(ticker);
      const freshResult = await pool.query('SELECT * FROM stock_news WHERE ticker = $1 ORDER BY datetime DESC LIMIT 10', [ticker]);
      res.json(freshResult.rows);
    } else {
      res.json(result.rows);
    }
  } catch (error) {
    console.error(`Error fetching news for ${ticker}:`, error.message);
    res.status(500).json({ error: 'Error fetching news' });
  }
});

// Route to calculate price target
router.get('/calculatePriceTarget/:ticker', async (req, res) => {
  const ticker = req.params.ticker.toUpperCase();

  try {
    console.log(`Storing price target for ${ticker} in the database`);
    // Fetch data
    const financialData = await dataFetcher.getFinancialStatements(ticker);
    const marketData = await dataFetcher.getMarketData(ticker);
    const riskMetrics = await dataFetcher.getRiskMetrics(ticker);

    // Calculate DCF
    const { priceTarget, wacc, assumptions } = await dcfModel.calculateDCF(
      ticker,
      financialData,
      marketData,
      riskMetrics
    );

    // Store result in the database
    const client = await pool.connect();
    const insertQuery = `
      INSERT INTO price_targets (ticker, calculation_date, price_target, wacc, assumptions)
      VALUES ($1, NOW(), $2, $3, $4)
      RETURNING *;
    `;
    const values = [ticker, priceTarget, wacc, assumptions];

    const result = await client.query(insertQuery, values);

    console.log(`Successfully stored price target for ${ticker}`);

    client.release();

    // Respond with the result
    res.json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    console.error('Error calculating price target:', error.message);
    res.status(500).json({
      success: false,
      message: 'Error calculating price target',
      error: error.message,
    });
  }
});

module.exports = router;
