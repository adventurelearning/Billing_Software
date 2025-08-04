import React, { useState, useEffect } from 'react';
import { Table, Select, Input, DatePicker, Card, Statistic, Spin, Alert, Tag, ConfigProvider, Divider, Modal, Row, Col, Typography, message } from 'antd';
import dayjs from 'dayjs';
import isBetween from 'dayjs/plugin/isBetween';
import {
  CalendarOutlined as CalendarDays,
  SearchOutlined as Search,
  ShoppingOutlined as ShoppingBag,
  UserOutlined as Users,
  BarChartOutlined as BarChart2,
  LineChartOutlined as TrendingUp,
  ShopOutlined as Store,
  CloseCircleOutlined as XCircle,
  InfoCircleOutlined as Info,
  FilterOutlined as Filter,
  EyeOutlined,
  WalletOutlined as Wallet,
} from '@ant-design/icons';
import Api from '../../service/api';

dayjs.extend(isBetween);

const { Option } = Select;
const { RangePicker } = DatePicker;
const { Text, Title } = Typography;

const BillingReport = ({ user }) => {
  // State management
  const [bills, setBills] = useState([]);
  const [cashiers, setCashiers] = useState([]);
  const [counters, setCounters] = useState([]);
  const [filteredBills, setFilteredBills] = useState([]);
  const [timeRange, setTimeRange] = useState('month');
  const [customDateRange, setCustomDateRange] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCounter, setSelectedCounter] = useState('all');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [topProducts, setTopProducts] = useState([]);
  const [selectedBill, setSelectedBill] = useState(null);
  const [isModalVisible, setIsModalVisible] = useState(false);

  // Fetch initial data (cashiers and counters)
  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const res = await Api.get("/credentials/users");

      if (!res.data) {
        throw new Error("No data received from server");
      }

      let cashiersData = [];
      if (Array.isArray(res.data)) {
        cashiersData = res.data;
      } else if (Array.isArray(res.data.cashiers)) {
        cashiersData = res.data.cashiers;
      } else {
        throw new Error("Invalid cashiers data format");
      }

      const processedCashiers = cashiersData.map(cashier => ({
        _id: cashier._id,
        cashierName: cashier.cashierName,
        cashierId: cashier.cashierId,
        counterNum: cashier.counterNum?.toString().trim(),
        contactNumber: cashier.contactNumber
      }));

      setCashiers(processedCashiers);

      const uniqueCounters = [...new Set(
        processedCashiers
          .filter(cashier => cashier.counterNum)
          .map(cashier => cashier.counterNum)
      )];

      setCounters(uniqueCounters);

      if (user?.counterId) {
        setSelectedCounter(user.counterId.toString().trim());
      } else if (uniqueCounters.length > 0) {
        setSelectedCounter('all');
      }
    } catch (error) {
      console.error("Failed to fetch initial data:", error);
      setError("Failed to load cashiers and counters data");
      setCashiers([]);
      setCounters([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch bill data with counter filtering
  const fetchBillData = async () => {
    try {
      setLoading(true);
      
      const params = {};
      
      if (selectedCounter !== 'all') {
        params.counterNum = selectedCounter.toString().trim();
      }

      const res = await Api.get("/bills", {
        params,
        validateStatus: function (status) {
          return status >= 200 && status < 300;
        }
      });

      let billsData = [];
      if (res.data) {
        billsData = Array.isArray(res.data) ? res.data : [res.data];
      }

      // Filter bills by date range client-side
      billsData = filterBillsByDateRange(billsData);
      
      // Additional counter filter (client-side)
      if (selectedCounter !== 'all') {
        billsData = billsData.filter(bill =>
          bill.cashier?.counterNum === selectedCounter.toString().trim()
        );
      }

      setBills(billsData);
      filterBills(billsData); // Apply search filter if any
      calculateTopProducts(billsData);

      if (billsData.length === 0) {
        message.info(selectedCounter === 'all'
          ? 'No bills found for selected date range'
          : `No bills found for Counter ${selectedCounter} in selected date range`);
      }

    } catch (error) {
      console.error("API Error Details:", error);
      setError("Failed to load bill data");
      setBills([]);
      setFilteredBills([]);
      setTopProducts([]);
    } finally {
      setLoading(false);
    }
  };

  // Filter bills by date range
  const filterBillsByDateRange = (billsData) => {
    if (timeRange !== 'custom') {
      const now = dayjs();
      let startDate, endDate;

      switch (timeRange) {
        case 'year':
          startDate = now.startOf('year');
          endDate = now.endOf('year');
          break;
        case 'month':
          startDate = now.startOf('month');
          endDate = now.endOf('month');
          break;
        case 'week':
          startDate = now.startOf('week');
          endDate = now.endOf('week');
          break;
        case 'day':
          startDate = now.startOf('day');
          endDate = now.endOf('day');
          break;
        default:
          return billsData;
      }

      return billsData.filter(bill =>
        dayjs(bill.date).isBetween(startDate, endDate, null, '[]')
      );
    } else if (customDateRange.length === 2 && customDateRange[0] && customDateRange[1]) {
      return billsData.filter(bill =>
        dayjs(bill.date).isBetween(
          customDateRange[0].startOf('day'), 
          customDateRange[1].endOf('day'), 
          null, 
          '[]'
        )
      );
    }
    return billsData;
  };

  // Apply search filter
  const filterBills = (billsData) => {
    let filtered = [...billsData];

    if (searchTerm) {
      filtered = filtered.filter(bill =>
        bill.customer?.contact?.includes(searchTerm) ||
        bill.customer?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        bill.billNumber?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredBills(filtered);
  };

  // Calculate top selling products (grouped by product name)
  const calculateTopProducts = (billsData) => {
    const productMap = {};

    billsData.forEach(bill => {
      if (bill.products && bill.products.length > 0) {
        bill.products.forEach(product => {
          const productName = product.product?.name || product.name || 'Unknown Product';
          
          if (!productMap[productName]) {
            productMap[productName] = {
              name: productName,
              quantity: 0,
              totalAmount: 0,
              counters: new Set(),
              bills: 0
            };
          }

          productMap[productName].quantity += product.quantity || 0;
          productMap[productName].totalAmount += (product.price || 0) * (product.quantity || 0);
          
          // Track which counters sold this product
          if (bill.cashier?.counterNum) {
            productMap[productName].counters.add(bill.cashier.counterNum);
          }
          
          productMap[productName].bills += 1;
        });
      }
    });

    // Convert to array and sort by quantity
    const productsArray = Object.values(productMap).map(product => ({
      ...product,
      counters: Array.from(product.counters).join(', ')
    }));
    
    productsArray.sort((a, b) => b.quantity - a.quantity);
    
    setTopProducts(productsArray.slice(0, 10)); // Top 10 products
  };

  // Calculate summary statistics
  const calculateSummary = () => {
    const summary = {
      totalBills: 0,
      totalAmount: 0,
      totalCustomers: new Set(),
      averageBill: 0
    };

    filteredBills.forEach(bill => {
      summary.totalBills += 1;
      summary.totalAmount += bill.grandTotal || 0;
      if (bill.customer?.id) {
        summary.totalCustomers.add(bill.customer.id);
      }
    });

    summary.averageBill = summary.totalBills > 0 ? summary.totalAmount / summary.totalBills : 0;
    summary.totalCustomers = summary.totalCustomers.size;

    return summary;
  };

  // Show bill details modal
  const showBillDetails = (bill) => {
    setSelectedBill(bill);
    setIsModalVisible(true);
  };

  // Close bill details modal
  const handleModalClose = () => {
    setIsModalVisible(false);
    setSelectedBill(null);
  };

  // Fetch data when component mounts or filters change
  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    if (counters.length > 0) {
      fetchBillData();
    }
  }, [selectedCounter, timeRange, customDateRange]);

  useEffect(() => {
    filterBills(bills);
    calculateTopProducts(bills);
  }, [searchTerm]);

  const summary = calculateSummary();

  // Table columns configuration
  const columns = [
    {
      title: 'Bill Date',
      dataIndex: 'date',
      key: 'date',
      render: date => date ? dayjs(date).format('DD/MM/YYYY') : 'N/A',
      sorter: (a, b) => new Date(a.date) - new Date(b.date),
      width: 120,
    },
    {
      title: 'Bill Number',
      dataIndex: 'billNumber',
      key: 'billNumber',
      render: text => text || 'N/A',
      width: 150,
    },
    {
      title: 'Counter',
      dataIndex: 'cashier',
      key: 'counter',
      render: cashier => cashier?.counterNum || 'N/A',
      sorter: (a, b) => (a.cashier?.counterNum || '').localeCompare(b.cashier?.counterNum || ''),
    },
    {
      title: 'Cashier',
      dataIndex: 'cashier',
      key: 'cashier',
      render: cashier => cashier?.cashierName || 'N/A',
      sorter: (a, b) => (a.cashier?.cashierName || '').localeCompare(b.cashier?.cashierName || ''),
    },
    {
      title: 'Customer',
      dataIndex: 'customer',
      key: 'customer',
      render: customer => customer?.name || 'Walk-in Customer',
      sorter: (a, b) => (a.customer?.name || '').localeCompare(b.customer?.name || ''),
    },
    {
      title: 'Contact',
      dataIndex: 'customer',
      key: 'contact',
      render: customer => customer?.contact || 'N/A',
      width: 150,
    },
    {
      title: 'Total Amount',
      dataIndex: 'grandTotal',
      key: 'grandTotal',
      render: amount => (
        <span className="text-base font-semibold text-gray-700">
          ₹{amount?.toFixed(2) || '0.00'}
        </span>
      ),
      sorter: (a, b) => (a.grandTotal || 0) - (b.grandTotal || 0),
      width: 150,
    },
    {
      title: 'Action',
      key: 'action',
      render: (_, record) => (
        <button
          onClick={() => showBillDetails(record)}
          className="text-blue-600 hover:text-blue-800 flex items-center gap-1"
        >
          <EyeOutlined className="w-4 h-4" />
          View
        </button>
      ),
      width: 100,
    },
  ];

  // Loading state
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50">
        <Spin size="large" tip="Loading data...">
          <div className="content-spin p-8 bg-white rounded-lg shadow-lg" />
        </Spin>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="p-8 bg-gray-50 min-h-screen flex items-center justify-center">
        <Alert
          message="Error"
          description={error}
          type="error"
          showIcon
          className="rounded-lg shadow-md max-w-lg w-full"
          icon={<XCircle className="w-6 h-6" />}
          action={
            <button
              onClick={() => window.location.reload()}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition duration-200 ease-in-out shadow-md"
            >
              Retry
            </button>
          }
        />
      </div>
    );
  }

  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: '#3b82f6',
        },
      }}
    >
      <div className="min-h-screen bg-gray-100 p-6 font-inter">
       
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
            <h1 className="text-xl font-semibold text-gray-900 mb-4 ">
              Billing Report & Analytics
            </h1>
            <div className="flex items-center space-x-2 text-gray-600">
              <CalendarDays className="w-5 h-5" />
              <span className="text-lg font-medium">
                {dayjs().format('DD MMMM YYYY')}
              </span>
            </div>
          </div>

          {/* Filters Section */}
          <div className="flex flex-col md:flex-row gap-4 mb-8 bg-white p-6 rounded-xl shadow-lg items-center">
            <div className="flex items-center gap-2 min-w-[180px]">
              <Store className="w-5 h-5 text-gray-500" />
              <Select
                value={selectedCounter}
                style={{ flexGrow: 1 }}
                onChange={setSelectedCounter}
                className="rounded-lg"
                disabled={counters.length === 0}
              >
                <Option value="all">All Counters</Option>
                {counters.map(counter => (
                  <Option key={counter} value={counter}>
                    Counter {counter}
                  </Option>
                ))}
              </Select>
            </div>

            <div className="flex items-center gap-2 min-w-[180px]">
              <CalendarDays className="w-5 h-5 text-gray-500" />
              <Select
                defaultValue={timeRange}
                value={timeRange}
                style={{ flexGrow: 1 }}
                onChange={(value) => {
                  setTimeRange(value);
                  if (value !== 'custom') setCustomDateRange([]);
                }}
                className="rounded-lg"
              >
                <Option value="year">This Year</Option>
                <Option value="month">This Month</Option>
                <Option value="week">This Week</Option>
                <Option value="day">Today</Option>
                <Option value="custom">Custom Date</Option>
              </Select>
            </div>

            {timeRange === 'custom' && (
              <RangePicker
                value={customDateRange}
                onChange={(dates) => setCustomDateRange(dates)}
                className="w-full md:w-auto rounded-lg shadow-sm"
              />
            )}

            <Input
              placeholder="Search by name, contact or bill number"
              prefix={<Search className="w-4 h-4 text-gray-400" />}
              style={{ flexGrow: 1 }}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              allowClear
              className="rounded-lg shadow-sm"
            />
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card bordered={false} className="shadow-xl transition-all duration-300 rounded-xl bg-gradient-to-br from-blue-50 to-blue-100">
              <Statistic
                title={<span className="text-blue-700 flex items-center gap-2"><ShoppingBag className="w-5 h-5" /> Total Bills</span>}
                value={summary.totalBills}
                valueStyle={{ color: '#1d4ed8' }}
              />
            </Card>
            <Card bordered={false} className="shadow-xl transition-all duration-300 rounded-xl bg-gradient-to-br from-green-50 to-green-100">
              <Statistic
                title={<span className="text-green-700 flex items-center gap-2"><Wallet className="w-5 h-5" /> Total Amount</span>}
                value={summary.totalAmount}
                precision={2}
                prefix="₹"
                valueStyle={{ color: '#15803d' }}
              />
            </Card>
            <Card bordered={false} className="shadow-xl transition-all duration-300 rounded-xl bg-gradient-to-br from-purple-50 to-purple-100">
              <Statistic
                title={<span className="text-purple-700 flex items-center gap-2"><Users className="w-5 h-5" /> Total Customers</span>}
                value={summary.totalCustomers}
                valueStyle={{ color: '#7e22ce' }}
              />
            </Card>
            <Card bordered={false} className="shadow-xl transition-all duration-300 rounded-xl bg-gradient-to-br from-amber-50 to-amber-100">
              <Statistic
                title={<span className="text-amber-700 flex items-center gap-2"><BarChart2 className="w-5 h-5" /> Avg. Bill Amount</span>}
                value={summary.averageBill}
                precision={2}
                prefix="₹"
                valueStyle={{ color: '#b45309' }}
              />
            </Card>
          </div>

          {/* Top Selling Products */}
          <div className="mb-8">
            <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Top Selling Products
              <Tag className="ml-2">{selectedCounter === 'all' ? 'All Counters' : `Counter ${selectedCounter}`}</Tag>
            </h2>
            
            {topProducts.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
                {topProducts.map((product, index) => (
                  <Card key={product.name} bordered={false} className="shadow-md hover:shadow-lg rounded-lg">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-semibold text-gray-800 truncate">
                        {product.name}
                      </h3>
                      {/* <div className={`flex items-center justify-center w-6 h-6 rounded-full ${
                        index === 0 ? 'bg-yellow-500' : 
                        index === 1 ? 'bg-gray-400' : 
                        index === 2 ? 'bg-amber-700' : 'bg-blue-500'
                      } text-white text-xs font-bold`}>
                        {index + 1}
                      </div> */}
                    </div>
                    
                    {selectedCounter === 'all' && (
                      <p className="text-xs text-gray-600 mb-2">
                        Sold at: {product.counters || 'Multiple counters'}
                      </p>
                    )}
                    
                    <Divider className="my-2" />
                    
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <p className="text-xs text-gray-500">Quantity Sold</p>
                        <p className="font-bold text-blue-600">{product.quantity}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Total Value</p>
                        <p className="font-bold text-green-600">₹{product.totalAmount.toFixed(2)}</p>
                      </div>
                    </div>
                    
                    <div className="mt-2">
                      <p className="text-xs text-gray-500">Appeared in</p>
                      <p className="font-medium">{product.bills} {product.bills === 1 ? 'bill' : 'bills'}</p>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <Card bordered={false} className="shadow-sm rounded-lg">
                <div className="flex flex-col items-center justify-center py-8 text-gray-500">
                  <Info className="w-12 h-12 mb-4 text-gray-400" />
                  <p className="text-lg font-medium">No products found for the selected criteria</p>
                </div>
              </Card>
            )}
          </div>

          {/* Bills Table */}
          <div className="bg-white p-6 rounded-xl shadow-lg">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <Filter className="w-5 h-5" />
                {selectedCounter === 'all' ? 'All Bills' : `Bills for Counter ${selectedCounter}`}
              </h2>
              <div className="text-sm text-gray-500">
                Showing {filteredBills.length} records
              </div>
            </div>

            <Table
              columns={columns}
              dataSource={filteredBills}
              rowKey="_id"
              pagination={{
                pageSize: 10,
                showSizeChanger: true,
                pageSizeOptions: ['10', '20', '50', '100'],
                showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} items`,
              }}
              scroll={{ x: true }}
              loading={loading}
              locale={{
                emptyText: (
                  <div className="flex flex-col items-center justify-center py-8 text-gray-500">
                    <Info className="w-12 h-12 mb-4 text-gray-400" />
                    <p className="text-lg font-medium">No bills found for the selected criteria</p>
                    <p className="text-sm">Try adjusting your filters or search terms.</p>
                  </div>
                )
              }}
              className="rounded-xl"
            />
          </div>

          {/* Bill Details Modal */}
          <Modal
            title={<Title level={4} className="mb-0">Bill Details</Title>}
            open={isModalVisible}
            onCancel={handleModalClose}
            footer={null}
            width={800}
          >
            {selectedBill && (
              <div>
                <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                  <Row gutter={16}>
                    <Col span={12}>
                      <div className="mb-2">
                        <Text strong>Bill Number:</Text> {selectedBill.billNumber || 'N/A'}
                      </div>
                      <div className="mb-2">
                        <Text strong>Date:</Text> {dayjs(selectedBill.date).format('DD/MM/YYYY HH:mm')}
                      </div>
                      <div className="mb-2">
                        <Text strong>Counter:</Text> {selectedBill.cashier?.counterNum || 'N/A'}
                      </div>
                    </Col>
                    <Col span={12}>
                      <div className="mb-2">
                        <Text strong>Customer:</Text> {selectedBill.customer?.name || 'Walk-in Customer'}
                      </div>
                      <div className="mb-2">
                        <Text strong>Contact:</Text> {selectedBill.customer?.contact || 'N/A'}
                      </div>
                      <div className="mb-2">
                        <Text strong>Payment Method:</Text> {selectedBill.paymentMethod || 'N/A'}
                      </div>
                    </Col>
                  </Row>
                </div>

                <div className="mb-6">
                  <Title level={5} className="mb-3">Products</Title>
                  <Table
                    columns={[
                      {
                        title: 'Product',
                        dataIndex: 'product',
                        key: 'product',
                        render: (product) => product?.name || 'Unknown Product',
                      },
                      {
                        title: 'Price',
                        dataIndex: 'price',
                        key: 'price',
                        render: price => `₹${price?.toFixed(2) || '0.00'}`,
                        width: 100,
                      },
                      {
                        title: 'Quantity',
                        dataIndex: 'quantity',
                        key: 'quantity',
                        width: 100,
                      },
                      {
                        title: 'Total',
                        key: 'total',
                        render: (_, record) => `₹${((record.price || 0) * (record.quantity || 0)).toFixed(2)}`,
                        width: 120,
                      },
                    ]}
                    dataSource={selectedBill.products || []}
                    rowKey={(record, index) => `${record.product?.id}-${index}`}
                    pagination={false}
                    size="small"
                  />
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <Row gutter={16}>
                    <Col span={12}>
                      <div className="mb-2">
                        <Text strong>Subtotal:</Text> ₹{selectedBill.subTotal?.toFixed(2) || '0.00'}
                      </div>
                      {selectedBill.discount > 0 && (
                        <div className="mb-2">
                          <Text strong>Discount:</Text> ₹{selectedBill.discount?.toFixed(2) || '0.00'}
                        </div>
                      )}
                      <div className="mb-2">
                        <Text strong>Tax:</Text> ₹{selectedBill.taxAmount?.toFixed(2) || '0.00'}
                      </div>
                    </Col>
                    <Col span={12}>
                      <div className="mb-2">
                        <Text strong>Grand Total:</Text> ₹{selectedBill.grandTotal?.toFixed(2) || '0.00'}
                      </div>
                      <div className="mb-2">
                        <Text strong>Paid Amount:</Text> ₹{selectedBill.paidAmount?.toFixed(2) || '0.00'}
                      </div>
                      <div className="mb-2">
                        <Text strong>Pending Amount:</Text> 
                        <Tag color={selectedBill.unpaidAmountForThisBill > 0 ? 'red' : 'green'} className="ml-2">
                          ₹{selectedBill.unpaidAmountForThisBill?.toFixed(2) || '0.00'}
                        </Tag>
                      </div>
                    </Col>
                  </Row>
                </div>
              </div>
            )}
          </Modal>
        </div>  
    </ConfigProvider>
  );
};

export default BillingReport;