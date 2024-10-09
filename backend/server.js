const express = require('express');
const cors = require('cors');
const cron = require('node-cron');
const routes = require('./routes'); // Import API routes
const { fetchSP500Data, fetchStockDetails } = require('./dataFetcher'); // Import the data fetcher function
require('dotenv').config();

const app = express();
const port = process.env.PORT || 5000;

// Enable CORS
app.use(cors());
app.use(express.json());

// API routes
app.use('/api', routes);

// Fetch data immediately when the server starts
// fetchSP500Data(); // Fetch stock data and cache it in the database

// Fetch SP500 data immediately, then schedule fetching every 15 minutes
cron.schedule('*/15 * * * *', fetchSP500Data);

// Start the server
app.listen(port, () => {
  console.log(`Backend running on http://localhost:${port}`);
});
