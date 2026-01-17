const express = require('express');
const router = express.Router();
const {
  getAllExitOrders,
  getExitOrderById,
  createExitOrder,
  updateExitOrder,
  deleteExitOrder,
  confirmExitOrder,
  closeExitOrder
} = require('../controllers/exitOrderController');

router.get('/', getAllExitOrders);
router.get('/:id', getExitOrderById);
router.post('/', createExitOrder);
router.put('/:id', updateExitOrder);
router.delete('/:id', deleteExitOrder);
router.post('/:id/confirm', confirmExitOrder);
router.post('/:id/close', closeExitOrder);

module.exports = router;

