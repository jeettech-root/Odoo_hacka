const mongoose = require('mongoose');

const PurchaseOrderLogSchema = new mongoose.Schema({
  purchaseOrderId: { type: mongoose.Schema.Types.ObjectId, ref: 'PurchaseOrder', required: true, index: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  action: { type: String, enum: ['Generated','Issued','Completed','Cancelled','Updated'], required: true },
  remarks: { type: String, trim: true }
}, { timestamps: true });

module.exports = mongoose.model('PurchaseOrderLog', PurchaseOrderLogSchema);
