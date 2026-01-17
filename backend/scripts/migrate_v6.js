const pool = require('../config/db');

const migrate = async () => {
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        // Add sale_price column to product_suppliers table
        await client.query(`
      ALTER TABLE product_suppliers 
      ADD COLUMN IF NOT EXISTS sale_price DECIMAL(10, 2) DEFAULT 0
    `);
        console.log('✅ Added sale_price to product_suppliers table');

        // Populate product_suppliers.sale_price with the product's current sale_price
        await client.query(`
      UPDATE product_suppliers ps
      SET sale_price = p.sale_price
      FROM products p
      WHERE ps.product_id = p.id AND ps.sale_price = 0
    `);
        console.log('✅ Populated existing supplier sale prices');

        // Create exit_orders table (similar to purchase_orders but for outgoing stock)
        await client.query(`
      CREATE TABLE IF NOT EXISTS exit_orders (
        id SERIAL PRIMARY KEY,
        customer_name VARCHAR(255),
        date DATE NOT NULL,
        status VARCHAR(50) DEFAULT 'draft' CHECK (status IN ('draft', 'confirmed', 'closed')),
        total DECIMAL(10, 2) DEFAULT 0,
        note TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
        console.log('✅ Created exit_orders table');

        // Create exit_order_lines table
        await client.query(`
      CREATE TABLE IF NOT EXISTS exit_order_lines (
        id SERIAL PRIMARY KEY,
        exit_order_id INTEGER NOT NULL REFERENCES exit_orders(id) ON DELETE CASCADE,
        product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
        quantity INTEGER NOT NULL,
        unit_price DECIMAL(10, 2) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
        console.log('✅ Created exit_order_lines table');

        // Create indexes
        await client.query('CREATE INDEX IF NOT EXISTS idx_exit_orders_date ON exit_orders(date)');
        await client.query('CREATE INDEX IF NOT EXISTS idx_exit_order_lines_exit_order_id ON exit_order_lines(exit_order_id)');
        await client.query('CREATE INDEX IF NOT EXISTS idx_exit_order_lines_product_id ON exit_order_lines(product_id)');

        await client.query('COMMIT');
        console.log('✅ Migration v6 completed successfully');

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('❌ Migration failed:', error);
        process.exit(1);
    } finally {
        client.release();
    }
};

migrate().then(() => process.exit(0));

