import React, { useEffect, useState } from 'react';
import { FiPackage, FiTrendingUp, FiAlertTriangle, FiCalendar, FiClock, FiLoader ,FiSearch} from 'react-icons/fi';
import StockUpdateForm from './StockUpdateForm';
import api from '../../service/api';

const StockDashboard = () => {
  const [stockData, setStockData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [timeFilter, setTimeFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showStockForm, setShowStockForm] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [error, setError] = useState(null);

  const fetchAllStockData = async () => {
    try {
      setLoading(true);
      // First get all products with their unit information
      const productsResponse = await api.get('/products');
      const products = productsResponse.data;

      // Then fetch stock data for each product
      const stockPromises = products.map(product =>
        api.get(`products/stock/${product.productCode}`).then(res => ({
          ...res.data,
          product // Include the full product details
        }))
      );

      const allStockData = await Promise.all(stockPromises);
      setStockData(allStockData.filter(data => data.success).map(data => ({
        ...data.product,
        stock: data.stock,
        stockHistory: data.stockHistory
      })));
      setError(null);
    } catch (err) {
      console.error('Failed to load stock data:', err);
      setError(err.response?.data?.message || err.message || 'Failed to fetch stock data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllStockData();
  }, [refreshKey]);

  const filteredStock = stockData.filter(item => {
    const productName = item?.productName || '';
    const category = item?.category || '';
    const searchTermLower = (searchTerm || '').toLowerCase();

    const matchesSearch = productName.toLowerCase().includes(searchTermLower) ||
      category.toLowerCase().includes(searchTermLower);

    let matchesTime = true;
    if (timeFilter === 'recent' && item?.stock?.updatedAt) {
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      matchesTime = new Date(item.stock.updatedAt) > oneWeekAgo;
    }

    return matchesSearch && matchesTime;
  });

  const formatQuantity = (item, quantity) => {
    if (!item || quantity === undefined || quantity === null) return 'N/A';

    const baseUnit = item?.baseUnit || 'units';
    const secondaryUnit = item?.secondaryUnit;
    const conversionRate = item?.conversionRate || 1;

    // If no secondary unit or conversion is 1, just show base unit
    if (!secondaryUnit || conversionRate === 1) {
      return `${quantity.toFixed(2)} ${baseUnit}`;
    }

    // Calculate full base units and remaining in secondary units
    const fullBaseUnits = Math.floor(quantity);
    const remainingQuantity = quantity - fullBaseUnits;
    const secondaryQuantity = remainingQuantity * conversionRate;

    let result = `${fullBaseUnits} ${baseUnit}`;
    if (secondaryQuantity > 0) {
      result += ` ${secondaryQuantity.toFixed(2)} ${secondaryUnit}`;
    }

    return result;
  };

  const criticalStock = filteredStock.filter(item => {
    const available = item?.stock?.availableQuantity || 0;
    return available <= (item?.minStockLevel || 2);
  });

  const trendingStock = filteredStock.filter(item => {
    // Assuming stockHistory contains sales data
    const recentSales = item.stockHistory?.filter(entry =>
      entry.type === 'sale' &&
      new Date(entry.createdAt) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    ).length || 0;
    return recentSales >= 5;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <FiLoader className="animate-spin text-2xl text-blue-500 mr-2" />
        <span className="text-lg">Loading stock dashboard...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <FiAlertTriangle className="text-2xl text-red-500 mr-2" />
        <span className="text-lg">Error: {error}</span>
      </div>
    );
  }

return (
  <div className="font-sans text-gray-900 min-h-screen bg-gray-50">
    {/* Header */}
    <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-10">
      <div className="max-w-7xl mx-auto px-2 ">
        <div className="flex flex-col md:flex-row gap-4 py-4 items-start md:items-center justify-between">
          {/* Dashboard title */}
          <div className="flex-shrink-0">
            <h1 className="text-lg md:text-xl font-semibold text-gray-700 whitespace-nowrap bg-blue-100 p-2 rounded-md">
              Stock Dashboard
            </h1>
          </div>

          {/* Search and filter */}
          <div className="w-full md:w-auto flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FiSearch className="text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search products..."
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 w-full"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <select
              className="border border-gray-300 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm"
              value={timeFilter}
              onChange={(e) => setTimeFilter(e.target.value)}
            >
              <option value="all">All Time</option>
              <option value="recent">Last 7 Days</option>
            </select>
          </div>
        </div>
      </div>
    </header>

    {/* Main Content */}
    <main className="max-w-7xl mx-auto px-4 sm:px-6  py-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 mb-6 md:mb-8">
        {/* Total Products */}
        <div className="bg-white rounded-xl shadow p-4 md:p-6 border-l-4 border-blue-500">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm md:text-base text-gray-500 font-medium">Total Products</p>
              <h3 className="text-2xl md:text-3xl font-bold mt-1">{filteredStock.length}</h3>
            </div>
            <div className="bg-blue-100 p-2 md:p-3 rounded-full">
              <FiPackage className="text-blue-600 text-lg md:text-xl" />
            </div>
          </div>
        </div>

        {/* Critical Stock */}
        <div className="bg-white rounded-xl shadow p-4 md:p-6 border-l-4 border-red-500">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm md:text-base text-gray-500 font-medium">Critical Stock</p>
              <h3 className="text-2xl md:text-3xl font-bold mt-1">{criticalStock.length}</h3>
            </div>
            <div className="bg-red-100 p-2 md:p-3 rounded-full">
              <FiAlertTriangle className="text-red-600 text-lg md:text-xl" />
            </div>
          </div>
        </div>

        {/* Trending Products */}
        <div className="bg-white rounded-xl shadow p-4 md:p-6 border-l-4 border-green-500">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm md:text-base text-gray-500 font-medium">Trending Products</p>
              <h3 className="text-2xl md:text-3xl font-bold mt-1">{trendingStock.length}</h3>
            </div>
            <div className="bg-green-100 p-2 md:p-3 rounded-full">
              <FiTrendingUp className="text-green-600 text-lg md:text-xl" />
            </div>
          </div>
        </div>
      </div>

      {/* Product Inventory */}
      <div className="bg-white rounded-xl shadow overflow-hidden">
        <div className="px-4 sm:px-6 py-4 border-b flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
          <h3 className="font-semibold text-base sm:text-lg">Product Inventory</h3>
          <p className="text-xs sm:text-sm text-gray-500">
            Showing {filteredStock.length} of {stockData.length} products
          </p>
        </div>

        <div className="divide-y">
          {filteredStock.length > 0 ? (
            filteredStock.map((item) => {
              const totalQuantity = item?.stock?.totalQuantity || 0;
              const availableQuantity = item?.stock?.availableQuantity || 0;
              const soldQuantity = totalQuantity - availableQuantity;

              return (
                <div key={item?._id} className="p-4 sm:p-6 hover:bg-gray-50 transition-colors">
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                    {/* Product Info */}
                    <div className="md:col-span-4">
                      <div className='flex flex-wrap gap-2'>
                        <h3 className="font-medium text-gray-900">{item?.productCode}</h3>
                        <h3 className="font-medium text-gray-900">{item?.productName}</h3>
                      </div>
                      <p className="text-xs sm:text-sm text-gray-500 mt-1">{item?.category || 'Uncategorized'}</p>
                      <div className="flex flex-wrap items-center mt-2 text-xs sm:text-sm text-gray-500 gap-2">
                        <span className="flex items-center">
                          <FiCalendar className="mr-1" />
                          {item?.stock?.updatedAt ? new Date(item.stock.updatedAt).toLocaleDateString() : 'N/A'}
                        </span>
                        <span className="flex items-center">
                          <FiClock className="mr-1" />
                          {item?.stock?.updatedAt ? new Date(item.stock.updatedAt).toLocaleTimeString() : 'N/A'}
                        </span>
                      </div>
                    </div>

                    {/* Stock Level */}
                    <div className="md:col-span-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs sm:text-sm font-medium text-gray-500">Stock Level</span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          availableQuantity <= (item?.minStockLevel || 2) ? 'bg-red-100 text-red-800' :
                          availableQuantity <= 10 ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'
                        }`}>
                          {availableQuantity <= (item?.minStockLevel || 2) ? 'Low' :
                           availableQuantity <= 10 ? 'Medium' : 'High'}
                        </span>
                      </div>
                      <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${
                            availableQuantity <= (item?.minStockLevel || 2) ? 'bg-red-500' :
                            availableQuantity <= 10 ? 'bg-yellow-500' : 'bg-green-500'
                          }`}
                          style={{
                            width: `${Math.min(100, (availableQuantity / (totalQuantity || 1)) * 100)}%`
                          }}
                        ></div>
                      </div>
                    </div>

                    {/* Stock Quantities */}
                    <div className="md:col-span-3">
                      <div className="grid grid-cols-3 gap-1 sm:gap-2 text-center">
                        <div>
                          <p className="text-xs sm:text-sm text-gray-500">Uploaded</p>
                          <p className="font-medium text-sm sm:text-base">{formatQuantity(item, totalQuantity)}</p>
                        </div>
                        <div>
                          <p className="text-xs sm:text-sm text-gray-500">Sold</p>
                          <p className="font-medium text-blue-600 text-sm sm:text-base">{formatQuantity(item, soldQuantity)}</p>
                        </div>
                        <div>
                          <p className="text-xs sm:text-sm text-gray-500">Remaining</p>
                          <p className={`font-medium text-sm sm:text-base ${
                            availableQuantity <= (item?.minStockLevel || 2) ? 'text-red-600' : 'text-gray-900'
                          }`}>
                            {formatQuantity(item, availableQuantity)}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Action Button */}
                    <div className="md:col-span-2 flex justify-end mt-2 sm:mt-0">
                      <button
                        onClick={() => {
                          setSelectedProduct(item);
                          setShowStockForm(true);
                        }}
                        className="px-3 sm:px-4 py-1 sm:py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-xs sm:text-sm font-medium whitespace-nowrap"
                      >
                        Manage Stock
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="p-6 text-center text-gray-500">
              No products found matching your criteria
            </div>
          )}
        </div>
      </div>
    </main>

    {/* Stock Update Form Modal */}
    {showStockForm && selectedProduct && (
      <StockUpdateForm
        product={selectedProduct}
        onUpdate={() => {
          setRefreshKey(prev => prev + 1);
          setShowStockForm(false);
          setSelectedProduct(null);
        }}
        onCancel={() => {
          setShowStockForm(false);
          setSelectedProduct(null);
        }}
      />
    )}
  </div>
);
};

export default StockDashboard;