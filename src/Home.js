import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom'; // Import the useNavigate hook
import { fetchStockData } from './apiService';
import './Home.css';

function Home() {
  const [stockData, setStockData] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate(); // Initialize navigation

  useEffect(() => {
    const getStockData = async () => {
      const symbols = ['AAPL', 'MSFT', 'NVDA', 'META', 'AMZN'];
      const data = await fetchStockData(symbols);
      setStockData(data);
      setLoading(false);
    };

    getStockData();
  }, []);

  // Navigate to the stock detail page when a row is clicked
  const handleRowClick = (symbol) => {
    navigate(`/stock/${symbol}`);
  };

  return (
    <div>
      <div className="main-content">
        <section className="financial-data">
          <h2>Top 5 S&P 500 Stocks</h2>
          {loading ? (
            <p>Loading data...</p>
          ) : (
            <div className="stock-table">
              <table>
                <thead>
                  <tr>
                    <th>Ticker</th>
                    <th>Name</th>
                    <th>% Change</th>
                    <th>Price</th>
                    <th>Volume</th>
                    <th>Industry</th>
                  </tr>
                </thead>
                <tbody>
                  {stockData.map((stock, index) => (
                    <tr key={index} onClick={() => handleRowClick(stock.ticker)}>
                      <td>{stock.ticker}</td>
                      <td>{stock.name}</td>
                      <td className={stock.change >= 0 ? 'positive' : 'negative'}>
                        {stock.change >= 0 ? `+${stock.change.toFixed(2)}%` : `${stock.change.toFixed(2)}%`}
                      </td>
                      <td>{stock.price.toFixed(2)}</td>
                      <td>{stock.volume}</td>
                      <td>{stock.industry}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="recommendations">
          <h2>Personalized Recommendations</h2>
          <button className="survey-button">GET RECOMMENDATIONS</button>
        </section>
      </div>
    </div>
  );
}

export default Home;
