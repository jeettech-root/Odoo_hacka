const mongoose = require('mongoose');

const InvoiceLogSchema = new mongoose.Schema({
  invoiceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Invoice', required: true, index: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  action: { type: String, enum: ['Generated','Sent','Paid','Cancelled','Updated'], required: true },
  remarks: { type: String, trim: true }
}, { timestamps: true });

module.exports = mongoose.model('InvoiceLog', InvoiceLogSchema);
