const express = require('express');
const axios = require('axios');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 5000;

app.get('/api/sp500', async (req, res) => {
  try {
    const symbols = ['AAPL', 'MSFT', 'META', 'GOOGL', 'AMZN'];
    const responses = await Promise.all(symbols.map(symbol => 
      axios.get(`https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${process.env.REACT_APP_FINNHUB_API_KEY}`)
    ));

    const data = responses.map(response => response.data);
    res.json(data);
  } catch (error) {
    res.status(500).send('Error fetching data');
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
