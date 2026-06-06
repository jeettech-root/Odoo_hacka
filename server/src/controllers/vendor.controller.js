const { Vendor } = require('../models');

const emailRegex = /^\S+@\S+\.\S+$/;

exports.createVendor = async (req, res, next) => {
  try {
    const { companyName, gstNumber, contactPerson, email, phone, address, category, status } = req.body;
    if (!companyName) return res.status(400).json({ error: 'companyName is required' });
    if (email && !emailRegex.test(email)) return res.status(400).json({ error: 'Invalid email' });

    const vendor = new Vendor({ companyName, gstNumber, contactPerson, email, phone, address, category, status });
    await vendor.save();
    res.status(201).json(vendor);
  } catch (err) { next(err); }
};

exports.getAllVendors = async (req, res, next) => {
  try {
    const { q, status, page = 1, limit = 50 } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (q) filter.$text = { $search: q };

    const vendors = await Vendor.find(filter).skip((page-1)*limit).limit(parseInt(limit,10)).sort({ createdAt: -1 });
    res.json(vendors);
  } catch (err) { next(err); }
};

exports.getVendorById = async (req, res, next) => {
  try {
    const id = req.params.id;
    const vendor = await Vendor.findById(id);
    if (!vendor) return res.status(404).json({ error: 'Vendor not found' });
    res.json(vendor);
  } catch (err) { next(err); }
};

exports.updateVendor = async (req, res, next) => {
  try {
    const id = req.params.id;
    const updates = req.body;
    if (updates.email && !emailRegex.test(updates.email)) return res.status(400).json({ error: 'Invalid email' });
    const vendor = await Vendor.findByIdAndUpdate(id, updates, { new: true });
    if (!vendor) return res.status(404).json({ error: 'Vendor not found' });
    res.json(vendor);
  } catch (err) { next(err); }
};

exports.deleteVendor = async (req, res, next) => {
  try {
    const id = req.params.id;
    const vendor = await Vendor.findByIdAndDelete(id);
    if (!vendor) return res.status(404).json({ error: 'Vendor not found' });
    res.json({ message: 'Vendor deleted' });
  } catch (err) { next(err); }
};
