const StockMovement = require('../models/StockMovement');

const getAllStockMovements = async (req, res, next) => {
  try {
    const movements = await StockMovement.findAll();
    res.json(movements.map(formatStockMovement));
  } catch (error) {
    next(error);
  }
};

const getStockMovementById = async (req, res, next) => {
  try {
    const movement = await StockMovement.findById(req.params.id);
    if (!movement) {
      return res.status(404).json({ error: { message: 'Stock movement not found' } });
    }
    res.json(formatStockMovement(movement));
  } catch (error) {
    next(error);
  }
};

const createStockMovement = async (req, res, next) => {
  try {
    const data = {
      productId: req.body.productId || req.body.product_id,
      type: req.body.type,
      quantity: req.body.quantity,
      date: req.body.date,
      reference: req.body.reference,
      note: req.body.note
    };
    
    const movement = await StockMovement.create(data);
    res.status(201).json(formatStockMovement(movement));
  } catch (error) {
    next(error);
  }
};

const updateStockMovement = async (req, res, next) => {
  try {
    const data = {
      productId: req.body.productId || req.body.product_id,
      type: req.body.type,
      quantity: req.body.quantity,
      date: req.body.date,
      reference: req.body.reference,
      note: req.body.note
    };
    
    const movement = await StockMovement.update(req.params.id, data);
    if (!movement) {
      return res.status(404).json({ error: { message: 'Stock movement not found' } });
    }
    res.json(formatStockMovement(movement));
  } catch (error) {
    next(error);
  }
};

const deleteStockMovement = async (req, res, next) => {
  try {
    const movement = await StockMovement.delete(req.params.id);
    if (!movement) {
      return res.status(404).json({ error: { message: 'Stock movement not found' } });
    }
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

const formatStockMovement = (movement) => ({
  id: movement.id.toString(),
  productId: movement.product_id.toString(),
  type: movement.type,
  quantity: parseInt(movement.quantity),
  date: movement.date,
  reference: movement.reference,
  note: movement.note
});

module.exports = {
  getAllStockMovements,
  getStockMovementById,
  createStockMovement,
  updateStockMovement,
  deleteStockMovement
};

