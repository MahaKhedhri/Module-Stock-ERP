const pool = require('../config/db');

const migrate = async () => {
    try {
        console.log('Migrating database schema v10: Warehouse Shelves...');

        // Add shelves column to warehouses table to store comma-separated list of predefined shelves
        await pool.query(`
      ALTER TABLE warehouses 
      ADD COLUMN IF NOT EXISTS shelves TEXT;
    `);

        console.log('Migration v10 completed successfully');
    } catch (error) {
        console.error('Migration v10 failed:', error);
        process.exit(1);
    } finally {
        await pool.end();
    }
};

migrate();
