const express = require('express');
const router = express.Router();
const {
  getAllPurchaseOrderLines,
  getPurchaseOrderLineById,
  createPurchaseOrderLine,
  updatePurchaseOrderLine,
  deletePurchaseOrderLine
} = require('../controllers/purchaseOrderLineController');

router.get('/', getAllPurchaseOrderLines);
router.get('/:id', getPurchaseOrderLineById);
router.post('/', createPurchaseOrderLine);
router.put('/:id', updatePurchaseOrderLine);
router.delete('/:id', deletePurchaseOrderLine);

module.exports = router;

