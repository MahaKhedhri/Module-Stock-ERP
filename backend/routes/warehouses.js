const express = require('express');
const router = express.Router();
const {
  getAllWarehouses,
  getWarehouseById,
  createWarehouse,
  updateWarehouse,
  deleteWarehouse,
  assignProduct,
  removeProduct,
  updateProductQuantity,
  moveProduct
} = require('../controllers/warehouseController');

router.get('/', getAllWarehouses);
router.get('/:id', getWarehouseById);
router.post('/', createWarehouse);
router.put('/:id', updateWarehouse);
router.delete('/:id', deleteWarehouse);
router.post('/:id/products', assignProduct);
router.delete('/:id/products/:productId', removeProduct);
router.put('/:id/products/quantity', updateProductQuantity);
router.post('/:id/products/move', moveProduct);

module.exports = router;
