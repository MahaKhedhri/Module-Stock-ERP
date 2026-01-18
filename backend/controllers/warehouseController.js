const Warehouse = require('../models/Warehouse');

const getAllWarehouses = async (req, res, next) => {
  try {
    const warehouses = await Warehouse.findAll();
    res.json(warehouses.map(formatWarehouse));
  } catch (error) {
    next(error);
  }
};

const getWarehouseById = async (req, res, next) => {
  try {
    const warehouse = await Warehouse.findById(req.params.id);
    if (!warehouse) {
      return res.status(404).json({ error: { message: 'Warehouse not found' } });
    }
    res.json(formatWarehouse(warehouse));
  } catch (error) {
    next(error);
  }
};

const createWarehouse = async (req, res, next) => {
  try {
    const warehouse = await Warehouse.create(req.body);
    res.status(201).json(formatWarehouse(warehouse));
  } catch (error) {
    next(error);
  }
};

const updateWarehouse = async (req, res, next) => {
  try {
    const warehouse = await Warehouse.update(req.params.id, req.body);
    if (!warehouse) {
      return res.status(404).json({ error: { message: 'Warehouse not found' } });
    }
    res.json(formatWarehouse(warehouse));
  } catch (error) {
    next(error);
  }
};

const deleteWarehouse = async (req, res, next) => {
  try {
    const warehouse = await Warehouse.delete(req.params.id);
    if (!warehouse) {
      return res.status(404).json({ error: { message: 'Warehouse not found' } });
    }
    res.status(204).send();
  } catch (error) {
    if (error.message.includes('Cannot delete')) {
      return res.status(400).json({ error: { message: error.message } });
    }
    next(error);
  }
};

const assignProduct = async (req, res, next) => {
  try {
    const { productId, quantity, shelf, expirationDate, zoneId } = req.body;
    const qty = Math.max(0, parseInt(quantity) || 0); // Ensure non-negative
    const assignment = await Warehouse.assignProduct(req.params.id, productId, qty, shelf, expirationDate, zoneId);
    res.json(assignment);
  } catch (error) {
    if (error.message.includes('déjà assigné')) {
      return res.status(400).json({ error: { message: error.message } });
    }
    next(error);
  }
};

const removeProduct = async (req, res, next) => {
  try {
    const { productId } = req.params;
    const result = await Warehouse.removeProduct(req.params.id, productId);
    if (!result) {
      return res.status(404).json({ error: { message: 'Product not found in warehouse' } });
    }
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

const updateProductQuantity = async (req, res, next) => {
  try {
    const { productId, quantity } = req.body;
    const qty = Math.max(0, parseInt(quantity) || 0); // Ensure non-negative
    const result = await Warehouse.updateProductQuantity(req.params.id, productId, qty);
    if (!result) {
      return res.status(404).json({ error: { message: 'Product not found in warehouse' } });
    }
    res.json(result);
  } catch (error) {
    next(error);
  }
};

const moveProduct = async (req, res, next) => {
  try {
    const { toWarehouseId, productId, quantity, shelf, expirationDate, zoneId } = req.body;
    const qty = Math.max(0, parseInt(quantity) || 0); // Ensure non-negative
    await Warehouse.moveProduct(req.params.id, toWarehouseId, productId, qty, shelf, expirationDate, zoneId);
    res.json({ success: true, message: 'Product moved successfully' });
  } catch (error) {
    if (error.message.includes('Insufficient') || error.message.includes('déjà') || error.message.includes('trouvé')) {
      return res.status(400).json({ error: { message: error.message } });
    }
    next(error);
  }
};

const formatWarehouse = (warehouse) => ({
  id: warehouse.id.toString(),
  name: warehouse.name,
  address: warehouse.address,
  description: warehouse.description,
  shelves: warehouse.shelves,
  zones: warehouse.zones,
  productCount: warehouse.product_count ? parseInt(warehouse.product_count) : 0,
  products: warehouse.products ? warehouse.products.map(p => ({
    id: p.id.toString(),
    productId: p.product_id.toString(),
    productName: p.product_name,
    sku: p.sku,
    quantity: p.product_quantity != null ? parseInt(p.product_quantity) : 0,
    unit: p.unit,
    image: p.image,
    shelf: p.shelf,
    expirationDate: p.expiration_date
  })) : []
});

module.exports = {
  getAllWarehouses,
  getWarehouseById,
  createWarehouse,
  updateWarehouse,
  deleteWarehouse,
  assignProduct,
  removeProduct,
  updateProductQuantity,
  moveProduct
};

