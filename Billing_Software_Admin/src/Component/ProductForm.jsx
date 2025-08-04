import { useState, useEffect } from 'react';
import '../App.css';
import api from '../service/api';

const ProductForm = ({ onSubmit, product, onCancel }) => {
    const [formData, setFormData] = useState({
        category: '',
        productName: '',
        productCode: '',
        hsnCode: '',
        brand: '',
        baseUnit: 'piece',
        secondaryUnit: '',
        conversionRate: 0,
        mrp: '',
        discount: '',
        mrpPrice: '',
        netPrice: '',
        gst: '',
        sgst: '',
        totalPrice: '',
        perUnitPrice: '',
        stockQuantity: '',
        gstCategory: 'GST',
        quantity: '1',
        discountOnMRP: '',
        incomingDate: '',
        expiryDate: '',
        supplierName: '',
        batchNumber: '',
        manufactureDate: '',
        manufactureLocation: '',
        totalConvertedQty: 0,
        sellerPrice: '',
        profit: '',
        lowStockAlert: 0,
    });

    const [uniqueCategories, setUniqueCategories] = useState([]);
    const [filteredCategories, setFilteredCategories] = useState([]);
    const [showCategorySuggestions, setShowCategorySuggestions] = useState(false);

    const unitTypes = [
        { value: 'piece', label: 'Pcs' },
        { value: 'box', label: 'Box' },
        { value: 'kg', label: 'kg' },
        { value: 'gram', label: 'g' },
        { value: 'liter', label: 'L' },
        { value: 'ml', label: 'ml' },
        { value: 'bag', label: 'bag' },
        { value: 'packet', label: 'packet' },
        { value: 'bottle', label: 'bottle' },
    ];

    const [selectedUnit, setSelectedUnit] = useState('piece');
    const [calculatedPrice, setCalculatedPrice] = useState(0);
    const [manualPrice, setManualPrice] = useState(0);
    const [useManualPrice, setUseManualPrice] = useState(false);

    useEffect(() => {
        const calculatePrice = async () => {
            if (formData.productCode && selectedUnit && formData.stockQuantity) {
                try {
                    const res = await api.get(
                        `/products/calculate-price/${formData.productCode}`,
                        {
                            params: {
                                unit: selectedUnit,
                                quantity: formData.stockQuantity
                            }
                        }
                    );
                    setCalculatedPrice(res.data.price);
                    if (!useManualPrice) {
                        setFormData(prev => ({
                            ...prev,
                            mrp: res.data.price.toFixed(2),
                            netPrice: res.data.price.toFixed(2),
                            totalPrice: res.data.price.toFixed(2)
                        }));
                    }
                } catch (error) {
                    console.error('Error calculating price:', error);
                }
            }
        };

        calculatePrice();
    }, [selectedUnit, formData.stockQuantity, formData.productCode, useManualPrice]);

    const handleManualPriceChange = (e) => {
        const value = parseFloat(e.target.value) || 0;
        setManualPrice(value);
        setUseManualPrice(true);
        setFormData(prev => ({
            ...prev,
            mrp: value.toFixed(2),
            netPrice: value.toFixed(2),
            totalPrice: value.toFixed(2)
        }));
    };

    useEffect(() => {
        if (product) {
            setFormData({
                category: product.category || '',
                productName: product.productName || '',
                productCode: product.productCode || '',
                hsnCode: product.hsnCode || '',
                brand: product.brand || '',
                baseUnit: product.baseUnit || 'piece',
                secondaryUnit: product.secondaryUnit || '',
                conversionRate: product.conversionRate || 0,
                mrp: product.mrp?.toString() || '',
                mrpPrice: product.mrpPrice?.toString() || '',
                discount: product.discount?.toString() || '',
                netPrice: product.netPrice?.toString() || '',
                gst: product.gst?.toString() || '',
                sgst: product.sgst?.toString() || '',
                perUnitPrice: product.perUnitPrice?.toString(),
                totalPrice: product.totalPrice?.toString() || '',
                stockQuantity: product.stockQuantity?.toString() || '',
                quantity: product.quantity?.toString() || '1',
                discountOnMRP: product.discountOnMRP?.toString() || '0',
                incomingDate: product.incomingDate || '',
                expiryDate: product.expiryDate || '',
                gstCategory: product.gstCategory || 'GST',
                supplierName: product.supplierName || '',
                batchNumber: product.batchNumber || '',
                lowStockAlert: product.lowStockAlert || 0,
                manufactureDate: product.manufactureDate || '',
                manufactureLocation: product.manufactureLocation || '',
                totalConvertedQty: product.secondaryUnit
                    ? (parseFloat(product.stockQuantity || 0) * (parseFloat(product.conversionRate || 0)))
                    : 0,
                sellerPrice: product.sellerPrice?.toString() || '0',
                profit: product.profit?.toString() || '0'
            });
        }
    }, [product]);

    useEffect(() => {
        const storedCategories = JSON.parse(localStorage.getItem('uniqueCategories')) || [];
        setUniqueCategories(storedCategories);
    }, []);

    const formatSupplierName = (name) => {
        return name
            .toLowerCase()
            .split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    };

    const handleChange = (e) => {
        const { name, value } = e.target;

        // Special handling for supplierName to capitalize first letter and lowercase the rest
        let processedValue = value;
        if (name === 'supplierName' || name === 'manufactureLocation') {
            processedValue = formatSupplierName(value);
        }

        // Special handling for numeric fields to remove leading zeros
        const numericFields = [
            'mrp', 'discount', 'gst', 'sgst', 'stockQuantity',
            'conversionRate', 'sellerPrice', 'mrpPrice', 'quantity', 'perUnitPrice'
        ];

        if (numericFields.includes(name)) {
            // Remove leading zeros when user starts typing
            if (value.length > 1 && value.startsWith('0') && !value.startsWith('0.')) {
                processedValue = value.replace(/^0+/, '') || '0';
            }
        }

        setFormData((prev) => {
            const updatedData = { ...prev, [name]: processedValue };

            // Recalculate prices
            if (name === 'mrp' || name === 'discount' || name === 'gst' || name === 'sgst' || name === 'sellerPrice') {
                const mrp = parseFloat(updatedData.mrp) || 0;
                const sellerPrice = parseFloat(updatedData.sellerPrice) || 0;
                const discount = parseFloat(updatedData.discount) || 0;
                const gst = parseFloat(updatedData.gst) || 0;
                const sgst = parseFloat(updatedData.sgst) || 0;

                // Calculate net price after discount (but don't use it for total price)
                const netPrice = mrp - (mrp * (discount / 100));

                // Calculate GST amounts (for display purposes only)
                const gstAmount = mrp * (gst / 100);
                const sgstAmount = mrp * (sgst / 100);

                // Total price remains the MRP (sales price)
                const totalPrice = mrp;

                // Calculate profit (seller price is the cost price)
                const profit = totalPrice - sellerPrice;

                updatedData.netPrice = netPrice.toFixed(2);
                updatedData.totalPrice = totalPrice.toFixed(2);
                updatedData.profit = profit.toFixed(2);
            }

            // Calculate totalConvertedQty
            if (name === 'stockQuantity' || name === 'conversionRate' || name === 'secondaryUnit') {
                const stockQty = parseFloat(updatedData.stockQuantity) || 0;
                const rate = parseFloat(updatedData.conversionRate) || 0;

                if (updatedData.secondaryUnit) {
                    updatedData.totalConvertedQty = stockQty * rate;
                } else {
                    updatedData.totalConvertedQty = 0;
                }
            }

            return updatedData;
        });

        // Category auto-suggestion
        if (name === 'category') {
            if (value) {
                const filtered = uniqueCategories.filter((cat) =>
                    cat.toLowerCase().includes(value.toLowerCase())
                );
                setFilteredCategories(filtered);
                setShowCategorySuggestions(true);
            } else {
                setFilteredCategories(uniqueCategories);
                setShowCategorySuggestions(true);
            }
        }
    };

    const handleCategorySelect = (category) => {
        setFormData((prev) => ({ ...prev, category }));
        setShowCategorySuggestions(false);
    };

    const handleCategoryInputFocus = () => {
        setFilteredCategories(uniqueCategories);
        setShowCategorySuggestions(true);
    };

    const handleCategoryInputBlur = (e) => {
        setTimeout(() => {
            if (!e.currentTarget.contains(e.relatedTarget)) {
                setShowCategorySuggestions(false);
            }
        }, 100);
    };

    const handleBarcodeSearch = async (barcode) => {
        if (!barcode) return;

        try {
            const res = await api.get(`/products/barcode/${barcode}`);
            const data = res.data;

            if (!data) {
                console.warn("Product not found for barcode:", barcode);
                return;
            }

            setFormData((prev) => ({
                ...prev,
                category: data.category || '',
                productName: data.productName || '',
                brand: data.brand || '',
                baseUnit: data.baseUnit || 'piece',
                secondaryUnit: data.secondaryUnit || '',
                conversionRate: data.conversionRate || 0,
                mrp: data.mrp?.toString() || '',
                mrpPrice: data.mrpPrice?.toString() || '',
                discount: data.discount?.toString() || '',
                netPrice: data.netPrice?.toString() || '',
                gst: data.gst?.toString() || '',
                sgst: data.sgst?.toString() || '',
                perUnitPrice: data.perUnitPrice?.toString(),
                totalPrice: data.totalPrice?.toString() || '',
                stockQuantity: data.stockQuantity?.toString() || '',
                quantity: data.quantity?.toString() || '1',
                discountOnMRP: data.discountOnMRP?.toString() || '0',
                incomingDate: data.incomingDate || '',
                expiryDate: data.expiryDate || '',
                supplierName: data.supplierName || '',
                batchNumber: data.batchNumber || '',
                manufactureDate: data.manufactureDate || '',
                manufactureLocation: data.manufactureLocation || '',
                productCode: data.productCode || barcode,
                hsnCode: data.hsnCode || '',
                totalConvertedQty: data.secondaryUnit
                    ? parseFloat(data.stockQuantity || 0) * parseFloat(data.conversionRate || 0)
                    : 0,
            }));
        } catch (error) {
            console.error("Error fetching product by barcode:", error.message);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Validate required fields
        if (!formData.productCode || !formData.productName || !formData.category || !formData.stockQuantity) {
            alert('Please fill all required fields (marked with *)');
            return;
        }

        if (formData.category && !uniqueCategories.includes(formData.category)) {
            const updatedCategories = [...uniqueCategories, formData.category];
            setUniqueCategories(updatedCategories);
            localStorage.setItem('uniqueCategories', JSON.stringify(updatedCategories));
        }

        const preparedData = {
            ...formData,
            mrp: parseFloat(formData.mrp) || 0,
            mrpPrice: parseFloat(formData.mrpPrice) || 0,
            discount: parseFloat(formData.discount) || 0,
            netPrice: parseFloat(formData.netPrice) || 0,
            gst: parseFloat(formData.gst) || 0,
            sgst: parseFloat(formData.sgst) || 0,
            totalPrice: parseFloat(formData.totalPrice) || 0,
            perUnitPrice: parseFloat(formData.perUnitPrice) || 0,
            stockQuantity: parseFloat(formData.stockQuantity) || 0,
            quantity: parseInt(formData.quantity) || 1,
            conversionRate: parseFloat(formData.conversionRate) || 0,
            discountOnMRP: parseFloat(formData.discountOnMRP) || 0,
            totalConvertedQty: parseFloat(formData.totalConvertedQty) || 0,
        };

        console.log('Submitting data:', preparedData);

        try {
            const url = product
                ? `/products/${product._id}`
                : '/products';

            const method = product ? 'put' : 'post';

            const res = await api[method](url, preparedData);
            console.log('Product saved successfully:', res.data);

            onSubmit(res.data);

            if (!product) {
                setFormData({
                    category: '',
                    productName: '',
                    productCode: '',
                    hsnCode: '',
                    brand: '',
                    baseUnit: 'piece',
                    secondaryUnit: '',
                    conversionRate: 0,
                    mrp: '0',
                    mrpPrice: '0',
                    discount: '0',
                    netPrice: '0',
                    gst: '0',
                    sgst: '0',
                    totalPrice: '0',
                    perUnitPrice: '0',
                    stockQuantity: '0',
                    sellerPrice: '0',
                    profit: '0',
                    quantity: '1',
                    discountOnMRP: '0',
                    incomingDate: '',
                    expiryDate: '',
                    supplierName: '',
                    batchNumber: '',
                    manufactureDate: '',
                    manufactureLocation: '',
                    totalConvertedQty: 0
                });
                setUseManualPrice(false);
                setManualPrice(0);
            }
        } catch (error) {
            console.error('Error saving product:', error);
            if (error.response) {
                console.error('Server response:', error.response.data);
                alert(`Error: ${error.response.data.message || 'Failed to save product'}`);
            } else {
                alert('Network error. Please try again.');
            }
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            {/* Product Information Section */}
            <div className="bg-white shadow rounded-lg p-4">
                <h3 className="text-md font-semibold text-gray-800 mb-3 pb-2 border-b border-gray-200">
                    Product Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
                    <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Product Code*</label>
                        <input
                            type="text"
                            name="productCode"
                            value={formData.productCode}
                            onChange={(e) => {
                                handleChange(e);
                                handleBarcodeSearch(e.target.value);
                            }}
                            required
                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                            placeholder="PRD-001"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Product Name*</label>
                        <input
                            type="text"
                            name="productName"
                            value={formData.productName}
                            onChange={handleChange}
                            required
                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                            placeholder="Product name"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">HSN Code</label>
                        <input
                            type="text"
                            name="hsnCode"
                            value={formData.hsnCode}
                            onChange={handleChange}
                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                            placeholder="HSN Code"
                        />
                    </div>

                    <div className="relative" onBlur={handleCategoryInputBlur}>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Category*</label>
                        <input
                            type="text"
                            name="category"
                            value={formData.category}
                            onChange={handleChange}
                            onFocus={handleCategoryInputFocus}
                            required
                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                            placeholder="Category"
                            autoComplete="off"
                        />
                        {showCategorySuggestions && filteredCategories.length > 0 && (
                            <ul className="absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded shadow max-h-48 overflow-y-auto text-sm">
                                {filteredCategories.map((cat, index) => (
                                    <li
                                        key={index}
                                        className="px-2 py-1 hover:bg-blue-50 cursor-pointer"
                                        onMouseDown={() => handleCategorySelect(cat)}
                                    >
                                        {cat}
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Brand</label>
                        <input
                            type="text"
                            name="brand"
                            value={formData.brand}
                            onChange={handleChange}
                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                            placeholder="Brand"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Received Date</label>
                        <input
                            type="date"
                            name="incomingDate"
                            value={formData.incomingDate}
                            onChange={handleChange}
                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                    </div>
                </div>
            </div>

            {/* Pricing Section */}
            <div className="bg-white shadow rounded-lg p-4">
                <h3 className="text-md font-semibold text-gray-800 mb-3 pb-2 border-b border-gray-200">
                    Pricing Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
                    <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Select Unit</label>
                        <select
                            value={selectedUnit}
                            onChange={(e) => setSelectedUnit(e.target.value)}
                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                        >
                            {unitTypes.map((unit) => (
                                <option key={unit.value} value={unit.value}>{unit.label}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">MRP Price (₹)*</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none">
                                <span className="text-gray-500 text-sm">₹</span>
                            </div>
                            <input
                                type="text"
                                name="mrpPrice"
                                value={formData.mrpPrice}
                                onChange={handleChange}
                                inputMode="numeric"
                                pattern="[0-9]*"
                                required
                                className="no-arrows w-full pl-7 pr-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                                placeholder="0.00"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Seller Price (₹)*</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none">
                                <span className="text-gray-500 text-sm">₹</span>
                            </div>
                            <input
                                type="text"
                                name="sellerPrice"
                                value={formData.sellerPrice}
                                onChange={handleChange}
                                inputMode="numeric"
                                pattern="[0-9]*"
                                required
                                className="no-arrows w-full pl-7 pr-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                                placeholder="0.00"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Sales Price (₹)*</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none">
                                <span className="text-gray-500 text-sm">₹</span>
                            </div>
                            <input
                                type="text"
                                name="mrp"
                                value={useManualPrice ? manualPrice : formData.mrp}
                                onChange={useManualPrice ? handleManualPriceChange : handleChange}
                                inputMode="numeric"
                                pattern="[0-9]*"
                                required
                                className="no-arrows w-full pl-7 pr-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                                placeholder="0.00"
                            />
                        </div>
                        {!useManualPrice && (
                            <p className="text-xs text-gray-500 mt-1">
                                Auto: ₹{calculatedPrice.toFixed(2)} for {formData.stockQuantity} {selectedUnit}
                            </p>
                        )}
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Per Unit Price (₹)</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none">
                                <span className="text-gray-500 text-sm">₹</span>
                            </div>
                            <input
                                type="text"
                                name="perUnitPrice"
                                value={formData.perUnitPrice}
                                onChange={handleChange}
                                inputMode="numeric"
                                pattern="[0-9]*"
                                className="no-arrows w-full pl-7 pr-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                                placeholder="0.00"
                            />
                        </div>
                    </div>
                    {/* 
                    <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Discount (%)</label>
                        <div className="relative">
                            <input
                                type="text"
                                name="discount"
                                value={formData.discount}
                                onChange={handleChange}
                                inputMode="numeric"
                                pattern="[0-9]*"
                                className="no-arrows w-full pr-7 pl-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                                placeholder="0.0"
                            />
                            <div className="absolute inset-y-0 right-0 pr-2 flex items-center pointer-events-none">
                                <span className="text-gray-500 text-sm">%</span>
                            </div>
                        </div>
                    </div> */}

                    {/* GST Category Dropdown (Aligned Right) */}
                    <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">GST Category*</label>
                        <select
                            name="gstCategory"
                            value={formData.gstCategory}
                            onChange={handleChange}
                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                        >
                            <option value="GST">GST</option>
                            <option value="Non-GST">Non-GST</option>
                        </select>
                    </div>

                    {/* GST + SGST (conditionally rendered) */}
                    {formData.gstCategory === 'GST' && (
                        <>
                            <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">CGST (%)</label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        name="gst"
                                        value={formData.gst}
                                        onChange={handleChange}
                                        inputMode="numeric"
                                        pattern="[0-9]*"
                                        className="no-arrows w-full pr-7 pl-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                                        placeholder="0.0"
                                    />
                                    <div className="absolute inset-y-0 right-0 pr-2 flex items-center pointer-events-none">
                                        <span className="text-gray-500 text-sm">%</span>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">SGST (%)</label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        name="sgst"
                                        value={formData.sgst}
                                        onChange={handleChange}
                                        inputMode="numeric"
                                        pattern="[0-9]*"
                                        className="no-arrows w-full pr-7 pl-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                                        placeholder="0.0"
                                    />
                                    <div className="absolute inset-y-0 right-0 pr-2 flex items-center pointer-events-none">
                                        <span className="text-gray-500 text-sm">%</span>
                                    </div>
                                </div>
                            </div>
                        </>
                    )}

                    <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Total Price (₹)</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none">
                                <span className="text-gray-500 text-sm">₹</span>
                            </div>
                            <input
                                type="text"
                                name="totalPrice"
                                value={formData.totalPrice}
                                readOnly
                                className="w-full pl-7 pr-2 py-1 text-sm bg-gray-50 border border-gray-300 rounded"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Profit (₹)</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none">
                                <span className="text-gray-500 text-sm">₹</span>
                            </div>
                            <input
                                type="text"
                                name="profit"
                                value={formData.profit}
                                readOnly
                                className="w-full pl-7 pr-2 py-1 text-sm bg-gray-50 border border-gray-300 rounded"
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Product Source Information Section */}
            <div className="bg-white shadow rounded-lg p-4">
                <h3 className="text-md font-semibold text-gray-800 mb-3 pb-2 border-b border-gray-200">
                    Product Source Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                    <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Supplier Name</label>
                        <input
                            type="text"
                            name="supplierName"
                            value={formData.supplierName}
                            onChange={handleChange}
                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                            placeholder="Supplier name"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Batch Number</label>
                        <input
                            type="text"
                            name="batchNumber"
                            value={formData.batchNumber}
                            onChange={handleChange}
                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                            placeholder="Batch number"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Manufacture Date</label>
                        <input
                            type="date"
                            name="manufactureDate"
                            value={formData.manufactureDate}
                            onChange={handleChange}
                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Expiry Date</label>
                        <input
                            type="date"
                            name="expiryDate"
                            value={formData.expiryDate}
                            onChange={handleChange}
                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Manufacture Location</label>
                        <input
                            type="text"
                            name="manufactureLocation"
                            value={formData.manufactureLocation}
                            onChange={handleChange}
                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                            placeholder="Location"
                        />
                    </div>
                </div>
            </div>

            {/* Inventory Section */}
            <div className="bg-white shadow rounded-lg p-4">
                <h3 className="text-md font-semibold text-gray-800 mb-3 pb-2 border-b border-gray-200">
                    Inventory & Units
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Base Unit*</label>
                        <select
                            name="baseUnit"
                            value={formData.baseUnit}
                            onChange={handleChange}
                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                        >
                            {unitTypes.map((unit) => (
                                <option key={unit.value} value={unit.value}>
                                    {unit.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Secondary Unit</label>
                        <select
                            name="secondaryUnit"
                            value={formData.secondaryUnit}
                            onChange={handleChange}
                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                        >
                            <option value="">None</option>
                            {unitTypes
                                .filter(unit => unit.value !== formData.baseUnit)
                                .map((unit) => (
                                    <option key={unit.value} value={unit.value}>
                                        {unit.label}
                                    </option>
                                ))}
                        </select>
                    </div>

                    {formData.secondaryUnit && (
                        <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">Conversion Rate</label>
                            <div className="flex items-center space-x-1">
                                <span className="text-xs">1 {formData.baseUnit} =</span>
                                <input
                                    type="text"
                                    name="conversionRate"
                                    value={formData.conversionRate}
                                    onChange={handleChange}
                                    inputMode="numeric"
                                    pattern="[0-9]*"
                                    className="no-arrows w-16 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                                />
                                <span className="text-xs">{formData.secondaryUnit}</span>
                            </div>
                        </div>
                    )}

                    <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Stock Qty*</label>
                        <input
                            type="text"
                            name="stockQuantity"
                            value={formData.stockQuantity}
                            onChange={handleChange}
                            inputMode="numeric"
                            pattern="[0-9]*"
                            required
                            className="no-arrows w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                            placeholder="Available qty"
                        />
                    </div>

                    {formData.secondaryUnit && (
                        <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                                Total {formData.secondaryUnit}
                            </label>
                            <input
                                type="number"
                                name="totalConvertedQty"
                                value={formData.totalConvertedQty}
                                readOnly
                                className="w-full px-2 py-1 text-sm border border-gray-200 bg-gray-100 rounded focus:outline-none"
                            />
                        </div>
                    )}
                    <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Low Stock Alert</label>
                        <input
                            type="text"
                            name="lowStockAlert"
                            value={formData.lowStockAlert}
                            onChange={handleChange}
                            inputMode="numeric"
                            pattern="[0-9]*"
                            className="no-arrows w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                            placeholder="Alert when stock is low"
                        />
                    </div>
                </div>
            </div>

            {/* Form Actions */}
            <div className="flex justify-end space-x-2 pt-2">
                {product && (
                    <button
                        type="button"
                        onClick={onCancel}
                        className="px-3 py-1 text-sm border border-gray-300 rounded text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    >
                        Cancel
                    </button>
                )}
                <button
                    type="submit"
                    className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                    {product ? 'Update' : 'Add Product'}
                </button>
            </div>
        </form>
    );
};

export default ProductForm;