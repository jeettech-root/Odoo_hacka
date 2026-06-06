const mongoose = require('mongoose');
const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

exports.validateRequestApproval = (req, res, next) => {
  const { quotationId, rfqId } = req.body;
  if (!quotationId || !isValidObjectId(quotationId)) return res.status(400).json({ error: 'quotationId is required and must be valid' });
  if (!rfqId || !isValidObjectId(rfqId)) return res.status(400).json({ error: 'rfqId is required and must be valid' });
  next();
};

exports.validateManagerAction = (req, res, next) => {
  const { remarks } = req.body;
  if (remarks && typeof remarks !== 'string') return res.status(400).json({ error: 'remarks must be a string' });
  next();
};
