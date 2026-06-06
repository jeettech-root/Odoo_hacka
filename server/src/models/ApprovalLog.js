const mongoose = require('mongoose');

const ApprovalLogSchema = new mongoose.Schema({
  approvalId: { type: mongoose.Schema.Types.ObjectId, ref: 'Approval', required: true, index: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  action: { type: String, enum: ['Requested','Viewed','Approved','Rejected'], required: true },
  remarks: { type: String, trim: true }
}, { timestamps: true });

module.exports = mongoose.model('ApprovalLog', ApprovalLogSchema);
