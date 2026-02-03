# Receipta Frontend

Frontend application for Receipta using Next.js and Tailwind CSS.

## Prerequisites

- Node.js (v18 or higher)

## Setup

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
```bash
cp .env.local.example .env.local
```

Edit `.env.local` with your backend API URL:
```
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

## Running the Application

Development mode:
```bash
npm run dev
```

The application will be available at `http://localhost:3000`.

Production build:
```bash
npm run build
npm start
```

## Features

- View all receipts
- Add new receipts
- Edit existing receipts
- Delete receipts
- Categorize receipts
- Responsive design with Tailwind CSS

## Tech Stack

- **Next.js** - React framework
- **React** - UI library
- **Tailwind CSS** - Utility-first CSS framework
- **Axios** - HTTP client (available for use)
