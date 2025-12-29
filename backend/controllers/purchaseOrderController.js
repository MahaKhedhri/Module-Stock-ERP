const PurchaseOrder = require('../models/PurchaseOrder');

const getAllPurchaseOrders = async (req, res, next) => {
  try {
    const orders = await PurchaseOrder.findAll();
    res.json(orders.map(formatPurchaseOrder));
  } catch (error) {
    next(error);
  }
};

const getPurchaseOrderById = async (req, res, next) => {
  try {
    const order = await PurchaseOrder.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ error: { message: 'Purchase order not found' } });
    }
    res.json(formatPurchaseOrder(order));
  } catch (error) {
    next(error);
  }
};

const createPurchaseOrder = async (req, res, next) => {
  try {
    // Transform camelCase to snake_case for model
    const data = {
      supplierId: req.body.supplierId || req.body.supplier_id,
      date: req.body.date,
      status: req.body.status || 'draft',
      lines: (req.body.lines || []).map(line => ({
        productId: line.productId || line.product_id,
        quantity: line.quantity,
        unitPrice: line.unitPrice || line.unit_price
      }))
    };
    
    const order = await PurchaseOrder.create(data);
    res.status(201).json(formatPurchaseOrder(order));
  } catch (error) {
    next(error);
  }
};

const updatePurchaseOrder = async (req, res, next) => {
  try {
    const data = {
      supplierId: req.body.supplierId || req.body.supplier_id,
      date: req.body.date,
      status: req.body.status,
      lines: req.body.lines ? req.body.lines.map(line => ({
        productId: line.productId || line.product_id,
        quantity: line.quantity,
        unitPrice: line.unitPrice || line.unit_price
      })) : undefined
    };
    
    const order = await PurchaseOrder.update(req.params.id, data);
    if (!order) {
      return res.status(404).json({ error: { message: 'Purchase order not found' } });
    }
    res.json(formatPurchaseOrder(order));
  } catch (error) {
    next(error);
  }
};

const deletePurchaseOrder = async (req, res, next) => {
  try {
    const order = await PurchaseOrder.delete(req.params.id);
    if (!order) {
      return res.status(404).json({ error: { message: 'Purchase order not found' } });
    }
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

const receivePurchaseOrder = async (req, res, next) => {
  try {
    const order = await PurchaseOrder.receive(req.params.id);
    res.json(formatPurchaseOrder(order));
  } catch (error) {
    if (error.message.includes('not found') || error.message.includes('already received')) {
      return res.status(422).json({ error: { message: error.message } });
    }
    next(error);
  }
};

const formatPurchaseOrder = (order) => ({
  id: order.id.toString(),
  supplierId: order.supplier_id.toString(),
  date: order.date,
  status: order.status,
  total: parseFloat(order.total),
  lines: (order.lines || []).map(line => ({
    productId: line.product_id.toString(),
    quantity: parseInt(line.quantity),
    unitPrice: parseFloat(line.unit_price)
  }))
});

module.exports = {
  getAllPurchaseOrders,
  getPurchaseOrderById,
  createPurchaseOrder,
  updatePurchaseOrder,
  deletePurchaseOrder,
  receivePurchaseOrder
};

