const { Invoice, InvoiceLog, PurchaseOrder, Vendor } = require('../models');
const PDFDocument = require('pdfkit');
const nodemailer = require('nodemailer');

async function createLog(invoiceId, userId, action, remarks) {
  try {
    await InvoiceLog.create({ invoiceId, userId, action, remarks });
  } catch (err) {
    console.error('InvoiceLog error', err);
  }
}

// Generate invoice from purchase order
exports.generateInvoice = async (req, res, next) => {
  try {
    const { poId } = req.body;
    const po = await PurchaseOrder.findById(poId);
    if (!po) return res.status(404).json({ error: 'Purchase Order not found' });

    // only allow from Issued or Completed PO
    if (po.status !== 'Issued' && po.status !== 'Completed') {
      return res.status(400).json({ error: 'Invoice can only be generated from an Issued or Completed PO' });
    }

    // prevent duplicate invoice per PO
    const existing = await Invoice.findOne({ poId: po._id });
    if (existing) return res.status(409).json({ error: 'Invoice already generated for this PO' });

    const subtotal = po.amount;
    const gstPercentage = 18;
    const gstAmount = +(subtotal * gstPercentage / 100).toFixed(2);
    const totalAmount = +(subtotal + gstAmount).toFixed(2);

    const year = new Date().getFullYear();
    const start = new Date(`${year}-01-01T00:00:00.000Z`);
    const end = new Date(`${year + 1}-01-01T00:00:00.000Z`);
    const count = await Invoice.countDocuments({ generatedAt: { $gte: start, $lt: end } });
    const seq = count + 1;
    const invoiceNumber = `INV-${year}-${String(seq).padStart(4,'0')}`;

    const invoice = new Invoice({
      invoiceNumber,
      poId: po._id,
      vendorId: po.vendorId,
      subtotal,
      gstPercentage,
      gstAmount,
      totalAmount,
      status: 'Draft',
      generatedBy: req.user.id,
      generatedAt: new Date()
    });

    await invoice.save();
    await createLog(invoice._id, req.user.id, 'Generated', `Generated from PO ${po._id}`);
    res.status(201).json(invoice);
  } catch (err) { next(err); }
};

exports.getAllInvoices = async (req, res, next) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const filter = {};
    if (req.user.role === 'Vendor') {
      const vendor = await Vendor.findOne({ email: req.user.email.toLowerCase() });
      if (!vendor) return res.json([]);
      filter.vendorId = vendor._id;
    }
    const invoices = await Invoice.find(filter)
      .populate('poId')
      .populate('vendorId')
      .skip((page-1)*limit)
      .limit(parseInt(limit,10))
      .sort({ createdAt: -1 });
    res.json(invoices);
  } catch (err) { next(err); }
};

exports.getInvoiceById = async (req, res, next) => {
  try {
    const id = req.params.id;
    const invoice = await Invoice.findById(id)
      .populate({
        path: 'poId',
        populate: [
          { path: 'rfqId' },
          { path: 'quotationId' }
        ]
      })
      .populate('vendorId');
    if (!invoice) return res.status(404).json({ error: 'Invoice not found' });

    if (req.user.role === 'Vendor') {
      const vendor = await Vendor.findOne({ email: req.user.email.toLowerCase() });
      const targetVendorId = invoice.vendorId?._id ? invoice.vendorId._id.toString() : invoice.vendorId?.toString();
      if (!vendor || targetVendorId !== vendor._id.toString()) {
        return res.status(403).json({ error: 'Forbidden: you do not own this invoice' });
      }
    }
    res.json(invoice);
  } catch (err) { next(err); }
};

exports.updateStatus = async (req, res, next) => {
  try {
    const id = req.params.id;
    const { status, remarks } = req.body;
    const invoice = await Invoice.findById(id);
    if (!invoice) return res.status(404).json({ error: 'Invoice not found' });

    if (invoice.status === 'Paid' || invoice.status === 'Cancelled') return res.status(400).json({ error: 'Cannot change status of paid or cancelled invoice' });

    invoice.status = status;
    await invoice.save();
    await createLog(invoice._id, req.user.id, status === 'Sent' ? 'Sent' : (status === 'Paid' ? 'Paid' : (status === 'Cancelled' ? 'Cancelled' : 'Updated')), remarks);
    res.json(invoice);
  } catch (err) { next(err); }
};

