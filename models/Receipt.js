const { v4: uuidv4 } = require('uuid');

class Receipt {
  constructor({ invoiceId, paymentId, amount, clientName, items }) {
    this.id = uuidv4();
    this.receiptNumber = this.generateReceiptNumber();
    this.invoiceId = invoiceId;
    this.paymentId = paymentId;
    this.amount = amount;
    this.clientName = clientName;
    this.items = items;
    this.createdAt = new Date().toISOString();
    this.pdfPath = null;
  }

  generateReceiptNumber() {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000);
    return `REC-${timestamp}-${random}`;
  }

  setPdfPath(path) {
    this.pdfPath = path;
  }
}

module.exports = Receipt;
