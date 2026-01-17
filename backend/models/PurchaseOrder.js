const pool = require('../config/db');

class PurchaseOrder {
  static async findAll() {
    const result = await pool.query(`
      SELECT po.*, s.name as supplier_name
      FROM purchase_orders po
      LEFT JOIN suppliers s ON po.supplier_id = s.id
      ORDER BY po.id
    `);
    
    // Get lines for each order
    const orders = result.rows;
    for (let order of orders) {
      const linesResult = await pool.query(`
        SELECT pol.*, p.name as product_name, p.sku
        FROM purchase_order_lines pol
        LEFT JOIN products p ON pol.product_id = p.id
        WHERE pol.purchase_order_id = $1
      `, [order.id]);
      order.lines = linesResult.rows;
    }
    
    return orders;
  }

  static async findById(id) {
    const result = await pool.query(`
      SELECT po.*, s.name as supplier_name
      FROM purchase_orders po
      LEFT JOIN suppliers s ON po.supplier_id = s.id
      WHERE po.id = $1
    `, [id]);
    
    if (result.rows.length === 0) {
      return null;
    }
    
    const order = result.rows[0];
    const linesResult = await pool.query(`
      SELECT pol.*, p.name as product_name, p.sku
      FROM purchase_order_lines pol
      LEFT JOIN products p ON pol.product_id = p.id
      WHERE pol.purchase_order_id = $1
    `, [id]);
    order.lines = linesResult.rows;
    
    return order;
  }

  static async create(data) {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      const { supplierId, date, status, lines } = data;
      
      // Create purchase order
      const poResult = await client.query(
        `INSERT INTO purchase_orders (supplier_id, date, status) 
         VALUES ($1, $2, $3) RETURNING *`,
        [supplierId, date, status || 'draft']
      );
      const order = poResult.rows[0];
      
      // Create lines and calculate total
      let total = 0;
      for (const line of lines) {
        const { productId, quantity, unitPrice } = line;
        
        // Validate non-negative values
        if (quantity <= 0 || unitPrice < 0) {
          throw new Error('La quantité doit être supérieure à 0 et le prix ne peut pas être négatif');
        }
        
        // Verify that the product has the supplier configured
        const supplierCheck = await client.query(
          `SELECT COUNT(*) as count 
           FROM product_suppliers 
           WHERE product_id = $1 AND supplier_id = $2`,
          [productId, supplierId]
        );
        
        if (parseInt(supplierCheck.rows[0].count) === 0) {
          throw new Error(`Le produit avec l'ID ${productId} n'est pas configuré pour ce fournisseur`);
        }
        
        await client.query(
          `INSERT INTO purchase_order_lines (purchase_order_id, product_id, quantity, unit_price) 
           VALUES ($1, $2, $3, $4)`,
          [order.id, productId, quantity, unitPrice]
        );
        total += quantity * unitPrice;
      }
      
      // Update total
      await client.query(
        'UPDATE purchase_orders SET total = $1 WHERE id = $2',
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
      
      const { supplierId, date, status, lines } = data;
      
      // Update purchase order
      if (supplierId || date || status) {
        const updates = [];
        const values = [];
        let paramCount = 1;
        
        if (supplierId !== undefined) {
          updates.push(`supplier_id = $${paramCount++}`);
          values.push(supplierId);
        }
        if (date !== undefined) {
          updates.push(`date = $${paramCount++}`);
          values.push(date);
        }
        if (status !== undefined) {
          updates.push(`status = $${paramCount++}`);
          values.push(status);
        }
        
        updates.push('updated_at = CURRENT_TIMESTAMP');
        values.push(id);
        
        await client.query(
          `UPDATE purchase_orders SET ${updates.join(', ')} WHERE id = $${paramCount}`,
          values
        );
      }
      
      // Update lines if provided
      if (lines) {
        // Get current supplier_id for validation
        const currentOrder = await this.findById(id);
        const currentSupplierId = supplierId || currentOrder.supplier_id;
        
        // Delete existing lines
        await client.query('DELETE FROM purchase_order_lines WHERE purchase_order_id = $1', [id]);
        
        // Insert new lines
        let total = 0;
        for (const line of lines) {
          const { productId, quantity, unitPrice } = line;
          
          // Validate non-negative values
          if (quantity <= 0 || unitPrice < 0) {
            throw new Error('La quantité doit être supérieure à 0 et le prix ne peut pas être négatif');
          }
          
          // Verify that the product has the supplier configured
          const supplierCheck = await client.query(
            `SELECT COUNT(*) as count 
             FROM product_suppliers 
             WHERE product_id = $1 AND supplier_id = $2`,
            [productId, currentSupplierId]
          );
          
          if (parseInt(supplierCheck.rows[0].count) === 0) {
            throw new Error(`Le produit avec l'ID ${productId} n'est pas configuré pour ce fournisseur`);
          }
          
          await client.query(
            `INSERT INTO purchase_order_lines (purchase_order_id, product_id, quantity, unit_price) 
             VALUES ($1, $2, $3, $4)`,
            [id, productId, quantity, unitPrice]
          );
          total += quantity * unitPrice;
        }
        
        // Update total
        await client.query('UPDATE purchase_orders SET total = $1 WHERE id = $2', [total, id]);
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
    const result = await pool.query('DELETE FROM purchase_orders WHERE id = $1 RETURNING *', [id]);
    return result.rows[0];
  }

  static async receive(id) {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      const order = await this.findById(id);
      if (!order) {
        throw new Error('Purchase order not found');
      }
      
      if (order.status === 'received') {
        throw new Error('Order already received');
      }
      
      // Update product quantities and create stock movements
      for (const line of order.lines) {
        await client.query(
          'UPDATE products SET quantity = quantity + $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
          [line.quantity, line.product_id]
        );
        
        await client.query(
          `INSERT INTO stock_movements (product_id, type, quantity, date, reference, note) 
           VALUES ($1, 'in', $2, CURRENT_DATE, $3, 'Purchase order reception')`,
          [line.product_id, line.quantity, `PO-${id}`]
        );
      }
      
      // Update order status
      await client.query(
        'UPDATE purchase_orders SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
        ['received', id]
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

module.exports = PurchaseOrder;

