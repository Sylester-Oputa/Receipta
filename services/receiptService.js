const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

class ReceiptService {
  generateReceiptPDF(receipt, invoice) {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({ margin: 50 });
        const fileName = `receipt-${receipt.receiptNumber}.pdf`;
        const filePath = path.join(__dirname, '..', 'receipts', fileName);
        
        // Ensure receipts directory exists
        const receiptsDir = path.join(__dirname, '..', 'receipts');
        if (!fs.existsSync(receiptsDir)) {
          fs.mkdirSync(receiptsDir, { recursive: true });
        }
        
        const stream = fs.createWriteStream(filePath);
        doc.pipe(stream);

        // Add content to PDF
        this.addHeader(doc, receipt);
        this.addClientInfo(doc, receipt, invoice);
        this.addPaymentDetails(doc, receipt);
        this.addInvoiceItems(doc, invoice);
        this.addFooter(doc);

        doc.end();

        stream.on('finish', () => {
          receipt.setPdfPath(filePath);
          resolve(filePath);
        });

        stream.on('error', reject);
      } catch (error) {
        reject(error);
      }
    });
  }

  addHeader(doc, receipt) {
    doc
      .fontSize(20)
      .text('OFFICIAL RECEIPT', 50, 50, { align: 'center' })
      .fontSize(10)
      .text('Receipta - Invoice and Payment Workflow Platform', { align: 'center' })
      .moveDown();

    doc
      .fontSize(12)
      .text(`Receipt Number: ${receipt.receiptNumber}`, 50, 120)
      .text(`Date: ${new Date(receipt.createdAt).toLocaleDateString()}`, 50, 140)
      .moveDown();
  }

  addClientInfo(doc, receipt, invoice) {
    doc
      .fontSize(14)
      .text('Bill To:', 50, 180)
      .fontSize(12)
      .text(receipt.clientName, 50, 200)
      .text(invoice.clientEmail, 50, 215)
      .moveDown();
  }

  addPaymentDetails(doc, receipt) {
    const yPosition = 260;
    
    doc
      .fontSize(14)
      .text('Payment Information', 50, yPosition)
      .fontSize(12)
      .text(`Payment ID: ${receipt.paymentId.slice(0, 8)}`, 50, yPosition + 20)
      .text(`Invoice ID: ${receipt.invoiceId.slice(0, 8)}`, 50, yPosition + 35)
      .text(`Amount Paid: $${receipt.amount.toFixed(2)}`, 50, yPosition + 50, { 
        fontSize: 16, 
        bold: true 
      })
      .moveDown();
  }

  addInvoiceItems(doc, invoice) {
    const tableTop = 360;
    const itemHeight = 20;
    
    doc
      .fontSize(14)
      .text('Items', 50, tableTop)
      .moveDown(0.5);

    // Table headers
    doc
      .fontSize(10)
      .text('Description', 50, tableTop + 30)
      .text('Qty', 300, tableTop + 30)
      .text('Unit Price', 350, tableTop + 30)
      .text('Total', 450, tableTop + 30);

    // Draw line under headers
    doc
      .moveTo(50, tableTop + 45)
      .lineTo(550, tableTop + 45)
      .stroke();

    // Table rows
    let y = tableTop + 55;
    invoice.items.forEach(item => {
      doc
        .fontSize(10)
        .text(item.description, 50, y, { width: 240 })
        .text(item.quantity.toString(), 300, y)
        .text(`$${item.unitPrice.toFixed(2)}`, 350, y)
        .text(`$${(item.quantity * item.unitPrice).toFixed(2)}`, 450, y);
      y += itemHeight;
    });

    // Draw line before totals
    y += 10;
    doc
      .moveTo(50, y)
      .lineTo(550, y)
      .stroke();

    // Totals
    y += 20;
    doc
      .fontSize(12)
      .text(`Subtotal:`, 350, y)
      .text(`$${invoice.subtotal.toFixed(2)}`, 450, y)
      .text(`Tax (10%):`, 350, y + 20)
      .text(`$${invoice.tax.toFixed(2)}`, 450, y + 20)
      .fontSize(14)
      .text(`Total:`, 350, y + 40)
      .text(`$${invoice.total.toFixed(2)}`, 450, y + 40);
  }

  addFooter(doc) {
    doc
      .fontSize(10)
      .text(
        'Thank you for your business!',
        50,
        700,
        { align: 'center' }
      )
      .text(
        'This is an official receipt issued by Receipta',
        { align: 'center' }
      );
  }
}

module.exports = new ReceiptService();
