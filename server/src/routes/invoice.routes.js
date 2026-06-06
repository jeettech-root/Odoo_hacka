const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/invoice.controller');
const validate = require('../validators/invoice.validator');
const authenticate = require('../middlewares/authenticate');
const authorize = require('../middlewares/authorize');
const invMw = require('../middlewares/invoice.middleware');

// Generate invoice from PO (Admin/ProcurementOfficer)
router.post('/generate', authenticate, authorize(['Admin','ProcurementOfficer']), validate.validateGenerate, ctrl.generateInvoice);

// Get all invoices (Admin/ProcurementOfficer/Manager/Vendor)
router.get('/', authenticate, authorize(['Admin','ProcurementOfficer','Manager','Vendor']), ctrl.getAllInvoices);

// Get invoice by id
router.get('/:id', authenticate, authorize(['Admin','ProcurementOfficer','Manager','Vendor']), invMw.ensureExists, ctrl.getInvoiceById);

// Update invoice status (Admin/ProcurementOfficer)
router.post('/:id/status', authenticate, authorize(['Admin','ProcurementOfficer']), invMw.ensureExists, validate.validateUpdateStatus, ctrl.updateStatus);

// Download PDF Invoice
router.get('/:id/pdf', authenticate, authorize(['Admin','ProcurementOfficer','Manager','Vendor']), invMw.ensureExists, ctrl.downloadPDF);

// Email Invoice
router.post('/:id/email', authenticate, authorize(['Admin','ProcurementOfficer']), invMw.ensureExists, ctrl.sendEmail);

module.exports = router;
