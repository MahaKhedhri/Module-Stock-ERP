const pool = require('../config/db');

class Category {
  static async findAll() {
    const result = await pool.query('SELECT * FROM categories ORDER BY id');
    return result.rows;
  }

  static async findById(id) {
    const result = await pool.query('SELECT * FROM categories WHERE id = $1', [id]);
    return result.rows[0];
  }

  static async create(data) {
    const { name, description } = data;
    const result = await pool.query(
      'INSERT INTO categories (name, description) VALUES ($1, $2) RETURNING *',
      [name, description || null]
    );
    return result.rows[0];
  }

  static async update(id, data) {
    const { name, description } = data;
    const result = await pool.query(
      'UPDATE categories SET name = $1, description = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3 RETURNING *',
      [name, description || null, id]
    );
    return result.rows[0];
  }

  static async delete(id) {
    // Check if category has products
    const productCheck = await pool.query('SELECT COUNT(*) FROM products WHERE category_id = $1', [id]);
    if (parseInt(productCheck.rows[0].count) > 0) {
      throw new Error('Cannot delete category with associated products');
    }
    
    const result = await pool.query('DELETE FROM categories WHERE id = $1 RETURNING *', [id]);
    return result.rows[0];
  }
}

module.exports = Category;

