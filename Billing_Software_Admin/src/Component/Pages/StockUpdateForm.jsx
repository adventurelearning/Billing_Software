import { useState, useEffect } from 'react';
import api from '../../service/api';
import { toast } from 'react-toastify';

const StockUpdateForm = ({ product, onUpdate, onCancel }) => {
    const [formData, setFormData] = useState({
        incomingDate: new Date().toISOString().split('T')[0],
        stockQuantity: '',
        supplierName: '',
        batchNumber: '',
        manufactureDate: '',
        expiryDate: '',
        mrp: product?.mrp || '0',
        sellerPrice: product?.sellerPrice || '0'
    });

    const [currentStock, setCurrentStock] = useState(product?.stockQuantity || 0);
    const [totalConvertedQty, setTotalConvertedQty] = useState(0);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState(null);
    const [history, setHistory] = useState([]);

    useEffect(() => {
        if (product) {
            setFormData(prev => ({
                ...prev,
                mrp: product.mrp?.toString() || '0',
                sellerPrice: product.sellerPrice?.toString() || '0',
                supplierName: product.supplierName || '',
                batchNumber: product.batchNumber || ''
            }));
            setCurrentStock(parseFloat(product.stockQuantity) || 0);

            // Load product history if available
            if (product.history && Array.isArray(product.history)) {
                setHistory(product.history);
            }
        }
    }, [product]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));

        if (name === 'stockQuantity' && product?.secondaryUnit && product?.conversionRate) {
            const newQty = parseFloat(value) || 0;
            setTotalConvertedQty(newQty * parseFloat(product.conversionRate));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setIsSubmitting(true);

        try {
            if (!formData.stockQuantity) {
                throw new Error('Please fill all required fields');
            }

            if (!product?.productCode) {
                throw new Error('Product information is incomplete');
            }

            const newStockQty = parseFloat(formData.stockQuantity);
            if (newStockQty <= 0) {
                throw new Error('Stock quantity must be greater than 0');
            }

            // In your handleSubmit function in the React component
            const updateData = {
                newStockAdded: parseFloat(newStockQty), // Ensure this is a number
                previousStock: parseFloat(currentStock), // Ensure this is a number
                supplierName: formData.supplierName || product.supplierName || 'N/A',
                batchNumber: formData.batchNumber || product.batchNumber || 'N/A',
                manufactureDate: formData.manufactureDate || undefined,
                expiryDate: formData.expiryDate || undefined,
                mrp: parseFloat(formData.mrp) || product.mrp || 0,
                sellerPrice: parseFloat(formData.sellerPrice) || product.sellerPrice || 0
            };

            const response = await api.put(
                `/products/stock/${product.productCode}`,
                updateData
            );

            toast.success('Stock updated successfully!');

            // Add to local history for immediate UI update
            const newHistoryEntry = {
                timestamp: new Date(),
                stockQuantity: currentStock + newStockQty,
                mrp: parseFloat(formData.mrp) || 0,
                sellerPrice: parseFloat(formData.sellerPrice) || 0,
                incomingDate: formData.incomingDate || new Date().toISOString().split('T')[0],
                expiryDate: formData.expiryDate || null,
                manufactureDate: formData.manufactureDate || null,
                updatedBy: 'system', // You would get this from auth context in a real app
                action: 'STOCK_UPDATE',
                notes: `Added ${newStockQty} ${product.baseUnit} of stock`
            };

            setHistory(prev => [newHistoryEntry, ...prev]);
            onUpdate(response.data.product, response.data.stock);

        } catch (error) {
            console.error('Stock update error:', error);
            const errorMessage = error.response?.data?.message ||
                error.message ||
                'Failed to update stock. Please try again.';
            setError(errorMessage);
            toast.error(errorMessage);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
                <div className="p-6">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-bold">
                            Update Stock for {product?.productName || 'Product'}
                        </h2>
                        <button
                            onClick={onCancel}
                            className="text-gray-500 hover:text-gray-700"
                        >
                            &times;
                        </button>
                    </div>

                    {error && (
                        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">
                            {error}
                        </div>
                    )}

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Stock Update Form */}
                        <div>
                            <h3 className="text-lg font-semibold mb-3">Stock Information</h3>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="bg-gray-50 p-3 rounded">
                                        <label className="block text-xs font-medium text-gray-500 mb-1">Current Stock</label>
                                        <p className="font-medium">
                                            {currentStock} {product?.baseUnit}
                                            {product?.secondaryUnit && product?.conversionRate && (
                                                <span className="text-gray-500 ml-2">
                                                    ({currentStock * parseFloat(product.conversionRate)} {product.secondaryUnit})
                                                </span>
                                            )}
                                        </p>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-medium text-gray-700 mb-1">Add Stock Quantity*</label>
                                        <input
                                            type="number"
                                            name="stockQuantity"
                                            value={formData.stockQuantity}
                                            onChange={handleChange}
                                            min="0"
                                            step="0.01"
                                            required
                                            className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                                            placeholder="Quantity to add"
                                            disabled={isSubmitting}
                                        />
                                    </div>

                                    {/* <div>
                                        <label className="block text-xs font-medium text-gray-700 mb-1">Supplier Name</label>
                                        <input
                                            type="text"
                                            name="supplierName"
                                            value={formData.supplierName}
                                            onChange={handleChange}
                                            className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                                            placeholder="Supplier name"
                                            disabled={isSubmitting}
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-medium text-gray-700 mb-1">Batch Number</label>
                                        <input
                                            type="text"
                                            name="batchNumber"
                                            value={formData.batchNumber}
                                            onChange={handleChange}
                                            className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                                            placeholder="Batch number"
                                            disabled={isSubmitting}
                                        />
                                    </div> */}

                                    <div>
                                        <label className="block text-xs font-medium text-gray-700 mb-1">Manufacture Date</label>
                                        <input
                                            type="date"
                                            name="manufactureDate"
                                            value={formData.manufactureDate}
                                            onChange={handleChange}
                                            className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                                            disabled={isSubmitting}
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-medium text-gray-700 mb-1">Expiry Date</label>
                                        <input
                                            type="date"
                                            name="expiryDate"
                                            value={formData.expiryDate}
                                            onChange={handleChange}
                                            className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                                            disabled={isSubmitting}
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-medium text-gray-700 mb-1">Sales Price (₹)</label>
                                        <input
                                            type="number"
                                            name="mrp"
                                            value={formData.mrp}
                                            onChange={handleChange}
                                            min="0"
                                            step="0.01"
                                            className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                                            disabled={isSubmitting}
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-medium text-gray-700 mb-1">Seller Price (₹)</label>
                                        <input
                                            type="number"
                                            name="sellerPrice"
                                            value={formData.sellerPrice}
                                            onChange={handleChange}
                                            min="0"
                                            step="0.01"
                                            className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                                            disabled={isSubmitting}
                                        />
                                    </div>
                                </div>

                                {product?.secondaryUnit && product?.conversionRate && formData.stockQuantity && (
                                    <div className="bg-blue-50 p-3 rounded">
                                        <p className="text-sm text-blue-800">
                                            Adding {formData.stockQuantity} {product.baseUnit} will add {totalConvertedQty.toFixed(2)} {product.secondaryUnit} to inventory
                                        </p>
                                    </div>
                                )}

                                <div className="bg-gray-50 p-3 rounded">
                                    <p className="text-sm text-gray-800">
                                        After update: {currentStock + (parseFloat(formData.stockQuantity) || 0)} {product?.baseUnit}
                                        {product?.secondaryUnit && product?.conversionRate && (
                                            <span className="text-gray-500 ml-2">
                                                ({(currentStock + (parseFloat(formData.stockQuantity) || 0)) * parseFloat(product.conversionRate)} {product.secondaryUnit})
                                            </span>
                                        )}
                                    </p>
                                </div>

                                <div className="flex justify-end space-x-3 pt-4">
                                    <button
                                        type="button"
                                        onClick={onCancel}
                                        className="px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-50"
                                        disabled={isSubmitting}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-blue-400"
                                        disabled={isSubmitting}
                                    >
                                        {isSubmitting ? 'Updating...' : 'Update Stock'}
                                    </button>
                                </div>
                            </form>
                        </div>

                        {/* History Section */}
                        <div>
                            <h3 className="text-lg font-semibold mb-3">Update History</h3>
                            {history.length > 0 ? (
                                <div className="bg-gray-50 p-3 rounded max-h-96 overflow-y-auto">
                                    <ul className="space-y-3">
                                        {history.map((item, index) => (
                                            <li key={index} className="border-b border-gray-200 pb-2 last:border-b-0">
                                                <div className="flex justify-between items-start">
                                                    <div>
                                                        <p className="text-sm font-medium">
                                                            {new Date(item.timestamp).toLocaleDateString()} {new Date(item.timestamp).toLocaleTimeString()}
                                                        </p>
                                                        {/* <p className="text-xs text-gray-600">
                                                            Action: {item.action || 'UPDATE'}
                                                            {item.updatedBy && ` by ${item.updatedBy}`}
                                                        </p> */}
                                                        {item.notes && (
                                                            <p className="text-xs text-gray-600 mt-1">{item.notes}</p>
                                                        )}
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-sm font-medium">
                                                            Stock: {item.stockQuantity} {product?.baseUnit}
                                                        </p>
                                                        <p className="text-xs text-gray-600">
                                                            Sales Price: ₹{item.mrp}
                                                        </p>
                                                        {item.sellerPrice && (
                                                            <p className="text-xs text-gray-600">
                                                                Seller Price: ₹{item.sellerPrice}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                                {(item.expiryDate || item.manufactureDate) && (
                                                    <div className="mt-1 text-xs text-gray-500">
                                                        {item.manufactureDate && `Mfg: ${new Date(item.manufactureDate).toLocaleDateString()}`}
                                                        {item.expiryDate && ` Exp: ${new Date(item.expiryDate).toLocaleDateString()}`}
                                                    </div>
                                                )}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            ) : (
                                <div className="bg-gray-50 p-4 rounded text-center">
                                    <p className="text-gray-500">No history available for this product</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StockUpdateForm;