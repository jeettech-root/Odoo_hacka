const { RFQ, Vendor } = require('../models');

exports.createRFQ = async (req, res, next) => {
  try {
    const { title, description, productName, quantity, unit, deadline, assignedVendors, status } = req.body;
    const rfq = new RFQ({ title, description, productName, quantity, unit, deadline, assignedVendors, status });
    await rfq.save();
    res.status(201).json(rfq);
  } catch (err) { next(err); }
};

exports.getAllRFQs = async (req, res, next) => {
  try {
    const { q, status, page = 1, limit = 50 } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (q) filter.$text = { $search: q };

    const rfqs = await RFQ.find(filter)
      .populate('assignedVendors', 'companyName email')
      .skip((page-1)*limit)
      .limit(parseInt(limit,10))
      .sort({ createdAt: -1 });
    res.json(rfqs);
  } catch (err) { next(err); }
};

exports.getRFQById = async (req, res, next) => {
  try {
    const id = req.params.id;
    const rfq = await RFQ.findById(id).populate('assignedVendors', 'companyName email phone');
    if (!rfq) return res.status(404).json({ error: 'RFQ not found' });
    res.json(rfq);
  } catch (err) { next(err); }
};

exports.updateRFQ = async (req, res, next) => {
  try {
    const id = req.params.id;
    const updates = req.body;
    const rfq = await RFQ.findByIdAndUpdate(id, updates, { new: true });
    if (!rfq) return res.status(404).json({ error: 'RFQ not found' });
    res.json(rfq);
  } catch (err) { next(err); }
};

exports.deleteRFQ = async (req, res, next) => {
  try {
    const id = req.params.id;
    const rfq = await RFQ.findByIdAndDelete(id);
    if (!rfq) return res.status(404).json({ error: 'RFQ not found' });
    res.json({ message: 'RFQ deleted' });
  } catch (err) { next(err); }
};

exports.assignVendors = async (req, res, next) => {
  try {
    const id = req.params.id;
    const { assignedVendors } = req.body;

    // Optional: ensure vendors exist
    if (assignedVendors && assignedVendors.length) {
      const count = await Vendor.countDocuments({ _id: { $in: assignedVendors } });
      if (count !== assignedVendors.length) return res.status(400).json({ error: 'One or more vendors not found' });
    }

    const rfq = await RFQ.findByIdAndUpdate(id, { assignedVendors }, { new: true }).populate('assignedVendors', 'companyName email');
    if (!rfq) return res.status(404).json({ error: 'RFQ not found' });
    res.json(rfq);
  } catch (err) { next(err); }
};
