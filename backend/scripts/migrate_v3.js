const pool = require('../config/db');

const migrate = async () => {
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        // Create product_suppliers table
        await client.query(`
      CREATE TABLE IF NOT EXISTS product_suppliers (
        id SERIAL PRIMARY KEY,
        product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
        supplier_id INTEGER NOT NULL REFERENCES suppliers(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(product_id, supplier_id)
      )
    `);

        console.log('✅ Created product_suppliers table');

        // Migrate existing data
        // We select product_id and supplier_id from products table where supplier_id IS NOT NULL
        // and insert into product_suppliers, ignoring duplicates
        await client.query(`
      INSERT INTO product_suppliers (product_id, supplier_id)
      SELECT id, supplier_id 
      FROM products 
      WHERE supplier_id IS NOT NULL
      ON CONFLICT (product_id, supplier_id) DO NOTHING
    `);

        console.log('✅ Migrated existing supplier relationships');

        // Create index
        await client.query('CREATE INDEX IF NOT EXISTS idx_product_suppliers_product_id ON product_suppliers(product_id)');
        await client.query('CREATE INDEX IF NOT EXISTS idx_product_suppliers_supplier_id ON product_suppliers(supplier_id)');

        await client.query('COMMIT');
        console.log('✅ Migration v3 completed successfully');

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('❌ Migration failed:', error);
        process.exit(1);
    } finally {
        client.release();
    }
};

migrate().then(() => process.exit(0));
