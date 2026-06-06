const express = require('express');
const router = express.Router();
const vendorController = require('../controllers/vendor.controller');
const authenticate = require('../middlewares/authenticate');
const authorize = require('../middlewares/authorize');

// All endpoints protected
router.use(authenticate);

// Create vendor (Admin, ProcurementOfficer)
router.post('/', authorize('Admin','ProcurementOfficer'), vendorController.createVendor);

// List vendors (any authenticated role)
router.get('/', vendorController.getAllVendors);

// Get vendor by id
router.get('/:id', vendorController.getVendorById);

// Update vendor (Admin, ProcurementOfficer)
router.put('/:id', authorize('Admin','ProcurementOfficer'), vendorController.updateVendor);

// Delete vendor (Admin only)
router.delete('/:id', authorize('Admin'), vendorController.deleteVendor);

module.exports = router;
