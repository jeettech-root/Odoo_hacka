const Invoice = require('../models/Invoice');

exports.ensureExists = async (req, res, next) => {
  try {
    const id = req.params.id;
    const inv = await Invoice.findById(id);
    if (!inv) return res.status(404).json({ error: 'Invoice not found' });
    req.invoice = inv;
    next();
  } catch (err) { next(err); }
};
