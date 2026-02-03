# Receipta Backend

Backend API for Receipta application using Express.js, PostgreSQL, and Prisma ORM.

## Prerequisites

- Node.js (v18 or higher)
- PostgreSQL database

## Setup

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
```bash
cp .env.example .env
```

Edit `.env` with your database credentials:
```
DATABASE_URL="postgresql://user:password@localhost:5432/receipta_db?schema=public"
PORT=5000
```

3. Run Prisma migrations:
```bash
npm run prisma:migrate
```

4. Generate Prisma Client:
```bash
npm run prisma:generate
```

## Running the Server

Development mode with auto-reload:
```bash
npm run dev
```

Production mode:
```bash
npm start
```

## API Endpoints

### Receipts
- `GET /api/receipts` - Get all receipts
- `GET /api/receipts/:id` - Get a single receipt
- `POST /api/receipts` - Create a new receipt
- `PUT /api/receipts/:id` - Update a receipt
- `DELETE /api/receipts/:id` - Delete a receipt

### Health Check
- `GET /api/health` - Check API status

## Prisma Studio

To view and manage your database with Prisma Studio:
```bash
npm run prisma:studio
```
