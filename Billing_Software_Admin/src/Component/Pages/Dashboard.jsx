import { useState, useEffect } from 'react';
import { Bar, Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
} from 'chart.js';
import { Search, Plus, Eye, Edit, Bell, DollarSign, Users, Package, ShoppingCart, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../../service/api';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

// Notification Modal Component
const NotificationModal = ({ alerts, onClose }) => {
  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 w-11/12 md:w-1/2 lg:w-1/2 relative">
        <button onClick={onClose} className="absolute top-3 right-3 text-gray-500 hover:text-gray-700">
          <X className="h-6 w-6" />
        </button>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Low Stock Alerts</h2>
        {alerts.length > 0 ? (
          <ul className="divide-y divide-gray-200 max-h-60 overflow-y-auto">
            {alerts.map((alert, index) => (
              <li key={index} className="py-3 flex justify-between items-center">
                <div>
                  <span className="text-base font-medium text-gray-800">{alert.productName}</span>
                  <div className="text-sm text-gray-500">Code: {alert.productCode}</div>
                  <div className="text-sm text-gray-500">Category: {alert.category}</div>
                </div>
                <div className="text-right">
                  <span className="text-base text-red-600 font-semibold">
                    Available : {alert.currentStock}
                    {/* left (threshold: {alert.threshold}) */}
                  </span>
                  <div className="text-sm text-gray-500"></div>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-600">No low stock alerts at the moment. Good job!</p>
        )}
      </div>
    </div>
  );
};

const Dashboard = ({ setActivePage }) => {
  const [bills, setBills] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [lowStockAlerts, setLowStockAlerts] = useState([]);
  const [topSellingProducts, setTopSellingProducts] = useState([]);
  const [lessSellingProducts, setLessSellingProducts] = useState([]);
  const [monthlyRevenue, setMonthlyRevenue] = useState({});
  const [loading, setLoading] = useState(true);
  const [showLowStockModal, setShowLowStockModal] = useState(false);
  const [showTopSellingChart, setShowTopSellingChart] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch bills data
        const billsResponse = await api.get('/bills');
        setBills(billsResponse.data || []);

        // Process data for dashboard
        processDashboardData(billsResponse.data || []);

        // Fetch low stock products
        await fetchLowStockProducts();
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    const fetchLowStockProducts = async () => {
      try {
        // First get stock summary to find current stock levels
        const stockResponse = await api.get('/stock-summary');
        const stockData = stockResponse.data || [];

        // Then get product details to find low stock thresholds
        const productsResponse = await api.get('/products');
        const productsData = productsResponse.data || [];

        // Combine the data to find low stock items
        const alerts = productsData
          .filter(product => {
            // Find matching stock item
            const stockItem = stockData.find(s =>
              s.productCode === product.productCode ||
              s._id === product._id
            );

            if (!stockItem) return false; // Skip if no stock data found

            // Get current stock and threshold
            const currentStock = stockItem.availableQuantity || stockItem.currentStock || 0;
            const threshold = product.lowStockAlert || 10; // Default threshold is 10

            return currentStock < threshold;
          })
          .map(product => {
            const stockItem = stockData.find(s =>
              s.productCode === product.productCode ||
              s._id === product._id
            ) || {};

            const currentStock = stockItem.availableQuantity || stockItem.currentStock || 0;
            const threshold = product.lowStockAlert || 10;

            return {
              productId: product._id || stockItem._id,
              productCode: product.productCode || stockItem.productCode,
              productName: product.productName || stockItem.productName || 'Unknown Product',
              currentStock: currentStock,
              price: product.netPrice || product.mrp || product.price || 0,
              category: product.category || 'N/A',
              sku: product.productCode || product.sku || 'N/A',
              threshold: threshold
            };
          });

        setLowStockAlerts(alerts);
      } catch (error) {
        console.error('Error fetching low stock products:', error);
      }
    };

    fetchData();
  }, []);

  const processDashboardData = (billsData) => {
    if (!billsData || !Array.isArray(billsData)) return;

    const allProducts = billsData.flatMap(bill => bill.products || []);
    const productSales = {};

    allProducts.forEach(product => {
      if (!product) return;
      const productName = product.name || 'Unknown Product';
      const quantity = product.quantity || 0;

      // For sales calculation
      if (!productSales[productName]) {
        productSales[productName] = quantity;
      } else {
        productSales[productName] += quantity;
      }
    });

    // Top Selling Products
    const topSelling = Object.entries(productSales)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, sales]) => ({ name, sales }));
    setTopSellingProducts(topSelling);

    // Less Selling Products
    const lessSelling = Object.entries(productSales)
      .sort((a, b) => a[1] - b[1]) // Sort ascending for less selling
      .slice(0, 5)
      .map(([name, sales]) => ({ name, sales }));
    setLessSellingProducts(lessSelling);

    // Monthly Revenue
    const monthlyRev = {};
    billsData.forEach(bill => {
      if (!bill || !bill.date) return;
      const month = new Date(bill.date).getMonth();
      const total = bill.total || 0;

      if (!monthlyRev[month]) {
        monthlyRev[month] = total;
      } else {
        monthlyRev[month] += total;
      }
    });
    setMonthlyRevenue(monthlyRev);
  };

  // Calculate summary metrics with fallback values
  const totalBills = bills.length || 0;
  const totalRevenue = bills.reduce((sum, bill) => sum + (bill?.paidAmount || 0), 0);
  const uniqueCustomers = new Set(bills.map(bill => bill?.customer?.id).filter(Boolean)).size;
  const allProductsInBills = bills.flatMap(bill => bill?.products || []);
  const totalProductsInStock = allProductsInBills.reduce((sum, product) => sum + (product?.quantity || 0), 0);

  // Prepare chart data for Monthly Revenue
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const monthlyRevenueChartData = {
    labels: months,
    datasets: [
      {
        label: 'Monthly Revenue',
        data: months.map((_, index) => monthlyRevenue[index] || 0),
        backgroundColor: 'rgba(59, 130, 246, 0.7)',
        borderColor: 'rgba(29, 78, 216, 1)',
        borderWidth: 1,
        hoverBackgroundColor: 'rgba(59, 130, 246, 0.9)',
      },
    ],
  };

  const monthlyRevenueChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          font: {
            size: 14,
            family: 'Inter, sans-serif',
          },
          color: '#333',
        },
      },
      title: {
        display: true,
        text: 'Monthly Revenue Overview',
        font: {
          size: 18,
          weight: 'bold',
          family: 'Inter, sans-serif',
        },
        color: '#333',
      },
      tooltip: {
        backgroundColor: 'rgba(0,0,0,0.8)',
        titleFont: {
          size: 16,
          family: 'Inter, sans-serif',
        },
        bodyFont: {
          size: 14,
          family: 'Inter, sans-serif',
        },
        callbacks: {
          label: function (context) {
            let label = context.dataset.label || '';
            if (label) {
              label += ': ';
            }
            if (context.parsed.y !== null) {
              label += `₹${context.parsed.y.toLocaleString()}`;
            }
            return label;
          }
        }
      }
    },
    scales: {
      x: {
        ticks: {
          font: {
            size: 12,
            family: 'Inter, sans-serif',
          },
          color: '#555',
        },
        grid: {
          display: false,
        },
      },
      y: {
        ticks: {
          font: {
            size: 12,
            family: 'Inter, sans-serif',
          },
          color: '#555',
          callback: function (value) {
            return '₹' + value.toLocaleString();
          }
        },
        grid: {
          color: 'rgba(200, 200, 200, 0.2)',
        },
      },
    }
  };

  // Prepare chart data for Product Sales (Pie Chart)
  const getProductChartData = (products) => ({
    labels: products.map(p => p?.name || 'Unknown'),
    datasets: [
      {
        data: products.map(p => p?.sales || 0),
        backgroundColor: [
          '#3B82F6',
          '#60A5FA',
          '#93C5FD',
          '#BFDBFE',
          '#DBEAFE',
        ],
        borderColor: '#ffffff',
        borderWidth: 2,
        hoverOffset: 10,
      },
    ],
  });

  const productChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right',
        labels: {
          font: {
            size: 14,
            family: 'Inter, sans-serif',
          },
          color: '#333',
        },
      },
      tooltip: {
        backgroundColor: 'rgba(0,0,0,0.8)',
        titleFont: {
          size: 16,
          family: 'Inter, sans-serif',
        },
        bodyFont: {
          size: 14,
          family: 'Inter, sans-serif',
        },
        callbacks: {
          label: function (context) {
            let label = context.label || '';
            if (label) {
              label += ': ';
            }
            if (context.parsed !== null) {
              label += `${context.parsed} units`;
            }
            return label;
          }
        }
      }
    },
    animation: {
      animateScale: true,
      animateRotate: true
    }
  };

  // Filter customers for the table with proper null checks
  const customers = bills.reduce((acc, bill) => {
    if (!bill || !bill.customer) return acc;

    const customerId = bill.customer.id;
    const existingCustomer = acc.find(c => c.id === customerId);

    if (!existingCustomer) {
      acc.push({
        id: customerId,
        name: bill.customer.name || 'Unknown Customer',
        totalSpent: bill.total || 0,
        lastVisit: bill.date || new Date().toISOString(),
      });
    } else {
      existingCustomer.totalSpent += bill.total || 0;
      const billDate = bill.date ? new Date(bill.date) : new Date(0);
      const lastVisitDate = existingCustomer.lastVisit ? new Date(existingCustomer.lastVisit) : new Date(0);

      if (billDate > lastVisitDate) {
        existingCustomer.lastVisit = bill.date;
      }
    }
    return acc;
  }, []).sort((a, b) => {
    const dateA = a.lastVisit ? new Date(a.lastVisit) : new Date(0);
    const dateB = b.lastVisit ? new Date(b.lastVisit) : new Date(0);
    return dateB - dateA;
  });

  const filteredCustomers = customers.filter(customer =>
    customer?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
<div className="font-sans text-gray-900 min-h-screen bg-gray-50">
  {/* Header - Fixed at top */}
  <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-10">
    <div className="max-w-6xl mx-auto px-2">
      <div className="flex justify-between items-center h-16">
        {/* Dashboard title */}
        <h1 className="text-lg md:text-xl font-semibold text-gray-700  whitespace-nowrap bg-blue-100 p-2 rounded-md">
          Dashboard
        </h1>
        
        {/* Notification button */}
        <button
          onClick={() => setShowLowStockModal(true)}
          className="p-2 rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors duration-200 relative"
          aria-label="Notifications"
        >
          <Bell className="h-5 w-5" />
          {lowStockAlerts.length > 0 && (
            <span className="absolute top-0 right-0 h-3 w-3 rounded-full bg-red-500 flex items-center justify-center text-white text-xs font-bold animate-pulse">
              {lowStockAlerts.length}
            </span>
          )}
        </button>
      </div>
    </div>
  </header>

  {/* Main Content */}
  <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
    {/* Action Buttons - Stack on mobile, row on larger screens */}
    <div className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
      <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
        <button
          onClick={() => setActivePage('Products')}
          className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200 w-full sm:w-auto"
        >
          <Plus className="mr-2 h-4 w-4" />
          Add New Product
        </button>
        <button
          onClick={() => setActivePage('Stock Summary')}
          className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors duration-200 w-full sm:w-auto"
        >
          <Eye className="mr-2 h-4 w-4" />
          View Stock Summary
        </button>
      </div>
    </div>

    {loading ? (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500"></div>
        <p className="ml-4 text-lg text-gray-600">Loading dashboard data...</p>
      </div>
    ) : (
      <>
        {/* Summary Cards - Responsive grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Revenue Card */}
          <div className="bg-white overflow-hidden shadow-md rounded-lg transform transition duration-300 hover:scale-[1.02]">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-1">
                  <dl>
                    <dt className="text-base font-medium text-gray-500 truncate">Total Revenue</dt>
                    <p className='text-xs font-medium text-gray-500 pb-2'>Last 30 days</p>
                    <dd className="flex items-baseline">
                      <div className="text-lg font-bold text-gray-900">
                        ₹{totalRevenue.toLocaleString()}
                      </div>
                    </dd>
                  </dl>
                </div>
                <div className="flex-shrink-0 bg-blue-100 rounded-full p-2 shadow-lg">
                  <DollarSign className="h-7 w-7 text-blue-800" />
                </div>
              </div>
            </div>
          </div>

          {/* Bills Card */}
          <div className="bg-white overflow-hidden shadow-md rounded-lg transform transition duration-300 hover:scale-[1.02]">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-1">
                  <dl>
                    <dt className="text-base font-medium text-gray-500 truncate">Total Bill</dt>
                    <p className='text-xs font-medium text-gray-500 pb-2'>Last 30 days</p>
                    <dd className="flex items-baseline">
                      <div className="text-lg font-bold text-gray-900">
                        {totalBills}
                      </div>
                    </dd>
                  </dl>
                </div>
                <div className="flex-shrink-0 bg-green-100 rounded-full p-2 shadow-lg">
                  <ShoppingCart className="h-7 w-7 text-green-800" />
                </div>
              </div>
            </div>
          </div>

          {/* Customers Card */}
          <div className="bg-white overflow-hidden shadow-md rounded-lg transform transition duration-300 hover:scale-[1.02]">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-1">
                  <dl>
                    <dt className="text-base font-medium text-gray-500 truncate">Total Customers</dt>
                    <p className='text-xs font-medium text-gray-500 pb-2'>Last 30 days</p>
                    <dd className="flex items-baseline">
                      <div className="text-lg font-bold text-gray-900">
                        {uniqueCustomers}
                      </div>
                    </dd>
                  </dl>
                </div>
                <div className="flex-shrink-0 bg-yellow-100 rounded-full p-2 shadow-lg">
                  <Users className="h-7 w-7 text-yellow-800" />
                </div>
              </div>
            </div>
          </div>

          {/* Products Card */}
          <div className="bg-white overflow-hidden shadow-md rounded-lg transform transition duration-300 hover:scale-[1.02]">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-1">
                  <dl>
                    <dt className="text-base font-medium text-gray-500 truncate">Products in Stock</dt>
                    <p className='text-xs font-medium text-gray-500 pb-2'>Last 30 days</p>
                    <dd className="flex items-baseline">
                      <div className="text-lg font-bold text-gray-900">
                        {totalProductsInStock}
                      </div>
                    </dd>
                  </dl>
                </div>
                <div className="flex-shrink-0 bg-purple-100 rounded-full p-2 shadow-lg">
                  <Package className="h-7 w-7 text-purple-800" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Charts Section - Stack on mobile, side-by-side on larger screens */}
        <div className='grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8'>
          {/* Monthly Revenue Chart */}
          <div className="bg-white shadow-md rounded-lg p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Monthly Revenue</h3>
            <div className="h-80">
              <Bar data={monthlyRevenueChartData} options={monthlyRevenueChartOptions} />
            </div>
          </div>

          {/* Product Sales Chart */}
          <div className="bg-white shadow-md rounded-lg p-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-3">
              <h3 className="text-lg font-bold text-gray-900">
                {showTopSellingChart ? 'Top Selling Products' : 'Less Selling Products'}
              </h3>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowTopSellingChart(true)}
                  className={`px-3 py-1 sm:px-4 sm:py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
                    showTopSellingChart
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  Top Selling
                </button>
                <button
                  onClick={() => setShowTopSellingChart(false)}
                  className={`px-3 py-1 sm:px-4 sm:py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
                    !showTopSellingChart
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  Less Selling
                </button>
              </div>
            </div>
            <div className="h-80 flex justify-center items-center">
              {showTopSellingChart ? (
                topSellingProducts.length > 0 ? (
                  <Pie data={getProductChartData(topSellingProducts)} options={productChartOptions} />
                ) : (
                  <p className="text-gray-600">No top selling product data available.</p>
                )
              ) : (
                lessSellingProducts.length > 0 ? (
                  <Pie data={getProductChartData(lessSellingProducts)} options={productChartOptions} />
                ) : (
                  <p className="text-gray-600">No less selling product data available.</p>
                )
              )}
            </div>
          </div>
        </div>

        {/* Alerts Section - Full width */}
        <div className="bg-white shadow-md rounded-lg overflow-hidden mb-8">
          <div className="px-6 py-5 border-b border-gray-200 bg-red-50">
            <h3 className="text-lg leading-6 font-semibold text-red-800 flex items-center">
              <Bell className="mr-2 h-5 w-5" /> Low Stock Alerts
            </h3>
          </div>
          <div className="bg-white p-6">
            {lowStockAlerts.length > 0 ? (
              <ul className="divide-y divide-red-100">
                {lowStockAlerts.map((alert, index) => (
                  <li key={index} className="py-3 flex flex-col sm:flex-row justify-between gap-2 sm:gap-0">
                    <div className="flex-1">
                      <div className="text-base font-medium text-gray-900">{alert.productName}</div>
                      <div className="text-sm text-gray-500">Code: {alert.productCode}</div>
                      <div className="text-sm text-gray-500">Category: {alert.category}</div>
                    </div>
                    <div className="sm:text-right">
                      <div className="text-base text-red-600 font-semibold">
                        Available: {alert.currentStock}
                      </div>
                      <div className="text-sm text-gray-500">Price: ₹{alert.price}</div>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="text-center py-4 text-gray-600 text-base">
                All good! No low stock alerts.
              </div>
            )}
          </div>
        </div>
      </>
    )}
  </main>

  {/* Low Stock Notification Modal */}
  {showLowStockModal && (
    <NotificationModal
      alerts={lowStockAlerts}
      onClose={() => setShowLowStockModal(false)}
    />
  )}
</div>
  );
};

export default Dashboard;