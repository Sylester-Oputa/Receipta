const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');

// Get invoices from the invoice routes module
let invoices;
setTimeout(() => {
  invoices = require('./invoices').invoices;
}, 0);

// Get all receipts
router.get('/', (req, res) => {
  try {
    const allInvoices = Array.from(invoices.values());
    const allReceipts = allInvoices.flatMap(invoice => invoice.receipts);
    
    res.json({ 
      count: allReceipts.length,
      receipts: allReceipts 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get receipts for a specific invoice
router.get('/invoice/:invoiceId', (req, res) => {
  try {
    const invoice = invoices.get(req.params.invoiceId);
    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    res.json({ 
      invoiceId: invoice.id,
      receipts: invoice.receipts 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Download receipt PDF
router.get('/:receiptNumber/download', (req, res) => {
  try {
    const allInvoices = Array.from(invoices.values());
    let receipt = null;
    
    for (const invoice of allInvoices) {
      receipt = invoice.receipts.find(r => r.receiptNumber === req.params.receiptNumber);
      if (receipt) break;
    }

    if (!receipt) {
      return res.status(404).json({ error: 'Receipt not found' });
    }

    if (!receipt.pdfPath || !fs.existsSync(receipt.pdfPath)) {
      return res.status(404).json({ error: 'Receipt PDF not found' });
    }

    res.download(receipt.pdfPath, `receipt-${receipt.receiptNumber}.pdf`);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = { router };
