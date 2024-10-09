const axios = require('axios');
const pool = require('./db');


const API_KEY = 'cs04b61r01qrbtrl7je0cs04b61r01qrbtrl7jeg';
const finnhubBaseUrl = 'https://finnhub.io/api/v1';

// List of top 50 S&P 500 companies
const symbols = [
  'AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA', 'META', 'NVDA', 'BRK.B', 'JNJ', 'V',
  'WMT', 'PG', 'JPM', 'XOM', 'UNH', 'HD', 'MA', 'DIS', 'PFE', 'CVX',
  'KO', 'MRK', 'PEP', 'BAC'
];

// Function to fetch data from Finnhub and store it in the PostgreSQL table
async function fetchSP500Data() {
  try {
    // Loop through each symbol
    for (const symbol of symbols) {
      // Fetch data from the Finnhub API
      const [quoteResponse, profileResponse] = await Promise.all([
        axios.get(`https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${API_KEY}`),
        axios.get(`https://finnhub.io/api/v1/stock/profile2?symbol=${symbol}&token=${API_KEY}`)
      ]);

      const quote = quoteResponse.data;
      const profile = profileResponse.data;

      console.log(`Quote for ${symbol}:`, quote);
      console.log(`Profile for ${symbol}:`, profile);

      // Insert data into the PostgreSQL table
      await pool.query(
        `INSERT INTO stocks (logo, ticker, name, industry, change_percent, price, marketCapitalization, open)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         ON CONFLICT (ticker) 
         DO UPDATE SET 
            logo = EXCLUDED.logo,
            name = EXCLUDED.name,
            industry = EXCLUDED.industry,
            change_percent = EXCLUDED.change_percent,
            price = EXCLUDED.price,
            marketCapitalization = EXCLUDED.marketCapitalization,
            open = EXCLUDED.open`,
        [
          profile.logo,
          symbol,
          profile.name,
          profile.finnhubIndustry,
          quote.dp,               // Change percentage
          quote.c,                // Current price
          profile.marketCapitalization,
          quote.o                 // Open price
        ]
      );
    }

    console.log('SP500 data successfully fetched and stored.');
  } catch (error) {
    console.error('Error fetching SP500 data:', error);
  }
}

// Fetch and store stock details
async function fetchStockDetails(ticker) {
  try {
      console.log(`fetchStockDetails(): ${ticker}`)

      // Fetch basic financials data
      const financialsResponse = await axios.get(`https://finnhub.io/api/v1/stock/metric?symbol=${ticker}&metric=all&token=${API_KEY}`);
      const financialsData = financialsResponse.data.metric;
      console.log(`Financials for ${ticker}:`, financialsData);

      // Insert or update stock details and metrics in the PostgreSQL table
        await pool.query(
            `INSERT INTO company_metrics 
            (ticker, pe_ratio, price_sales_ratio, price_book_ratio, pfcf_share, roe, 
             net_profit_margin, gross_margin, revenue_growth_3y, eps_growth_5y, asset_turnover, 
             inventory_turnover, debt_to_equity_ratio, current_ratio, last_updated) 
            VALUES 
            ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
            ON CONFLICT (ticker) DO UPDATE 
            SET pe_ratio = EXCLUDED.pe_ratio,
                price_sales_ratio = EXCLUDED.price_sales_ratio,
                price_book_ratio = EXCLUDED.price_book_ratio,
                pfcf_share = EXCLUDED.pfcf_share,
                roe = EXCLUDED.roe,
                net_profit_margin = EXCLUDED.net_profit_margin,
                gross_margin = EXCLUDED.gross_margin,
                revenue_growth_3y = EXCLUDED.revenue_growth_3y,
                eps_growth_5y = EXCLUDED.eps_growth_5y,
                asset_turnover = EXCLUDED.asset_turnover,
                inventory_turnover = EXCLUDED.inventory_turnover,
                debt_to_equity_ratio = EXCLUDED.debt_to_equity_ratio,
                current_ratio = EXCLUDED.current_ratio,
                last_updated = EXCLUDED.last_updated;`,
            [
                ticker,
                financialsData.peTTM,
                financialsData.psTTM,
                financialsData.pbQuarterly,
                financialsData.pfcfShareTTM, // P/FCF replacing EV/EBITDA
                financialsData.roeTTM,
                financialsData.netProfitMarginTTM,
                financialsData.grossMarginTTM,
                financialsData.revenueGrowth3Y,
                financialsData.epsGrowth5Y,
                financialsData.assetTurnoverTTM,
                financialsData.inventoryTurnoverTTM,
                financialsData['longTermDebt/equityQuarterly'],
                financialsData.currentRatioQuarterly,
                new Date() // Timestamp for last updated
            ]
        );

      console.log(`${ticker} data successfully fetched and stored.`);
  } catch (error) {
      console.error(`Error fetching stock details for ${ticker}:`, error);
  }
}

