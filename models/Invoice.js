const { v4: uuidv4 } = require('uuid');

class Invoice {
  constructor({ clientName, clientEmail, items, dueDate, notes = '' }) {
    this.id = uuidv4();
    this.clientName = clientName;
    this.clientEmail = clientEmail;
    this.items = items; // Array of { description, quantity, unitPrice }
    this.dueDate = dueDate;
    this.notes = notes;
    this.subtotal = this.calculateSubtotal();
    this.tax = this.calculateTax();
    this.total = this.subtotal + this.tax;
    this.status = 'draft'; // draft, sent, acknowledged, paid, overdue
    this.createdAt = new Date().toISOString();
    this.sentAt = null;
    this.acknowledgedAt = null;
    this.payments = [];
    this.receipts = [];
  }

  calculateSubtotal() {
    return this.items.reduce((sum, item) => {
      return sum + (item.quantity * item.unitPrice);
    }, 0);
  }

  calculateTax() {
    // Simple 10% tax calculation
    return this.subtotal * 0.10;
  }

  getPaidAmount() {
    return this.payments.reduce((sum, payment) => sum + payment.amount, 0);
  }

  getBalance() {
    return this.total - this.getPaidAmount();
  }

  markAsSent() {
    this.status = 'sent';
    this.sentAt = new Date().toISOString();
  }

  markAsAcknowledged() {
    if (this.status === 'sent' || this.status === 'acknowledged') {
      this.status = 'acknowledged';
      this.acknowledgedAt = new Date().toISOString();
    }
  }

  markAsPaid() {
    if (this.getBalance() <= 0) {
      this.status = 'paid';
    }
  }

  addPayment(payment) {
    this.payments.push(payment);
    this.markAsPaid();
  }

  addReceipt(receipt) {
    this.receipts.push(receipt);
  }
}

module.exports = Invoice;
