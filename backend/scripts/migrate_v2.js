const pool = require('../config/db');

const migrate = async () => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    // Drop the existing check constraint
    await client.query(`
      ALTER TABLE purchase_orders 
      DROP CONSTRAINT IF EXISTS purchase_orders_status_check
    `);
    
    // Add the new check constraint with 'confirmed' status
    await client.query(`
      ALTER TABLE purchase_orders 
      ADD CONSTRAINT purchase_orders_status_check 
      CHECK (status IN ('draft', 'confirmed', 'sent', 'received', 'closed'))
    `);
    
    await client.query('COMMIT');
    console.log('✅ Database migration completed successfully');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    client.release();
    process.exit(0);
  }
};

migrate();
