const express = require('express');
const router = express.Router();
const Payment = require('../models/Payment');
const Receipt = require('../models/Receipt');
const receiptService = require('../services/receiptService');
const emailService = require('../services/emailService');

// Get invoices from the invoice routes module
let invoices;
setTimeout(() => {
  invoices = require('./invoices').invoices;
}, 0);

// In-memory storage
const payments = new Map();

// Record a new payment
router.post('/', async (req, res) => {
  try {
    const { invoiceId, amount, paymentMethod, notes } = req.body;
    
    // Validation
    if (!invoiceId || !amount || !paymentMethod) {
      return res.status(400).json({ 
        error: 'Missing required fields: invoiceId, amount, paymentMethod' 
      });
    }

    const invoice = invoices.get(invoiceId);
    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    if (amount <= 0) {
      return res.status(400).json({ error: 'Payment amount must be positive' });
    }

    const balance = invoice.getBalance();
    if (amount > balance) {
      return res.status(400).json({ 
        error: `Payment amount ($${amount}) exceeds invoice balance ($${balance.toFixed(2)})` 
      });
    }

    // Create payment
    const payment = new Payment({ invoiceId, amount, paymentMethod, notes });
    payments.set(payment.id, payment);
    
    // Add payment to invoice
    invoice.addPayment(payment);
    
    res.status(201).json({ 
      message: 'Payment recorded successfully', 
      payment,
      invoice: {
        id: invoice.id,
        total: invoice.total,
        paidAmount: invoice.getPaidAmount(),
        balance: invoice.getBalance(),
        status: invoice.status
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all payments
router.get('/', (req, res) => {
  try {
    const allPayments = Array.from(payments.values());
    res.json({ 
      count: allPayments.length,
      payments: allPayments 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get payments for a specific invoice
router.get('/invoice/:invoiceId', (req, res) => {
  try {
    const invoice = invoices.get(req.params.invoiceId);
    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    res.json({ 
      invoiceId: invoice.id,
      payments: invoice.payments,
      totalPaid: invoice.getPaidAmount(),
      balance: invoice.getBalance()
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get a single payment
router.get('/:id', (req, res) => {
  try {
    const payment = payments.get(req.params.id);
    if (!payment) {
      return res.status(404).json({ error: 'Payment not found' });
    }
    res.json({ payment });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Generate receipt for a payment
router.post('/:id/generate-receipt', async (req, res) => {
  try {
    const payment = payments.get(req.params.id);
    if (!payment) {
      return res.status(404).json({ error: 'Payment not found' });
    }

    if (payment.receiptGenerated) {
      return res.status(400).json({ 
        error: 'Receipt already generated for this payment' 
      });
    }

    const invoice = invoices.get(payment.invoiceId);
    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    // Create receipt
    const receipt = new Receipt({
      invoiceId: payment.invoiceId,
      paymentId: payment.id,
      amount: payment.amount,
      clientName: invoice.clientName,
      items: invoice.items
    });

    // Generate PDF
    const pdfPath = await receiptService.generateReceiptPDF(receipt, invoice);
    
    // Mark payment as having receipt
    payment.receiptGenerated = true;
    
    // Add receipt to invoice
    invoice.addReceipt(receipt);

    // Send receipt via email
    const emailResult = await emailService.sendReceipt(receipt, invoice);
    
    res.status(201).json({ 
      message: 'Receipt generated successfully', 
      receipt,
      pdfPath,
      emailResult
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = { router, payments };
