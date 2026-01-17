const pool = require('../config/db');

const migrate = async () => {
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        // Add purchase_price column to product_suppliers table
        await client.query(`
      ALTER TABLE product_suppliers 
      ADD COLUMN IF NOT EXISTS purchase_price DECIMAL(10, 2) DEFAULT 0
    `);
        console.log('✅ Added purchase_price to product_suppliers table');

        // Populate product_suppliers.purchase_price with the product's current purchase_price
        // This ensures existing relationships have a valid price (the current global price)
        await client.query(`
      UPDATE product_suppliers ps
      SET purchase_price = p.purchase_price
      FROM products p
      WHERE ps.product_id = p.id
    `);
        console.log('✅ Populated existing supplier prices');

        // Remove NOT NULL constraint from purchase_price in products table
        // It will serve as a default/reference price now
        await client.query('ALTER TABLE products ALTER COLUMN purchase_price DROP NOT NULL');
        console.log('✅ Removed NOT NULL constraint from products.purchase_price');

        await client.query('COMMIT');
        console.log('✅ Migration v5 completed successfully');

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('❌ Migration failed:', error);
        process.exit(1);
    } finally {
        client.release();
    }
};

migrate().then(() => process.exit(0));
