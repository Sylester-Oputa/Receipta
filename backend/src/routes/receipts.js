const express = require('express');
const router = express.Router();
const receiptController = require('../controllers/receiptController');

// GET all receipts
router.get('/', receiptController.getAllReceipts);

// GET a single receipt by ID
router.get('/:id', receiptController.getReceiptById);

// POST create a new receipt
router.post('/', receiptController.createReceipt);

// PUT update a receipt
router.put('/:id', receiptController.updateReceipt);

// DELETE a receipt
router.delete('/:id', receiptController.deleteReceipt);

module.exports = router;
