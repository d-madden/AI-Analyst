import React from 'react';
import { BrowserRouter as Router, Route, Routes, Link } from 'react-router-dom';
import Home from './Home';
import SP500 from './SP500';
import StockDetail from './StockDetail'; // Import StockDetail page
import './App.css'; // Import Tailwind styles

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-900 text-white">
        {/* Header bar with title, nav tabs, and search bar */}
        <header className="bg-gray-800 py-4 px-6 shadow-lg flex items-center justify-between">
          <div className="text-2xl font-bold">AlphaScore AI</div>
          <nav className="space-x-6 flex">
            <Link to="/" className="text-white uppercase hover:text-blue-400">Home</Link>
            <Link to="/sp500" className="text-white uppercase hover:text-blue-400">S&P 500</Link>
          </nav>
          <div className="relative">
            <input
              type="text"
              placeholder="Search..."
              className="px-4 py-2 bg-gray-700 text-white rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>
        </header>

        {/* Define routes for Home, S&P 500, and StockDetail pages */}
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/sp500" element={<SP500 />} />
          <Route path="/stock/:ticker" element={<StockDetail />} /> {/* Dynamic route for Stock Detail */}
        </Routes>
      </div>
    </Router>
  );
}

export default App;
