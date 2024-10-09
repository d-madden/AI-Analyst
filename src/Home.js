import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchSP500Data } from './apiService';

function Home() {
  const [homeData, setHomeData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortColumn, setSortColumn] = useState('change_percent');
  const [sortDirection, setSortDirection] = useState('desc');

  const navigate = useNavigate();

  useEffect(() => {
    async function getData() {
      const data = await fetchSP500Data();
      data.sort((a, b) => b.change_percent - a.change_percent);
      setHomeData(data.slice(0, 5));
      setLoading(false);
    }
    getData();
  }, []);

  const handleSort = (column) => {
    const direction = sortColumn === column && sortDirection === 'asc' ? 'desc' : 'asc';
    const sortedData = [...homeData].sort((a, b) => {
      if (column === 'change_percent' || column === 'price' || column === 'change') {
        return direction === 'asc' ? a[column] - b[column] : b[column] - a[column];
      }
      return direction === 'asc' ? a[column].localeCompare(b[column]) : b[column].localeCompare(a[column]);
    });
    setSortColumn(column);
    setSortDirection(direction);
    setHomeData(sortedData);
  };

  const handleRowClick = (ticker) => {
    navigate(`/stock/${ticker}`);
  };

  return (
    <div className="px-8 py-12 space-y-8">
      <div className="grid grid-cols-3 gap-8">
        {/* Financial Data Section */}
        <section className="col-span-2 bg-gray-800 p-6 rounded-lg shadow">
          <h2 className="text-center text-xl font-bold">Top 5 S&P 500 Stocks</h2>
          {loading ? (
            <p>Loading data...</p>
          ) : (
            <table className="w-full text-left mt-4">
              <thead>
                <tr className="bg-gray-700">
                  <th className="py-2 px-4 cursor-pointer" onClick={() => handleSort('ticker')}>Ticker</th>
                  <th className="py-2 px-4 cursor-pointer" onClick={() => handleSort('name')}>Name</th>
                  <th className="py-2 px-4 cursor-pointer" onClick={() => handleSort('change_percent')}>% Change</th>
                  <th className="py-2 px-4 cursor-pointer" onClick={() => handleSort('price')}>Price</th>
                  <th className="py-2 px-4 cursor-pointer" onClick={() => handleSort('open')}>Open</th>
                </tr>
              </thead>
              <tbody>
                {homeData.map((stock, index) => (
                  <tr key={index} className="hover:bg-gray-600 cursor-pointer" onClick={() => handleRowClick(stock.ticker)}>
                    <td className="py-2 px-4">{stock.ticker}</td>
                    <td className="py-2 px-4">{stock.name}</td>
                    <td className={`py-2 px-4 ${stock.change_percent >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                      {stock.change_percent >= 0 ? `+${stock.change_percent}%` : `${stock.change_percent}%`}
                    </td>
                    <td className="py-2 px-4">${stock.price.toFixed(2)}</td>
                    <td className="py-2 px-4">${stock.open.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>

        {/* Recommendations Section */}
        <section className="bg-gray-800 p-6 rounded-lg shadow flex flex-col items-center justify-center">
          <h2 className="text-xl font-bold">Personalized Recommendations</h2>
          <button className="mt-4 bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-full uppercase">
            Get Recommendations
          </button>
        </section>
      </div>
    </div>
  );
}

export default Home;
