const PurchaseOrderLine = require('../models/PurchaseOrderLine');

const getAllPurchaseOrderLines = async (req, res, next) => {
  try {
    const lines = await PurchaseOrderLine.findAll();
    res.json(lines.map(formatPurchaseOrderLine));
  } catch (error) {
    next(error);
  }
};

const getPurchaseOrderLineById = async (req, res, next) => {
  try {
    const line = await PurchaseOrderLine.findById(req.params.id);
    if (!line) {
      return res.status(404).json({ error: { message: 'Purchase order line not found' } });
    }
    res.json(formatPurchaseOrderLine(line));
  } catch (error) {
    next(error);
  }
};

const createPurchaseOrderLine = async (req, res, next) => {
  try {
    const data = {
      purchaseOrderId: req.body.purchaseOrderId || req.body.purchase_order_id,
      productId: req.body.productId || req.body.product_id,
      quantity: req.body.quantity,
      unitPrice: req.body.unitPrice || req.body.unit_price
    };
    
    const line = await PurchaseOrderLine.create(data);
    res.status(201).json(formatPurchaseOrderLine(line));
  } catch (error) {
    next(error);
  }
};

const updatePurchaseOrderLine = async (req, res, next) => {
  try {
    const data = {
      productId: req.body.productId || req.body.product_id,
      quantity: req.body.quantity,
      unitPrice: req.body.unitPrice || req.body.unit_price
    };
    
    const line = await PurchaseOrderLine.update(req.params.id, data);
    if (!line) {
      return res.status(404).json({ error: { message: 'Purchase order line not found' } });
    }
    res.json(formatPurchaseOrderLine(line));
  } catch (error) {
    next(error);
  }
};

const deletePurchaseOrderLine = async (req, res, next) => {
  try {
    const line = await PurchaseOrderLine.delete(req.params.id);
    if (!line) {
      return res.status(404).json({ error: { message: 'Purchase order line not found' } });
    }
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

const formatPurchaseOrderLine = (line) => ({
  id: line.id.toString(),
  purchaseOrderId: line.purchase_order_id.toString(),
  productId: line.product_id.toString(),
  quantity: parseInt(line.quantity),
  unitPrice: parseFloat(line.unit_price)
});

module.exports = {
  getAllPurchaseOrderLines,
  getPurchaseOrderLineById,
  createPurchaseOrderLine,
  updatePurchaseOrderLine,
  deletePurchaseOrderLine
};

