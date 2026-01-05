const express = require('express');
const router = express.Router();
const { getDashboardStats, getStockValuation } = require('../controllers/reportController');

router.get('/dashboard-stats', getDashboardStats);
router.get('/stock-valuation', getStockValuation);

module.exports = router;
