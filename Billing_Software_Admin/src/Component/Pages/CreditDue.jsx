import React, { useState, useEffect } from 'react';
import { Table, Select, Input, DatePicker, Modal, Card, Statistic, Spin, Alert, Tag, ConfigProvider, Collapse } from 'antd';
import dayjs from 'dayjs';
import isBetween from 'dayjs/plugin/isBetween';
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter';
import {
  CalendarDays,
  Search,
  Users,
  Wallet,
  Landmark,
  XCircle,
  CheckCircle,
  Info,
  ChevronDown,
  ChevronUp,
  List,
} from 'lucide-react';
import api from '../../service/api';

// Extend dayjs with necessary plugins
dayjs.extend(isBetween);
dayjs.extend(isSameOrAfter);

const { Option } = Select;
const { RangePicker } = DatePicker;
const { Panel } = Collapse;

const CreditDue = () => {
  // State management
  const [bills, setBills] = useState([]);
  const [filteredBills, setFilteredBills] = useState([]);
  const [timeRange, setTimeRange] = useState('month');
  const [customDateRange, setCustomDateRange] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all'); // 'all', 'paid', 'pending'

  // Fetch bills data from API
  useEffect(() => {
    const fetchBills = async () => {
      try {
        setLoading(true);
        const response = await api.get('/bills');
        console.log('Fetched bills:', response.data);
        setBills(response.data);
        setFilteredBills(response.data);
        setError(null);
      } catch (err) {
        console.error('Error fetching bills:', err);
        setError('Failed to fetch bills data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchBills();
  }, []);

  // Filter bills based on selected criteria
  useEffect(() => {
    let filtered = [...bills];

    // Apply time range filter
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
          startDate = null;
          endDate = null;
      }

      if (startDate && endDate) {
        filtered = filtered.filter(bill =>
          dayjs(bill.date).isBetween(startDate, endDate, null, '[]')
        );
      }
    } else if (customDateRange.length === 2 && customDateRange[0] && customDateRange[1]) {
      filtered = filtered.filter(bill =>
        dayjs(bill.date).isBetween(
          customDateRange[0].startOf('day'), 
          customDateRange[1].endOf('day'), 
          null, 
          '[]'
        )
      );
    }

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(bill =>
        bill.customer?.contact?.includes(searchTerm) ||
        bill.customer?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        bill.billNumber?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply status filter for the main table (pending customers)
    if (statusFilter !== 'all') {
      filtered = filtered.filter(bill => {
        if (statusFilter === 'pending') {
          return bill.unpaidAmountForThisBill > 0;
        } else if (statusFilter === 'paid') {
          return bill.unpaidAmountForThisBill <= 0;
        }
        return true;
      });
    }

    setFilteredBills(filtered);
  }, [bills, timeRange, customDateRange, searchTerm, statusFilter]);

  // Calculate summary statistics for pending customers
  const calculateSummary = () => {
    const pendingCustomers = {};

    filteredBills.forEach(bill => {
      if (statusFilter === 'all' || 
          (statusFilter === 'pending' && bill.unpaidAmountForThisBill > 0) ||
          (statusFilter === 'paid' && bill.unpaidAmountForThisBill <= 0)) {

        const customerId = bill.customer?.id || `unknown-${bill.billNumber}`;
        const customerName = bill.customer?.name || 'Unknown Customer';
        const customerContact = bill.customer?.contact || 'N/A';

        if (!pendingCustomers[customerId]) {
          pendingCustomers[customerId] = {
            id: customerId,
            name: customerName,
            contact: customerContact,
            totalAmount: 0,
            paidAmount: 0,
            pendingAmount: 0,
            bills: []
          };
        }

        pendingCustomers[customerId].totalAmount += bill.grandTotal || 0;
        pendingCustomers[customerId].paidAmount += bill.paidAmount || 0;
        pendingCustomers[customerId].pendingAmount += bill.unpaidAmountForThisBill || 0;
        pendingCustomers[customerId].bills.push(bill);
      }
    });

    // Sort customers by pending amount in descending order
    return Object.values(pendingCustomers).sort((a, b) => b.pendingAmount - a.pendingAmount);
  };

  const pendingCustomers = calculateSummary();

  // Calculate total summary for all filtered pending customers
  const totalSummary = pendingCustomers.reduce(
    (acc, customer) => ({
      totalAmount: acc.totalAmount + customer.totalAmount,
      paidAmount: acc.paidAmount + customer.paidAmount,
      pendingAmount: acc.pendingAmount + customer.pendingAmount,
    }),
    { totalAmount: 0, paidAmount: 0, pendingAmount: 0 }
  );

  // Table columns configuration for the main table
  const columns = [
    {
      title: 'Date',
      dataIndex: 'date',
      key: 'date',
      render: (_, record) => {
        const latestBill = record.bills[record.bills.length - 1];
        return latestBill?.date ? dayjs(latestBill.date).format('DD/MM/YYYY') : 'N/A';
      },
      sorter: (a, b) => {
        const aDate = a.bills[a.bills.length - 1]?.date;
        const bDate = b.bills[b.bills.length - 1]?.date;
        return new Date(aDate) - new Date(bDate);
      },
      width: 120,
    },
    {
      title: 'Bill Number',
      dataIndex: 'billNumber',
      key: 'billNumber',
      render: (_, record) => {
        const latestBill = record.bills[record.bills.length - 1];
        return latestBill?.billNumber || 'N/A';
      },
      width: 150,
    },
    {
      title: 'Customer Name',
      dataIndex: 'name',
      key: 'name',
      render: (text) => text || 'Unknown Customer',
      sorter: (a, b) => (a.name || '').localeCompare(b.name || ''),
    },
    {
      title: 'Contact Number',
      dataIndex: 'contact',
      key: 'contact',
      render: (text) => text || 'N/A',
      width: 150,
    },
    {
      title: 'Total Amount',
      dataIndex: 'totalAmount',
      key: 'totalAmount',
      render: (amount) => (
        <span className="text-base font-semibold text-gray-700">
          ₹{amount?.toFixed(2) || '0.00'}
        </span>
      ),
      sorter: (a, b) => a.totalAmount - b.totalAmount,
      width: 150,
    },
    {
      title: 'Paid Amount',
      dataIndex: 'paidAmount',
      key: 'paidAmount',
      render: (amount) => (
        <Tag color="green" className="text-base px-3 py-1 rounded-full font-semibold">
          ₹{amount?.toFixed(2) || '0.00'}
        </Tag>
      ),
      sorter: (a, b) => a.paidAmount - b.paidAmount,
      width: 150,
    },
    {
      title: 'Pending Amount',
      dataIndex: 'pendingAmount',
      key: 'pendingAmount',
      render: (amount) => (
        <Tag color={amount > 0 ? 'red' : 'green'} className="text-base px-3 py-1 rounded-full font-semibold">
          ₹{amount?.toFixed(2) || '0.00'}
        </Tag>
      ),
      sorter: (a, b) => a.pendingAmount - b.pendingAmount,
      width: 150,
    },
    {
      title: 'Action',
      key: 'action',
      render: (_, record) => (
        <button
          onClick={() => {
            setSelectedCustomer(record);
            setIsModalOpen(true);
          }}
          className="text-blue-600 hover:text-blue-800 font-semibold py-1 px-3 rounded-md transition duration-200 ease-in-out transform hover:scale-105"
        >
          View Details
        </button>
      ),
      width: 120,
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
          // You can customize theme tokens here if needed
        },
      }}
    >
      <div className="min-h-screen bg-gray-100 p-6 font-inter">
        <style>
          {`
          .font-inter {
            font-family: 'Inter', sans-serif;
          }
          .ant-card-bordered {
            border-radius: 0.75rem;
            border-color: #e2e8f0;
          }
          .ant-statistic-title {
            font-size: 1rem;
            color: #64748b;
          }
          .ant-statistic-content {
            font-size: 1.875rem;
            font-weight: 600;
          }
          .ant-table-wrapper .ant-table {
            border-radius: 0.75rem;
            overflow: hidden;
          }
          .ant-table-thead > tr > th {
            background-color: #f8fafc;
            color: #475569;
            font-weight: 600;
            font-size: 0.95rem;
            padding: 16px 24px;
          }
          .ant-table-tbody > tr > td {
            padding: 12px 24px;
          }
          .ant-table-pagination.ant-pagination {
            padding: 16px 0;
            border-top: 1px solid #e2e8f0;
            margin: 0;
            background-color: #fff;
            border-bottom-left-radius: 0.75rem;
            border-bottom-right-radius: 0.75rem;
          }
          .ant-modal-content {
            border-radius: 1rem;
            overflow: hidden;
          }
          .ant-modal-header {
            border-bottom: 1px solid #e2e8f0;
            padding: 16px 24px;
            background-color: #f8fafc;
            border-top-left-radius: 1rem;
            border-top-right-radius: 1rem;
          }
          .ant-modal-title {
            font-size: 1.25rem;
            font-weight: 700;
            color: #1e293b;
          }
          .ant-modal-close-x {
            width: 48px;
            height: 48px;
            line-height: 48px;
          }
          .ant-tag {
            border-radius: 9999px;
            padding: 0.25rem 0.75rem;
            font-size: 0.875rem;
          }
          .ant-select-selector, .ant-input, .ant-picker {
            border-radius: 0.5rem !important;
            border-color: #cbd5e1 !important;
          }
          .ant-select-selector:hover, .ant-input:hover, .ant-picker:hover {
            border-color: #60a5fa !important;
          }
          .ant-select-focused .ant-select-selector, .ant-input:focus, .ant-picker-focused {
            border-color: #3b82f6 !important;
            box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2) !important;
          }
          .ant-collapse {
            background-color: #fff;
            border-radius: 0.5rem;
            border: 1px solid #e2e8f0;
          }
          .ant-collapse-header {
            align-items: center !important;
          }
          .product-row {
            border-bottom: 1px solid #f1f5f9;
            padding: 12px 0;
          }
          .product-row:last-child {
            border-bottom: none;
          }
          .payment-method-tag {
            border-radius: 4px;
            padding: 2px 8px;
            font-size: 12px;
            text-transform: capitalize;
          }
          `}
        </style>

        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
            <h1 className="text-3xl font-extrabold text-gray-900 mb-4 md:mb-0">
              Credit Due Management
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
              <CalendarDays className="w-5 h-5 text-gray-500" />
              <Select
                defaultValue="month"
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

            <div className="flex items-center gap-2 min-w-[180px]">
              <List className="w-5 h-5 text-gray-500" />
              <Select
                defaultValue="all"
                style={{ flexGrow: 1 }}
                onChange={(value) => setStatusFilter(value)}
                className="rounded-lg"
              >
                <Option value="all">All Transactions</Option>
                <Option value="pending">Pending Only</Option>
                <Option value="paid">Paid Only</Option>
              </Select>
            </div>

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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card bordered={false} className="shadow-xl transition-all duration-300 rounded-xl bg-gradient-to-br from-green-50 to-green-100">
              <Statistic
                title={<span className="text-green-700 flex items-center gap-2"><Wallet className="w-5 h-5" /> Total Bill Amount</span>}
                value={totalSummary.totalAmount}
                precision={2}
                prefix="₹"
                valueStyle={{ color: '#15803d' }}
              />
            </Card>
            <Card bordered={false} className="shadow-xl transition-all duration-300 rounded-xl bg-gradient-to-br from-red-50 to-red-100">
              <Statistic
                title={<span className="text-red-700 flex items-center gap-2"><Landmark className="w-5 h-5" /> Total Pending Amount</span>}
                value={totalSummary.pendingAmount}
                precision={2}
                prefix="₹"
                valueStyle={{ color: '#b91c1c' }}
              />
            </Card>
            <Card bordered={false} className="shadow-xl transition-all duration-300 rounded-xl bg-gradient-to-br from-blue-50 to-blue-100">
              <Statistic
                title={<span className="text-blue-700 flex items-center gap-2"><Wallet className="w-5 h-5" /> Total Paid Amount</span>}
                value={totalSummary.paidAmount}
                precision={2}
                prefix="₹"
                valueStyle={{ color: '#1d4ed8' }}
              />
            </Card>
          </div>

          {/* Customers Table */}
          <div className="bg-white p-6 rounded-xl shadow-lg">
            <Table
              columns={columns}
              dataSource={pendingCustomers}
              rowKey={(record) => record.id}
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
                    <p className="text-lg font-medium">No records found for the selected criteria</p>
                    <p className="text-sm">Try adjusting your filters or search terms.</p>
                  </div>
                )
              }}
              className="rounded-xl"
            />
          </div>

          {/* Customer Details Modal */}
          <Modal
            title={
              <div className="flex items-center gap-3 py-2">
                <span className="text-xl font-bold text-gray-900">Due Details for {selectedCustomer?.name || 'Customer'}</span>
                <span className="text-sm text-gray-500">({selectedCustomer?.contact || 'N/A'})</span>
              </div>
            }
            open={isModalOpen}
            onCancel={() => setIsModalOpen(false)}
            footer={null}
            width={900}
            styles={{
              body: { padding: '24px' },
              header: { borderBottom: '1px solid #e2e8f0', padding: '16px 24px', backgroundColor: '#f8fafc' },
            }}
            className="rounded-2xl"
          >
            {selectedCustomer && (
              <div>
                <div className="mb-6 p-5 bg-blue-50 rounded-lg border border-blue-200 shadow-sm">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
                    <div>
                      <p className="text-gray-700 text-lg mb-1"><strong>Customer Name:</strong> <span className="font-semibold text-gray-900">{selectedCustomer.name || 'N/A'}</span></p>
                      <p className="text-gray-700 text-lg"><strong>Contact:</strong> <span className="font-semibold text-gray-900">{selectedCustomer.contact || 'N/A'}</span></p>
                    </div>
                    <div className="text-right mt-4 md:mt-0">
                      <p className="text-xl font-bold text-red-600 flex items-center justify-end">
                        Total Pending:
                        <span className="ml-3 text-3xl">
                          ₹{selectedCustomer.pendingAmount?.toFixed(2) || '0.00'}
                        </span>
                      </p>
                    </div>
                  </div>
                </div>

                <Table
                  columns={[
                    {
                      title: 'Bill Date',
                      dataIndex: 'date',
                      key: 'date',
                      render: date => date ? dayjs(date).format('DD/MM/YYYY') : 'N/A',
                      sorter: (a, b) => new Date(a.date) - new Date(b.date)
                    },
                    {
                      title: 'Bill Number',
                      dataIndex: 'billNumber',
                      key: 'billNumber',
                      render: text => text || 'N/A'
                    },
                    {
                      title: 'Products',
                      dataIndex: 'products',
                      key: 'products',
                      render: (products) => {
                        if (!products?.length) return 'No products';

                        const productNames = products.map(product => product.name || 'Unknown Product');
                        return (
                          <div className="max-w-xs truncate" title={productNames.join(', ')}>
                            {productNames.slice(0, 1000).join(', ')}
                            {productNames.length > 1000 && ` +${productNames.length - 1000} more`}
                          </div>
                        );
                      },
                    },
                    {
                      title: 'Quantity',
                      dataIndex: 'products',
                      key: 'quantity',
                      render: (products) => {
                        if (!products?.length) return 'N/A';
                        return products.reduce((sum, product) => sum + (product.quantity || 0), 0);
                      },
                      width: 100,
                    },
                    {
                      title: 'Price',
                      dataIndex: 'products',
                      key: 'price',
                      render: (products) => {
                        if (!products?.length) return 'N/A';
                        return `₹${products.reduce((sum, product) => sum + (product.price || 0), 0).toFixed(2)}`;
                      },
                      width: 120,
                    },
                    {
                      title: 'Grand Total',
                      dataIndex: 'grandTotal',
                      key: 'grandTotal',
                      render: amount => `₹${amount?.toFixed(2) || '0.00'}`,
                      sorter: (a, b) => (a.grandTotal || 0) - (b.grandTotal || 0)
                    },
                    {
                      title: 'Paid Amount',
                      dataIndex: 'paidAmount',
                      key: 'paidAmount',
                      render: amount => `₹${amount?.toFixed(2) || '0.00'}`,
                      sorter: (a, b) => (a.paidAmount || 0) - (b.paidAmount || 0)
                    },
                    {
                      title: 'Unpaid Amount',
                      dataIndex: 'unpaidAmountForThisBill',
                      key: 'unpaidAmountForThisBill',
                      render: amount => (
                        <Tag color={amount > 0 ? 'red' : 'green'} className="text-base px-3 py-1 rounded-full font-semibold">
                          ₹{amount?.toFixed(2) || '0.00'}
                        </Tag>
                      ),
                      sorter: (a, b) => (a.unpaidAmountForThisBill || 0) - (b.unpaidAmountForThisBill || 0)
                    },
                    {
                      title: 'Payment Method',
                      dataIndex: 'paymentMethod',
                      key: 'paymentMethod',
                      render: method => (
                        <Tag className="payment-method-tag">
                          {method || 'N/A'}
                        </Tag>
                      )
                    },
                    {
                      title: 'Status',
                      dataIndex: 'status',
                      key: 'status',
                      render: status => {
                        let color = 'gray';
                        let icon = null;
                        if (status === 'paid') {
                          color = 'green';
                          icon = <CheckCircle className="w-4 h-4 mr-1 inline-block" />;
                        } else if (status === 'partial') {
                          color = 'orange';
                          icon = <Info className="w-4 h-4 mr-1 inline-block" />;
                        } else if (status === 'unpaid') {
                          color = 'red';
                          icon = <XCircle className="w-4 h-4 mr-1 inline-block" />;
                        }
                        return (
                          <Tag color={color} className="text-base px-3 py-1 rounded-full font-semibold capitalize">
                            {icon} {status?.toUpperCase() || 'UNKNOWN'}
                          </Tag>
                        );
                      }
                    },
                  ]}
                  dataSource={selectedCustomer.bills}
                  rowKey="_id"
                  pagination={false}
                  scroll={{ x: true }}
                  expandable={{
                    expandedRowRender: (record) => (
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                          <div>
                            <h4 className="font-semibold text-gray-800 mb-2">Bill Summary</h4>
                            <div className="grid grid-cols-2 gap-2 text-sm">
                              <div><span className="font-medium">Bill Date:</span> {dayjs(record.date).format('DD/MM/YYYY')}</div>
                              <div><span className="font-medium">Bill Number:</span> {record.billNumber || 'N/A'}</div>
                              <div><span className="font-medium">Grand Total:</span> ₹{record.grandTotal?.toFixed(2) || '0.00'}</div>
                              <div><span className="font-medium">Paid Amount:</span> ₹{record.paidAmount?.toFixed(2) || '0.00'}</div>
                              <div><span className="font-medium">Pending Amount:</span> ₹{record.unpaidAmountForThisBill?.toFixed(2) || '0.00'}</div>
                              <div><span className="font-medium">Payment Method:</span> {record.paymentMethod || 'N/A'}</div>
                            </div>
                          </div>
                        </div>

                        <h4 className="font-semibold text-gray-800 mb-2">Product Details</h4>
                        <Table
                          columns={[
                            {
                              title: 'Name',
                              dataIndex: 'name',
                              key: 'name',
                              render: (text, record) => {
                                if (text) return text;
                                return record.product?.name || 'Unknown Product';
                              },
                            },
                            {
                              title: 'Price',
                              dataIndex: 'price',
                              key: 'price',
                              render: (price) => `₹${price?.toFixed(2) || '0.00'}`,
                              width: 100,
                            },
                            {
                              title: 'Quantity',
                              dataIndex: 'quantity',
                              key: 'quantity',
                              width: 100,
                            },
                            {
                              title: 'Unit',
                              dataIndex: 'unit',
                              key: 'unit',
                              render: (text) => text || 'N/A',
                              width: 80,
                            },
                            {
                              title: 'GST',
                              dataIndex: 'gst',
                              key: 'gst',
                              render: (gst) => `${gst || '0'}%`,
                              width: 80,
                            },
                            {
                              title: 'MRP',
                              dataIndex: 'mrpPrice',
                              key: 'mrpPrice',
                              render: (mrpPrice, record) => `₹${(mrpPrice || record.mrp || '0.00')?.toFixed(2)}`,
                              width: 100,
                            },
                            {
                              title: 'Discount',
                              dataIndex: 'discount',
                              key: 'discount',
                              render: (discount) => `₹${discount?.toFixed(2) || '0.00'}`,
                              width: 100,
                            },
                            {
                              title: 'Total',
                              key: 'total',
                              render: (_, record) => `₹${((record.price || 0) * (record.quantity || 0))?.toFixed(2)}`,
                              width: 120,
                            },
                          ]}
                          dataSource={record.products || []}
                          rowKey={(item, index) => `${item.product?.id}-${index}`}
                          pagination={false}
                          size="small"
                          bordered
                          className="rounded-lg"
                          locale={{
                            emptyText: 'No products found for this bill'
                          }}
                        />
                      </div>
                    ),
                    rowExpandable: (record) => !!record.products?.length,
                  }}
                  locale={{
                    emptyText: 'No bills found for this customer'
                  }}
                  className="rounded-xl"
                />
              </div>
            )}
          </Modal>
        </div>
      </div>
    </ConfigProvider>
  );
};

export default CreditDue;