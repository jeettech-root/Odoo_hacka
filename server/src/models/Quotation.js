const mongoose = require('mongoose');

const QuotationSchema = new mongoose.Schema({
  rfqId: { type: mongoose.Schema.Types.ObjectId, ref: 'RFQ', required: true, index: true },
  vendorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Vendor' },
  submittedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  price: { type: Number, required: true, min: 0 },
  deliveryDays: { type: Number, required: true, min: 0 },
  notes: { type: String, trim: true },
  status: { type: String, enum: ['submitted','withdrawn','accepted','rejected'], default: 'submitted' },
  submittedAt: { type: Date, default: () => new Date() }
}, { timestamps: true });

QuotationSchema.index({ rfqId: 1, vendorId: 1 });

module.exports = mongoose.model('Quotation', QuotationSchema);
