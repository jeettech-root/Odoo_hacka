const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/purchaseOrder.controller');
const validate = require('../validators/purchaseOrder.validator');
const authenticate = require('../middlewares/authenticate');
const authorize = require('../middlewares/authorize');
const poMw = require('../middlewares/purchaseOrder.middleware');

// Generate PO from approved quotation (Admin or ProcurementOfficer)
router.post('/generate', authenticate, authorize(['Admin','ProcurementOfficer']), validate.validateGenerate, ctrl.generatePO);

// Get all POs (Admin/ProcurementOfficer/Manager/Vendor)
router.get('/', authenticate, authorize(['Admin','ProcurementOfficer','Manager','Vendor']), ctrl.getAllPOs);

// Get PO by id
router.get('/:id', authenticate, authorize(['Admin','ProcurementOfficer','Manager','Vendor']), poMw.ensureExists, ctrl.getPOById);

// Update PO status (Admin or ProcurementOfficer)
router.post('/:id/status', authenticate, authorize(['Admin','ProcurementOfficer']), poMw.ensureExists, validate.validateUpdateStatus, ctrl.updateStatus);

module.exports = router;
