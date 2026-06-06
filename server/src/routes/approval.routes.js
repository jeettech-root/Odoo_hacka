const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/approval.controller');
const validate = require('../validators/approval.validator');
const authenticate = require('../middlewares/authenticate');
const authorize = require('../middlewares/authorize');
const approvalMw = require('../middlewares/approval.middleware');

// ProcurementOfficer requests approval for a quotation
router.post('/', authenticate, authorize(['Admin','ProcurementOfficer']), validate.validateRequestApproval, ctrl.requestApproval);

// Dev-only: create a test approval without authentication (development only)
router.post('/dev/create', ctrl.createTestApproval);

// Manager/PO/Admin views pending approvals
router.get('/pending', authenticate, authorize(['Admin','ProcurementOfficer','Manager']), ctrl.getPendingApprovals);

// Manager approves
router.post('/:id/approve', authenticate, authorize('Manager'), approvalMw.ensurePending, validate.validateManagerAction, ctrl.approve);

// Manager rejects
router.post('/:id/reject', authenticate, authorize('Manager'), approvalMw.ensurePending, validate.validateManagerAction, ctrl.reject);

// Get approval details
router.get('/:id', authenticate, ctrl.getApprovalById);

module.exports = router;
