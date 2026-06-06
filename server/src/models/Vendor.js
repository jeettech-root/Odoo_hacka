const mongoose = require('mongoose');
const { Schema } = mongoose;

const VendorSchema = new Schema({
  companyName: { type: String, required: true, trim: true },
  gstNumber: { type: String, trim: true },
  contactPerson: { type: String, trim: true },
  email: { type: String, trim: true, lowercase: true },
  phone: { type: String, trim: true },
  address: { type: String, trim: true },
  category: { type: String, trim: true },
  status: { type: String, enum: ['active','inactive','suspended'], default: 'active' }
}, { timestamps: true });

VendorSchema.index({ companyName: 'text', email: 1 });

module.exports = mongoose.model('Vendor', VendorSchema);
