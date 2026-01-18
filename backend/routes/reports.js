const express = require('express');
const router = express.Router();
const { getDashboardStats, getStockValuation, getCategoryDistribution, getTopMovers } = require('../controllers/reportController');

router.get('/dashboard-stats', getDashboardStats);
router.get('/stock-valuation', getStockValuation);
router.get('/category-distribution', getCategoryDistribution);
router.get('/top-movers', getTopMovers);

module.exports = router;
