const express = require('express');
const router = express.Router();
const Invoice = require('../models/Invoice');
const emailService = require('../services/emailService');
const { invoices } = require('../data/storage');

// Create a new invoice
router.post('/', async (req, res) => {
  try {
    const { clientName, clientEmail, items, dueDate, notes } = req.body;
    
    // Validation
    if (!clientName || !clientEmail || !items || !dueDate) {
      return res.status(400).json({ 
        error: 'Missing required fields: clientName, clientEmail, items, dueDate' 
      });
    }

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Items must be a non-empty array' });
    }

    const invoice = new Invoice({ clientName, clientEmail, items, dueDate, notes });
    invoices.set(invoice.id, invoice);
    
    res.status(201).json({ 
      message: 'Invoice created successfully', 
      invoice 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all invoices
router.get('/', (req, res) => {
  try {
    const allInvoices = Array.from(invoices.values());
    res.json({ 
      count: allInvoices.length,
      invoices: allInvoices 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get a single invoice
router.get('/:id', (req, res) => {
  try {
    const invoice = invoices.get(req.params.id);
    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found' });
    }
    res.json({ invoice });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Send an invoice to client
router.post('/:id/send', async (req, res) => {
  try {
    const invoice = invoices.get(req.params.id);
    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    if (invoice.status !== 'draft') {
      return res.status(400).json({ 
        error: 'Invoice has already been sent',
        currentStatus: invoice.status
      });
    }

    // Send email
    const emailResult = await emailService.sendInvoice(invoice);
    
    // Mark invoice as sent
    invoice.markAsSent();
    
    res.json({ 
      message: 'Invoice sent successfully', 
      invoice,
      emailResult
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Acknowledge an invoice (typically called by client)
router.post('/:id/acknowledge', (req, res) => {
  try {
    const invoice = invoices.get(req.params.id);
    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    if (invoice.status === 'draft') {
      return res.status(400).json({ 
        error: 'Cannot acknowledge a draft invoice' 
      });
    }

    invoice.markAsAcknowledged();
    
    res.json({ 
      message: 'Invoice acknowledged successfully', 
      invoice 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update an invoice (only if still in draft)
router.put('/:id', (req, res) => {
  try {
    const invoice = invoices.get(req.params.id);
    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    if (invoice.status !== 'draft') {
      return res.status(400).json({ 
        error: 'Cannot modify invoice after it has been sent' 
      });
    }

    const { clientName, clientEmail, items, dueDate, notes } = req.body;
    
    if (clientName) invoice.clientName = clientName;
    if (clientEmail) invoice.clientEmail = clientEmail;
    if (items) {
      invoice.items = items;
      invoice.subtotal = invoice.calculateSubtotal();
      invoice.tax = invoice.calculateTax();
      invoice.total = invoice.subtotal + invoice.tax;
    }
    if (dueDate) invoice.dueDate = dueDate;
    if (notes !== undefined) invoice.notes = notes;
    
    res.json({ 
      message: 'Invoice updated successfully', 
      invoice 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete an invoice (only if still in draft)
router.delete('/:id', (req, res) => {
  try {
    const invoice = invoices.get(req.params.id);
    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    if (invoice.status !== 'draft') {
      return res.status(400).json({ 
        error: 'Cannot delete invoice after it has been sent' 
      });
    }

    invoices.delete(req.params.id);
    res.json({ message: 'Invoice deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = { router, invoices };
