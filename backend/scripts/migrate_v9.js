const pool = require('../config/db');

const migrate = async () => {
    try {
        console.log('Migrating database schema v9: Warehouse Zones...');

        // Create warehouse_zones table
        await pool.query(`
      CREATE TABLE IF NOT EXISTS warehouse_zones (
        id SERIAL PRIMARY KEY,
        warehouse_id INTEGER REFERENCES warehouses(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

        // Add zone_id to product_warehouses
        await pool.query(`
      ALTER TABLE product_warehouses 
      ADD COLUMN IF NOT EXISTS zone_id INTEGER REFERENCES warehouse_zones(id) ON DELETE SET NULL;
    `);

        console.log('Migration v9 completed successfully');
    } catch (error) {
        console.error('Migration v9 failed:', error);
        process.exit(1);
    } finally {
        await pool.end();
    }
};

migrate();
