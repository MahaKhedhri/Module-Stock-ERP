const pool = require('../config/db');

class ExitOrder {
  static async findAll() {
    const result = await pool.query(`
      SELECT eo.*
      FROM exit_orders eo
      ORDER BY eo.id DESC
    `);
    
    // Get lines for each order
    const orders = result.rows;
    for (let order of orders) {
      const linesResult = await pool.query(`
        SELECT eol.*, p.name as product_name, p.sku
        FROM exit_order_lines eol
        LEFT JOIN products p ON eol.product_id = p.id
        WHERE eol.exit_order_id = $1
      `, [order.id]);
      order.lines = linesResult.rows;
    }
    
    return orders;
  }

  static async findById(id) {
    const result = await pool.query(`
      SELECT eo.*
      FROM exit_orders eo
      WHERE eo.id = $1
    `, [id]);
    
    if (result.rows.length === 0) {
      return null;
    }
    
    const order = result.rows[0];
    const linesResult = await pool.query(`
      SELECT eol.*, p.name as product_name, p.sku
      FROM exit_order_lines eol
      LEFT JOIN products p ON eol.product_id = p.id
      WHERE eol.exit_order_id = $1
    `, [id]);
    order.lines = linesResult.rows;
    
    return order;
  }

  static async create(data) {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      const { customerName, date, status, note, lines } = data;
      
      // Create exit order
      const eoResult = await client.query(
        `INSERT INTO exit_orders (customer_name, date, status, note) 
         VALUES ($1, $2, $3, $4) RETURNING *`,
        [customerName || null, date, status || 'draft', note || null]
      );
      const order = eoResult.rows[0];
      
      // Create lines and calculate total
      let total = 0;
      for (const line of lines) {
        const { productId, quantity, unitPrice } = line;
        
        // Validate non-negative values
        if (quantity <= 0 || unitPrice < 0) {
          throw new Error('La quantité doit être supérieure à 0 et le prix ne peut pas être négatif');
        }
        
        await client.query(
          `INSERT INTO exit_order_lines (exit_order_id, product_id, quantity, unit_price) 
           VALUES ($1, $2, $3, $4)`,
          [order.id, productId, quantity, unitPrice]
        );
        total += quantity * unitPrice;
      }
      
      // Update total
      await client.query(
        'UPDATE exit_orders SET total = $1 WHERE id = $2',
        [total, order.id]
      );
      order.total = total;
      
      await client.query('COMMIT');
      
      return await this.findById(order.id);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  static async update(id, data) {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      const { customerName, date, status, note, lines } = data;
      
      // Update exit order
      if (customerName !== undefined || date || status !== undefined || note !== undefined) {
        const updates = [];
        const values = [];
        let paramCount = 1;
        
        if (customerName !== undefined) {
          updates.push(`customer_name = $${paramCount++}`);
          values.push(customerName);
        }
        if (date !== undefined) {
          updates.push(`date = $${paramCount++}`);
          values.push(date);
        }
        if (status !== undefined) {
          updates.push(`status = $${paramCount++}`);
          values.push(status);
        }
        if (note !== undefined) {
          updates.push(`note = $${paramCount++}`);
          values.push(note);
        }
        
        updates.push('updated_at = CURRENT_TIMESTAMP');
        values.push(id);
        
        await client.query(
          `UPDATE exit_orders SET ${updates.join(', ')} WHERE id = $${paramCount}`,
          values
        );
      }
      
      // Update lines if provided
      if (lines) {
        // Delete existing lines
        await client.query('DELETE FROM exit_order_lines WHERE exit_order_id = $1', [id]);
        
        // Insert new lines
        let total = 0;
        for (const line of lines) {
          const { productId, quantity, unitPrice } = line;
          
          // Validate non-negative values
          if (quantity <= 0 || unitPrice < 0) {
            throw new Error('La quantité doit être supérieure à 0 et le prix ne peut pas être négatif');
          }
          
          await client.query(
            `INSERT INTO exit_order_lines (exit_order_id, product_id, quantity, unit_price) 
             VALUES ($1, $2, $3, $4)`,
            [id, productId, quantity, unitPrice]
          );
          total += quantity * unitPrice;
        }
        
        // Update total
        await client.query('UPDATE exit_orders SET total = $1 WHERE id = $2', [total, id]);
      }
      
      await client.query('COMMIT');
      
      return await this.findById(id);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  static async delete(id) {
    const result = await pool.query('DELETE FROM exit_orders WHERE id = $1 RETURNING *', [id]);
    return result.rows[0];
  }

  static async confirm(id) {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      const order = await this.findById(id);
      if (!order) {
        throw new Error('Exit order not found');
      }
      
      if (order.status === 'closed') {
        throw new Error('Order already closed');
      }
      
      // Update product quantities and create stock movements
      for (const line of order.lines) {
        // Check if product has enough stock
        const productResult = await client.query('SELECT quantity FROM products WHERE id = $1', [line.product_id]);
        if (productResult.rows.length === 0) {
          throw new Error(`Product with id ${line.product_id} not found`);
        }
        
        const currentQuantity = parseInt(productResult.rows[0].quantity);
        if (currentQuantity < line.quantity) {
          throw new Error(`Insufficient stock for product. Available: ${currentQuantity}, Required: ${line.quantity}`);
        }
        
        // Decrease product quantity
        await client.query(
          'UPDATE products SET quantity = quantity - $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
          [line.quantity, line.product_id]
        );
        
        // Create stock movement
        await client.query(
          `INSERT INTO stock_movements (product_id, type, quantity, date, reference, note) 
           VALUES ($1, 'out', $2, CURRENT_DATE, $3, 'Exit order confirmation')`,
          [line.product_id, line.quantity, `EO-${id}`]
        );
      }
      
      // Update order status
      await client.query(
        'UPDATE exit_orders SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
        ['confirmed', id]
      );
      
      await client.query('COMMIT');
      
      return await this.findById(id);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  static async close(id) {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      const order = await this.findById(id);
      if (!order) {
        throw new Error('Exit order not found');
      }
      
      if (order.status !== 'confirmed') {
        throw new Error('Order must be confirmed before closing');
      }
      
      // Update order status
      await client.query(
        'UPDATE exit_orders SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
        ['closed', id]
      );
      
      await client.query('COMMIT');
      
      return await this.findById(id);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
}

module.exports = ExitOrder;

