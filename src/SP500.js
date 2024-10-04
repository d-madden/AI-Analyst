import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './SP500.css';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  LineElement,
  PointElement,
  CategoryScale,
  LinearScale,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

function SP500() {
  const [sp500Data, setSp500Data] = useState([]);
  const [sortConfig, setSortConfig] = useState({ key: 'marketCap', direction: 'descending' });
  const [chartData, setChartData] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSP500Data = async () => {
      const apiKey = process.env.REACT_APP_FINNHUB_API_KEY;

      try {
        const symbols = [
          'AAPL', 'MSFT', 'META', 'GOOGL', 'AMZN', 'TSLA', 'NVDA', 'BRK.B', 'JNJ', 'V'
        ];

        const stockDataPromises = symbols.map(async (symbol) => {
          const [quoteResponse, profileResponse] = await Promise.all([
            axios.get(`https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${apiKey}`),
            axios.get(`https://finnhub.io/api/v1/stock/profile2?symbol=${symbol}&token=${apiKey}`)
          ]);

          const currentPrice = quoteResponse.data.c;
          const previousClose = quoteResponse.data.pc;
          const change = previousClose
            ? ((currentPrice - previousClose) / previousClose) * 100
            : 'N/A';

          return {
            ticker: symbol,
            name: profileResponse.data.name,
            industry: profileResponse.data.finnhubIndustry || 'N/A',
            price: currentPrice || 'N/A',
            change: change !== 'N/A' ? change.toFixed(2) : 'N/A',
            marketCap: profileResponse.data.marketCapitalization || 'N/A',
            volumeToday: quoteResponse.data.v || 'N/A',
            avgVolume: profileResponse.data.avgVolume || 'N/A',
            peRatio: profileResponse.data.peNormalizedAnnual || 'N/A',
          };
        });

        const stockData = await Promise.all(stockDataPromises);
        setSp500Data(stockData);
        setLoading(false);

        // Set chart data for S&P 500 performance
        setChartData({
          labels: ['9 AM', '10 AM', '11 AM', '12 PM', '1 PM', '2 PM', '3 PM', '4 PM'],
          datasets: [
            {
              label: 'S&P500 Performance',
              data: stockData.map(stock => stock.price),
              borderColor: '#61dafb',
              fill: false,
            },
          ],
        });
      } catch (error) {
        console.error('Error fetching S&P 500 data:', error);
      }
    };

    fetchSP500Data();
  }, []);

  // Sort data
  const sortedSp500Data = React.useMemo(() => {
    let sortableData = [...sp500Data];
    if (sortConfig !== null) {
      sortableData.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) {
          return sortConfig.direction === 'ascending' ? -1 : 1;
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
          return sortConfig.direction === 'ascending' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableData;
  }, [sp500Data, sortConfig]);

  const requestSort = (key) => {
    let direction = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  if (loading) return <p>Loading data...</p>;

  return (
    <div className="sp500-container">
      <h2>S&P500 Companies</h2>

      <table className="sp500-table">
        <thead>
          <tr>
            <th onClick={() => requestSort('ticker')}>Ticker</th>
            <th onClick={() => requestSort('name')}>Name</th>
            <th onClick={() => requestSort('industry')}>Industry</th>
            <th onClick={() => requestSort('price')}>$Price</th>
            <th onClick={() => requestSort('change')}>% Change Today</th>
            <th onClick={() => requestSort('marketCap')}>Market Capitalization</th>
            <th onClick={() => requestSort('avgVolume')}>Avg Daily Volume</th>
            <th onClick={() => requestSort('peRatio')}>PE Ratio</th>
          </tr>
        </thead>
        <tbody>
          {sortedSp500Data.map((stock, index) => (
            <tr key={index}>
              <td>{stock.ticker}</td>
              <td>{stock.name}</td>
              <td>{stock.industry}</td>
              <td>${stock.price.toFixed(2)}</td>
              <td className={stock.change >= 0 ? 'positive' : 'negative'}>
                {stock.change >= 0 ? `+${stock.change}%` : `${stock.change}%`}
              </td>
              <td>{stock.marketCap !== 'N/A' ? (stock.marketCap / 1e3).toFixed(2) + 'B' : 'N/A'}</td>
              <td>{stock.avgVolume.toLocaleString() + "mm"}</td>
              <td>{stock.peRatio.toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="sp500-chart-container">
        <h2>S&P500 Performance</h2>
        <Line data={chartData} options={{ responsive: true }} />
      </div>
    </div>
  );
}

export default SP500;