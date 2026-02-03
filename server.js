const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Routes
const invoiceRoutes = require('./routes/invoices');
const paymentRoutes = require('./routes/payments');
const receiptRoutes = require('./routes/receipts');

app.use('/api/invoices', invoiceRoutes.router);
app.use('/api/payments', paymentRoutes.router);
app.use('/api/receipts', receiptRoutes.router);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'Receipta API is running',
    timestamp: new Date().toISOString()
  });
});

// Root endpoint
app.get('/api', (req, res) => {
  res.json({
    name: 'Receipta API',
    version: '1.0.0',
    description: 'Invoice and payment workflow platform',
    endpoints: {
      invoices: '/api/invoices',
      payments: '/api/payments',
      receipts: '/api/receipts',
      health: '/api/health'
    }
  });
});

// Serve the frontend for all other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ 
    error: 'Internal server error',
    message: err.message 
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`\n🚀 Receipta server is running on http://localhost:${PORT}`);
  console.log(`📊 API endpoints available at http://localhost:${PORT}/api`);
  console.log(`\nAvailable endpoints:`);
  console.log(`  - GET    /api/health`);
  console.log(`  - GET    /api/invoices`);
  console.log(`  - POST   /api/invoices`);
  console.log(`  - GET    /api/invoices/:id`);
  console.log(`  - POST   /api/invoices/:id/send`);
  console.log(`  - POST   /api/invoices/:id/acknowledge`);
  console.log(`  - GET    /api/payments`);
  console.log(`  - POST   /api/payments`);
  console.log(`  - POST   /api/payments/:id/generate-receipt`);
  console.log(`  - GET    /api/receipts`);
  console.log(`  - GET    /api/receipts/:receiptNumber/download`);
});

module.exports = app;
