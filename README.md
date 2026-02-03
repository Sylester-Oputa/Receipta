# Receipta

A full-stack receipt management application built with Next.js, Tailwind CSS, Express.js, PostgreSQL, and Prisma ORM.

## Project Structure

```
Receipta/
├── frontend/          # Next.js frontend with Tailwind CSS
│   ├── components/    # React components
│   ├── pages/        # Next.js pages
│   ├── styles/       # CSS styles
│   └── public/       # Static assets
└── backend/          # Express.js backend
    ├── src/          # Source code
    │   ├── routes/   # API routes
    │   ├── controllers/  # Route controllers
    │   └── index.js  # Server entry point
    └── prisma/       # Prisma schema and migrations
```

## Tech Stack

### Frontend
- **Next.js** - React framework for production
- **React** - UI library
- **Tailwind CSS** - Utility-first CSS framework

### Backend
- **Node.js** - JavaScript runtime
- **Express.js** - Web application framework
- **PostgreSQL** - Relational database
- **Prisma** - Modern ORM for Node.js

## Quick Start

### Prerequisites
- Node.js (v18 or higher)
- PostgreSQL database

### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
```

Edit `.env` with your database credentials:
```
DATABASE_URL="postgresql://user:password@localhost:5432/receipta_db?schema=public"
PORT=5000
```

4. Run Prisma migrations:
```bash
npm run prisma:migrate
```

5. Generate Prisma Client:
```bash
npm run prisma:generate
```

6. Start the backend server:
```bash
npm run dev
```

The backend API will be available at `http://localhost:5000`.

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.local.example .env.local
```

Edit `.env.local`:
```
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

4. Start the development server:
```bash
npm run dev
```

The frontend will be available at `http://localhost:3000`.

## Features

- ✅ Create, read, update, and delete receipts
- ✅ Categorize receipts
- ✅ Add descriptions and images to receipts
- ✅ Responsive design for mobile and desktop
- ✅ RESTful API architecture
- ✅ PostgreSQL database with Prisma ORM

## API Endpoints

### Receipts
- `GET /api/receipts` - Get all receipts
- `GET /api/receipts/:id` - Get a single receipt
- `POST /api/receipts` - Create a new receipt
- `PUT /api/receipts/:id` - Update a receipt
- `DELETE /api/receipts/:id` - Delete a receipt

### Health Check
- `GET /api/health` - Check API status

## Development

### Backend Development
```bash
cd backend
npm run dev  # Start with nodemon for auto-reload
```

### Frontend Development
```bash
cd frontend
npm run dev  # Start Next.js dev server
```

### Database Management
```bash
cd backend
npm run prisma:studio  # Open Prisma Studio to view/manage data
```

## License

MIT