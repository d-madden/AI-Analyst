import axios from 'axios';

// Finnhub API key
const apiKey = process.env.REACT_APP_FINNHUB_API_KEY;

// Function to fetch stock data for multiple symbols
export const fetchStockData = async (symbols) => {
  try {
    const stockDataPromises = symbols.map(async (symbol) => {
      const [quoteResponse, profileResponse] = await Promise.all([
        axios.get(`https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${apiKey}`),
        axios.get(`https://finnhub.io/api/v1/stock/profile2?symbol=${symbol}&token=${apiKey}`),
      ]);

      const quote = quoteResponse.data;
      const profile = profileResponse.data;

      return {
        ticker: symbol,
        name: profile.name || symbol,
        change: ((quote.c - quote.pc) / quote.pc) * 100, // Daily % change
        price: quote.c, // Current price
        volume: quote.v, // Volume
        industry: profile.finnhubIndustry || 'Unknown',
      };
    });

    const stockData = await Promise.all(stockDataPromises);
    return stockData;
  } catch (error) {
    console.error('Error fetching stock data:', error);
    return [];
  }
};
