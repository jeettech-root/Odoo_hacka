const Approval = require('../models/Approval');

// ensure approval exists and is pending
module.exports.ensurePending = async (req, res, next) => {
  try {
    const id = req.params.id;
    const approval = await Approval.findById(id);
    if (!approval) return res.status(404).json({ error: 'Approval not found' });
    if (approval.status !== 'Pending') return res.status(400).json({ error: 'Approval already processed' });
    req.approval = approval;
    next();
  } catch (err) { next(err); }
};
