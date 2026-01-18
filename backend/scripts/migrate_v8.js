const pool = require('../config/db');

const migrate = async () => {
    try {
        console.log('Migrating database schema v8...');

        // Add shelf and expiration_date columns to product_warehouses table
        await pool.query(`
      ALTER TABLE product_warehouses 
      ADD COLUMN IF NOT EXISTS shelf VARCHAR(50),
      ADD COLUMN IF NOT EXISTS expiration_date DATE;
    `);

        console.log('Migration v8 completed successfully');
    } catch (error) {
        console.error('Migration v8 failed:', error);
        process.exit(1);
    } finally {
        await pool.end();
    }
};

migrate();
