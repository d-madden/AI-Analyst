import React, { useState, useEffect } from 'react';
import { fetchSP500Data } from './apiService'; // Adjust the path if necessary
import { useNavigate } from 'react-router-dom';

function SP500() {
  const [sp500Data, setSp500Data] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortColumn, setSortColumn] = useState('marketcapitalization');
  const [sortDirection, setSortDirection] = useState('desc');
  const navigate = useNavigate();

  useEffect(() => {
    async function getData() {
      const data = await fetchSP500Data();
      const sortedData = data.sort((a, b) => b.marketcapitalization - a.marketcapitalization); // Sort by marketcap descending
      setSp500Data(sortedData);
      setLoading(false);
    }
    getData();
  }, []);

  const handleSort = (column) => {
    const direction = sortColumn === column && sortDirection === 'asc' ? 'desc' : 'asc';
    const sortedData = [...sp500Data].sort((a, b) => {
      if (typeof a[column] === 'number') {
        return direction === 'asc' ? a[column] - b[column] : b[column] - a[column];
      } else {
        return direction === 'asc' 
          ? a[column].localeCompare(b[column]) 
          : b[column].localeCompare(a[column]);
      }
    });
    setSp500Data(sortedData);
    setSortColumn(column);
    setSortDirection(direction);
  };

  const formatMarketCap = (marketCap) => {
    return `${(marketCap / 1e3).toFixed(1).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;
  };

  const formatChange = (change_percent) => {
    return `${(change_percent * 1).toFixed(3)}`;
  };

  const formatPrice = (price) => {
    return `${parseFloat(price).toFixed(2)}`;
  };

  const handleRowClick = (ticker) => {
    navigate(`/stock/${ticker}`);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <h2 className="text-3xl font-bold text-center mb-8">S&P 500 Performance</h2>
      
      {loading ? (
        <p className="text-center">Loading data...</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full bg-gray-800 rounded-lg shadow-lg">
            <thead className="bg-gray-700">
              <tr>
                <th className="py-3 px-6"></th>
                <th className="py-3 px-6 text-left cursor-pointer" onClick={() => handleSort('ticker')}>Ticker</th>
                <th className="py-3 px-6 text-left cursor-pointer" onClick={() => handleSort('name')}>Name</th>
                <th className="py-3 px-6 text-left cursor-pointer" onClick={() => handleSort('industry')}>Industry</th>
                <th className="py-3 px-6 text-center cursor-pointer" onClick={() => handleSort('change_percent')}>Change (%)</th>
                <th className="py-3 px-6 text-center cursor-pointer" onClick={() => handleSort('price')}>Price ($)</th>
                <th className="py-3 px-6 text-center cursor-pointer" onClick={() => handleSort('marketcapitalization')}>Market Cap (B)</th>
                <th className="py-3 px-6 text-center cursor-pointer" onClick={() => handleSort('open')}>Open Price ($)</th>
              </tr>
            </thead>
            <tbody>
              {sp500Data.map((stock) => (
                <tr key={stock.ticker} onClick={() => handleRowClick(stock.ticker)} className="hover:bg-gray-700 cursor-pointer">
                  <td className="py-3 px-6 text-left ">
                    <img src={stock.logo} alt={`${stock.ticker} logo`} className="w-8 h-8 object-contain" />
                  </td>
                  <td className="py-3 px-6 text-left ">{stock.ticker}</td>
                  <td className="py-3 px-6 text-left ">{stock.name}</td>
                  <td className="py-3 px-6 text-left ">{stock.industry}</td>
                  <td className={`py-3 px-6 text-center ${formatChange(stock.change_percent) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {stock.change_percent >= 0 ? `+${formatChange(stock.change_percent)}%` : `${formatChange(stock.change_percent)}%`}
                  </td>
                  <td className="py-3 px-6 text-center ">{formatPrice(stock.price)}</td>
                  <td className="py-3 px-6 text-center ">{formatMarketCap(stock.marketcapitalization)}</td>
                  <td className="py-3 px-6 text-center ">{formatPrice(stock.open)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default SP500;