// Generates PDF helper structure
function buildPDF(invoice, doc) {
  const vendor = invoice.vendorId || {};
  const po = invoice.poId || {};
  const rfq = po.rfqId || {};

  // Background accent header
  doc.rect(0, 0, 612, 120).fill('#0f172a');

  // Title
  doc.fillColor('#ffffff').fontSize(22).text('VendorBridge ERP Corp', 50, 40, { bold: true });
  doc.fontSize(10).fillColor('#94a3b8').text('Intelligent Procurement Lifecycle Solutions', 50, 70);

  // INVOICE text
  doc.fillColor('#ffffff').fontSize(20).text('INVOICE', 450, 40, { align: 'right' });
  doc.fontSize(10).fillColor('#e2e8f0');
  doc.text(`Invoice #: ${invoice.invoiceNumber}`, 400, 70, { align: 'right' });
  doc.text(`Date: ${new Date(invoice.createdAt).toLocaleDateString()}`, 400, 85, { align: 'right' });

  // Body content reset
  doc.fillColor('#1e293b');

  // Billing Details
  doc.fontSize(12).text('Company Details', 50, 150, { bold: true });
  doc.fontSize(10).fillColor('#475569');
  doc.text('VendorBridge ERP Ltd.', 50, 170);
  doc.text('GSTIN: 29AAACV1234F1Z0', 50, 185);
  doc.text('finance@vendorbridge.com', 50, 200);

  doc.fillColor('#1e293b');
  doc.fontSize(12).text('Vendor Details', 320, 150, { bold: true });
  doc.fontSize(10).fillColor('#475569');
  doc.text(vendor.companyName || 'N/A', 320, 170);
  doc.text(`GSTIN: ${vendor.gstNumber || 'N/A'}`, 320, 185);
  doc.text(`Email: ${vendor.email || 'N/A'}`, 320, 200);
  doc.text(`Address: ${vendor.address || 'N/A'}`, 320, 215);

  // Table Headers
  doc.rect(50, 260, 512, 25).fill('#f1f5f9');
  doc.fillColor('#0f172a').fontSize(10).text('Item / Product Description', 60, 268, { bold: true });
  doc.text('Qty', 320, 268, { bold: true });
  doc.text('Unit Price', 380, 268, { bold: true });
  doc.text('Total', 480, 268, { bold: true, align: 'right' });

  // Rows details
  const prodName = rfq.productName || 'Procured Items';
  const qty = rfq.quantity || 1;
  const unit = rfq.unit || 'pcs';
  const unitPrice = (invoice.subtotal / qty).toFixed(2);

  doc.fillColor('#334155');
  doc.text(`${prodName} (${qty} ${unit})`, 60, 300);
  doc.text(`${qty}`, 320, 300);
  doc.text(`$${unitPrice}`, 380, 300);
  doc.text(`$${invoice.subtotal.toFixed(2)}`, 480, 300, { align: 'right' });

  // Separator
  doc.moveTo(50, 330).lineTo(562, 330).stroke('#e2e8f0');

  // Breakdown Calculations
  doc.text('Subtotal:', 320, 350);
  doc.text(`$${invoice.subtotal.toFixed(2)}`, 480, 350, { align: 'right' });

  const cgst = (invoice.gstAmount / 2).toFixed(2);
  const sgst = (invoice.gstAmount / 2).toFixed(2);

  doc.text('CGST (9%):', 320, 370);
  doc.text(`$${cgst}`, 480, 370, { align: 'right' });

  doc.text('SGST (9%):', 320, 390);
  doc.text(`$${sgst}`, 480, 390, { align: 'right' });

  doc.moveTo(320, 410).lineTo(562, 410).stroke('#e2e8f0');

  doc.fontSize(12).fillColor('#0f172a').text('Grand Total:', 320, 420, { bold: true });
  doc.text(`$${invoice.totalAmount.toFixed(2)}`, 480, 420, { align: 'right', bold: true });

  // Box QR placeholder
  doc.rect(50, 350, 100, 100).stroke('#cbd5e1');
  doc.fontSize(8).fillColor('#64748b').text('QR Reference Code', 58, 435);

  // Footer note
  doc.fontSize(10).fillColor('#94a3b8').text('Thank you for choosing VendorBridge ERP.', 50, 500, { align: 'center' });
}

