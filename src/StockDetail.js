import React, { useState, useEffect } from 'react';
import { fetchStockDetailsFromBackend, calculatePriceTarget, loadTradingViewChart, fetchStockNewsFromBackend } from './apiService';
import { useParams } from 'react-router-dom';

function StockDetail() {
  const { ticker } = useParams();
  const [stockDetails, setStockDetails] = useState({});
  const [priceTarget, setPriceTarget] = useState(null);
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cleanup;

    async function loadStockDetailsAndChart() {
      try {
        const stockData = await fetchStockDetailsFromBackend(ticker);
        const stockNews = await fetchStockNewsFromBackend(ticker);

        if (stockData) {
          setStockDetails(stockData);
        } else {
          console.error(`No stock data found for ticker: ${ticker}`);
        }
        if (stockNews) {
            setNews(stockNews);
          }

        cleanup = loadTradingViewChart(ticker);
      } catch (error) {
        console.error('Error fetching details:', error);
      } finally {
        setLoading(false);
      }
    }

    loadStockDetailsAndChart();

    return () => {
      if (cleanup) cleanup();
    };
  }, [ticker]);

  const handleShowPriceTarget = async () => {
    if (!ticker) return;

    setLoading(true);
    setError(null);

    try {
      const data = await calculatePriceTarget(ticker);
      if (data.success) {
        setPriceTarget(data.data);
      } else {
        setError(data.message || 'Failed to fetch price target.');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <p>Loading stock data...</p>;
  if (error) return <p>Error: {error}</p>;

  return (
    <div className="px-8 py-5 space-y-5 text-white">
      <h1 className="text-2xl font-bold">{stockDetails.name} ({stockDetails.ticker})</h1>

      <div className="grid grid-cols-3 gap-8">
        
      <div className="col-span-2 bg-gray-800 p-6 rounded-lg shadow-lg h-96">  {/* Set height to 96 for larger space */}
        <div id="tradingview_chart" className="w-full h-full"></div>  {/* Chart resizes to container */}
      </div>


        <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
          <h2 className="text-xl font-bold mb-4">Key Metrics</h2>
          <table className="w-full">
            <tbody>
            <tr>
                            <td>PE Ratio (TTM):</td>
                            <td>{stockDetails.pe_ratio || 'N/A'}</td>
                        </tr>
                        <tr>
                            <td>Price-to-Sales Ratio (TTM):</td>
                            <td>{stockDetails.price_sales_ratio || 'N/A'}</td>
                        </tr>
                        <tr>
                            <td>Price-to-Book Ratio (Quarterly):</td>
                            <td>{stockDetails.price_book_ratio || 'N/A'}</td>
                        </tr>
                        <tr>
                            <td>Price-to-Free-Cash-Flow (P/FCF):</td>
                            <td>{stockDetails.pfcf_share || 'N/A'}</td>
                        </tr>
                        <tr>
                            <td>ROE (TTM):</td>
                            <td>{stockDetails.roe || 'N/A'}</td>
                        </tr>
                        <tr>
                            <td>Net Profit Margin (TTM):</td>
                            <td>{stockDetails.net_profit_margin || 'N/A'}</td>
                        </tr>
                        <tr>
                            <td>Gross Margin (TTM):</td>
                            <td>{stockDetails.gross_margin || 'N/A'}</td>
                        </tr>
                        <tr>
                            <td>Revenue Growth (3Y YoY):</td>
                            <td>{stockDetails.revenue_growth_3y || 'N/A'}</td>
                        </tr>
                        <tr>
                            <td>EPS Growth (5Y):</td>
                            <td>{stockDetails.eps_growth_5y || 'N/A'}</td>
                        </tr>
                        <tr>
                            <td>Asset Turnover (TTM):</td>
                            <td>{stockDetails.asset_turnover || 'N/A'}</td>
                        </tr>
                        <tr>
                            <td>Inventory Turnover (TTM):</td>
                            <td>{stockDetails.inventory_turnover || 'N/A'}</td>
                        </tr>
                        <tr>
                            <td>Debt-to-Equity Ratio (Quarterly):</td>
                            <td>{stockDetails.debt_to_equity_ratio || 'N/A'}</td>
                        </tr>
                        <tr>
                            <td>Current Ratio (Quarterly):</td>
                            <td>{stockDetails.current_ratio || 'N/A'}</td>
                        </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-8">
        <div className="col-span-2 bg-gray-800 p-6 rounded-lg shadow-lg">
        <h2 className="text-xl font-bold mb-4">News</h2>
        {news.length === 0 ? (
          <p>No news available for {ticker}.</p>
        ) : (
          <ul>
            {news.map((article) => (
              <li key={article.url} className="mb-4">
                <a href={article.url} className="text-blue-400" target="_blank" rel="noopener noreferrer">
                  <h3 className="text-lg font-semibold">{article.headline}</h3>
                </a>
                <p>{article.source} - {new Date(article.datetime).toLocaleDateString()}</p>
                <p>{article.summary}</p>
              </li>
            ))}
          </ul>
        )}
      </div>

        <div className="bg-gray-800 p-6 rounded-lg shadow-lg text-center">
          <button className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-full uppercase"
            onClick={handleShowPriceTarget}>
            Show Price Target
          </button>
          {priceTarget && (
            <div className="mt-4">
              <h3 className="text-lg font-bold">Price Target: ${priceTarget.priceTarget}</h3>
              <p className="text-sm">WACC: {(priceTarget.wacc * 100).toFixed(2)}%</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default StockDetail;
