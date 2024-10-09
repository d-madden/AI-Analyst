const apiUrl = 'http://localhost:5000';

// Fetch data for Home page
export const fetchHomeData = async () => {
  try {
    const response = await fetch(`${apiUrl}/api/home`);
    return await response.json();
  } catch (error) {
    console.error('Error fetching home data:', error);
    return [];
  }
};

// Fetch data for S&P 500 page
export const fetchSP500Data = async () => {
  try {
    const response = await fetch(`${apiUrl}/api/sp500`);
    return await response.json();
  } catch (error) {
    console.error('Error fetching SP500 data:', error);
    return [];
  }
};

export const fetchStockDetailsFromBackend = async (ticker) => {
  try {
      console.log("calling api service for:", ticker);
      const response = await fetch(`${apiUrl}/api/stock_details/${ticker}`);

      if (!response.ok) {
          throw new Error(`Failed to fetch stock details: ${response.status}`);
      }

      return await response.json();
  } catch (error) {
      console.error('Error fetching stock details:', error);
      return null;
  }
};

export async function calculatePriceTarget(ticker) {
  console.log(`Calling API to calculate price target for ${ticker}`);
  try {
    const response = await fetch(`${apiUrl}/api/calculatePriceTarget/${ticker}`);
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    const data = await response.json();
    console.log(`Received data from API for ${ticker}`, data);
    return data;
  } catch (error) {
    console.error(`Error fetching price target for ${ticker}:`, error.message);
    throw error;
  }
}

export const loadTradingViewChart = (ticker) => {
  const script = document.createElement('script');
  script.src = 'https://s3.tradingview.com/tv.js';
  script.async = true;

  script.onload = () => {
    if (window.TradingView) {
      new window.TradingView.widget({
        symbol: ticker,
        interval: 'D',
        container_id: 'tradingview_chart',
        width: '100%',  // Responsive width
        height: '100%',  // Responsive height
        theme: 'dark',
        style: '1',
        locale: 'en',
        hide_top_toolbar: true,
        enable_publishing: false,
        save_image: false,
      });
    } else {
      console.error('TradingView is not available.');
    }
  };

  script.onerror = () => {
    console.error('Failed to load TradingView script.');
  };

  document.body.appendChild(script);

  return () => {
    document.body.removeChild(script);  // Cleanup script when component unmounts
  };
};


export const fetchStockNewsFromBackend = async (ticker) => {
  try {
    const response = await fetch(`${apiUrl}/api/stock_news/${ticker}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch stock news: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching stock news:', error);
    return [];
  }
};
