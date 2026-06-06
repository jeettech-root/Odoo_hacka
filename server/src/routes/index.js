const express = require('express');
const router = express.Router();

const healthRoutes = require('./health.routes');
const authRoutes = require('./auth.routes');
const testRoutes = require('./test.routes');
const vendorRoutes = require('./vendor.routes');
const rfqRoutes = require('./rfq.routes');
const quotationRoutes = require('./quotation.routes');
const approvalRoutes = require('./approval.routes');
const purchaseOrderRoutes = require('./purchaseOrder.routes');
const invoiceRoutes = require('./invoice.routes');

const authenticate = require('../middlewares/authenticate');
const { Vendor, RFQ, Approval, PurchaseOrder, Invoice } = require('../models');

router.use('/health', healthRoutes);
router.use('/auth', authRoutes);
router.use('/test', testRoutes);
router.use('/vendors', vendorRoutes);
router.use('/rfqs', rfqRoutes);
router.use('/quotations', quotationRoutes);
router.use('/approvals', approvalRoutes);
router.use('/purchase-orders', purchaseOrderRoutes);
router.use('/invoices', invoiceRoutes);

router.get('/dashboard/stats', authenticate, async (req, res, next) => {
  try {
    const role = req.user.role;
    const stats = {
      vendors: 0,
      rfqs: 0,
      approvals: 0,
      pos: 0,
      invoices: 0,
      charts: {
        monthlyProcurement: [],
        vendorPerformance: [],
        spendingSummary: []
      }
    };

    stats.vendors = await Vendor.countDocuments();
    stats.rfqs = await RFQ.countDocuments();
    stats.approvals = await Approval.countDocuments(role === 'Manager' ? { status: 'Pending' } : {});

    if (role === 'Vendor') {
      const vendor = await Vendor.findOne({ email: req.user.email.toLowerCase() });
      if (vendor) {
        stats.pos = await PurchaseOrder.countDocuments({ vendorId: vendor._id });
        stats.invoices = await Invoice.countDocuments({ vendorId: vendor._id });
      }
    } else {
      stats.pos = await PurchaseOrder.countDocuments();
      stats.invoices = await Invoice.countDocuments();
    }

    const poFilter = {};
    if (role === 'Vendor') {
      const vendor = await Vendor.findOne({ email: req.user.email.toLowerCase() });
      if (vendor) poFilter.vendorId = vendor._id;
    }
    const allPOs = await PurchaseOrder.find(poFilter).select('amount createdAt');
    const monthlyMap = {};
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const mName = months[d.getMonth()];
      monthlyMap[mName] = 0;
    }

    for (const po of allPOs) {
      const mName = months[new Date(po.createdAt).getMonth()];
      if (monthlyMap[mName] !== undefined) {
        monthlyMap[mName] += po.amount;
      }
    }
    stats.charts.monthlyProcurement = Object.keys(monthlyMap).map(name => ({
      name,
      amount: monthlyMap[name]
    }));

    const vendorsList = await Vendor.find().limit(5);
    stats.charts.vendorPerformance = await Promise.all(vendorsList.map(async (v) => {
      const poCount = await PurchaseOrder.countDocuments({ vendorId: v._id });
      const totalSpend = await PurchaseOrder.aggregate([
        { $match: { vendorId: v._id } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]);
      return {
        name: v.companyName,
        poCount,
        score: poCount * 25 + 45 > 100 ? 100 : poCount * 25 + 45,
        totalSpend: totalSpend[0]?.total || 0
      };
    }));

    const categoryMap = {};
    const posWithVendors = await PurchaseOrder.find(poFilter).populate('vendorId');
    for (const po of posWithVendors) {
      const category = po.vendorId?.category || 'General';
      categoryMap[category] = (categoryMap[category] || 0) + po.amount;
    }
    stats.charts.spendingSummary = Object.keys(categoryMap).map(name => ({
      name,
      value: categoryMap[name]
    }));

    res.json(stats);
  } catch (err) { next(err); }
});

module.exports = router;
