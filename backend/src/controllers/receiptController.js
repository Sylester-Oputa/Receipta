const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Get all receipts
const getAllReceipts = async (req, res) => {
  try {
    const receipts = await prisma.receipt.findMany({
      orderBy: {
        createdAt: 'desc',
      },
    });
    res.json(receipts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get a single receipt by ID
const getReceiptById = async (req, res) => {
  try {
    const { id } = req.params;
    const receipt = await prisma.receipt.findUnique({
      where: { id },
    });
    
    if (!receipt) {
      return res.status(404).json({ error: 'Receipt not found' });
    }
    
    res.json(receipt);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Create a new receipt
const createReceipt = async (req, res) => {
  try {
    const { title, amount, date, category, description, imageUrl } = req.body;
    
    const receipt = await prisma.receipt.create({
      data: {
        title,
        amount: parseFloat(amount),
        date: new Date(date),
        category,
        description,
        imageUrl,
      },
    });
    
    res.status(201).json(receipt);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update a receipt
const updateReceipt = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, amount, date, category, description, imageUrl } = req.body;
    
    const receipt = await prisma.receipt.update({
      where: { id },
      data: {
        ...(title && { title }),
        ...(amount && { amount: parseFloat(amount) }),
        ...(date && { date: new Date(date) }),
        ...(category && { category }),
        ...(description !== undefined && { description }),
        ...(imageUrl !== undefined && { imageUrl }),
      },
    });
    
    res.json(receipt);
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Receipt not found' });
    }
    res.status(500).json({ error: error.message });
  }
};

// Delete a receipt
const deleteReceipt = async (req, res) => {
  try {
    const { id } = req.params;
    
    await prisma.receipt.delete({
      where: { id },
    });
    
    res.json({ message: 'Receipt deleted successfully' });
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Receipt not found' });
    }
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  getAllReceipts,
  getReceiptById,
  createReceipt,
  updateReceipt,
  deleteReceipt,
};
