const mongoose = require('mongoose');
const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

exports.validateGenerate = (req, res, next) => {
  const { quotationId } = req.body;
  if (!quotationId || !isValidObjectId(quotationId)) return res.status(400).json({ error: 'quotationId is required and must be valid' });
  next();
};

exports.validateUpdateStatus = (req, res, next) => {
  const { status } = req.body;
  if (!status || !['Draft','Issued','Completed','Cancelled'].includes(status)) return res.status(400).json({ error: 'status is required and must be one of Draft,Issued,Completed,Cancelled' });
  next();
};
