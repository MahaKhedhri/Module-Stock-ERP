const pool = require('../config/db');

const migrate = async () => {
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        // Remove NOT NULL constraint from supplier_id in products table
        await client.query('ALTER TABLE products ALTER COLUMN supplier_id DROP NOT NULL');

        // Optional: Drop the foreign key constraint if we want to fully decouple, 
        // but keeping it nullable is fine for now/backward compatibility if needed.
        // For now, just dropping NOT NULL is sufficient to fix the error.

        console.log('✅ Removed NOT NULL constraint from products.supplier_id');

        await client.query('COMMIT');
        console.log('✅ Migration v4 completed successfully');

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('❌ Migration failed:', error);
        process.exit(1);
    } finally {
        client.release();
    }
};

migrate().then(() => process.exit(0));
