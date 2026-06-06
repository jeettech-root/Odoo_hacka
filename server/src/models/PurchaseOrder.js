const mongoose = require('mongoose');

const PurchaseOrderSchema = new mongoose.Schema({
  poNumber: { type: String, required: true, unique: true, index: true },
  quotationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Quotation', required: true },
  rfqId: { type: mongoose.Schema.Types.ObjectId, ref: 'RFQ', required: true },
  vendorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Vendor', required: true },
  approvalId: { type: mongoose.Schema.Types.ObjectId, ref: 'Approval' },
  amount: { type: Number, required: true, min: 0 },
  status: { type: String, enum: ['Draft','Issued','Completed','Cancelled'], default: 'Draft' },
  generatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  generatedAt: { type: Date }
}, { timestamps: true });

PurchaseOrderSchema.index({ poNumber: 1 });

module.exports = mongoose.model('PurchaseOrder', PurchaseOrderSchema);
