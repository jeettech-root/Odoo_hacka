const { Quotation, RFQ, Vendor } = require('../models');

// Vendor submits a quotation for an RFQ
exports.submitQuotation = async (req, res, next) => {
  try {
    const { rfqId, vendorId, price, deliveryDays, notes } = req.body;

    // Ensure RFQ exists
    const rfq = await RFQ.findById(rfqId);
    if (!rfq) return res.status(404).json({ error: 'RFQ not found' });

    // Check deadline
    if (rfq.deadline && new Date() > new Date(rfq.deadline)) {
      return res.status(400).json({ error: 'Cannot submit quotation after RFQ deadline' });
    }

    const vendor = await Vendor.findById(vendorId);
    if (!vendor) return res.status(404).json({ error: 'Vendor not found' });

    const assigned = (rfq.assignedVendors || []).map(String);
    if (!assigned.includes(vendorId.toString())) {
      return res.status(400).json({ error: 'Vendor not assigned to this RFQ' });
    }

    // Prevent duplicate quotation by same user for same RFQ
    const existing = await Quotation.findOne({ rfqId, submittedBy: req.user.id });
    if (existing) return res.status(409).json({ error: 'Quotation already submitted by this user' });

    const q = new Quotation({ rfqId, vendorId, submittedBy: req.user.id, price, deliveryDays, notes });
    await q.save();
    res.status(201).json(q);
  } catch (err) { next(err); }
};

// Vendor updates their quotation before RFQ deadline
exports.updateQuotation = async (req, res, next) => {
  try {
    const id = req.params.id;
    const updates = req.body;
    const q = await Quotation.findById(id);
    if (!q) return res.status(404).json({ error: 'Quotation not found' });

    // Only submitting vendor can update
    if (req.user.role !== 'Vendor' || q.submittedBy?.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Forbidden: only submitting vendor can update' });
    }

    // Check RFQ deadline
    const rfq = await RFQ.findById(q.rfqId);
    if (rfq && rfq.deadline && new Date() > new Date(rfq.deadline)) {
      return res.status(400).json({ error: 'Cannot update quotation after RFQ deadline' });
    }

    const allowedUpdates = ['price', 'deliveryDays', 'notes'];
    for (const field of allowedUpdates) {
      if (updates[field] !== undefined) q[field] = updates[field];
    }
    await q.save();
    res.json(q);
  } catch (err) { next(err); }
};

// Procurement Officer (or Admin) views quotations across RFQs
exports.getAllQuotations = async (req, res, next) => {
  try {
    const { rfqId, status, sortBy = 'createdAt', order = 'desc' } = req.query;
    const filter = {};
    if (rfqId) filter.rfqId = rfqId;
    if (status) filter.status = status;

    const sortField = ['price', 'deliveryDays', 'createdAt'].includes(sortBy) ? sortBy : 'createdAt';
    const sortOrder = order === 'asc' ? 1 : -1;

    const qs = await Quotation.find(filter)
      .populate('rfqId', 'title productName deadline status')
      .populate('vendorId', 'companyName email')
      .populate('submittedBy', 'name email')
      .sort({ [sortField]: sortOrder });

    res.json(qs);
  } catch (err) { next(err); }
};

// Procurement Officer (or Admin) views all quotations for an RFQ
exports.getQuotationsByRFQ = async (req, res, next) => {
  try {
    const rfqId = req.params.rfqId;
    const { sortBy = 'price', order = 'asc', highlightLowest = 'true' } = req.query;
    const sortField = sortBy === 'deliveryDays' ? 'deliveryDays' : 'price';
    const sortOrder = order === 'desc' ? -1 : 1;

    const qs = await Quotation.find({ rfqId }).populate('vendorId', 'companyName email').populate('submittedBy', 'name email');

    // Compute lowest price
    let minPrice = null;
    for (const it of qs) {
      if (typeof it.price === 'number') {
        if (minPrice === null || it.price < minPrice) minPrice = it.price;
      }
    }

    // Convert to plain objects and annotate
    let result = qs.map((it) => {
      const obj = it.toObject();
      if (highlightLowest === 'true') obj.isLowest = (minPrice !== null && obj.price === minPrice);
      return obj;
    });

    // Sort
    result.sort((a,b) => {
      const av = a[sortField] ?? 0;
      const bv = b[sortField] ?? 0;
      if (av < bv) return -1 * sortOrder;
      if (av > bv) return 1 * sortOrder;
      return 0;
    });

    res.json(result);
  } catch (err) { next(err); }
};

// Get quotation details - vendor owner or procurement officer/admin
exports.getQuotationById = async (req, res, next) => {
  try {
    const id = req.params.id;
    const q = await Quotation.findById(id).populate('vendorId', 'companyName email').populate('submittedBy', 'name email');
    if (!q) return res.status(404).json({ error: 'Quotation not found' });

    if (req.user.role === 'Vendor' && q.submittedBy?.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    res.json(q);
  } catch (err) { next(err); }
};
