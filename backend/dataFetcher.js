const axios = require('axios');
const pool = require('./db');
const cron = require('node-cron');
const FINNHUB_API_KEY = process.env.REACT_APP_FINNHUB_API_KEY;

const tickers = [
    'AAPL', 'MSFT', 'META', 'GOOGL', 'AMZN', 'TSLA', 'NVDA', 'BRK.B', 'JNJ', 'V'
  ];

async function fetchStockData() {
  for (let i = 0; i < tickers.length; i += 30) {
    const batch = tickers.slice(i, i + 30);
    for (const ticker of batch) {
      try {
        const response = await axios.get(`https://finnhub.io/api/v1/quote?symbol=${ticker}&token=${FINNHUB_API_KEY}`);
        const { c: price } = response.data;

        await pool.query(
          `INSERT INTO stocks (ticker, price, last_updated) 
           VALUES ($1, $2, NOW()) 
           ON CONFLICT (ticker) 
           DO UPDATE SET price = EXCLUDED.price, last_updated = NOW()`,
          [ticker, price]
        );
      } catch (error) {
        console.error(`Error fetching data for ${ticker}:`, error);
      }
    }
    await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second after each batch to avoid limit
  }
}

// Schedule every hour
cron.schedule('0 * * * *', fetchStockData);
