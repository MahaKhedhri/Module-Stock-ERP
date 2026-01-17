const pool = require('../config/db');

class StockMovement {
  static async findAll() {
    const result = await pool.query(`
      SELECT sm.*, p.name as product_name, p.sku
      FROM stock_movements sm
      LEFT JOIN products p ON sm.product_id = p.id
      ORDER BY sm.date DESC, sm.id DESC
    `);
    return result.rows;
  }

  static async findById(id) {
    const result = await pool.query(`
      SELECT sm.*, p.name as product_name, p.sku
      FROM stock_movements sm
      LEFT JOIN products p ON sm.product_id = p.id
      WHERE sm.id = $1
    `, [id]);
    return result.rows[0];
  }

  static async create(data) {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      const { productId, type, quantity, date, reference, note } = data;
      
      // Validate quantity is positive
      if (quantity <= 0) {
        throw new Error('La quantité doit être supérieure à 0');
      }
      
      // Create stock movement
      const result = await client.query(
        `INSERT INTO stock_movements (product_id, type, quantity, date, reference, note) 
         VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
        [productId, type, quantity, date || new Date().toISOString().split('T')[0], reference || null, note || null]
      );
      const movement = result.rows[0];
      
      // Update product quantity and check for negative stock
      if (type === 'in') {
        await client.query(
          'UPDATE products SET quantity = quantity + $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
          [quantity, productId]
        );
      } else if (type === 'out') {
        // Check if we have enough stock
        const productCheck = await client.query('SELECT quantity FROM products WHERE id = $1', [productId]);
        if (productCheck.rows.length === 0) {
          throw new Error('Produit non trouvé');
        }
        const currentQuantity = parseInt(productCheck.rows[0].quantity);
        if (currentQuantity < quantity) {
          throw new Error(`Stock insuffisant. Disponible: ${currentQuantity}, Demandé: ${quantity}`);
        }
        await client.query(
          'UPDATE products SET quantity = GREATEST(0, quantity - $1), updated_at = CURRENT_TIMESTAMP WHERE id = $2',
          [quantity, productId]
        );
      } else if (type === 'adjustment') {
        // For adjustment, ensure final quantity is not negative
        const finalQuantity = Math.max(0, quantity);
        await client.query(
          'UPDATE products SET quantity = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
          [finalQuantity, productId]
        );
      }
      
      await client.query('COMMIT');
      
      return await this.findById(movement.id);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  static async update(id, data) {
    const { productId, type, quantity, date, reference, note } = data;
    const result = await pool.query(
      `UPDATE stock_movements 
       SET product_id = $1, type = $2, quantity = $3, date = $4, reference = $5, note = $6, updated_at = CURRENT_TIMESTAMP 
       WHERE id = $7 RETURNING *`,
      [productId, type, quantity, date, reference || null, note || null, id]
    );
    return result.rows[0];
  }

  static async delete(id) {
    const result = await pool.query('DELETE FROM stock_movements WHERE id = $1 RETURNING *', [id]);
    return result.rows[0];
  }
}

module.exports = StockMovement;

