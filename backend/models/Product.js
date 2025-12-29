const pool = require('../config/db');

class Product {
  static async findAll() {
    const result = await pool.query(`
      SELECT p.*, 
             c.name as category_name, 
             s.name as supplier_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN suppliers s ON p.supplier_id = s.id
      ORDER BY p.id
    `);
    return result.rows;
  }

  static async findById(id) {
    const result = await pool.query(`
      SELECT p.*, 
             c.name as category_name, 
             s.name as supplier_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN suppliers s ON p.supplier_id = s.id
      WHERE p.id = $1
    `, [id]);
    return result.rows[0];
  }

  static async create(data) {
    const { name, sku, categoryId, purchasePrice, salePrice, quantity, unit, image, supplierId, minStock } = data;
    const result = await pool.query(
      `INSERT INTO products (name, sku, category_id, purchase_price, sale_price, quantity, unit, image, supplier_id, min_stock) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
      [name, sku, categoryId, purchasePrice, salePrice, quantity || 0, unit, image || null, supplierId, minStock || 0]
    );
    return result.rows[0];
  }

  static async update(id, data) {
    const fields = [];
    const values = [];
    let paramCount = 1;

    const fieldMap = {
      name: 'name',
      sku: 'sku',
      categoryId: 'category_id',
      purchasePrice: 'purchase_price',
      salePrice: 'sale_price',
      quantity: 'quantity',
      unit: 'unit',
      image: 'image',
      supplierId: 'supplier_id',
      minStock: 'min_stock'
    };

    Object.keys(data).forEach(key => {
      if (data[key] !== undefined && fieldMap[key]) {
        fields.push(`${fieldMap[key]} = $${paramCount++}`);
        values.push(data[key]);
      }
    });

    if (fields.length === 0) {
      return await this.findById(id);
    }

    fields.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id);

    const result = await pool.query(
      `UPDATE products SET ${fields.join(', ')} WHERE id = $${paramCount} RETURNING *`,
      values
    );
    return result.rows[0];
  }

  static async delete(id) {
    const result = await pool.query('DELETE FROM products WHERE id = $1 RETURNING *', [id]);
    return result.rows[0];
  }

  static async adjustStock(id, quantity, note) {
    const product = await this.findById(id);
    if (!product) {
      throw new Error('Product not found');
    }

    const adjustment = quantity - product.quantity;
    await pool.query(
      'UPDATE products SET quantity = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [quantity, id]
    );

    // Create stock movement
    const movementResult = await pool.query(
      `INSERT INTO stock_movements (product_id, type, quantity, date, note) 
       VALUES ($1, 'adjustment', $2, CURRENT_DATE, $3) RETURNING *`,
      [id, adjustment, note || 'Manual stock adjustment']
    );

    return await this.findById(id);
  }
}

module.exports = Product;

