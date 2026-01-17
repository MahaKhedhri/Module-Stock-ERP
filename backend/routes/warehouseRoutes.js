const express = require('express');
const router = express.Router();
const warehouseController = require('../controllers/warehouseController');

router.get('/', warehouseController.getAllWarehouses);
router.post('/', warehouseController.createWarehouse);
router.post('/:id/stocks', warehouseController.updateStocks);

module.exports = router;
