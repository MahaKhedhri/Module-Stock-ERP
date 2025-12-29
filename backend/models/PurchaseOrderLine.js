const pool = require('../config/db');

class PurchaseOrderLine {
  static async findAll() {
    const result = await pool.query(`
      SELECT pol.*, p.name as product_name, p.sku
      FROM purchase_order_lines pol
      LEFT JOIN products p ON pol.product_id = p.id
      ORDER BY pol.id
    `);
    return result.rows;
  }

  static async findByOrderId(orderId) {
    const result = await pool.query(`
      SELECT pol.*, p.name as product_name, p.sku
      FROM purchase_order_lines pol
      LEFT JOIN products p ON pol.product_id = p.id
      WHERE pol.purchase_order_id = $1
      ORDER BY pol.id
    `, [orderId]);
    return result.rows;
  }

  static async findById(id) {
    const result = await pool.query(`
      SELECT pol.*, p.name as product_name, p.sku
      FROM purchase_order_lines pol
      LEFT JOIN products p ON pol.product_id = p.id
      WHERE pol.id = $1
    `, [id]);
    return result.rows[0];
  }

  static async create(data) {
    const { purchaseOrderId, productId, quantity, unitPrice } = data;
    const result = await pool.query(
      `INSERT INTO purchase_order_lines (purchase_order_id, product_id, quantity, unit_price) 
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [purchaseOrderId, productId, quantity, unitPrice]
    );
    return result.rows[0];
  }

  static async update(id, data) {
    const { productId, quantity, unitPrice } = data;
    const result = await pool.query(
      `UPDATE purchase_order_lines 
       SET product_id = $1, quantity = $2, unit_price = $3, updated_at = CURRENT_TIMESTAMP 
       WHERE id = $4 RETURNING *`,
      [productId, quantity, unitPrice, id]
    );
    return result.rows[0];
  }

  static async delete(id) {
    const result = await pool.query('DELETE FROM purchase_order_lines WHERE id = $1 RETURNING *', [id]);
    return result.rows[0];
  }
}

module.exports = PurchaseOrderLine;

