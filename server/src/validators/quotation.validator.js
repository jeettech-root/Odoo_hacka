const mongoose = require('mongoose');

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

exports.validateSubmit = (req, res, next) => {
  const { rfqId, vendorId, price, deliveryDays } = req.body;
  if (!rfqId || !isValidObjectId(rfqId)) return res.status(400).json({ error: 'rfqId is required and must be a valid id' });
  if (!vendorId || !isValidObjectId(vendorId)) return res.status(400).json({ error: 'vendorId is required and must be a valid id' });
  if (price === undefined || price === null) return res.status(400).json({ error: 'price is required' });
  if (typeof price !== 'number' || price < 0) return res.status(400).json({ error: 'price must be a non-negative number' });
  if (deliveryDays === undefined || deliveryDays === null) return res.status(400).json({ error: 'deliveryDays is required' });
  if (!Number.isInteger(deliveryDays) || deliveryDays < 0) return res.status(400).json({ error: 'deliveryDays must be a non-negative integer' });
  next();
};

exports.validateUpdate = (req, res, next) => {
  const { price, deliveryDays, notes } = req.body;
  if (price !== undefined && (typeof price !== 'number' || price < 0)) return res.status(400).json({ error: 'price must be a non-negative number' });
  if (deliveryDays !== undefined && (!Number.isInteger(deliveryDays) || deliveryDays < 0)) return res.status(400).json({ error: 'deliveryDays must be a non-negative integer' });
  if (notes !== undefined && typeof notes !== 'string') return res.status(400).json({ error: 'notes must be a string' });
  next();
};
