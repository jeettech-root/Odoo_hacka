const mongoose = require('mongoose');

const InvoiceSchema = new mongoose.Schema({
  invoiceNumber: { type: String, required: true, unique: true, index: true },
  poId: { type: mongoose.Schema.Types.ObjectId, ref: 'PurchaseOrder', required: true, index: true },
  vendorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Vendor', required: true },
  subtotal: { type: Number, required: true, min: 0 },
  gstPercentage: { type: Number, required: true, default: 18 },
  gstAmount: { type: Number, required: true, min: 0 },
  totalAmount: { type: Number, required: true, min: 0 },
  status: { type: String, enum: ['Draft','Sent','Paid','Cancelled'], default: 'Draft' },
  generatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  generatedAt: { type: Date }
}, { timestamps: true });

InvoiceSchema.index({ invoiceNumber: 1 });

module.exports = mongoose.model('Invoice', InvoiceSchema);
