const mongoose = require('mongoose');

const ApprovalSchema = new mongoose.Schema({
  quotationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Quotation', required: true, index: true },
  rfqId: { type: mongoose.Schema.Types.ObjectId, ref: 'RFQ', required: true, index: true },
  requesterId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // ProcurementOfficer who requested approval
  managerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // manager who acted
  status: { type: String, enum: ['Pending','Approved','Rejected'], default: 'Pending' },
  remarks: { type: String, trim: true }
}, { timestamps: true });

module.exports = mongoose.model('Approval', ApprovalSchema);
