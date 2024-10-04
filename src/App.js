import React from 'react';
import { BrowserRouter as Router, Route, Routes, Link } from 'react-router-dom';
import Home from './Home';
import SP500 from './SP500';
import StockDetail from './StockDetail'; // Import StockDetail page
import './App.css'; // Import the global styles

function App() {
  return (
    <Router>
      <div className="App">
        {/* Header bar with title, nav tabs, and search bar */}
        <header className="App-header">
          <div className="header-left">
            <h1>Financial Platform</h1> {/* Title on the top left */}
          </div>
          <nav className="nav-tabs">
            <Link to="/" className="tab-link">Home</Link>
            <Link to="/sp500" className="tab-link">S&P 500</Link> {/* Navigation tabs */}
          </nav>
          <div className="search-bar">
            <input type="text" placeholder="Search..." />
          </div>
        </header>

        {/* Define routes for Home, S&P 500, and StockDetail pages */}
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/sp500" element={<SP500 />} />
          <Route path="/stock/:symbol" element={<StockDetail />} /> {/* Dynamic route for Stock Detail */}
        </Routes>
      </div>
    </Router>
  );
}

export default App;
