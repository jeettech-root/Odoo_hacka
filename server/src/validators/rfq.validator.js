const mongoose = require('mongoose');

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

exports.validateCreate = (req, res, next) => {
  const { title, productName, quantity, unit, deadline, assignedVendors } = req.body;
  if (!title) return res.status(400).json({ error: 'title is required' });
  if (!productName) return res.status(400).json({ error: 'productName is required' });
  if (quantity === undefined || quantity === null) return res.status(400).json({ error: 'quantity is required' });
  if (typeof quantity !== 'number' || quantity < 0) return res.status(400).json({ error: 'quantity must be a non-negative number' });
  if (!unit) return res.status(400).json({ error: 'unit is required' });
  if (deadline && Number.isNaN(new Date(deadline).getTime())) return res.status(400).json({ error: 'deadline must be a valid date' });
  if (assignedVendors && !Array.isArray(assignedVendors)) return res.status(400).json({ error: 'assignedVendors must be an array of vendor ids' });
  if (assignedVendors) {
    for (const v of assignedVendors) {
      if (!isValidObjectId(v)) return res.status(400).json({ error: 'assignedVendors contains invalid id' });
    }
  }
  next();
};

exports.validateUpdate = (req, res, next) => {
  const { quantity, deadline, assignedVendors, status } = req.body;
  if (quantity !== undefined && (typeof quantity !== 'number' || quantity < 0)) return res.status(400).json({ error: 'quantity must be a non-negative number' });
  if (deadline && Number.isNaN(new Date(deadline).getTime())) return res.status(400).json({ error: 'deadline must be a valid date' });
  if (assignedVendors && !Array.isArray(assignedVendors)) return res.status(400).json({ error: 'assignedVendors must be an array of vendor ids' });
  if (assignedVendors) {
    for (const v of assignedVendors) {
      if (!isValidObjectId(v)) return res.status(400).json({ error: 'assignedVendors contains invalid id' });
    }
  }
  if (status && !['draft','open','closed','cancelled'].includes(status)) return res.status(400).json({ error: 'invalid status' });
  next();
};

exports.validateAssign = (req, res, next) => {
  const { assignedVendors } = req.body;
  if (!assignedVendors || !Array.isArray(assignedVendors) || assignedVendors.length === 0) return res.status(400).json({ error: 'assignedVendors array is required' });
  for (const v of assignedVendors) {
    if (!isValidObjectId(v)) return res.status(400).json({ error: 'assignedVendors contains invalid id' });
  }
  next();
};
