const { Approval, ApprovalLog, Quotation, RFQ, User } = require('../models');

async function createLog(approvalId, userId, action, remarks) {
  try {
    await ApprovalLog.create({ approvalId, userId, action, remarks });
  } catch (err) {
    // don't block main flow on logging error
    console.error('ApprovalLog error', err);
  }
}

// ProcurementOfficer requests approval for a quotation
exports.requestApproval = async (req, res, next) => {
  try {
    const { quotationId, rfqId, remarks } = req.body;

    // ensure quotation exists and belongs to rfq
    const q = await Quotation.findById(quotationId);
    if (!q) return res.status(404).json({ error: 'Quotation not found' });
    if (q.rfqId.toString() !== rfqId.toString()) return res.status(400).json({ error: 'Quotation does not belong to the provided RFQ' });
    if (q.status !== 'submitted') return res.status(400).json({ error: 'Only submitted quotations can be sent for approval' });

    const existing = await Approval.findOne({ quotationId, status: { $in: ['Pending', 'Approved'] } });
    if (existing) return res.status(409).json({ error: 'Approval already requested for this quotation' });

    const approval = await Approval.create({ quotationId, rfqId, requesterId: req.user.id, remarks, status: 'Pending' });
    await createLog(approval._id, req.user.id, 'Requested', remarks);
    res.status(201).json(approval);
  } catch (err) { next(err); }
};

// Manager views pending approvals (optionally by rfq, or general status filter)
exports.getPendingApprovals = async (req, res, next) => {
  try {
    const { rfqId, status } = req.query;
    const filter = {};
    if (status) {
      filter.status = status;
    } else if (req.user.role === 'Manager') {
      filter.status = 'Pending';
    }
    if (rfqId) filter.rfqId = rfqId;
    const approvals = await Approval.find(filter)
      .populate({
        path: 'quotationId',
        populate: [
          { path: 'vendorId' },
          { path: 'rfqId' }
        ]
      })
      .populate('requesterId', 'name email')
      .sort({ createdAt: -1 });
    // log views
    for (const a of approvals) {
      await createLog(a._id, req.user.id, 'Viewed');
    }
    res.json(approvals);
  } catch (err) { next(err); }
};

// Manager approves
exports.approve = async (req, res, next) => {
  try {
    const id = req.params.id;
    const { remarks } = req.body;
    const approval = await Approval.findById(id);
    if (!approval) return res.status(404).json({ error: 'Approval not found' });
    if (approval.status !== 'Pending') return res.status(400).json({ error: 'Approval already processed' });

    approval.status = 'Approved';
    approval.managerId = req.user.id;
    approval.remarks = remarks || approval.remarks;
    await approval.save();

    // update quotation status
    await Quotation.findByIdAndUpdate(approval.quotationId, { status: 'accepted' });

    await createLog(approval._id, req.user.id, 'Approved', remarks);
    res.json(approval);
  } catch (err) { next(err); }
};

// Manager rejects
exports.reject = async (req, res, next) => {
  try {
    const id = req.params.id;
    const { remarks } = req.body;
    const approval = await Approval.findById(id);
    if (!approval) return res.status(404).json({ error: 'Approval not found' });
    if (approval.status !== 'Pending') return res.status(400).json({ error: 'Approval already processed' });

    approval.status = 'Rejected';
    approval.managerId = req.user.id;
    approval.remarks = remarks || approval.remarks;
    await approval.save();

    // update quotation status
    await Quotation.findByIdAndUpdate(approval.quotationId, { status: 'rejected' });

    await createLog(approval._id, req.user.id, 'Rejected', remarks);
    res.json(approval);
  } catch (err) { next(err); }
};

// Get approval details
exports.getApprovalById = async (req, res, next) => {
  try {
    const id = req.params.id;
    const approval = await Approval.findById(id)
      .populate({
        path: 'quotationId',
        populate: [
          { path: 'vendorId' },
          { path: 'rfqId' }
        ]
      })
      .populate('requesterId', 'name email')
      .populate('managerId', 'name email');
    if (!approval) return res.status(404).json({ error: 'Approval not found' });
    await createLog(approval._id, req.user.id, 'Viewed');
    res.json(approval);
  } catch (err) { next(err); }
};

// Dev helper: create a pending approval from the first submitted quotation (development only)
exports.createTestApproval = async (req, res, next) => {
  try {
    if (process.env.NODE_ENV === 'production') return res.status(403).json({ error: 'Not allowed in production' });
    const q = await Quotation.findOne({ status: 'submitted' });
    if (!q) return res.status(404).json({ error: 'No submitted quotation found' });
    const rfqId = q.rfqId;
    const existing = await Approval.findOne({ quotationId: q._id, status: { $in: ['Pending','Approved'] } });
    if (existing) return res.status(409).json({ error: 'Approval already exists for this quotation' });
    // determine requesterId: prefer quotation.submittedBy, then any ProcurementOfficer or Admin
    let requesterId = q.submittedBy
    if (!requesterId) {
      const po = await User.findOne({ role: 'ProcurementOfficer' })
      if (po) requesterId = po._id
      else {
        const adm = await User.findOne({ role: 'Admin' })
        if (adm) requesterId = adm._id
      }
    }
    if (!requesterId) return res.status(400).json({ error: 'No suitable requester user found to create approval' })
    const approval = await Approval.create({ quotationId: q._id, rfqId, requesterId, remarks: 'Dev-created', status: 'Pending' });
    await createLog(approval._id, 'dev', 'Requested', 'Dev-created');
    res.status(201).json(approval);
  } catch (err) { next(err); }
}
