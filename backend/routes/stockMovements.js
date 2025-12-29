const express = require('express');
const router = express.Router();
const {
  getAllStockMovements,
  getStockMovementById,
  createStockMovement,
  updateStockMovement,
  deleteStockMovement
} = require('../controllers/stockMovementController');

router.get('/', getAllStockMovements);
router.get('/:id', getStockMovementById);
router.post('/', createStockMovement);
router.put('/:id', updateStockMovement);
router.delete('/:id', deleteStockMovement);

module.exports = router;

