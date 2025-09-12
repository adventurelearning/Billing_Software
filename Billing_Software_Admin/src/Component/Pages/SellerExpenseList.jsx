import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../service/api';
import Swal from 'sweetalert2';

const SellerExpenseList = () => {
    const [sellerData, setSellerData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [expandedSellers, setExpandedSellers] = useState({});
    const [searchTerm, setSearchTerm] = useState('');
    const [sortConfig, setSortConfig] = useState({ key: 'supplierName', direction: 'asc' });
    const [dateRange, setDateRange] = useState({ start: '', end: '' });
    const [paymentStatus, setPaymentStatus] = useState({});
    const [currentPage, setCurrentPage] = useState(1);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [currentSellerKey, setCurrentSellerKey] = useState('');
    const [paymentAmount, setPaymentAmount] = useState('');
    const [paymentNotes, setPaymentNotes] = useState('');
    const [paymentHistory, setPaymentHistory] = useState({});
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [showProductHistory, setShowProductHistory] = useState(false);
    const itemsPerPage = 10;

    const navigate = useNavigate();

    useEffect(() => {
        const fetchSellerExpenses = async () => {
            try {
                setLoading(true);
                const params = new URLSearchParams();
                if (dateRange.start) params.append('startDate', dateRange.start);
                if (dateRange.end) params.append('endDate', dateRange.end);

                const response = await api.get(`/products/seller-expenses?${params.toString()}`);
                setSellerData(response.data);
                setLoading(false);
            } catch (err) {
                setError(err.response?.data?.message || 'Failed to fetch seller expenses');
                setLoading(false);
            }
        };

        const savedPaymentStatus = localStorage.getItem('sellerPaymentStatus');
        if (savedPaymentStatus) {
            setPaymentStatus(JSON.parse(savedPaymentStatus));
        }

        const savedPaymentHistory = localStorage.getItem('sellerPaymentHistory');
        if (savedPaymentHistory) {
            setPaymentHistory(JSON.parse(savedPaymentHistory));
        }

        fetchSellerExpenses();
    }, [dateRange]);

    useEffect(() => {
        // When seller data changes, update payment status for any changed totals
        const updatedStatus = { ...paymentStatus };
        let needsUpdate = false;

        sellerData.forEach(sellerGroup => {
            const sellerKey = `${sellerGroup.supplierName}-${sellerGroup.batchNumber}`;
            const currentTotal = parseFloat(calculateTotalAmount(sellerGroup.products));
            
            if (updatedStatus[sellerKey] && updatedStatus[sellerKey].totalAmount !== currentTotal) {
                updatedStatus[sellerKey] = {
                    ...updatedStatus[sellerKey],
                    balanceAmount: currentTotal - updatedStatus[sellerKey].paidAmount,
                    totalAmount: currentTotal
                };
                needsUpdate = true;
            }
        });

        if (needsUpdate) {
            setPaymentStatus(updatedStatus);
            localStorage.setItem('sellerPaymentStatus', JSON.stringify(updatedStatus));
        }
    }, [sellerData]);

    const toggleSellerDetails = (sellerKey) => {
        setExpandedSellers(prev => ({
            ...prev,
            [sellerKey]: !prev[sellerKey]
        }));
    };

    const requestSort = (key) => {
        let direction = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const sortedData = React.useMemo(() => {
        let sortableData = [...sellerData];
        if (sortConfig.key) {
            sortableData.sort((a, b) => {
                if (a[sortConfig.key] < b[sortConfig.key]) {
                    return sortConfig.direction === 'asc' ? -1 : 1;
                }
                if (a[sortConfig.key] > b[sortConfig.key]) {
                    return sortConfig.direction === 'asc' ? 1 : -1;
                }
                return 0;
            });
        }
        return sortableData;
    }, [sellerData, sortConfig]);

    const filteredSellers = sortedData.filter(seller =>
        seller.supplierName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        seller.batchNumber.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const paginatedSellers = filteredSellers.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    const calculateTotalAmount = (products) => {
        return products.reduce((total, product) => {
            return total + (product.sellerPrice * product.addedStock);
        }, 0).toFixed(2);
    };

    const calculateTotalProfit = (products) => {
        return products.reduce((total, product) => {
            return total + (product.totalProfit || 0);
        }, 0).toFixed(2);
    };

    const openPaymentModal = (sellerKey) => {
        setCurrentSellerKey(sellerKey);
        const sellerPayment = paymentStatus[sellerKey] || {};
        setPaymentAmount('');
        setPaymentNotes('');
        setShowPaymentModal(true);
    };

    const handlePaymentSubmit = () => {
        if (!currentSellerKey) return;

        const seller = filteredSellers.find(seller => 
            `${seller.supplierName}-${seller.batchNumber}` === currentSellerKey
        );
        
        if (!seller) return;

        const totalAmount = parseFloat(calculateTotalAmount(seller.products));
        const paidAmount = parseFloat(paymentAmount) || 0;
        
        if (paidAmount <= 0) {
            Swal.fire('Error', 'Payment amount must be greater than 0', 'error');
            return;
        }

        const existingPayment = paymentStatus[currentSellerKey] || {
            paidAmount: 0,
            balanceAmount: totalAmount,
            payments: []
        };
        
        // Calculate maximum allowed payment
        const maxAllowedPayment = existingPayment.balanceAmount;
        
        if (paidAmount > maxAllowedPayment) {
            Swal.fire('Error', `Payment amount cannot exceed the balance of ${formatCurrency(maxAllowedPayment)}`, 'error');
            return;
        }

        const newPaidAmount = existingPayment.paidAmount + paidAmount;
        const newBalanceAmount = totalAmount - newPaidAmount;
        const isFullyPaid = newBalanceAmount <= 0;

        const paymentRecord = {
            amount: paidAmount,
            date: new Date().toISOString(),
            notes: paymentNotes
        };

        const newStatus = { 
            ...paymentStatus, 
            [currentSellerKey]: {
                isPaid: isFullyPaid,
                paidAmount: newPaidAmount,
                balanceAmount: newBalanceAmount,
                lastPaymentDate: new Date().toISOString(),
                payments: [...(existingPayment.payments || []), paymentRecord],
                totalAmount: totalAmount
            }
        };

        const newPaymentHistory = {
            ...paymentHistory,
            [currentSellerKey]: [
                ...(paymentHistory[currentSellerKey] || []),
                paymentRecord
            ]
        };

        setPaymentStatus(newStatus);
        setPaymentHistory(newPaymentHistory);
        localStorage.setItem('sellerPaymentStatus', JSON.stringify(newStatus));
        localStorage.setItem('sellerPaymentHistory', JSON.stringify(newPaymentHistory));
        setShowPaymentModal(false);

        Swal.fire(
            'Payment Recorded',
            `Payment of ₹${paidAmount.toFixed(2)} has been recorded. ${isFullyPaid ? 'Full payment completed.' : `Balance: ₹${newBalanceAmount.toFixed(2)}`}`,
            'success'
        );
    };

    const handleUnpaid = (sellerKey) => {
        Swal.fire({
            title: 'Confirm Unpaid Status',
            text: 'Are you sure you want to mark this seller as unpaid? This will reset all payment records.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Yes, mark as unpaid'
        }).then((result) => {
            if (result.isConfirmed) {
                const newStatus = { ...paymentStatus };
                delete newStatus[sellerKey];
                setPaymentStatus(newStatus);
                localStorage.setItem('sellerPaymentStatus', JSON.stringify(newStatus));

                const newHistory = { ...paymentHistory };
                delete newHistory[sellerKey];
                setPaymentHistory(newHistory);
                localStorage.setItem('sellerPaymentHistory', JSON.stringify(newHistory));

                Swal.fire(
                    'Marked as Unpaid',
                    'The seller has been marked as unpaid and payment records have been cleared.',
                    'success'
                );
            }
        });
    };

    const exportToCSV = () => {
        const headers = [
            'Supplier Name', 'Batch Number', 'Product Code', 'Product Name',
            'Quantity', 'Unit', 'Cost Price', 'MRP', 'Profit', 'Added Date', 
            'Payment Status', 'Paid Amount', 'Balance Amount', 'Payment History'
        ];

        const csvData = [
            headers.join(','),
            ...filteredSellers.flatMap(seller => {
                const sellerKey = `${seller.supplierName}-${seller.batchNumber}`;
                const payment = paymentStatus[sellerKey] || {};
                const history = paymentHistory[sellerKey] || [];
                
                return seller.products.map(product => [
                    `"${seller.supplierName}"`,
                    `"${seller.batchNumber}"`,
                    `"${product.productCode}"`,
                    `"${product.productName}"`,
                    product.addedStock,
                    `"${product.baseUnit}"`,
                    product.sellerPrice,
                    product.mrp,
                    (product.totalProfit || 0),
                    `"${formatDate(product.createdAt)}"`,
                    payment.isPaid ? 'Paid' : payment.paidAmount ? `Partially Paid (${payment.paidAmount})` : 'Unpaid',
                    payment.paidAmount || 0,
                    payment.balanceAmount || calculateTotalAmount(seller.products),
                    `"${history.map(p => `${formatDate(p.date)}: ₹${p.amount}${p.notes ? ` (${p.notes})` : ''}`).join('; ')}"`
                ].join(','));
            }).join('\n')];

        const blob = new Blob([csvData], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `seller-expenses-${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
    };

    const viewProductHistory = async (product) => {
        try {
            // Fetch the full product details with history
            const response = await api.get(`/products/code/${product.productCode}`);
            setSelectedProduct(response.data);
            setShowProductHistory(true);
        } catch (err) {
            console.error('Error fetching product history:', err);
            Swal.fire('Error', 'Failed to fetch product history', 'error');
        }
    };

    const LoadingSkeleton = () => (
        <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
                <div key={i} className="bg-gray-100 rounded-lg p-4 animate-pulse">
                    <div className="flex justify-between">
                        <div className="h-6 w-1/3 bg-gray-300 rounded"></div>
                        <div className="h-6 w-1/4 bg-gray-300 rounded"></div>
                    </div>
                </div>
            ))}
        </div>
    );

    const EmptyState = () => (
        <div className="text-center py-12">
            <svg
                className="mx-auto h-24 w-24 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
            >
                <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1}
                    d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                ></path>
            </svg>
            <h3 className="mt-2 text-lg font-medium text-gray-900">No seller expenses found</h3>
            <p className="mt-1 text-sm text-gray-500">
                Try adjusting your search or filter to find what you're looking for.
            </p>
        </div>
    );

    const SortIndicator = ({ columnKey }) => {
        if (sortConfig.key !== columnKey) return null;
        return (
            <span className="ml-1">
                {sortConfig.direction === 'asc' ? '↑' : '↓'}
            </span>
        );
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
    };

    const formatDateTime = (dateString) => {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            minimumFractionDigits: 2
        }).format(amount);
    };

    if (loading) return <LoadingSkeleton />;

    if (error) {
        return (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
                <strong className="font-bold">Error!</strong>
                <span className="block sm:inline"> {error}</span>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-2 py-2">
            {/* Payment Modal */}
            {showPaymentModal && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
                        <h3 className="text-lg font-semibold mb-4">Record Payment</h3>
                        
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Total Amount: 
                                <span className="ml-2 font-semibold">
                                    {formatCurrency(
                                        calculateTotalAmount(
                                            filteredSellers.find(seller => 
                                                `${seller.supplierName}-${seller.batchNumber}` === currentSellerKey
                                            ).products)
                                        )
                                    }
                                </span>
                            </label>
                        </div>

                        {paymentStatus[currentSellerKey]?.paidAmount > 0 && (
                            <div className="mb-3 p-3 bg-blue-50 rounded-md">
                                <p className="text-sm text-blue-700">
                                    Already Paid: {formatCurrency(paymentStatus[currentSellerKey].paidAmount)}
                                </p>
                                <p className="text-sm text-blue-700">
                                    Balance: {formatCurrency(paymentStatus[currentSellerKey].balanceAmount)}
                                </p>
                            </div>
                        )}
                        
                        <div className="mb-4">
                            <label htmlFor="paymentAmount" className="block text-sm font-medium text-gray-700 mb-1">
                                Amount to Pay
                            </label>
                            <input
                                type="number"
                                id="paymentAmount"
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                value={paymentAmount}
                                onChange={(e) => {
                                    const maxAmount = paymentStatus[currentSellerKey]?.balanceAmount || 
                                        calculateTotalAmount(
                                            filteredSellers.find(seller => 
                                                `${seller.supplierName}-${seller.batchNumber}` === currentSellerKey
                                            ).products
                                        );
                                    const enteredAmount = parseFloat(e.target.value);
                                    
                                    if (enteredAmount > maxAmount) {
                                        setPaymentAmount(maxAmount);
                                    } else if (e.target.value === '') {
                                        setPaymentAmount('');
                                    } else if (!isNaN(enteredAmount)) {
                                        setPaymentAmount(enteredAmount);
                                    }
                                }}
                                placeholder="Enter amount"
                                max={paymentStatus[currentSellerKey]?.balanceAmount || 
                                    calculateTotalAmount(
                                        filteredSellers.find(seller => 
                                            `${seller.supplierName}-${seller.batchNumber}` === currentSellerKey
                                        ).products
                                    )}
                            />
                            <p className="text-xs text-gray-500 mt-1">
                                Maximum payable: {formatCurrency(
                                    paymentStatus[currentSellerKey]?.balanceAmount || 
                                    calculateTotalAmount(
                                        filteredSellers.find(seller => 
                                            `${seller.supplierName}-${seller.batchNumber}` === currentSellerKey
                                        ).products
                                    )
                                )}
                            </p>
                        </div>
                        
                        <div className="mb-4">
                            <label htmlFor="paymentNotes" className="block text-sm font-medium text-gray-700 mb-1">
                                Notes (Optional)
                            </label>
                            <textarea
                                id="paymentNotes"
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                value={paymentNotes}
                                onChange={(e) => setPaymentNotes(e.target.value)}
                                rows="3"
                                placeholder="Payment reference or notes..."
                            />
                        </div>
                        
                        <div className="flex justify-end space-x-3">
                            <button
                                onClick={() => setShowPaymentModal(false)}
                                className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handlePaymentSubmit}
                                disabled={!paymentAmount || parseFloat(paymentAmount) <= 0}
                                className={`px-4 py-2 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                                    !paymentAmount || parseFloat(paymentAmount) <= 0 
                                        ? 'bg-blue-400 cursor-not-allowed' 
                                        : 'bg-blue-600 hover:bg-blue-700'
                                }`}
                            >
                                Record Payment
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Product History Modal */}
            {showProductHistory && selectedProduct && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full p-6 max-h-screen overflow-y-auto">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-semibold">
                                Product History - {selectedProduct.productName}
                            </h3>
                            <button
                                onClick={() => setShowProductHistory(false)}
                                className="text-gray-500 hover:text-gray-700"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <div className="mb-4">
                            <p className="text-sm text-gray-600">
                                Product Code: {selectedProduct.productCode} | 
                                Category: {selectedProduct.category} | 
                                Base Unit: {selectedProduct.baseUnit}
                            </p>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Date & Time
                                        </th>
                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Stock Qty
                                        </th>
                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Seller Price
                                        </th>
                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            MRP
                                        </th>
                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Profit/Unit
                                        </th>
                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Mfg Date
                                        </th>
                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Expiry Date
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {selectedProduct.history && selectedProduct.history.map((historyItem, index) => (
                                        <tr key={index} className="hover:bg-gray-50">
                                            <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                                                {formatDateTime(historyItem.timestamp)}
                                            </td>
                                            <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                                                {historyItem.stockQuantity}
                                            </td>
                                            <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                                                {formatCurrency(historyItem.sellerPrice || 0)}
                                            </td>
                                            <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                                                {formatCurrency(historyItem.mrp || 0)}
                                            </td>
                                            <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                                                {formatCurrency((historyItem.mrp || 0) - (historyItem.sellerPrice || 0))}
                                            </td>
                                            <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                                                {formatDate(historyItem.manufactureDate)}
                                            </td>
                                            <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                                                {formatDate(historyItem.expiryDate)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
                <h1 className="inline-block text-lg md:text-xl font-semibold text-gray-700 whitespace-nowrap bg-blue-100 px-3 py-1 rounded-md">Seller Expense Management</h1>

                <div className="flex flex-col md:flex-row md:items-center space-y-2 md:space-y-0 md:space-x-4">
                    <div className="relative w-full md:w-64">
                        <input
                            type="text"
                            placeholder="Search by seller or batch..."
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        <svg
                            className="absolute right-3 top-3 h-5 w-5 text-gray-400"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                            xmlns="http://www.w3.org/2000/svg"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                            />
                        </svg>
                    </div>
                </div>
            </div>

            <div className="flex flex-col md:flex-row md:items-center space-y-2 md:space-y-0 md:space-x-4 mb-4">
                <div className="flex items-center">
                    <label htmlFor="startDate" className="mr-2 text-sm text-gray-600">From:</label>
                    <input
                        type="date"
                        id="startDate"
                        className="px-3 py-2 border border-gray-300 rounded-md"
                        value={dateRange.start}
                        onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                    />
                </div>
                <div className="flex items-center">
                    <label htmlFor="endDate" className="mr-2 text-sm text-gray-600">To:</label>
                    <input
                        type="date"
                        id="endDate"
                        className="px-3 py-2 border border-gray-300 rounded-md"
                        value={dateRange.end}
                        onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                    />
                </div>
                <button
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                    onClick={() => setCurrentPage(1)}
                >
                    Apply Filter
                </button>
            </div>

            {filteredSellers.length === 0 ? (
                <EmptyState />
            ) : (
                <div className="space-y-4">
                    {paginatedSellers.map((sellerGroup) => {
                        const sellerKey = `${sellerGroup.supplierName}-${sellerGroup.batchNumber}`;
                        const isExpanded = expandedSellers[sellerKey];
                        const totalAmount = calculateTotalAmount(sellerGroup.products);
                        const totalProfit = calculateTotalProfit(sellerGroup.products);
                        const paymentInfo = paymentStatus[sellerKey] || {};
                        const history = paymentHistory[sellerKey] || [];
                        const currentTotalAmount = parseFloat(totalAmount);
                        
                        // Calculate balance based on current total amount and payments made
                        const balanceAmount = paymentInfo.totalAmount !== undefined && paymentInfo.totalAmount !== currentTotalAmount
                            ? currentTotalAmount - (paymentInfo.paidAmount || 0)
                            : paymentInfo.balanceAmount || (currentTotalAmount - (paymentInfo.paidAmount || 0));

                        return (
                            <div key={sellerKey} className="bg-white rounded-lg shadow overflow-hidden">
                                <div
                                    className="flex justify-between items-center p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                                    onClick={() => toggleSellerDetails(sellerKey)}
                                >
                                    <div className="flex items-center space-x-4">
                                        <div className={`w-3 h-3 rounded-full ${parseFloat(totalAmount) > 10000 ? 'bg-red-500' :
                                            parseFloat(totalAmount) > 5000 ? 'bg-yellow-500' : 'bg-green-500'
                                            }`}></div>
                                        <div>
                                            <h3 className="font-semibold text-lg text-gray-800">{sellerGroup.supplierName}</h3>
                                            <p className="text-sm text-gray-600">Batch: {sellerGroup.batchNumber}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center space-x-4">
                                        <div className="text-right">
                                            <p className="font-medium text-gray-800">₹{totalAmount}</p>
                                            <p className="text-sm text-gray-600">
                                                {sellerGroup.products.length} items | Profit: ₹{totalProfit}
                                            </p>
                                        </div>
                                        <svg
                                            className={`h-5 w-5 text-gray-500 transform transition-transform ${isExpanded ? 'rotate-180' : ''
                                                }`}
                                            fill="none"
                                            viewBox="0 0 24 24"
                                            stroke="currentColor"
                                        >
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                        </svg>
                                    </div>
                                </div>

                                {isExpanded && (
                                    <div className="border-t border-gray-200">
                                        <div className="overflow-x-auto">
                                            <table className="min-w-full divide-y divide-gray-200">
                                                <thead className="bg-gray-50">
                                                    <tr>
                                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                            Product
                                                        </th>
                                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                            Code
                                                        </th>
                                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                            Category
                                                        </th>
                                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                            Qty
                                                        </th>
                                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                            Cost
                                                        </th>
                                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                            Sales Price
                                                        </th>
                                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                            Profit
                                                        </th>
                                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                            Added
                                                        </th>
                                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                            Mfg
                                                        </th>
                                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                            Expiry
                                                        </th>
                                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                            Actions
                                                        </th>
                                                    </tr>
                                                </thead>
                                                <tbody className="bg-white divide-y divide-gray-200">
                                                    {sellerGroup.products.map((product) => {
                                                        const profitPerUnit = (product.mrp - product.sellerPrice) || 0;
                                                        const totalSellerPrice = (product.sellerPrice * product.addedStock).toFixed(2);
                                                        const totalSalesPrice = (product.mrp * product.addedStock).toFixed(2);
                                                        const totalProfit = (product.totalProfit || (profitPerUnit * product.addedStock)).toFixed(2);

                                                        return (
                                                            <tr key={`${product._id}-${product.addedStock}`} className="hover:bg-gray-50">
                                                                <td className="px-6 py-4 whitespace-nowrap">
                                                                    <div className="text-sm font-medium text-gray-900">
                                                                        {product.productName}
                                                                    </div>
                                                                </td>
                                                                <td className="px-6 py-4 whitespace-nowrap">
                                                                    <div className="text-sm text-gray-900">{product.productCode}</div>
                                                                </td>
                                                                <td className="px-6 py-4 whitespace-nowrap">
                                                                    <div className="text-sm text-gray-900">
                                                                        {product.category}
                                                                    </div>
                                                                </td>
                                                                <td className="px-6 py-4 whitespace-nowrap">
                                                                    <div className="text-sm text-gray-900">
                                                                        <span className="font-medium">{product.addedStock}</span> {product.baseUnit}
                                                                    </div>
                                                                </td>
                                                                <td className="px-6 py-4 whitespace-nowrap">
                                                                    <div className="text-sm text-gray-900">
                                                                        ₹{totalSellerPrice}
                                                                    </div>
                                                                </td>
                                                                <td className="px-6 py-4 whitespace-nowrap">
                                                                    <div className="text-sm text-gray-900">
                                                                        ₹{totalSalesPrice}
                                                                    </div>
                                                                </td>
                                                                <td className="px-6 py-4 whitespace-nowrap">
                                                                    <div className={`text-sm font-medium ${totalProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                                        ₹{totalProfit}
                                                                    </div>
                                                                </td>
                                                                <td className="px-6 py-4 whitespace-nowrap">
                                                                    <div className="text-sm text-gray-900">
                                                                        {formatDate(product.timestamp)}
                                                                    </div>
                                                                </td>
                                                                <td className="px-6 py-4 whitespace-nowrap">
                                                                    <div className="text-sm text-gray-900">
                                                                        {formatDate(product.manufactureDate)}
                                                                    </div>
                                                                </td>
                                                                <td className="px-6 py-4 whitespace-nowrap">
                                                                    <div className="text-sm text-gray-900">
                                                                        {formatDate(product.expiryDate)}
                                                                    </div>
                                                                </td>
                                                                <td className="px-6 py-4 whitespace-nowrap">
                                                                    <button
                                                                        onClick={() => viewProductHistory(product)}
                                                                        className="px-3 py-1 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200"
                                                                    >
                                                                        History
                                                                    </button>
                                                                </td>
                                                            </tr>
                                                        );
                                                    })}
                                                </tbody>
                                                <tfoot className="bg-gray-50">
                                                    <tr>
                                                        <td colSpan="3" className="px-6 py-3 text-right text-sm font-medium text-gray-500">
                                                            Total
                                                        </td>
                                                        <td className="px-6 py-3 text-sm text-gray-900">
                                                            {sellerGroup.products.reduce((sum, p) => sum + p.addedStock, 0)}
                                                        </td>
                                                        <td className="px-6 py-3 text-sm font-semibold text-gray-900">
                                                            ₹{totalAmount}
                                                        </td>
                                                        <td></td>
                                                        <td className="px-6 py-3 text-sm font-semibold text-green-600">
                                                            ₹{totalProfit}
                                                        </td>
                                                        <td colSpan="4"></td>
                                                    </tr>
                                                </tfoot>
                                            </table>
                                        </div>

                                        {/* Payment History Section */}
                                        {history.length > 0 && (
                                            <div className="px-6 py-4 border-t border-gray-200">
                                                <h4 className="font-medium text-gray-700 mb-2">Payment History</h4>
                                                <div className="overflow-x-auto">
                                                    <table className="min-w-full divide-y divide-gray-200">
                                                        <thead className="bg-gray-50">
                                                            <tr>
                                                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                                                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                                                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Notes</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody className="bg-white divide-y divide-gray-200">
                                                            {history.map((payment, index) => (
                                                                <tr key={index}>
                                                                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                                                                        {formatDateTime(payment.date)}
                                                                    </td>
                                                                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                                                                        ₹{payment.amount.toFixed(2)}
                                                                    </td>
                                                                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                                                                        {payment.notes || '-'}
                                                                    </td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </div>
                                        )}

                                        <div className="px-6 py-3 bg-gray-50 border-t border-gray-200 flex justify-between items-center">
                                            <div className="text-sm text-gray-500">
                                                {balanceAmount > 0 && (
                                                    <span className="ml-4 text-red-600">
                                                        Balance: ₹{Math.max(balanceAmount, 0).toFixed(2)}
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex space-x-2">
                                                {paymentInfo.isPaid ? (
                                                    <>
                                                        <button
                                                            className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-md"
                                                            disabled
                                                        >
                                                            Paid
                                                        </button>
                                                        <button
                                                            onClick={() => handleUnpaid(sellerKey)}
                                                            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-md"
                                                        >
                                                            Mark as Unpaid
                                                        </button>
                                                    </>
                                                ) : (
                                                    <>
                                                        <button
                                                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                            onClick={() => openPaymentModal(sellerKey)}
                                                        >
                                                            {paymentInfo.paidAmount ? 'Add Payment' : 'Make Payment'}
                                                        </button>
                                                        {paymentInfo.paidAmount && (
                                                            <button
                                                                className="px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white text-sm font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500"
                                                                disabled
                                                            >
                                                                Partially Paid
                                                            </button>
                                                        )}
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            {filteredSellers.length > itemsPerPage && (
                <div className="flex justify-center mt-6">
                    <nav className="inline-flex rounded-md shadow">
                        <button
                            onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
                            disabled={currentPage === 1}
                            className="px-3 py-2 rounded-l-md border border-gray-300 bg-white text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                        >
                            Previous
                        </button>
                        {Array.from({ length: Math.ceil(filteredSellers.length / itemsPerPage) }).map((_, i) => (
                            <button
                                key={i}
                                onClick={() => setCurrentPage(i + 1)}
                                className={`px-3 py-2 border-t border-b border-gray-300 ${currentPage === i + 1 ? 'bg-blue-50 text-blue-600' : 'bg-white text-gray-500 hover:bg-gray-50'
                                    }`}
                            >
                                {i + 1}
                            </button>
                        ))}
                        <button
                            onClick={() => setCurrentPage(p => Math.min(p + 1, Math.ceil(filteredSellers.length / itemsPerPage)))}
                            disabled={currentPage === Math.ceil(filteredSellers.length / itemsPerPage)}
                            className="px-3 py-2 rounded-r-md border border-gray-300 bg-white text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                        >
                            Next
                        </button>
                    </nav>
                </div>
            )}
        </div>
    );
};

export default SellerExpenseList;