import React, { useEffect, useState } from 'react';
import { X, Search } from 'lucide-react';
import api from '../../service/api';
import axios from 'axios';

const ProductDetailsModal = ({ selectedBill, onClose }) => {
  if (!selectedBill) return null;

  // Extract all required data with fallbacks
  const billNumber = selectedBill.billNumber || 'N/A';
  const billDate = selectedBill.date ? new Date(selectedBill.date).toLocaleString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  }) : 'N/A';

  // Cashier details
  const cashier = selectedBill.cashier || {};
  const cashierId = cashier.cashierId || 'N/A';
  const cashierName = cashier.cashierName || 'N/A';
  const counterNum = cashier.counterNum || 'N/A';
  const cashierContact = cashier.contactNumber || 'N/A';

  // Customer details
  const customer = selectedBill.customer || {};
  const customerId = customer.id || customer._id || 'N/A';
  const customerName = customer.name || 'N/A';
  const customerContact = customer.contact || 'N/A';
  const customerAadhaar = customer.aadhaar || customer.aadhar || 'N/A';
  const customerLocation = customer.location || 'N/A';

  // Bill summary
  const productSubtotal = selectedBill.productSubtotal?.toFixed(2) || '0.00';
  const transportCharge = selectedBill.transportCharge?.toFixed(2) || '0.00';
  const currentBillTotal = selectedBill.currentBillTotal?.toFixed(2) || '0.00';
  const grandTotal = selectedBill.grandTotal?.toFixed(2) || '0.00';
  const paidAmount = selectedBill.paidAmount?.toFixed(2) || '0.00';
  const unpaidAmount = selectedBill.unpaidAmountForThisBill?.toFixed(2) || '0.00';
  const paymentMethod = selectedBill.paymentMethod || 'N/A';

  // Products
  const products = selectedBill.products || [];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-lg font-medium text-gray-900">Bill Details</h3>
              <div className="text-sm text-gray-500 mt-1">
                <span className="font-medium">Bill ID:</span> {billNumber} |
                <span className="font-medium ml-2">Date:</span> {billDate}
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Cashier Details */}
            <div>
              <h4 className="text-sm font-medium text-gray-500 mb-2">Cashier Details</h4>
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <p className="text-xs text-gray-500">Cashier ID</p>
                    <p className="text-sm font-medium">{cashierId}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Name</p>
                    <p className="text-sm font-medium">{cashierName}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Counter</p>
                    <p className="text-sm font-medium">{counterNum}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Contact</p>
                    <p className="text-sm font-medium">{cashierContact}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Customer Details */}
            <div>
              <h4 className="text-sm font-medium text-gray-500 mb-2">Customer Details</h4>
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <p className="text-xs text-gray-500">Customer ID</p>
                    <p className="text-sm font-medium">{customerId}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Name</p>
                    <p className="text-sm font-medium">{customerName}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Contact</p>
                    <p className="text-sm font-medium">{customerContact}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Aadhaar</p>
                    <p className="text-sm font-medium">{customerAadhaar}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-xs text-gray-500">Location</p>
                    <p className="text-sm font-medium">{customerLocation}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Order Summary */}
          <div className="mt-6">
            <h4 className="text-sm font-medium text-gray-500 mb-2">Order Summary</h4>
            <div className="bg-gray-50 p-4 rounded-lg grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-xs text-gray-500">Product Subtotal</p>
                <p className="text-sm font-medium">₹ {productSubtotal}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Transport Charge</p>
                <p className="text-sm font-medium">₹ {transportCharge}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Bill Total</p>
                <p className="text-sm font-medium">₹ {currentBillTotal}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Grand Total</p>
                <p className="text-sm font-medium">₹ {grandTotal}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Paid Amount</p>
                <p className="text-sm font-medium text-green-600">₹ {paidAmount}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Unpaid Amount</p>
                <p className="text-sm font-medium text-red-600">₹ {unpaidAmount}</p>
              </div>
              <div className="col-span-2">
                <p className="text-xs text-gray-500">Payment Method</p>
                <p className="text-sm font-medium">{paymentMethod}</p>
              </div>
            </div>
          </div>

          {/* Products Purchased */}
          <div className="mt-6">
            <h4 className="text-sm font-medium text-gray-500 mb-2">Products Purchased ({products.length})</h4>
            <div className="border rounded-lg overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">MRP</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Qty</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Unit</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">GST</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {products.map((product, index) => (
                    <tr key={index}>
                      <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                        {product.name || 'Unnamed Product'}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                        ₹ {product.mrpPrice?.toFixed(2) || '0.00'}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                        ₹ {product.price?.toFixed(2) || '0.00'}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                        {product.quantity || 0}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                        {product.unit || 'N/A'}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                        {product.gst || 0}%
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm font-medium">
                        ₹ {((product.price || 0) * (product.quantity || 0)).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="mt-6 flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const BillingInvoices = () => {
  const [bills, setBills] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedBill, setSelectedBill] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredBills, setFilteredBills] = useState([]);

  useEffect(() => {
    const fetchBills = async () => {
      try {
        setIsLoading(true);
        const { data } = await api.get('/bills');
        setBills(data);
        setFilteredBills(data);
      } catch (error) {
        if (axios.isAxiosError(error)) {
          console.error('Error fetching bills:',
            error.response?.data?.message || error.message);
        } else {
          console.error('Unexpected error:', error);
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchBills();
  }, []);

  useEffect(() => {
    const lowerCaseSearchTerm = searchTerm.toLowerCase();
    const currentFilteredBills = bills.filter(bill => {
      const customerName = bill.customer?.name ? bill.customer.name.toLowerCase() : '';
      const customerId = bill.customer?.id ? bill.customer.id.toString().toLowerCase() : '';
      const customerContact = bill.customer?.contact ? bill.customer.contact.toLowerCase() : '';
      const billIdLastSix = bill._id ? bill._id.substring(bill._id.length - 6).toLowerCase() : '';
      const billNumber = bill.billNumber ? bill.billNumber.toLowerCase() : '';

      return (
        customerName.includes(lowerCaseSearchTerm) ||
        customerId.includes(lowerCaseSearchTerm) ||
        customerContact.includes(lowerCaseSearchTerm) ||
        billIdLastSix.includes(lowerCaseSearchTerm) ||
        billNumber.includes(lowerCaseSearchTerm)
      );
    });
    setFilteredBills(currentFilteredBills);
  }, [searchTerm, bills]);

  const openProductDetails = (bill) => {
    setSelectedBill(bill);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedBill(null);
  };

  return (
    <div className="font-sans text-gray-900 min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto  ">
        {/* Header Section */}
        <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-10 py-3">
          <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 px-2">
            <h1 className="text-xl md:text-xl font-semibold text-gray-700  bg-blue-100 px-2 py-1 rounded-md">
              Product Sales Bill
            </h1>

            <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
              <div className="relative flex-grow max-w-2xl">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm shadow-sm transition duration-150"
                  placeholder="Search ID, Bill No, Customer"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              <div className="flex items-center justify-between sm:justify-end gap-4">
                <span className="text-sm text-gray-600 whitespace-nowrap">
                  {filteredBills.length} {filteredBills.length === 1 ? 'Bill' : 'Bills'}
                </span>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="py-6 px-4 ">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-64 gap-4">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
              <p className="text-lg text-gray-600">Loading bills...</p>
            </div>
          ) : filteredBills.length === 0 && !searchTerm ? (
            <div className="bg-white rounded-xl shadow-sm p-8 text-center border border-gray-200 max-w-2xl mx-auto ">
              <svg className="mx-auto h-16 w-16 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h3 className="mt-4 text-base font-semibold text-gray-800">No bills found</h3>
              <p className="mt-2 text-gray-500 text-sm">It looks like no bills have been created yet.</p>              
            </div>
          ) : filteredBills.length === 0 && searchTerm ? (
            <div className="bg-white rounded-xl shadow-sm p-8 text-center border border-gray-200 max-w-2xl mx-auto">
              <svg className="mx-auto h-16 w-16 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h3 className="mt-4 text-xl font-semibold text-gray-800">No matching bills found</h3>
              <p className="mt-2 text-gray-500">Try adjusting your search term or filters.</p>
              <button
                onClick={() => setSearchTerm('')}
                className="mt-4 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors duration-200 text-sm font-medium"
              >
                Clear Search
              </button>
            </div>
          ) : (
            <div className="bg-white shadow-sm rounded-xl overflow-hidden border border-gray-200">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bill ID</th>
                      <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                      <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">Contact</th>
                      <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">Items</th>
                      <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                      <th className="px-4 sm:px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                      <th className="px-4 sm:px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-100">
                    {filteredBills.map((bill) => {
                      const billTotal = bill.grandTotal ? bill.grandTotal.toFixed(2) : '0.00';
                      const customerInitial = bill.customer?.name ? bill.customer.name.charAt(0).toUpperCase() : 'N/A';
                      const customerName = bill.customer?.name || 'N/A';
                      const customerContact = bill.customer?.contact || 'N/A';
                      const billDate = bill.date ? new Date(bill.date).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric'
                      }) : 'N/A';

                      return (
                        <tr key={bill._id} className="hover:bg-gray-50 transition-colors duration-150">
                          <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {bill.billNumber || (bill._id ? bill._id.substring(bill._id.length - 6) : 'N/A')}
                            </div>
                          </td>
                          <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-9 w-9 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-medium text-sm">
                                {customerInitial}
                              </div>
                              <div className="ml-3">
                                <div className="text-sm font-medium text-gray-900 truncate max-w-[120px] sm:max-w-none">
                                  {customerName}
                                </div>
                                <div className="text-xs text-gray-500 sm:hidden">{customerContact}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500 hidden sm:table-cell">
                            {customerContact}
                          </td>
                          <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500 hidden md:table-cell">
                            <div className="flex items-center">
                              <span className="mr-1">{bill.products?.length || 0}</span>
                              <span className="text-gray-400">items</span>
                            </div>
                          </td>
                          <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {billDate}
                          </td>
                          <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-right text-sm font-medium text-gray-900">
                            ₹ {billTotal}
                          </td>
                          <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <button
                              onClick={() => openProductDetails(bill)}
                              className="text-blue-600 hover:text-blue-800 font-medium transition-colors duration-200 px-3 py-1 rounded-md hover:bg-blue-50"
                            >
                              View
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </main>

        {isModalOpen && (
          <ProductDetailsModal
            selectedBill={selectedBill}
            onClose={closeModal}
          />
        )}
      </div>
    </div>
  );
};

export default BillingInvoices;