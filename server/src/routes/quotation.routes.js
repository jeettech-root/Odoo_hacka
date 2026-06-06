const express = require('express');
const router = express.Router();
const qCtrl = require('../controllers/quotation.controller');
const validate = require('../validators/quotation.validator');
const authenticate = require('../middlewares/authenticate');
const authorize = require('../middlewares/authorize');

// Vendor submits quotation
router.post('/', authenticate, authorize('Vendor'), validate.validateSubmit, qCtrl.submitQuotation);

// Vendor updates their quotation before RFQ deadline
router.put('/:id', authenticate, authorize('Vendor'), validate.validateUpdate, qCtrl.updateQuotation);

// Procurement Officer / Admin views quotations for approval and comparison workflows
router.get('/', authenticate, authorize(['Admin','ProcurementOfficer']), qCtrl.getAllQuotations);

// Procurement Officer / Admin views all quotations for an RFQ
router.get('/rfq/:rfqId', authenticate, authorize(['Admin','ProcurementOfficer']), qCtrl.getQuotationsByRFQ);

// Get quotation details (vendor owner or procurement officer/admin)
router.get('/:id', authenticate, qCtrl.getQuotationById);

module.exports = router;
