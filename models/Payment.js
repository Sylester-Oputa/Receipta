const { v4: uuidv4 } = require('uuid');

class Payment {
  constructor({ invoiceId, amount, paymentMethod, notes = '' }) {
    this.id = uuidv4();
    this.invoiceId = invoiceId;
    this.amount = amount;
    this.paymentMethod = paymentMethod; // cash, credit_card, bank_transfer, check
    this.notes = notes;
    this.createdAt = new Date().toISOString();
    this.receiptGenerated = false;
  }
}

module.exports = Payment;
