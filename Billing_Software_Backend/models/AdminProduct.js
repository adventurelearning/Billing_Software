const mongoose = require('mongoose');

const historySchema = new mongoose.Schema({
  timestamp: { type: Date, default: Date.now },
  stockQuantity: Number,
  mrp: Number,
  sellerPrice: Number,
  incomingDate: Date,
  expiryDate: Date,
  manufactureDate: Date,
  updatedBy: String,
  action: String,
  notes: String
});

const adminProductSchema = new mongoose.Schema({
  category: String,
  productName: { type: String, required: true },
  productCode: { type: String, unique: true },
  hsnCode: {type: String,trim: true},
  brand: String,
  mrp: { type: Number, required: true },
  sellerPrice: { type: Number, required: true },
  profit: { type: Number, required: true },
  discount: { type: Number, default: 0 },
  netPrice: Number,
  mrpPrice:  { type: Number, required: true },
  gst: { type: Number, required: true },
  sgst: Number,
  totalPrice: Number,
  perUnitPrice: Number,
  stockQuantity: { type: Number, default: 0, required: true  },
  gstCategory: { type: String, enum: ['GST', 'Non-GST'], required: true },
  overallQuantity: Number,
  quantity: Number,
  discountOnMRP: Number,
  incomingDate: Date,
  expiryDate: Date,
  supplierName: String,
  batchNumber: String,
  manufactureDate: Date,
  manufactureLocation: String,
  baseUnit: { type: String, required: true },
  secondaryUnit: String,
  conversionRate: { type: Number, default: 1 },
  basePrice: Number,
  secondaryPrice: Number,
  lowStockAlert: { type: Number, default: 0 },
  unitPrices: {
    piece: Number,
    box: Number,
    kg: Number,
    gram: Number,
    liter: Number,
    ml: Number,
    bag: Number,
    packet: Number,
    bottle: Number
  },
  history: [historySchema] // Add history array
}, { timestamps: true });

adminProductSchema.pre('save', function(next) {
  if (this.isModified('stockQuantity') || this.isModified('conversionRate')) {
    this.overallQuantity = this.stockQuantity * (this.conversionRate || 1);
  }
  next();
});

module.exports = mongoose.model('AdminProduct', adminProductSchema);                              