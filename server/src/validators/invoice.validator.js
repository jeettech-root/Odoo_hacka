const mongoose = require('mongoose');
const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

exports.validateGenerate = (req, res, next) => {
  const { poId } = req.body;
  if (!poId || !isValidObjectId(poId)) return res.status(400).json({ error: 'poId is required and must be valid' });
  next();
};

exports.validateUpdateStatus = (req, res, next) => {
  const { status } = req.body;
  if (!status || !['Draft','Sent','Paid','Cancelled'].includes(status)) return res.status(400).json({ error: 'status is required and must be one of Draft,Sent,Paid,Cancelled' });
  next();
};
