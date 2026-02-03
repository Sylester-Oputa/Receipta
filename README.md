# Receipta

**Invoice and Payment Workflow Platform**

Receipta is a comprehensive invoice and payment workflow platform that enables you to:
- 📝 **Send Invoices** - Create and send professional invoices to clients
- ✅ **Collect Client Acknowledgements** - Track when clients acknowledge receipt of invoices
- 💰 **Track Payments** - Record and monitor payments against invoices
- 🧾 **Generate Official Receipts** - Automatically generate PDF receipts for payments

All in one integrated system!

## Features

### Invoice Management
- Create detailed invoices with multiple line items
- Automatic calculation of subtotals, taxes, and totals
- Send invoices to clients via email
- Track invoice status (draft, sent, acknowledged, paid)
- View invoice history and details

### Client Acknowledgement System
- Email notifications with acknowledgement links
- Track when clients acknowledge receipt
- Automatic status updates

### Payment Tracking
- Record payments against invoices
- Support multiple payment methods (cash, credit card, bank transfer, check)
- Track payment history
- Calculate outstanding balances
- Prevent overpayment

### Receipt Generation
- Automatically generate official PDF receipts
- Professional receipt formatting with all transaction details
- Download receipts at any time
- Email receipts to clients

### Dashboard
- Real-time statistics
- Recent activity overview
- Quick access to all features

## Installation

### Prerequisites
- Node.js (v14 or higher)
- npm (v6 or higher)

### Setup

1. Clone the repository:
```bash
git clone https://github.com/Sylester-Oputa/Receipta.git
cd Receipta
```

2. Install dependencies:
```bash
npm install
```

3. Start the server:
```bash
npm start
```

The application will be available at `http://localhost:3000`

For development with auto-reload:
```bash
npm run dev
```

## Usage

### Creating an Invoice

1. Navigate to the **Invoices** tab
2. Fill in the client details (name and email)
3. Set the due date
4. Add invoice items with descriptions, quantities, and prices
5. Add any additional notes (optional)
6. Click **Create Invoice**

### Sending an Invoice

1. Find the invoice in the invoice list
2. Click **Send Invoice**
3. The invoice will be emailed to the client with an acknowledgement link

### Recording a Payment

1. Navigate to the **Payments** tab
2. Select the invoice from the dropdown
3. Enter the payment amount
4. Select the payment method
5. Add notes (optional)
6. Click **Record Payment**

### Generating a Receipt

1. Navigate to the **Payments** tab
2. Find the payment in the list
3. Click **Generate Receipt**
4. A PDF receipt will be created and emailed to the client
5. Download the receipt from the **Receipts** tab

## API Documentation

### Invoices

#### Create Invoice
```
POST /api/invoices
Content-Type: application/json

{
  "clientName": "John Doe",
  "clientEmail": "john@example.com",
  "items": [
    {
      "description": "Web Development",
      "quantity": 10,
      "unitPrice": 100.00
    }
  ],
  "dueDate": "2026-03-01",
  "notes": "Thank you for your business"
}
```

#### Get All Invoices
```
GET /api/invoices
```

#### Get Single Invoice
```
GET /api/invoices/:id
```

#### Send Invoice
```
POST /api/invoices/:id/send
```

#### Acknowledge Invoice
```
POST /api/invoices/:id/acknowledge
```

### Payments

#### Record Payment
```
POST /api/payments
Content-Type: application/json

{
  "invoiceId": "invoice-id",
  "amount": 550.00,
  "paymentMethod": "credit_card",
  "notes": "Paid via credit card"
}
```

#### Get All Payments
```
GET /api/payments
```

#### Get Payments for Invoice
```
GET /api/payments/invoice/:invoiceId
```

#### Generate Receipt
```
POST /api/payments/:id/generate-receipt
```

### Receipts

#### Get All Receipts
```
GET /api/receipts
```

#### Get Receipts for Invoice
```
GET /api/receipts/invoice/:invoiceId
```

#### Download Receipt PDF
```
GET /api/receipts/:receiptNumber/download
```

## Project Structure

```
Receipta/
├── models/
│   ├── Invoice.js      # Invoice data model
│   ├── Payment.js      # Payment data model
│   └── Receipt.js      # Receipt data model
├── routes/
│   ├── invoices.js     # Invoice API endpoints
│   ├── payments.js     # Payment API endpoints
│   └── receipts.js     # Receipt API endpoints
├── services/
│   ├── emailService.js # Email handling service
│   └── receiptService.js # PDF receipt generation
├── public/
│   ├── index.html      # Frontend interface
│   └── app.js          # Frontend JavaScript
├── receipts/           # Generated PDF receipts
├── server.js           # Express server
└── package.json        # Dependencies
```

## Technology Stack

- **Backend**: Node.js, Express
- **Email**: Nodemailer
- **PDF Generation**: PDFKit
- **Frontend**: Vanilla JavaScript, HTML5, CSS3
- **Storage**: In-memory (can be upgraded to database)

## Development

### Running Tests
```bash
npm test
```

### Project Configuration

The application uses in-memory storage by default. For production use, you should:
1. Replace in-memory storage with a database (MongoDB, PostgreSQL, etc.)
2. Configure email service with real SMTP credentials
3. Add authentication and authorization
4. Implement data persistence
5. Add security measures (rate limiting, input validation, etc.)

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

MIT License - see LICENSE file for details

## Support

For issues and questions, please open an issue on GitHub.