async function getFinancialStatements(ticker) {
  console.log(`Fetching financial statements for ${ticker}`);
  try {
    const financialsUrl = `${finnhubBaseUrl}/stock/financials-reported?symbol=${ticker}&token=${API_KEY}`;
    const response = await axios.get(financialsUrl);
    console.log(`Received financial statements for ${ticker}:`);
    return response.data; // Return the entire data object
  } catch (error) {
    console.error(`Error fetching financial statements for ${ticker}:`, error.message);
    throw error;
  }
}

async function getMarketData(ticker) {
  console.log(`Fetching market data for ${ticker}`);
  try {
    const quoteUrl = `${finnhubBaseUrl}/quote?symbol=${ticker}&token=${API_KEY}`;
    const profileUrl = `${finnhubBaseUrl}/stock/profile2?symbol=${ticker}&token=${API_KEY}`;

    const [quoteRes, profileRes] = await Promise.all([
      axios.get(quoteUrl),
      axios.get(profileUrl),
    ]);

    console.log(`Received market data for ${ticker}`);

    const stockPrice = quoteRes.data.c; // Current price
    let sharesOutstanding = profileRes.data.shareOutstanding;

    console.log(`Shares Outstanding from Finnhub for ${ticker}: ${sharesOutstanding}`);

    // Remove the incorrect multiplication
    sharesOutstanding *= 1_000_000;

    return {
      stockPrice,
      sharesOutstanding,
    };
  } catch (error) {
    console.error(`Error fetching market data for ${ticker}:`, error.message);
    throw error;
  }
}

async function getRiskMetrics(ticker) {
  console.log(`Fetching risk metrics for ${ticker}`);
  try {
    const metricsUrl = `${finnhubBaseUrl}/stock/metric?symbol=${ticker}&metric=all&token=${API_KEY}`;

    const metricsRes = await axios.get(metricsUrl);

    const beta = metricsRes.data.metric.beta;

    // Risk-free rate and market risk premium can be hardcoded or fetched from another API
    const riskFreeRate = 0.04; // Example: 2%
    const marketRiskPremium = 0.05; // Example: 5%

    console.log(`Received risk metrics for ${ticker}`);
    return {
      beta,
      riskFreeRate,
      marketRiskPremium,
    };
  } catch (error) {
    console.error(`Error fetching risk metrics for ${ticker}:`, error.message);
    throw error;
  }
}

async function fetchStockNews(ticker) {
  try {
    const newsUrl = `https://finnhub.io/api/v1/company-news?symbol=${ticker}&from=2023-01-01&to=${new Date().toISOString().split('T')[0]}&token=${API_KEY}`;
    const response = await axios.get(newsUrl);
    
    const news = response.data;
    
    console.log(`Fetched news for ${ticker}:`, news);
    
    // Insert news into PostgreSQL database
    for (const article of news) {
      await pool.query(
        `INSERT INTO stock_news (ticker, headline, source, summary, url, datetime)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (url) DO NOTHING`, // Avoid inserting duplicate news
        [
          ticker,
          article.headline,
          article.source,
          article.summary,
          article.url,
          new Date(article.datetime * 1000) // Convert to JS date
        ]
      );
    }
    console.log(`News for ${ticker} successfully inserted.`);
  } catch (error) {
    console.error(`Error fetching news for ${ticker}:`, error.message);
  }
}

module.exports = { 
  fetchSP500Data, 
  fetchStockDetails, 
  getFinancialStatements, 
  getMarketData, 
  getRiskMetrics,
  fetchStockNews };
