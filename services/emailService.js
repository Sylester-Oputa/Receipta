const nodemailer = require('nodemailer');

class EmailService {
  constructor() {
    // For demo purposes, using ethereal email (test email service)
    // In production, configure with real SMTP settings
    this.transporter = null;
    this.initialized = false;
  }

  async initialize() {
    if (this.initialized) return;
    
    try {
      // Create test account for demo
      const testAccount = await nodemailer.createTestAccount();
      
      this.transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass,
        },
      });
      
      this.initialized = true;
    } catch (error) {
      console.error('Failed to initialize email service:', error);
    }
  }

  async sendInvoice(invoice) {
    await this.initialize();
    
    if (!this.transporter) {
      console.log('Email service not available - skipping email send');
      return { success: false, message: 'Email service not configured' };
    }

    const emailBody = this.generateInvoiceEmail(invoice);
    
    try {
      const info = await this.transporter.sendMail({
        from: '"Receipta" <noreply@receipta.com>',
        to: invoice.clientEmail,
        subject: `Invoice #${invoice.id.slice(0, 8)} from Receipta`,
        html: emailBody,
      });

      console.log('Invoice email sent:', nodemailer.getTestMessageUrl(info));
      return { 
        success: true, 
        messageId: info.messageId,
        previewUrl: nodemailer.getTestMessageUrl(info)
      };
    } catch (error) {
      console.error('Failed to send invoice email:', error);
      return { success: false, error: error.message };
    }
  }

  generateInvoiceEmail(invoice) {
    const itemsHtml = invoice.items.map(item => `
      <tr>
        <td>${item.description}</td>
        <td>${item.quantity}</td>
        <td>$${item.unitPrice.toFixed(2)}</td>
        <td>$${(item.quantity * item.unitPrice).toFixed(2)}</td>
      </tr>
    `).join('');

    return `
      <html>
        <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #333;">Invoice from Receipta</h1>
          <p>Dear ${invoice.clientName},</p>
          <p>Please find your invoice details below:</p>
          
          <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
            <thead>
              <tr style="background-color: #f0f0f0;">
                <th style="padding: 10px; text-align: left; border: 1px solid #ddd;">Description</th>
                <th style="padding: 10px; text-align: left; border: 1px solid #ddd;">Qty</th>
                <th style="padding: 10px; text-align: left; border: 1px solid #ddd;">Unit Price</th>
                <th style="padding: 10px; text-align: left; border: 1px solid #ddd;">Total</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>
          
          <div style="text-align: right; margin: 20px 0;">
            <p><strong>Subtotal:</strong> $${invoice.subtotal.toFixed(2)}</p>
            <p><strong>Tax (10%):</strong> $${invoice.tax.toFixed(2)}</p>
            <p style="font-size: 18px;"><strong>Total:</strong> $${invoice.total.toFixed(2)}</p>
          </div>
          
          <p><strong>Due Date:</strong> ${new Date(invoice.dueDate).toLocaleDateString()}</p>
          ${invoice.notes ? `<p><strong>Notes:</strong> ${invoice.notes}</p>` : ''}
          
          <p style="margin-top: 30px;">
            To acknowledge receipt of this invoice, please click the link below:<br>
            <a href="http://localhost:3000/acknowledge/${invoice.id}" style="color: #007bff;">Acknowledge Invoice</a>
          </p>
          
          <p style="color: #666; font-size: 12px; margin-top: 40px;">
            Thank you for your business!<br>
            Receipta - Invoice and Payment Workflow Platform
          </p>
        </body>
      </html>
    `;
  }

  async sendReceipt(receipt, invoice) {
    await this.initialize();
    
    if (!this.transporter) {
      console.log('Email service not available - skipping email send');
      return { success: false, message: 'Email service not configured' };
    }

    const emailBody = this.generateReceiptEmail(receipt, invoice);
    
    try {
      const info = await this.transporter.sendMail({
        from: '"Receipta" <noreply@receipta.com>',
        to: invoice.clientEmail,
        subject: `Receipt ${receipt.receiptNumber} from Receipta`,
        html: emailBody,
      });

      console.log('Receipt email sent:', nodemailer.getTestMessageUrl(info));
      return { 
        success: true, 
        messageId: info.messageId,
        previewUrl: nodemailer.getTestMessageUrl(info)
      };
    } catch (error) {
      console.error('Failed to send receipt email:', error);
      return { success: false, error: error.message };
    }
  }

  generateReceiptEmail(receipt, invoice) {
    return `
      <html>
        <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #333;">Official Receipt</h1>
          <p>Dear ${receipt.clientName},</p>
          <p>Thank you for your payment. Here are your receipt details:</p>
          
          <div style="background-color: #f9f9f9; padding: 20px; border-radius: 5px; margin: 20px 0;">
            <p><strong>Receipt Number:</strong> ${receipt.receiptNumber}</p>
            <p><strong>Invoice ID:</strong> ${invoice.id.slice(0, 8)}</p>
            <p><strong>Payment Amount:</strong> $${receipt.amount.toFixed(2)}</p>
            <p><strong>Date:</strong> ${new Date(receipt.createdAt).toLocaleString()}</p>
          </div>
          
          <p>You can download your receipt PDF from the Receipta platform.</p>
          
          <p style="color: #666; font-size: 12px; margin-top: 40px;">
            Thank you for your business!<br>
            Receipta - Invoice and Payment Workflow Platform
          </p>
        </body>
      </html>
    `;
  }
}

module.exports = new EmailService();
