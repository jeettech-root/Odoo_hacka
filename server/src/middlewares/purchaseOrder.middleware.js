const PurchaseOrder = require('../models/PurchaseOrder');

exports.ensureExists = async (req, res, next) => {
  try {
    const id = req.params.id;
    const po = await PurchaseOrder.findById(id);
    if (!po) return res.status(404).json({ error: 'Purchase Order not found' });
    req.purchaseOrder = po;
    next();
  } catch (err) { next(err); }
};
