const PDFDocument = require('pdfkit');
const fs = require('fs');

const invoice = {
  invoiceNumber: 'INV-2026-0001',
  createdAt: new Date(),
  subtotal: 1200,
  gstPercentage: 18,
  gstAmount: 216,
  totalAmount: 1416,
  vendorId: {
    companyName: 'Test Vendor Inc',
    gstNumber: '29AAAAA1111A1Z1',
    email: 'vendor@example.com',
    address: '123 Main Street'
  },
  poId: {
    poNumber: 'PO-2026-0001',
    rfqId: {
      productName: 'Office Stationary Pack',
      quantity: 10,
      unit: 'packs'
    }
  }
};

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

try {
  const doc = new PDFDocument({ margin: 50 });
  doc.pipe(fs.createWriteStream('test-invoice.pdf'));
  buildPDF(invoice, doc);
  doc.end();
  console.log('Invoice PDF generated successfully without crash!');
} catch (err) {
  console.error('Invoice PDF generation crashed:', err);
}
