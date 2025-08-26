const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const AdminProduct = require('../models/AdminProduct');
const StockQuantity = require('../models/StockQuantity');
const StockHistory = require('../models/StockHistory'); 

router.get('/calculate-price/:code', async (req, res) => {
  try {
    const { unit, quantity } = req.query;
    const product = await AdminProduct.findOne({ productCode: req.params.code });

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    let price = 0;

    if (unit === product.baseUnit) {
      price = product.basePrice * quantity;
    } else if (unit === product.secondaryUnit) {
      price = product.secondaryPrice * quantity;
    } else if (product.unitPrices[unit]) {
      price = product.unitPrices[unit] * quantity;
    } else {
      if (unit === 'gram' && product.baseUnit === 'kg') {
        price = (product.basePrice / 1000) * quantity;
      } else if (unit === 'ml' && product.baseUnit === 'liter') {
        price = (product.basePrice / 1000) * quantity;
      } else {
        return res.status(400).json({ error: 'Invalid unit conversion' });
      }
    }

    res.json({ price: parseFloat(price.toFixed(2)) });
  } catch (err) {
    res.status(500).json({ error: 'Error calculating price', details: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    if (!req.body.gstCategory || !['GST', 'Non-GST'].includes(req.body.gstCategory)) {
      return res.status(400).json({ error: 'GST Category must be either "GST" or "Non-GST"' });
    }

    const conversionRate = req.body.conversionRate || 1;
    const stockQuantity = req.body.stockQuantity || 0;
    
    req.body.overallQuantity = stockQuantity * conversionRate;

    const basePrice = req.body.basePrice || req.body.mrp || 0;
    req.body.unitPrices = {
      piece: req.body.baseUnit === 'piece' ? basePrice : 0,
      box: req.body.baseUnit === 'box' ? basePrice : 0,
      kg: req.body.baseUnit === 'kg' ? basePrice : 0,
      gram: req.body.baseUnit === 'gram' ? basePrice : (req.body.baseUnit === 'kg' ? basePrice / 1000 : 0),
      liter: req.body.baseUnit === 'liter' ? basePrice : 0,
      ml: req.body.baseUnit === 'ml' ? basePrice : (req.body.baseUnit === 'liter' ? basePrice / 1000 : 0),
      bag: req.body.baseUnit === 'bag' ? basePrice : 0,
      packet: req.body.baseUnit === 'packet' ? basePrice : 0,
      bottle: req.body.baseUnit === 'bottle' ? basePrice : 0
    };

    if (req.body.secondaryUnit && conversionRate) {
      req.body.secondaryPrice = basePrice / conversionRate;
    }

    // Create initial history entry
    req.body.history = [{
      timestamp: new Date(),
      stockQuantity: req.body.stockQuantity || 0,
      mrp: req.body.mrp || 0,
      sellerPrice: req.body.sellerPrice || 0,
      incomingDate: req.body.incomingDate || null,
      expiryDate: req.body.expiryDate || null,
      manufactureDate: req.body.manufactureDate || null,
      updatedBy: req.user?.id || 'system',
      action: 'CREATE'
    }];

    const product = new AdminProduct(req.body);
    const savedProduct = await product.save();

    const existingStock = await StockQuantity.findOne({ productCode: savedProduct.productCode });

    if (existingStock) {
      existingStock.totalQuantity += savedProduct.stockQuantity;
      existingStock.availableQuantity += savedProduct.stockQuantity;
      existingStock.updatedAt = new Date();
      await existingStock.save();
    } else {
      const newStock = new StockQuantity({
        productCode: savedProduct.productCode,
        productName: savedProduct.productName,
        totalQuantity: savedProduct.stockQuantity,
        availableQuantity: savedProduct.stockQuantity,
        sellingQuantity: 0,
        updatedAt: new Date()
      });
      await newStock.save();
    }

    res.status(201).json(savedProduct);
  } catch (err) {
    console.error('❌ Error saving product and syncing stock:', err);
    res.status(500).json({ 
      error: 'Failed to save product', 
      details: err.message,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
});

router.get('/', async (req, res) => {
    try {
        const products = await AdminProduct.find().sort({ createdAt: -1 });
        res.json(products);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

router.get('/profit-summary', async (req, res) => {
    try {
        const products = await AdminProduct.find();
        const totalProfit = products.reduce((sum, product) => sum + product.profit, 0);
        
        res.json({
            totalProducts: products.length,
            totalProfit,
            averageProfit: totalProfit / products.length
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

router.get('/code/:code', async (req, res) => {
  try {
    const product = await AdminProduct.findOne({ productCode: req.params.code });
    if (!product) return res.status(404).json({ error: 'Product not found' });
    res.json(product);
  } catch (err) {
    res.status(500).json({ error: 'Error fetching product by code' });
  }
});

router.get('/name/:name', async (req, res) => {
  try {
    const escapedName = req.params.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    
    const product = await AdminProduct.findOne({ 
      productName: { 
        $regex: new RegExp(escapedName.trim().replace(/\s+/g, '\\s*'), 'i') 
      } 
    });
    
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    res.json(product);
  } catch (err) {
    res.status(500).json({ 
      error: 'Error fetching product by name',
      details: err.message 
    });
  }
});

router.get('/search', async (req, res) => {
  try {
    const query = req.query.query;
    
    if (!query) {
      return res.status(400).json({ error: 'Search query is required' });
    }
    
    const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    
    const products = await AdminProduct.find({
      $or: [
        { productName: { $regex: new RegExp(escapedQuery, 'i') } },
        { productCode: { $regex: new RegExp(escapedQuery, 'i') } }
      ]
    })
    .limit(10)
    .sort({ productName: 1 });
    
    res.json(products);
  } catch (err) {
    res.status(500).json({ 
      error: 'Error searching products',
      details: err.message 
    });
  }
});

router.patch('/reduce-stock/:code', async (req, res) => {
  const { quantity } = req.body;

  if (!quantity || quantity <= 0) {
    return res.status(400).json({ error: 'Quantity must be greater than 0' });
  }

  try {
    const product = await AdminProduct.findOne({ productCode: req.params.code });

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const conversionRate = product.conversionRate || 1;
    const overallQuantityToReduce = quantity * conversionRate;

    if (product.overallQuantity < overallQuantityToReduce) {
      return res.status(400).json({ error: 'Not enough stock available' });
    }

    // Add to history before updating
    product.history.push({
      timestamp: new Date(),
      stockQuantity: product.stockQuantity - quantity,
      mrp: product.mrp,
      sellerPrice: product.sellerPrice,
      incomingDate: product.incomingDate,
      expiryDate: product.expiryDate,
      manufactureDate: product.manufactureDate,
      updatedBy: req.user?.id || 'system',
      action: 'STOCK_REDUCE',
      notes: `Reduced stock by ${quantity} ${product.baseUnit}`
    });

    product.stockQuantity -= quantity;
    product.overallQuantity -= overallQuantityToReduce;
    
    await product.save();
    
    const stock = await StockQuantity.findOne({ productCode: req.params.code });
    if (stock) {
      stock.availableQuantity -= overallQuantityToReduce;
      await stock.save();
    }

    res.json({ message: 'Stock updated', updatedProduct: product });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update stock', details: err.message });
  }
});

router.get('/check-stock/:productCode', async (req, res) => {
  try {
    const { unit, quantity } = req.query;
    const product = await AdminProduct.findOne({ productCode: req.params.productCode });
    
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const stock = await StockQuantity.findOne({ productCode: req.params.productCode });
    if (!stock) {
      return res.json({ 
        available: 0, 
        required: 0, 
        isAvailable: false,
        availableDisplay: 0
      });
    }

    const availableInBaseUnits = stock.availableQuantity;
    let requiredInBaseUnits = 0;

    if (unit === product.baseUnit) {
      requiredInBaseUnits = quantity;
    } else if (unit === product.secondaryUnit) {
      requiredInBaseUnits = quantity * (product.conversionRate || 1);
    } else {
      if (unit === 'gram' && product.baseUnit === 'kg') {
        requiredInBaseUnits = quantity / 1000;
      } else if (unit === 'ml' && product.baseUnit === 'liter') {
        requiredInBaseUnits = quantity / 1000;
      } else {
        requiredInBaseUnits = quantity;
      }
    }

    const isAvailable = availableInBaseUnits >= requiredInBaseUnits;

    let availableDisplay = availableInBaseUnits;
    
    if (unit === product.secondaryUnit) {
      availableDisplay = availableInBaseUnits * (product.conversionRate || 1);
    } else if (unit === 'gram' && product.baseUnit === 'kg') {
      availableDisplay = availableInBaseUnits * 1000;
    } else if (unit === 'ml' && product.baseUnit === 'liter') {
      availableDisplay = availableInBaseUnits * 1000;
    }

    res.json({
      available: availableInBaseUnits,
      required: requiredInBaseUnits,
      isAvailable,
      availableDisplay,
      baseUnit: product.baseUnit,
      requestedUnit: unit
    });
  } catch (err) {
    res.status(500).json({ error: 'Error checking stock', details: err.message });
  }
});

router.put('/stock/:productCode', async (req, res) => {
  try {
    const { 
      newStockAdded, 
      previousStock, 
      supplierName, 
      batchNumber, 
      manufactureDate, 
      expiryDate, 
      mrp, 
      sellerPrice 
    } = req.body;

    if (!newStockAdded || isNaN(parseFloat(newStockAdded))) {
      return res.status(400).json({ 
        success: false,
        message: 'Invalid stock quantity' 
      });
    }

    const product = await AdminProduct.findOne({ productCode: req.params.productCode });
    if (!product) {
      return res.status(404).json({ 
        success: false,
        message: 'Product not found' 
      });
    }

    const addedStock = parseFloat(newStockAdded);
    const prevStock = parseFloat(previousStock || product.stockQuantity);
    const newTotalStock = addedStock;

    // Add to history before updating - Ensure stockQuantity is a number
    const historyEntry = {
      timestamp: new Date(),
      stockQuantity: newTotalStock, // This should be a number
      mrp: mrp ? parseFloat(mrp) : product.mrp,
      sellerPrice: sellerPrice ? parseFloat(sellerPrice) : product.sellerPrice,
      incomingDate: new Date(),
      expiryDate: expiryDate ? new Date(expiryDate) : product.expiryDate,
      manufactureDate: manufactureDate ? new Date(manufactureDate) : product.manufactureDate,
      updatedBy: req.user?.id || 'system',
      action: 'STOCK_UPDATE',
      notes: `Added ${addedStock} ${product.baseUnit} of stock`
    };

    // Update product stock
    const updatedProduct = await AdminProduct.findByIdAndUpdate(
      product._id,
      { 
        $inc: { 
          stockQuantity: addedStock, 
          overallQuantity: addedStock * (product.conversionRate || 1) 
        },
        $push: { history: historyEntry }, // Use $push to add to history array
        ...(supplierName && { supplierName }),
        ...(batchNumber && { batchNumber }),
        ...(manufactureDate && { manufactureDate: new Date(manufactureDate) }),
        ...(expiryDate && { expiryDate: new Date(expiryDate) }),
        ...(mrp && { mrp: parseFloat(mrp) }),
        ...(sellerPrice && { sellerPrice: parseFloat(sellerPrice) })
      },
      { new: true }
    );

    // Update stock quantity
    const stock = await StockQuantity.findOne({ productCode: req.params.productCode });
    if (stock) {
      stock.totalQuantity += addedStock;
      stock.availableQuantity += addedStock;
      await stock.save();
    } else {
      const newStock = new StockQuantity({
        productCode: product.productCode,
        productName: product.productName,
        totalQuantity: addedStock,
        availableQuantity: addedStock,
        sellingQuantity: 0
      });
      await newStock.save();
    }

    // Create stock history
    const stockHistory = new StockHistory({
      productId: product._id,
      productCode: product.productCode,
      productName: product.productName,
      previousStock: prevStock,
      addedStock: addedStock,
      newStock: newTotalStock,
      supplierName: supplierName || product.supplierName || 'N/A',
      batchNumber: batchNumber || product.batchNumber || 'N/A',
      manufactureDate: manufactureDate ? new Date(manufactureDate) : product.manufactureDate,
      expiryDate: expiryDate ? new Date(expiryDate) : product.expiryDate,
      mrp: mrp ? parseFloat(mrp) : product.mrp,
      sellerPrice: sellerPrice ? parseFloat(sellerPrice) : product.sellerPrice,
      updatedBy: req.user?.id || 'system'
    });

    await stockHistory.save();

    res.json({
      success: true,
      message: 'Stock updated successfully',
      product: updatedProduct,
      stock: stock || newStock
    });

  } catch (err) {
    console.error('Error updating stock:', err);
    res.status(500).json({ 
      success: false,
      message: 'Server error while updating stock',
      error: err.message 
    });
  }
});

router.get('/stock/:productCode', async (req, res) => {
  try {
    const productCode = req.params.productCode;

    const product = await AdminProduct.findOne({ productCode });
    if (!product) {
      return res.status(404).json({ 
        success: false,
        message: 'Product not found' 
      });
    }

    const stock = await StockQuantity.findOne({ productCode });
    
    const stockHistory = await StockHistory.find({ productCode })
      .sort({ createdAt: -1 })
      .limit(50);

    res.json({
      success: true,
      product,
      stock: stock || {
        productCode: product.productCode,
        productName: product.productName,
        totalQuantity: 0,
        availableQuantity: 0,
        sellingQuantity: 0
      },
      stockHistory
    });

  } catch (err) {
    console.error('Error fetching stock data:', err);
    res.status(500).json({ 
      success: false,
      message: 'Server error while fetching stock data',
      error: err.message 
    });
  }
});

router.get('/stock-history', async (req, res) => {
    try {
        const { productCode, startDate, endDate } = req.query;
        
        let query = {};
        
        if (productCode) {
            query.productCode = productCode;
        }
        
        if (startDate || endDate) {
            query.createdAt = {};
            if (startDate) query.createdAt.$gte = new Date(startDate);
            if (endDate) query.createdAt.$lte = new Date(endDate);
        }
        
        const history = await StockHistory.find(query)
            .sort({ createdAt: -1 })
            .lean();
        
        res.json(history);
    } catch (err) {
        console.error('Error fetching stock history:', err);
        res.status(500).json({ error: 'Server error while fetching stock history' });
    }
});

router.get('/seller-expenses', async (req, res) => {
    try {
        const { startDate, endDate, supplierName } = req.query;
        
        const matchStage = {
            "history.action": { $in: ["CREATE", "STOCK_UPDATE"] }
        };
        
        if (startDate || endDate) {
            matchStage["history.timestamp"] = {};
            if (startDate) matchStage["history.timestamp"].$gte = new Date(startDate);
            if (endDate) matchStage["history.timestamp"].$lte = new Date(endDate);
        }
        
        if (supplierName) {
            matchStage.supplierName = new RegExp(supplierName, 'i');
        }
        
        const pipeline = [
            { $unwind: "$history" },
            { $match: matchStage },
            {
                $group: {
                    _id: {
                        supplierName: "$supplierName",
                        batchNumber: "$batchNumber",
                        historyId: "$history._id"
                    },
                    productName: { $first: "$productName" },
                    productCode: { $first: "$productCode" },
                    category: { $first: "$category" },
                    baseUnit: { $first: "$baseUnit" },
                    timestamp: { $first: "$history.timestamp" },
                    stockQuantity: { $first: "$history.stockQuantity" },
                    sellerPrice: { $first: "$history.sellerPrice" },
                    mrp: { $first: "$history.mrp" },
                    manufactureDate: { $first: "$history.manufactureDate" },
                    expiryDate: { $first: "$history.expiryDate" },
                    action: { $first: "$history.action" },
                    updatedBy: { $first: "$history.updatedBy" }
                }
            },
            {
                $group: {
                    _id: {
                        supplierName: "$_id.supplierName",
                        batchNumber: "$_id.batchNumber"
                    },
                    products: {
                        $push: {
                            _id: "$_id.historyId",
                            productName: "$productName",
                            productCode: "$productCode",
                            category: "$category",
                            baseUnit: "$baseUnit",
                            addedStock: "$stockQuantity",
                            sellerPrice: "$sellerPrice",
                            mrp: "$mrp",
                            profitPerUnit: { $subtract: ["$mrp", "$sellerPrice"] },
                            totalProfit: { $multiply: [{ $subtract: ["$mrp", "$sellerPrice"] }, "$stockQuantity"] },
                            manufactureDate: "$manufactureDate",
                            expiryDate: "$expiryDate",
                            timestamp: "$timestamp",
                            action: "$action",
                            updatedBy: "$updatedBy"
                        }
                    },
                    totalAmount: {
                        $sum: { $multiply: ["$stockQuantity", "$sellerPrice"] }
                    },
                    totalProfit: {
                        $sum: { $multiply: [{ $subtract: ["$mrp", "$sellerPrice"] }, "$stockQuantity"] }
                    }
                }
            },
            {
                $project: {
                    _id: 0,
                    supplierName: "$_id.supplierName",
                    batchNumber: "$_id.batchNumber",
                    products: 1,
                    totalAmount: 1,
                    totalProfit: 1
                }
            },
            { $sort: { supplierName: 1, batchNumber: 1 } }
        ];
        
        const sellerExpenses = await AdminProduct.aggregate(pipeline);
        
        res.json(sellerExpenses);
    } catch (err) {
        console.error('Error fetching seller expenses:', err);
        res.status(500).json({ 
            error: 'Failed to fetch seller expenses',
            details: err.message,
            stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
        });
    }
});

router.get('/seller-info', async (req, res) => {
  try {
    const { supplierName, brand } = req.query;
    
    if (!supplierName || !brand) {
      return res.status(400).json({ error: 'Supplier name and brand are required' });
    }

    const product = await AdminProduct.findOne({ 
      supplierName: new RegExp(supplierName, 'i'),
      brand: new RegExp(brand, 'i')
    }).select('supplierName brand _id').lean();

    if (!product) {
      return res.status(404).json({ error: 'No products found for this supplier and brand' });
    }

    res.json({
      sellerId: product._id,
      supplierName: product.supplierName,
      brand: product.brand
    });
  } catch (err) {
    console.error('Error fetching seller info:', err);
    res.status(500).json({ 
      error: 'Failed to fetch seller info',
      details: err.message
    });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const productId = req.params.id;
    const updateData = req.body;
    
    // Get the current product
    const product = await AdminProduct.findById(productId);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // Create history entry for the update
    const historyEntry = {
      timestamp: new Date(),
      stockQuantity: updateData.stockQuantity !== undefined ? updateData.stockQuantity : product.stockQuantity,
      mrp: updateData.mrp !== undefined ? updateData.mrp : product.mrp,
      sellerPrice: updateData.sellerPrice !== undefined ? updateData.sellerPrice : product.sellerPrice,
      incomingDate: updateData.incomingDate !== undefined ? updateData.incomingDate : product.incomingDate,
      expiryDate: updateData.expiryDate !== undefined ? updateData.expiryDate : product.expiryDate,
      manufactureDate: updateData.manufactureDate !== undefined ? updateData.manufactureDate : product.manufactureDate,
      updatedBy: req.user?.id || 'system',
      action: 'UPDATE'
    };

    // Add to history array
    updateData.$push = { history: historyEntry };

    // Update the product
    const updatedProduct = await AdminProduct.findByIdAndUpdate(
      productId,
      updateData,
      { new: true }
    );

    res.json({
      success: true,
      message: 'Product updated successfully',
      product: updatedProduct
    });
  } catch (err) {
    console.error('Error updating product:', err);
    res.status(500).json({ 
      error: 'Failed to update product',
      details: err.message
    });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const productId = req.params.id;
    
    const product = await AdminProduct.findById(productId);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    await AdminProduct.findByIdAndDelete(productId);
    
    await StockQuantity.findOneAndDelete({ productCode: product.productCode });
    
    const stockHistory = new StockHistory({
      productId: product._id,
      productCode: product.productCode,
      productName: product.productName,
      action: 'DELETE',
      previousStock: product.stockQuantity,
      addedStock: 0,
      newStock: 0,
      updatedBy: req.user?.id || 'system',
      notes: 'Product deleted from system'
    });
    await stockHistory.save();

    res.json({ 
      success: true,
      message: 'Product and associated stock records deleted successfully'
    });
  } catch (err) {
    console.error('Error deleting product:', err);
    res.status(500).json({ 
      error: 'Failed to delete product',
      details: err.message,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
});

module.exports = router;