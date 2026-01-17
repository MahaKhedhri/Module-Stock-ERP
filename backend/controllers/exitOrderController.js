const ExitOrder = require('../models/ExitOrder');

const getAllExitOrders = async (req, res, next) => {
  try {
    const orders = await ExitOrder.findAll();
    res.json(orders.map(formatExitOrder));
  } catch (error) {
    next(error);
  }
};

const getExitOrderById = async (req, res, next) => {
  try {
    const order = await ExitOrder.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ error: { message: 'Exit order not found' } });
    }
    res.json(formatExitOrder(order));
  } catch (error) {
    next(error);
  }
};

const createExitOrder = async (req, res, next) => {
  try {
    const order = await ExitOrder.create(req.body);
    res.status(201).json(formatExitOrder(order));
  } catch (error) {
    next(error);
  }
};

const updateExitOrder = async (req, res, next) => {
  try {
    const order = await ExitOrder.update(req.params.id, req.body);
    if (!order) {
      return res.status(404).json({ error: { message: 'Exit order not found' } });
    }
    res.json(formatExitOrder(order));
  } catch (error) {
    next(error);
  }
};

const deleteExitOrder = async (req, res, next) => {
  try {
    const order = await ExitOrder.delete(req.params.id);
    if (!order) {
      return res.status(404).json({ error: { message: 'Exit order not found' } });
    }
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

const confirmExitOrder = async (req, res, next) => {
  try {
    const order = await ExitOrder.confirm(req.params.id);
    res.json(formatExitOrder(order));
  } catch (error) {
    if (error.message === 'Exit order not found') {
      return res.status(404).json({ error: { message: error.message } });
    }
    if (error.message.includes('Insufficient stock') || error.message.includes('not found')) {
      return res.status(400).json({ error: { message: error.message } });
    }
    next(error);
  }
};

const closeExitOrder = async (req, res, next) => {
  try {
    const order = await ExitOrder.close(req.params.id);
    res.json(formatExitOrder(order));
  } catch (error) {
    if (error.message === 'Exit order not found' || error.message.includes('must be confirmed')) {
      return res.status(400).json({ error: { message: error.message } });
    }
    next(error);
  }
};

const formatExitOrder = (order) => ({
  id: order.id.toString(),
  customerName: order.customer_name,
  date: order.date,
  status: order.status,
  total: parseFloat(order.total || 0),
  note: order.note,
  lines: order.lines ? order.lines.map(line => ({
    id: line.id.toString(),
    productId: line.product_id.toString(),
    productName: line.product_name,
    sku: line.sku,
    quantity: parseInt(line.quantity),
    unitPrice: parseFloat(line.unit_price)
  })) : []
});

module.exports = {
  getAllExitOrders,
  getExitOrderById,
  createExitOrder,
  updateExitOrder,
  deleteExitOrder,
  confirmExitOrder,
  closeExitOrder
};

