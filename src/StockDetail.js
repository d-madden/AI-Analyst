import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import './StockDetail.css';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  LineElement,
  PointElement,
  CategoryScale, // Import CategoryScale for x-axis
  LinearScale, // Import LinearScale for y-axis
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

// Register the components with Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

function StockDetail() {
  const { symbol } = useParams();
  const [stockDetails, setStockDetails] = useState({});
  const [chartData, setChartData] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStockDetails = async () => {
      const apiKey = process.env.REACT_APP_FINNHUB_API_KEY;

      try {
        // Fetch stock profile, metrics, and quote
        const [quoteResponse, profileResponse, metricsResponse] = await Promise.all([
          axios.get(`https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${apiKey}`),
          axios.get(`https://finnhub.io/api/v1/stock/profile2?symbol=${symbol}&token=${apiKey}`),
          axios.get(`https://finnhub.io/api/v1/stock/metric?symbol=${symbol}&metric=all&token=${apiKey}`)
        ]);

        // Set stock details
        setStockDetails({
          name: profileResponse.data.name,
          exchange: profileResponse.data.exchange,
          price: quoteResponse.data.c,
          changePercent: ((quoteResponse.data.c - quoteResponse.data.pc) / quoteResponse.data.pc) * 100,
          marketCap: metricsResponse.data.metric.marketCapitalization,
          peRatio: metricsResponse.data.metric.peNormalizedAnnual,
          avgVolume: metricsResponse.data.metric['10DayAverageTradingVolume'],
          nextEarnings: metricsResponse.data.metric.nextEarningsDate,
          lastEarnings: metricsResponse.data.metric.lastEarningsDate,
        });

        // Set chart data (dummy data for now)
        setChartData({
          labels: ['9 AM', '10 AM', '11 AM', '12 PM', '1 PM', '2 PM', '3 PM', '4 PM'],
          datasets: [
            {
              label: 'Price',
              data: [100, 102, 101, 103, 105, 107, 106, 108],
              borderColor: quoteResponse.data.c >= quoteResponse.data.pc ? '#00ff00' : '#ff4d4d',
              fill: false,
            },
          ],
        });

        setLoading(false);
      } catch (error) {
        console.error('Error fetching stock details:', error);
      }
    };

    fetchStockDetails();
  }, [symbol]);

  if (loading) return <p>Loading stock data...</p>;

  return (
    <div className="stock-detail">
      <h1 className="stock-name">
        {stockDetails.name} <span className="stock-ticker">({stockDetails.exchange}:{symbol})</span>
      </h1>

      <div className="stock-detail-container">
        {/* Chart section */}
        <div className="chart-container">
          <h2>Today's Performance</h2>
          <Line data={chartData} />
          <div className="price-change">
            <span className={stockDetails.changePercent >= 0 ? 'positive' : 'negative'}>
              ${stockDetails.price.toFixed(2)} ({stockDetails.changePercent.toFixed(2)}%)
            </span>
          </div>
        </div>

        {/* Key metrics section */}
        <div className="metrics-container">
          <h2>Key Metrics</h2>
          <table>
            <tbody>
              <tr>
                <td>Market Cap:</td>
                <td>{stockDetails.marketCap ? `${(stockDetails.marketCap / 1e3).toFixed(2)}B` : 'N/A'}</td>
              </tr>
              <tr>
                <td>PE Ratio:</td>
                <td>{stockDetails.peRatio ? stockDetails.peRatio.toFixed(2) : 'N/A'}</td>
              </tr>
              <tr>
                <td>Avg Daily Volume:</td>
                <td>{stockDetails.avgVolume ? stockDetails.avgVolume.toLocaleString() : 'N/A'}</td>
              </tr>
              <tr>
                <td>Next Earnings:</td>
                <td>{stockDetails.nextEarnings || 'N/A'}</td>
              </tr>
              <tr>
                <td>Last Earnings:</td>
                <td>{stockDetails.lastEarnings || 'N/A'}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default StockDetail;
