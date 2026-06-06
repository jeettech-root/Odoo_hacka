const express = require('express');
const router = express.Router();
const rfqCtrl = require('../controllers/rfq.controller');
const validate = require('../validators/rfq.validator');
const authenticate = require('../middlewares/authenticate');
const authorize = require('../middlewares/authorize');

// Create RFQ - Admin or ProcurementOfficer
router.post('/', authenticate, authorize(['Admin','ProcurementOfficer']), validate.validateCreate, rfqCtrl.createRFQ);

// Get list - any authenticated user
router.get('/', authenticate, rfqCtrl.getAllRFQs);

// Get details
router.get('/:id', authenticate, rfqCtrl.getRFQById);

// Update - Admin or ProcurementOfficer
router.put('/:id', authenticate, authorize(['Admin','ProcurementOfficer']), validate.validateUpdate, rfqCtrl.updateRFQ);

// Delete - Admin only
router.delete('/:id', authenticate, authorize('Admin'), rfqCtrl.deleteRFQ);

// Assign vendors - Admin or ProcurementOfficer
router.post('/:id/assign-vendors', authenticate, authorize(['Admin','ProcurementOfficer']), validate.validateAssign, rfqCtrl.assignVendors);

module.exports = router;
