const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose');
const SellerBill = require('../models/SellerBill');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Configure Cloudinary storage for PDF files
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: (req) => {
      const billType = req.body.billType === 'gst' ? 'gst_bills' : 'non_gst_bills';
      return `seller_bills/${billType}`;
    },
    format: async () => 'pdf', // always convert to pdf if needed
    resource_type: 'raw', // treat as raw file (not image)
    public_id: (req, file) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      const sanitizedFileName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
      return `bill-${uniqueSuffix}-${path.parse(sanitizedFileName).name}`;
    }
  }
});

const upload = multer({ 
  storage: storage,
  fileFilter: function (req, file, cb) {
    if (path.extname(file.originalname).toLowerCase() !== '.pdf') {
      return cb(new Error('Only PDF files are allowed'));
    }
    cb(null, true);
  },
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

router.post('/upload', upload.single('bill'), async (req, res) => {
  try {
    // Validate required fields
    const requiredFields = ['sellerId', 'supplierName', 'billType', 'billNumber', 'billDate', 'amount'];
    const missingFields = requiredFields.filter(field => !req.body[field]);
    
    if (missingFields.length > 0) {
      // Delete the uploaded file from Cloudinary if validation fails
      if (req.file && req.file.public_id) {
        await cloudinary.uploader.destroy(req.file.public_id, { resource_type: 'raw' });
      }
      return res.status(400).json({ 
        error: 'Missing required fields',
        missingFields
      });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Validate sellerId format
    if (!mongoose.Types.ObjectId.isValid(req.body.sellerId)) {
      // Delete the uploaded file from Cloudinary if validation fails
      if (req.file && req.file.public_id) {
        await cloudinary.uploader.destroy(req.file.public_id, { resource_type: 'raw' });
      }
      return res.status(400).json({ error: 'Invalid seller ID format' });
    }

    // Create new bill document
    const newBill = new SellerBill({
      sellerId: new mongoose.Types.ObjectId(req.body.sellerId),
      supplierName: req.body.supplierName,
      billType: req.body.billType,
      billNumber: req.body.billNumber,
      billDate: new Date(req.body.billDate),
      amount: parseFloat(req.body.amount),
      fileUrl: req.file.path, // Cloudinary URL
      publicId: req.file.public_id || undefined, // Cloudinary public ID
      fileName: req.file.originalname,
      downloadCount: 0
    });

    // Save to database
    await newBill.save();

    res.status(201).json({
      message: 'Bill uploaded successfully',
      bill: {
        id: newBill._id,
        billType: newBill.billType,
        billNumber: newBill.billNumber,
        billDate: newBill.billDate,
        amount: newBill.amount,
        fileName: newBill.fileName
      }
    });

  } catch (error) {
    console.error('Error in upload endpoint:', error);
    
    // Delete uploaded file from Cloudinary if there was an error
    if (req.file && req.file.public_id) {
      try {
        await cloudinary.uploader.destroy(req.file.public_id, { resource_type: 'raw' });
      } catch (err) {
        console.error('Error deleting file from Cloudinary:', err);
      }
    }
    
    // Handle specific error types
    if (error.name === 'ValidationError') {
      return res.status(400).json({ 
        error: 'Validation error',
        details: error.message
      });
    }
    
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ 
        error: 'File too large',
        details: 'Maximum file size is 5MB'
      });
    }

    res.status(500).json({ 
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Get all bills for a seller
router.get('/seller/:sellerId', async (req, res) => {
  try {
    const bills = await SellerBill.find({ sellerId: req.params.sellerId })
      .sort({ billDate: -1 });

    res.json(bills.map(bill => ({
      id: bill._id,
      billType: bill.billType,
      billNumber: bill.billNumber,
      billDate: bill.billDate,
      amount: bill.amount,
      fileName: bill.fileName,
      fileUrl: bill.fileUrl,
      downloadCount: bill.downloadCount,
      lastDownloadedAt: bill.lastDownloadedAt,
      uploadedAt: bill.createdAt
    })));
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch bills' });
  }
});

router.get('/secure-view/:billId', async (req, res) => {
  try {
    const bill = await SellerBill.findById(req.params.billId);
    if (!bill) {
      return res.status(404).json({ error: 'Bill not found' });
    }

    if (!bill.fileUrl) {
      return res.status(404).json({ error: 'File URL not found' });
    }

    // For viewing, we don't track as a download
    res.redirect(bill.fileUrl);

  } catch (error) {
    console.error('View error:', error);
    res.status(500).json({ error: 'Failed to view bill' });
  }
});

// Download endpoint - now redirects to Cloudinary URL
router.get('/download/:billId', async (req, res) => {
  try {
    const bill = await SellerBill.findById(req.params.billId);
    if (!bill) {
      return res.status(404).json({ error: 'Bill not found' });
    }

    if (!bill.fileUrl) {
      return res.status(404).json({ error: 'File URL not found' });
    }

    // Track the download
    await SellerBill.findByIdAndUpdate(
      req.params.billId,
      { 
        $inc: { downloadCount: 1 }, 
        lastDownloadedAt: new Date() 
      }
    );

    // Create a download URL that forces download
    const downloadUrl = bill.fileUrl.replace('/upload/', '/upload/fl_attachment/');
    res.redirect(downloadUrl);

  } catch (error) {
    console.error('Download error:', error);
    res.status(500).json({ error: 'Failed to download bill' });
  }
});

// Track download endpoint (now handled in the download endpoint)
router.patch('/track-download/:billId', async (req, res) => {
  try {
    const bill = await SellerBill.findByIdAndUpdate(
      req.params.billId,
      { 
        $inc: { downloadCount: 1 }, 
        lastDownloadedAt: new Date() 
      },
      { new: true }
    );
    
    if (!bill) {
      return res.status(404).json({ error: 'Bill not found' });
    }
    
    res.json({ message: 'Download tracked successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to track download' });
  }
});

// Get GST bills
router.get('/gst/:sellerId', async (req, res) => {
  try {
    const bills = await SellerBill.find({ 
      sellerId: req.params.sellerId,
      billType: 'gst'
    }).sort({ billDate: -1 });

    res.json(bills);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch GST bills' });
  }
});

// Get non-GST bills
router.get('/non-gst/:sellerId', async (req, res) => {
  try {
    const bills = await SellerBill.find({ 
      sellerId: req.params.sellerId,
      billType: 'non-gst'
    }).sort({ billDate: -1 });

    res.json(bills);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch non-GST bills' });
  }
});

// Get suppliers
router.get('/suppliers', async (req, res) => {
  try {
    const suppliers = await SellerBill.aggregate([
      {
        $group: {
          _id: {
            sellerId: '$sellerId',
            supplierName: '$supplierName',
          },
          billCount: { $sum: 1 }
        }
      },
      {
        $project: {
          _id: 0,
          sellerId: '$_id.sellerId',
          supplierName: '$_id.supplierName',
          billCount: 1
        }
      },
      { $sort: { supplierName: 1 } }
    ]);

    res.json(suppliers);
  } catch (error) {
    console.error('Error fetching suppliers:', error);
    res.status(500).json({ error: 'Failed to fetch suppliers' });
  }
});

// Delete a bill
router.delete('/:billId', async (req, res) => {
  try {
    const bill = await SellerBill.findById(req.params.billId);
    if (!bill) {
      return res.status(404).json({ error: 'Bill not found' });
    }

    // Delete from Cloudinary
    if (bill.publicId) {
      await cloudinary.uploader.destroy(bill.publicId, { resource_type: 'raw' });
    }

    // Delete from database
    await SellerBill.findByIdAndDelete(req.params.billId);

    res.json({ message: 'Bill deleted successfully' });
  } catch (error) {
    console.error('Delete error:', error);
    res.status(500).json({ error: 'Failed to delete bill' });
  }
});

module.exports = router;