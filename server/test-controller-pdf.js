const connectDB = require('./src/db');
const { Invoice } = require('./src/models');
const { downloadPDF } = require('./src/controllers/invoice.controller');
const fs = require('fs');

async function test() {
  try {
    await connectDB();
    const inv = await Invoice.findOne();
    if (!inv) {
      console.log('No invoices found in database.');
      process.exit(0);
    }
    console.log('Testing PDF controller with Invoice ID:', inv._id);

    // Mock Express request & response objects
    const req = {
      params: { id: inv._id.toString() },
      user: { role: 'Admin' }
    };
    const res = {
      headers: {},
      setHeader(name, val) {
        this.headers[name] = val;
      },
      write(chunk) {
        // mock stream write
      },
      on(event, handler) {
        // mock event listener
      },
      once() {},
      emit() {},
      end() {
        console.log('PDF stream completed successfully!');
        console.log('Headers:', this.headers);
        process.exit(0);
      }
    };

    const next = (err) => {
      if (err) {
        console.error('Controller failed with error:', err);
      }
      process.exit(1);
    };

    await downloadPDF(req, res, next);
  } catch (e) {
    console.error('Test crashed:', e);
    process.exit(1);
  }
}

test();
