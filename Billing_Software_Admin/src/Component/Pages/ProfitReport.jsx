import React, { useState, useEffect } from 'react';
import api from '../../service/api';

const ProfitReport = () => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [showHistoryModal, setShowHistoryModal] = useState(false);

    // Calculate total profit for all products
    const calculateTotalProfit = () => {
        return products.reduce((total, product) => {
            const historyProfit = calculateTotalHistoryProfit(product.history || []);
            return total + historyProfit;
        }, 0);
    };

    // Calculate total profit from all history entries for a product
    const calculateTotalHistoryProfit = (history) => {
        return history.reduce((total, entry) => {
            const profitPerUnit = (entry.mrp || 0) - (entry.sellerPrice || 0);
            return total + (profitPerUnit * (entry.stockQuantity || 0));
        }, 0);
    };

    const fetchProducts = async () => {
        try {
            setLoading(true);
            const response = await api.get('/products');
            setProducts(response.data);
            setLoading(false);
        } catch (err) {
            console.error('Error fetching products:', err);
            setError(err.message);
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProducts();
    }, []);

    const openHistoryModal = (product) => {
        setSelectedProduct(product);
        setShowHistoryModal(true);
    };

    const closeHistoryModal = () => {
        setShowHistoryModal(false);
        setSelectedProduct(null);
    };

    if (loading) return <div className="p-4">Loading...</div>;
    if (error) return <div className="p-4 text-red-500">Error: {error}</div>;

    return (
        <div className="font-sans text-gray-900 min-h-screen bg-gray-50">
            <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-2">
                    <div className="flex justify-between items-center mb-2 md:mb-0 py-2">
                        <h1 className="text-lg md:text-xl font-semibold text-gray-700 whitespace-nowrap bg-blue-100 p-2 rounded-md">
                            Profit Report
                        </h1>
                    </div>
                </div>
            </header>

            {/* Summary Card */}
            <div className="p-4 m-4">
                <div className="bg-purple-100 p-4 rounded-lg shadow">
                    <h3 className="text-lg font-semibold">Total Profit</h3>
                    <p className="text-2xl font-bold">₹{calculateTotalProfit().toFixed(2)}</p>
                </div>
            </div>

            {/* Products Table */}
            <div className="p-4 m-4 bg-white rounded-lg shadow">
                <h3 className="text-lg font-semibold mb-4">Product Profit Summary</h3>
                <div className="overflow-x-auto">
                    <table className="min-w-full bg-white border border-gray-200">
                        <thead>
                            <tr className="bg-gray-100 text-base font-normal">
                                <th className="py-2 px-4 border">Code</th>
                                <th className="py-2 px-4 border">Product Name</th>
                                <th className="py-2 px-4 border">Stock Qty</th>
                                <th className="py-2 px-4 border">Total Profit</th>
                                <th className="py-2 px-4 border">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {products.map((product) => {
                                const totalProfit = calculateTotalHistoryProfit(product.history || []);
                                
                                return (
                                    <tr key={product._id} className="hover:bg-gray-50">
                                        <td className="py-2 px-4 border text-center">{product.productCode || '-'}</td>
                                        <td className="py-2 px-4 border">{product.productName || '-'}</td>
                                        <td className="py-2 px-4 border text-center">{product.stockQuantity || 0}</td>
                                        <td className="py-2 px-4 border text-right font-medium">₹{totalProfit.toFixed(2)}</td>
                                        <td className="py-2 px-4 border text-center">
                                            <button
                                                onClick={() => openHistoryModal(product)}
                                                className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm"
                                            >
                                                View History
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* History Modal */}
            {showHistoryModal && selectedProduct && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg shadow-lg w-full max-w-6xl max-h-screen overflow-auto">
                        <div className="p-4 border-b border-gray-200 flex justify-between items-center">
                            <h2 className="text-xl font-semibold">
                                History for {selectedProduct.productName} ({selectedProduct.productCode})
                            </h2>
                            <button
                                onClick={closeHistoryModal}
                                className="text-gray-500 hover:text-gray-700 text-2xl"
                            >
                                &times;
                            </button>
                        </div>
                        <div className="p-4">
                            <div className="mb-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="bg-blue-50 p-4 rounded-lg">
                                    <h3 className="text-lg font-semibold mb-2">Product Details</h3>
                                    <div className="space-y-2">
                                        <p><strong>Product Code:</strong> {selectedProduct.productCode}</p>
                                        <p><strong>Product Name:</strong> {selectedProduct.productName}</p>
                                        <p><strong>Current Stock:</strong> {selectedProduct.stockQuantity}</p>
                                        <p><strong>Category:</strong> {selectedProduct.category || '-'}</p>
                                        <p><strong>Brand:</strong> {selectedProduct.brand || '-'}</p>
                                    </div>
                                </div>
                                <div className="bg-green-50 p-4 rounded-lg">
                                    <h3 className="text-lg font-semibold mb-2">Current Pricing Details</h3>
                                    <div className="space-y-2">
                                        <p><strong>MRP:</strong> ₹{selectedProduct.mrp?.toFixed(2)}</p>
                                        <p><strong>Seller Price:</strong> ₹{selectedProduct.sellerPrice?.toFixed(2)}</p>
                                        <p><strong>Profit per Unit:</strong> ₹{((selectedProduct.mrp || 0) - (selectedProduct.sellerPrice || 0)).toFixed(2)}</p>
                                    </div>
                                </div>
                            </div>
                            
                            <h3 className="text-lg font-semibold mb-2">Stock History</h3>
                            <div className="overflow-x-auto mb-4">
                                <table className="min-w-full bg-white border border-gray-200">
                                    <thead>
                                        <tr className="bg-gray-100 text-base font-normal">
                                            <th className="py-2 px-4 border">Date</th>
                                            <th className="py-2 px-4 border">Stock Qty</th>
                                            <th className="py-2 px-4 border">MRP</th>
                                            <th className="py-2 px-4 border">Seller Price</th>
                                            <th className="py-2 px-4 border">Profit/Unit</th>
                                            <th className="py-2 px-4 border">Total Profit</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {selectedProduct.history?.map((history, index) => {
                                            const profitPerUnit = (history.mrp || 0) - (history.sellerPrice || 0);
                                            const totalProfit = profitPerUnit * (history.stockQuantity || 0);
                                            const date = new Date(history.timestamp).toLocaleDateString();
                                            
                                            return (
                                                <tr key={index} className="hover:bg-gray-50">
                                                    <td className="py-2 px-4 border text-center">{date}</td>
                                                    <td className="py-2 px-4 border text-center">{history.stockQuantity || 0}</td>
                                                    <td className="py-2 px-4 border text-right">₹{(history.mrp || 0).toFixed(2)}</td>
                                                    <td className="py-2 px-4 border text-right">₹{(history.sellerPrice || 0).toFixed(2)}</td>
                                                    <td className="py-2 px-4 border text-right">₹{profitPerUnit.toFixed(2)}</td>
                                                    <td className="py-2 px-4 border text-right font-medium">₹{totalProfit.toFixed(2)}</td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>

                            {/* Total Profit Calculation */}
                            {selectedProduct.history && selectedProduct.history.length > 0 && (
                                <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                                    <h3 className="text-lg font-semibold mb-2">Total Profit</h3>
                                        <div className="text-right">
                                            <p className="text-xl font-bold">
                                                ₹{calculateTotalHistoryProfit(selectedProduct.history).toFixed(2)}
                                            </p>
                                        </div>
                                </div>
                            )}
                        </div>
                        <div className="p-4 border-t border-gray-200 flex justify-end">
                            <button
                                onClick={closeHistoryModal}
                                className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProfitReport;