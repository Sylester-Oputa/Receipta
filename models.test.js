const Invoice = require('./models/Invoice');
const Payment = require('./models/Payment');
const Receipt = require('./models/Receipt');

describe('Receipta Models', () => {
  describe('Invoice', () => {
    test('should create an invoice with correct calculations', () => {
      const invoice = new Invoice({
        clientName: 'Test Client',
        clientEmail: 'test@example.com',
        items: [
          { description: 'Item 1', quantity: 2, unitPrice: 100 },
          { description: 'Item 2', quantity: 1, unitPrice: 50 }
        ],
        dueDate: '2026-03-01',
        notes: 'Test notes'
      });

      expect(invoice.subtotal).toBe(250);
      expect(invoice.tax).toBe(25); // 10% of subtotal
      expect(invoice.total).toBe(275);
      expect(invoice.status).toBe('draft');
    });

    test('should calculate balance correctly', () => {
      const invoice = new Invoice({
        clientName: 'Test Client',
        clientEmail: 'test@example.com',
        items: [{ description: 'Item', quantity: 1, unitPrice: 100 }],
        dueDate: '2026-03-01'
      });

      expect(invoice.getBalance()).toBe(110); // 100 + 10% tax
      
      const payment = new Payment({
        invoiceId: invoice.id,
        amount: 50,
        paymentMethod: 'cash'
      });
      
      invoice.addPayment(payment);
      expect(invoice.getBalance()).toBe(60);
    });

    test('should mark invoice as sent', () => {
      const invoice = new Invoice({
        clientName: 'Test Client',
        clientEmail: 'test@example.com',
        items: [{ description: 'Item', quantity: 1, unitPrice: 100 }],
        dueDate: '2026-03-01'
      });

      expect(invoice.status).toBe('draft');
      expect(invoice.sentAt).toBeNull();
      
      invoice.markAsSent();
      
      expect(invoice.status).toBe('sent');
      expect(invoice.sentAt).not.toBeNull();
    });

    test('should mark invoice as acknowledged', () => {
      const invoice = new Invoice({
        clientName: 'Test Client',
        clientEmail: 'test@example.com',
        items: [{ description: 'Item', quantity: 1, unitPrice: 100 }],
        dueDate: '2026-03-01'
      });

      invoice.markAsSent();
      invoice.markAsAcknowledged();
      
      expect(invoice.status).toBe('acknowledged');
      expect(invoice.acknowledgedAt).not.toBeNull();
    });

    test('should mark invoice as paid when fully paid', () => {
      const invoice = new Invoice({
        clientName: 'Test Client',
        clientEmail: 'test@example.com',
        items: [{ description: 'Item', quantity: 1, unitPrice: 100 }],
        dueDate: '2026-03-01'
      });

      const payment = new Payment({
        invoiceId: invoice.id,
        amount: 110, // Full amount including tax
        paymentMethod: 'cash'
      });
      
      invoice.addPayment(payment);
      
      expect(invoice.status).toBe('paid');
      expect(invoice.getBalance()).toBe(0);
    });
  });

  describe('Payment', () => {
    test('should create a payment with correct properties', () => {
      const payment = new Payment({
        invoiceId: 'test-invoice-id',
        amount: 100,
        paymentMethod: 'credit_card',
        notes: 'Test payment'
      });

      expect(payment.id).toBeDefined();
      expect(payment.invoiceId).toBe('test-invoice-id');
      expect(payment.amount).toBe(100);
      expect(payment.paymentMethod).toBe('credit_card');
      expect(payment.receiptGenerated).toBe(false);
    });
  });

  describe('Receipt', () => {
    test('should create a receipt with unique receipt number', () => {
      const receipt1 = new Receipt({
        invoiceId: 'invoice-1',
        paymentId: 'payment-1',
        amount: 100,
        clientName: 'Test Client',
        items: []
      });

      const receipt2 = new Receipt({
        invoiceId: 'invoice-2',
        paymentId: 'payment-2',
        amount: 200,
        clientName: 'Test Client 2',
        items: []
      });

      expect(receipt1.receiptNumber).toBeDefined();
      expect(receipt2.receiptNumber).toBeDefined();
      expect(receipt1.receiptNumber).not.toBe(receipt2.receiptNumber);
    });

    test('should set PDF path', () => {
      const receipt = new Receipt({
        invoiceId: 'invoice-1',
        paymentId: 'payment-1',
        amount: 100,
        clientName: 'Test Client',
        items: []
      });

      expect(receipt.pdfPath).toBeNull();
      
      receipt.setPdfPath('/path/to/receipt.pdf');
      
      expect(receipt.pdfPath).toBe('/path/to/receipt.pdf');
    });
  });
});
