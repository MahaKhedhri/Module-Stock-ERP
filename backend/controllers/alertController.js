const pool = require('../config/db');

exports.getLowStockAlerts = async (req, res) => {
    try {
        const result = await pool.query(`
      SELECT p.*, c.name as category_name, s.name as supplier_name
      FROM products p 
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN suppliers s ON p.supplier_id = s.id
      WHERE p.quantity <= p.min_stock
      ORDER BY p.quantity ASC
    `);
        res.json(result.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error fetching alerts' });
    }
};
