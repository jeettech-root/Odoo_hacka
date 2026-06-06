const { PurchaseOrder, PurchaseOrderLog, Quotation, Approval, Vendor } = require('../models');

async function createLog(poId, userId, action, remarks) {
  try {
    await PurchaseOrderLog.create({ purchaseOrderId: poId, userId, action, remarks });
  } catch (err) {
    console.error('PurchaseOrderLog error', err);
  }
}

// Generate PO from approved quotation
exports.generatePO = async (req, res, next) => {
  try {
    const { quotationId } = req.body;
    const q = await Quotation.findById(quotationId);
    if (!q) return res.status(404).json({ error: 'Quotation not found' });

    // Ensure quotation is accepted and approval exists
    if (q.status !== 'accepted') return res.status(400).json({ error: 'Quotation is not accepted' });
    if (!q.vendorId) return res.status(400).json({ error: 'Quotation has no vendor assigned' });
    const approval = await Approval.findOne({ quotationId: q._id, status: 'Approved' });
    if (!approval) return res.status(400).json({ error: 'No approved approval record found for this quotation' });

    // Prevent duplicate PO for same quotation
    const existing = await PurchaseOrder.findOne({ quotationId: q._id });
    if (existing) return res.status(409).json({ error: 'Purchase Order already generated for this quotation' });

    // Generate PO number
    const year = new Date().getFullYear();
    const start = new Date(`${year}-01-01T00:00:00.000Z`);
    const end = new Date(`${year + 1}-01-01T00:00:00.000Z`);
    const count = await PurchaseOrder.countDocuments({ generatedAt: { $gte: start, $lt: end } });
    const seq = count + 1;
    const poNumber = `PO-${year}-${String(seq).padStart(4,'0')}`;

    const po = new PurchaseOrder({
      poNumber,
      quotationId: q._id,
      rfqId: q.rfqId,
      vendorId: q.vendorId,
      approvalId: approval._id,
      amount: q.price,
      status: 'Draft',
      generatedBy: req.user.id,
      generatedAt: new Date()
    });

    await po.save();
    await createLog(po._id, req.user.id, 'Generated', `Generated from quotation ${q._id}`);
    res.status(201).json(po);
  } catch (err) { next(err); }
};

exports.getAllPOs = async (req, res, next) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const filter = {};
    if (req.user.role === 'Vendor') {
      const vendor = await Vendor.findOne({ email: req.user.email.toLowerCase() });
      if (!vendor) return res.json([]);
      filter.vendorId = vendor._id;
    }
    const pos = await PurchaseOrder.find(filter)
      .populate('quotationId')
      .populate('vendorId')
      .populate('rfqId')
      .populate('approvalId')
      .skip((page-1)*limit)
      .limit(parseInt(limit,10))
      .sort({ createdAt: -1 });
    res.json(pos);
  } catch (err) { next(err); }
};

exports.getPOById = async (req, res, next) => {
  try {
    const id = req.params.id;
    const po = await PurchaseOrder.findById(id)
      .populate('quotationId')
      .populate('vendorId')
      .populate('approvalId')
      .populate('rfqId');
    if (!po) return res.status(404).json({ error: 'Purchase Order not found' });

    if (req.user.role === 'Vendor') {
      const vendor = await Vendor.findOne({ email: req.user.email.toLowerCase() });
      const targetVendorId = po.vendorId?._id ? po.vendorId._id.toString() : po.vendorId?.toString();
      if (!vendor || targetVendorId !== vendor._id.toString()) {
        return res.status(403).json({ error: 'Forbidden: you do not own this purchase order' });
      }
    }
    res.json(po);
  } catch (err) { next(err); }
};

exports.updateStatus = async (req, res, next) => {
  try {
    const id = req.params.id;
    const { status, remarks } = req.body;
    const po = await PurchaseOrder.findById(id);
    if (!po) return res.status(404).json({ error: 'Purchase Order not found' });

    // Simple state guard
    if (po.status === 'Completed' || po.status === 'Cancelled') return res.status(400).json({ error: 'Cannot change status of completed or cancelled PO' });

    po.status = status;
    await po.save();
    await createLog(po._id, req.user.id, status === 'Issued' ? 'Issued' : (status === 'Completed' ? 'Completed' : (status === 'Cancelled' ? 'Cancelled' : 'Updated')), remarks);
    res.json(po);
  } catch (err) { next(err); }
};
