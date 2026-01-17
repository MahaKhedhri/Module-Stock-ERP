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
    
    // Get suppliers for each product
    for (let product of result.rows) {
      const suppliersResult = await pool.query(`
        SELECT ps.*, s.name as supplier_name, s.email, s.phone, s.address
        FROM product_suppliers ps
        LEFT JOIN suppliers s ON ps.supplier_id = s.id
        WHERE ps.product_id = $1
      `, [product.id]);
      product.suppliers = suppliersResult.rows;
    }
    
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
    
    if (result.rows.length === 0) {
      return null;
    }
    
    const product = result.rows[0];
    
    // Get suppliers for this product
    const suppliersResult = await pool.query(`
      SELECT ps.*, s.name as supplier_name, s.email, s.phone, s.address
      FROM product_suppliers ps
      LEFT JOIN suppliers s ON ps.supplier_id = s.id
      WHERE ps.product_id = $1
    `, [id]);
    product.suppliers = suppliersResult.rows;
    
    return product;
  }

  static async create(data) {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      const { name, sku, categoryId, purchasePrice, salePrice, unit, image, minStock, suppliers } = data;
      
      // Create product with quantity defaulting to 0
      const result = await client.query(
        `INSERT INTO products (name, sku, category_id, purchase_price, sale_price, quantity, unit, image, supplier_id, min_stock) 
         VALUES ($1, $2, $3, $4, $5, 0, $6, $7, NULL, $8) RETURNING *`,
        [name, sku, categoryId, purchasePrice || null, salePrice, unit, image || null, minStock || 0]
      );
      const product = result.rows[0];
      
      // Add suppliers if provided
      if (suppliers && Array.isArray(suppliers) && suppliers.length > 0) {
        for (const supplier of suppliers) {
          await client.query(
            `INSERT INTO product_suppliers (product_id, supplier_id, purchase_price, sale_price)
             VALUES ($1, $2, $3, $4)
             ON CONFLICT (product_id, supplier_id) 
             DO UPDATE SET purchase_price = EXCLUDED.purchase_price, sale_price = EXCLUDED.sale_price`,
            [product.id, supplier.supplierId, supplier.purchasePrice || purchasePrice || 0, supplier.salePrice || salePrice]
          );
        }
      }
      
      await client.query('COMMIT');
      return await this.findById(product.id);
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
        if (data[key] !== undefined && fieldMap[key] && key !== 'suppliers') {
          fields.push(`${fieldMap[key]} = $${paramCount++}`);
          values.push(data[key]);
        }
      });

      if (fields.length > 0) {
        fields.push(`updated_at = CURRENT_TIMESTAMP`);
        values.push(id);
        await client.query(
          `UPDATE products SET ${fields.join(', ')} WHERE id = $${paramCount} RETURNING *`,
          values
        );
      }
      
      // Update suppliers if provided
      if (data.suppliers !== undefined) {
        // Delete existing suppliers
        await client.query('DELETE FROM product_suppliers WHERE product_id = $1', [id]);
        
        // Add new suppliers
        if (Array.isArray(data.suppliers) && data.suppliers.length > 0) {
          const product = await this.findById(id);
          for (const supplier of data.suppliers) {
            await client.query(
              `INSERT INTO product_suppliers (product_id, supplier_id, purchase_price, sale_price)
               VALUES ($1, $2, $3, $4)`,
              [id, supplier.supplierId, supplier.purchasePrice || product.purchase_price || 0, supplier.salePrice || product.sale_price]
            );
          }
        }
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

