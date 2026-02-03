# Receipta Backend

Receipta is an invoice + client acknowledgement + payment receipt platform. This backend is built with Node.js, Express, TypeScript, PostgreSQL, Prisma, JWT auth, and Zod validation.

## Requirements
- Node.js 18+
- PostgreSQL 14+

## Setup
1. Copy `.env.example` to `.env` and update values.
2. Create the database:
   ```bash
   createdb receipta_db
   createdb receipta_test
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Run Prisma migrations:
   ```bash
   npm run prisma:migrate
   ```
5. Seed the initial business + owner:
   ```bash
   npm run prisma:seed
   ```

## Run the Server
```bash
npm run dev
```
The server runs on `http://localhost:4000` by default.

## Swagger Docs
Open `http://localhost:4000/docs` after the server starts.

## Example cURL Flows
### Login
```bash
curl -X POST http://localhost:4000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"owner@receipta.local","password":"ChangeMe123!"}'
```

### Create Client
```bash
curl -X POST http://localhost:4000/api/v1/clients \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"name":"Acme Corp","email":"billing@acme.com"}'
```

### Create Invoice
```bash
curl -X POST http://localhost:4000/api/v1/invoices \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "clientId":"<CLIENT_ID>",
    "currency":"USD",
    "taxRate":7.5,
    "items":[
      {"description":"Design work","qty":2,"unitPrice":150}
    ]
  }'
```

### Send Invoice (get public tokens)
```bash
curl -X POST http://localhost:4000/api/v1/invoices/<INVOICE_ID>/send \
  -H "Authorization: Bearer <TOKEN>"
```

### Public View
```bash
curl http://localhost:4000/api/v1/public/invoices/view/<VIEW_TOKEN>
```

### Public Sign (data URL signature)
```bash
curl -X POST http://localhost:4000/api/v1/public/invoices/sign/<SIGN_TOKEN> \
  -H "Content-Type: application/json" \
  -d '{
    "signerName":"Jane Doe",
    "signerEmail":"jane@client.com",
    "acknowledge":true,
    "signatureDataUrl":"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR4nGNgYAAAAAMAASsJTYQAAAAASUVORK5CYII="
  }'
```

### Record Payment
```bash
curl -X POST http://localhost:4000/api/v1/invoices/<INVOICE_ID>/payments \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"amount":100,"method":"CARD"}'
```

### Get Receipt PDF
```bash
curl http://localhost:4000/api/v1/receipts/<RECEIPT_ID>/pdf \
  -H "Authorization: Bearer <TOKEN>" --output receipt.pdf
```

## Notes
- Invoice edits are only allowed in `DRAFT` status.
- `/send` creates public view + sign tokens (hashed in DB).
- `/sign` locks the invoice and stores a signed PDF snapshot + SHA-256 hash.
- Payments are immutable and always generate a receipt.
- Overpayments are blocked unless `business.allowOverpay=true`.
- `taxRate` is a percentage (e.g., `7.5` for 7.5%).

## Testing
Set `TEST_DATABASE_URL` in `.env` and run:
```bash
npm test
```

## Prisma
- Generate client: `npm run prisma:generate`
- Studio: `npm run prisma:studio`
