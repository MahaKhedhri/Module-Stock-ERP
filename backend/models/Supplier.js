const pool = require('../config/db');

class Supplier {
  static async findAll() {
    const result = await pool.query('SELECT * FROM suppliers ORDER BY id');
    return result.rows;
  }

  static async findById(id) {
    const result = await pool.query('SELECT * FROM suppliers WHERE id = $1', [id]);
    return result.rows[0];
  }

  static async create(data) {
    const { name, email, phone, address } = data;
    const result = await pool.query(
      'INSERT INTO suppliers (name, email, phone, address) VALUES ($1, $2, $3, $4) RETURNING *',
      [name, email, phone, address]
    );
    return result.rows[0];
  }

  static async update(id, data) {
    const { name, email, phone, address } = data;
    const result = await pool.query(
      'UPDATE suppliers SET name = $1, email = $2, phone = $3, address = $4, updated_at = CURRENT_TIMESTAMP WHERE id = $5 RETURNING *',
      [name, email, phone, address, id]
    );
    return result.rows[0];
  }

  static async delete(id) {
    // Check if supplier has products
    const productCheck = await pool.query('SELECT COUNT(*) FROM products WHERE supplier_id = $1', [id]);
    if (parseInt(productCheck.rows[0].count) > 0) {
      throw new Error('Cannot delete supplier with associated products');
    }
    
    const result = await pool.query('DELETE FROM suppliers WHERE id = $1 RETURNING *', [id]);
    return result.rows[0];
  }
}

module.exports = Supplier;

