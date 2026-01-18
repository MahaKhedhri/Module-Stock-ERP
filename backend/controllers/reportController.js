const pool = require('../config/db');

exports.getDashboardStats = async (req, res) => {
  try {
    const totalStockValueResult = await pool.query('SELECT SUM(quantity * COALESCE(purchase_price, 0)) as total_value FROM products');
    const totalProductsResult = await pool.query('SELECT COUNT(*) as total_count FROM products');
    const lowStockResult = await pool.query('SELECT COUNT(*) as low_stock_count FROM products WHERE quantity <= COALESCE(min_stock, 0)');

    // Recent movements (last 5)
    // Note: stock_movements might not have created_at if it's an older schema, but typically we order by date and then id for insertion order
    const recentMovementsResult = await pool.query(`
      SELECT sm.*, p.name as product_name 
      FROM stock_movements sm
      JOIN products p ON sm.product_id = p.id 
      ORDER BY sm.date DESC, sm.id DESC 
      LIMIT 5
    `);

    res.json({
      totalStockValue: parseFloat(totalStockValueResult.rows[0].total_value || 0),
      totalProducts: parseInt(totalProductsResult.rows[0].total_count || 0),
      lowStockCount: parseInt(lowStockResult.rows[0].low_stock_count || 0),
      recentMovements: recentMovementsResult.rows
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching stats' });
  }
};

exports.getStockValuation = async (req, res) => {
  try {
    const result = await pool.query(`
            SELECT 
                p.id, 
                p.name, 
                p.sku, 
                p.quantity, 
                COALESCE(p.purchase_price, 0) as purchase_price, 
                (p.quantity * COALESCE(p.purchase_price, 0)) as total_value,
                c.name as category_name
            FROM products p
            LEFT JOIN categories c ON p.category_id = c.id
            ORDER BY total_value DESC
        `);
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching valuation' });
  }
};

exports.getCategoryDistribution = async (req, res) => {
  try {
    const result = await pool.query(`
            SELECT 
                COALESCE(c.name, 'Sans Catégorie') as name, 
                COUNT(p.id) as count, 
                SUM(p.quantity * COALESCE(p.purchase_price, 0)) as value
            FROM products p
            LEFT JOIN categories c ON p.category_id = c.id
            GROUP BY c.name
        `);
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching category distribution' });
  }
};

exports.getTopMovers = async (req, res) => {
  try {
    // Top 5 products by exit quantity in the last 30 days
    const result = await pool.query(`
            SELECT 
                p.name, 
                SUM(sm.quantity) as total_out
            FROM stock_movements sm
            JOIN products p ON sm.product_id = p.id
            WHERE sm.type = 'out' 
            AND sm.date >= CURRENT_DATE - INTERVAL '30 days'
            GROUP BY p.name
            ORDER BY total_out DESC
            LIMIT 5
        `);
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching top movers' });
  }
};