// Download PDF
exports.downloadPDF = async (req, res, next) => {
  try {
    const id = req.params.id;
    const invoice = await Invoice.findById(id)
      .populate({
        path: 'poId',
        populate: [
          { path: 'rfqId' },
          { path: 'quotationId' }
        ]
      })
      .populate('vendorId');
    if (!invoice) return res.status(404).json({ error: 'Invoice not found' });

    if (req.user.role === 'Vendor') {
      const vendor = await Vendor.findOne({ email: req.user.email.toLowerCase() });
      const targetVendorId = invoice.vendorId?._id ? invoice.vendorId._id.toString() : invoice.vendorId?.toString();
      if (!vendor || targetVendorId !== vendor._id.toString()) {
        return res.status(403).json({ error: 'Forbidden: you do not own this invoice' });
      }
    }

    const doc = new PDFDocument({ margin: 50 });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="invoice-${invoice.invoiceNumber}.pdf"`);

    doc.pipe(res);
    buildPDF(invoice, doc);
    doc.end();
  } catch (err) { next(err); }
};

// Send Email
exports.sendEmail = async (req, res, next) => {
  try {
    const id = req.params.id;
    const invoice = await Invoice.findById(id)
      .populate({
        path: 'poId',
        populate: [
          { path: 'rfqId' },
          { path: 'quotationId' }
        ]
      })
      .populate('vendorId');
    if (!invoice) return res.status(404).json({ error: 'Invoice not found' });

    const doc = new PDFDocument({ margin: 50 });
    const chunks = [];
    doc.on('data', (c) => chunks.push(c));
    doc.on('end', async () => {
      const pdfBuffer = Buffer.concat(chunks);
      const vendorEmail = invoice.vendorId?.email || 'vendor@example.com';

      const hasSmtp = process.env.SMTP_HOST && process.env.SMTP_USER;
      let transporter;
      if (hasSmtp) {
        transporter = nodemailer.createTransport({
          host: process.env.SMTP_HOST,
          port: parseInt(process.env.SMTP_PORT || 587, 10),
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS
          }
        });
      } else {
        transporter = nodemailer.createTransport({
          jsonTransport: true
        });
      }

      const mailOptions = {
        from: '"VendorBridge ERP" <finance@vendorbridge.com>',
        to: vendorEmail,
        subject: `Purchase Invoice: ${invoice.invoiceNumber}`,
        text: `Hello,\n\nPlease find attached the purchase invoice ${invoice.invoiceNumber} for your references.\n\nSummary:\nSubtotal: $${invoice.subtotal.toFixed(2)}\nCGST (9%): $${(invoice.gstAmount/2).toFixed(2)}\nSGST (9%): $${(invoice.gstAmount/2).toFixed(2)}\nGrand Total: $${invoice.totalAmount.toFixed(2)}\n\nBest Regards,\nFinance Team\nVendorBridge Procurement`,
        attachments: [
          {
            filename: `${invoice.invoiceNumber}.pdf`,
            content: pdfBuffer,
            contentType: 'application/pdf'
          }
        ]
      };

      try {
        const info = await transporter.sendMail(mailOptions);
        if (!hasSmtp) {
          console.log('--- MAIL SIMULATION (No SMTP Configured) ---');
          console.log(info);
        }
        await createLog(invoice._id, req.user.id, 'Sent', `Emailed to ${vendorEmail}`);
        res.json({ message: 'Email sent successfully!', info: hasSmtp ? info.messageId : 'stub_sent' });
      } catch (err) {
        console.error('Mail Send failed, logging simulation fallback', err);
        await createLog(invoice._id, req.user.id, 'Sent', `Emailed to ${vendorEmail} (simulation fallback)`);
        res.json({ message: 'Email sending simulated successfully (SMTP not configured)', error: err.message });
      }
    });

    buildPDF(invoice, doc);
    doc.end();
  } catch (err) { next(err); }
};
