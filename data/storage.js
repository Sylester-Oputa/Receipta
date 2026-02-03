// In-memory data storage
// In production, this should be replaced with a database

const invoices = new Map();
const payments = new Map();

module.exports = {
  invoices,
  payments
};
