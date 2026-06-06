const mongoose = require('mongoose');

const RFQSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String, trim: true },
  productName: { type: String, required: true, trim: true, index: true },
  quantity: { type: Number, required: true, min: 0 },
  unit: { type: String, required: true, trim: true },
  deadline: { type: Date },
  assignedVendors: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Vendor' }],
  status: { type: String, enum: ['draft','open','closed','cancelled'], default: 'draft' }
}, { timestamps: true });

RFQSchema.index({ title: 'text', productName: 'text', description: 'text' });

module.exports = mongoose.model('RFQ', RFQSchema);
