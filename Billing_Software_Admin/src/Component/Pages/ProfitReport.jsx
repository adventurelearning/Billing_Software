import React, { useState, useEffect } from 'react';
import api from '../../service/api';

const ProfitReport = () => {
    const [products, setProducts] = useState([]);
    const [stockHistory, setStockHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [filters, setFilters] = useState({
        productCode: '',
        startDate: '',
        endDate: ''
    });

      const calculateProfits = () => {
        // Initial stock profit (from AdminProduct)
        const initialProfit = products.reduce(
            (sum, product) => sum + (product.profit || 0) * (product.stockQuantity || 0), 
            0
        );

        // Additional stock profit (from StockHistory)
        const additionalProfit = stockHistory.reduce(
            (sum, history) => {
                const profitPerUnit = history.profit || 
                                   (history.mrpPrice - history.sellerPrice) || 0;
                return history.addedStock > 0 ? 
                    sum + (profitPerUnit * history.addedStock) : 
                    sum
            }, 
            0
        );

        // Reductions (negative values from StockHistory)
        const reductions = stockHistory.reduce(
            (sum, history) => {
                const profitPerUnit = history.profit || 
                                   (history.mrpPrice - history.sellerPrice) || 0;
                return history.addedStock < 0 ? 
                    sum + Math.abs(profitPerUnit * history.addedStock) : 
                    sum
            }, 
            0
        );

        return {
            initialProfit,
            additionalProfit,
            reductions,
            totalProfit: initialProfit + additionalProfit,
            netProfit: initialProfit + additionalProfit - reductions
        };
    };


    const { initialProfit, additionalProfit, reductions, totalProfit, netProfit } = calculateProfits();

    const fetchData = async () => {
        try {
            setLoading(true);
            
            // Build query string from filters
            const queryParams = new URLSearchParams();
            if (filters.productCode) queryParams.append('productCode', filters.productCode);
            if (filters.startDate) queryParams.append('startDate', filters.startDate);
            if (filters.endDate) queryParams.append('endDate', filters.endDate);

            // Fetch data in parallel
            const [productsRes, historyRes] = await Promise.all([
                api.get(`/products`),
                api.get(`/products/stock-history?${queryParams.toString()}`)
            ]);

            setProducts(productsRes.data);
            setStockHistory(historyRes.data);
            setLoading(false);
        } catch (err) {
            console.error('Error fetching data:', err);
            setError(err.message);
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [filters]);

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
    };

    if (loading) return <div className="p-4">Loading...</div>;
    if (error) return <div className="p-4 text-red-500">Error: {error}</div>;

    return (
        <div className="p-4">
            <h2 className="text-xl font-bold mb-4">Profit Report</h2>
            
            {/* Filters */}
            <div className="bg-white p-4 rounded-lg shadow mb-6">
                <h3 className="text-lg font-semibold mb-3">Filters</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Product Code</label>
                        <input
                            type="text"
                            name="productCode"
                            value={filters.productCode}
                            onChange={handleFilterChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md"
                            placeholder="Enter product code"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                        <input
                            type="date"
                            name="startDate"
                            value={filters.startDate}
                            onChange={handleFilterChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                        <input
                            type="date"
                            name="endDate"
                            value={filters.endDate}
                            onChange={handleFilterChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        />
                    </div>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-blue-100 p-4 rounded-lg">
                    <h3 className="text-lg font-semibold">Initial Stock Profit</h3>
                    <p className="text-2xl font-bold">₹{initialProfit.toFixed(2)}</p>
                </div>
                <div className="bg-green-100 p-4 rounded-lg">
                    <h3 className="text-lg font-semibold">Added Stock Profit</h3>
                    <p className="text-2xl font-bold">₹{additionalProfit.toFixed(2)}</p>
                </div>
                <div className="bg-yellow-100 p-4 rounded-lg">
                    <h3 className="text-lg font-semibold">Stock Reductions</h3>
                    <p className="text-2xl font-bold">-₹{reductions.toFixed(2)}</p>
                </div>
                <div className="bg-purple-100 p-4 rounded-lg">
                    <h3 className="text-lg font-semibold">Net Profit</h3>
                    <p className="text-2xl font-bold">₹{netProfit.toFixed(2)}</p>
                </div>
            </div>

                 {/* Initial Stock Table */}
            <div className="mb-8">
                <h3 className="text-lg font-semibold mb-2">Initial Stock</h3>
                <div className="overflow-x-auto">
                    <table className="min-w-full bg-white border border-gray-200">
                        <thead>
                            <tr className="bg-gray-100">
                                <th className="py-2 px-4 border">Code</th>
                                <th className="py-2 px-4 border">Product</th>
                                <th className="py-2 px-4 border">Sales Price</th>
                                <th className="py-2 px-4 border">Seller Price</th>
                                <th className="py-2 px-4 border">Profit/Unit</th>
                                <th className="py-2 px-4 border">Initial Qty</th>
                                <th className="py-2 px-4 border">Total Profit</th>
                            </tr>
                        </thead>
                        <tbody>
                            {products.map((product) => {
                                const profit = product.profit || (product.mrp - product.sellerPrice) || 0;
                                const qty = product.stockQuantity || 0;
                                const total = profit * qty;

                                return (
                                    <tr key={product._id} className="hover:bg-gray-50">
                                        <td className="py-2 px-4 border text-center">{product.productCode || '-'}</td>
                                        <td className="py-2 px-4 border">{product.productName || '-'}</td>
                                        <td className="py-2 px-4 border text-right">₹{(product.mrp || 0).toFixed(2)}</td>
                                        <td className="py-2 px-4 border text-right">₹{(product.sellerPrice || 0).toFixed(2)}</td>
                                        <td className="py-2 px-4 border text-right">₹{profit.toFixed(2)}</td>
                                        <td className="py-2 px-4 border text-center">{qty}</td>
                                        <td className="py-2 px-4 border text-right font-medium">₹{total.toFixed(2)}</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Stock History Table */}
            {/* <div>
                <h3 className="text-lg font-semibold mb-2">Stock Movements</h3>
                <div className="overflow-x-auto">
                    <table className="min-w-full bg-white border border-gray-200">
                        <thead>
                            <tr className="bg-gray-100">
                                <th className="py-2 px-4 border">Date</th>
                                <th className="py-2 px-4 border">Code</th>
                                <th className="py-2 px-4 border">Product</th>
                                <th className="py-2 px-4 border">Type</th>
                                <th className="py-2 px-4 border">Qty</th>
                                <th className="py-2 px-4 border">MRP</th>
                                <th className="py-2 px-4 border">Seller Price</th>
                                <th className="py-2 px-4 border">Profit/Unit</th>
                                <th className="py-2 px-4 border">Total Profit</th>
                            </tr>
                        </thead>
                        <tbody>
                            {stockHistory.map((history) => {
                                const date = new Date(history.createdAt).toLocaleDateString();
                                const isAddition = history.addedStock > 0;
                                const qty = Math.abs(history.addedStock);
                                const profit = history.profit || (history.mrpPrice - history.sellerPrice) || 0;
                                const total = profit * qty;

                                return (
                                    <tr key={history._id} className="hover:bg-gray-50">
                                        <td className="py-2 px-4 border text-center">{date}</td>
                                        <td className="py-2 px-4 border text-center">{history.productCode || '-'}</td>
                                        <td className="py-2 px-4 border">{history.productName || '-'}</td>
                                        <td className={`py-2 px-4 border text-center ${
                                            isAddition ? 'text-green-600' : 'text-red-600'
                                        }`}>
                                            {isAddition ? 'Addition' : 'Reduction'}
                                        </td>
                                        <td className="py-2 px-4 border text-center">{qty}</td>
                                        <td className="py-2 px-4 border text-right">₹{(history.mrpPrice || 0).toFixed(2)}</td>
                                        <td className="py-2 px-4 border text-right">₹{(history.sellerPrice || 0).toFixed(2)}</td>
                                        <td className="py-2 px-4 border text-right">₹{profit.toFixed(2)}</td>
                                        <td className={`py-2 px-4 border text-right font-medium ${
                                            isAddition ? 'text-green-600' : 'text-red-600'
                                        }`}>
                                            {isAddition ? '+' : '-'}₹{total.toFixed(2)}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div> */}
        </div>
    );
};

export default ProfitReport;