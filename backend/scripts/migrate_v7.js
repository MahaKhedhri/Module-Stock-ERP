const pool = require('../config/db');

const migrate = async () => {
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        // Create warehouses table
        await client.query(`
      CREATE TABLE IF NOT EXISTS warehouses (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        address TEXT,
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
        console.log('✅ Created warehouses table');

        // Check if product_warehouses table exists
        const tableExists = await client.query(`
          SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_name = 'product_warehouses'
          )
        `);
        
        if (!tableExists.rows[0].exists) {
          // Create product_warehouses table (one product can only be in one warehouse)
          await client.query(`
            CREATE TABLE product_warehouses (
              id SERIAL PRIMARY KEY,
              product_id INTEGER NOT NULL UNIQUE REFERENCES products(id) ON DELETE CASCADE,
              warehouse_id INTEGER NOT NULL REFERENCES warehouses(id) ON DELETE CASCADE,
              quantity INTEGER DEFAULT 0,
              created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
              updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
          `);
          console.log('✅ Created product_warehouses table (one product per warehouse)');
        } else {
          // Table exists, check and fix constraints
          // Drop old unique constraint if it exists on (product_id, warehouse_id)
          try {
            await client.query(`
              ALTER TABLE product_warehouses 
              DROP CONSTRAINT IF EXISTS product_warehouses_product_id_warehouse_id_key
            `);
            await client.query(`
              ALTER TABLE product_warehouses 
              DROP CONSTRAINT IF EXISTS product_warehouses_pkey
            `);
          } catch (e) {
            // Ignore if constraint doesn't exist
          }
          
          // Add unique constraint on product_id if it doesn't exist
          const uniqueCheck = await client.query(`
            SELECT constraint_name 
            FROM information_schema.table_constraints 
            WHERE table_name = 'product_warehouses' 
            AND constraint_type = 'UNIQUE' 
            AND constraint_name LIKE '%product_id%'
          `);
          
          if (uniqueCheck.rows.length === 0) {
            await client.query(`
              ALTER TABLE product_warehouses 
              ADD CONSTRAINT product_warehouses_product_id_key UNIQUE (product_id)
            `);
            console.log('✅ Added unique constraint on product_id');
          }
          
          // Re-add primary key if needed
          try {
            await client.query(`
              ALTER TABLE product_warehouses 
              ADD CONSTRAINT product_warehouses_pkey PRIMARY KEY (id)
            `);
          } catch (e) {
            // Primary key already exists
          }
        }

        // Create indexes
        await client.query('CREATE INDEX IF NOT EXISTS idx_product_warehouses_product_id ON product_warehouses(product_id)');
        await client.query('CREATE INDEX IF NOT EXISTS idx_product_warehouses_warehouse_id ON product_warehouses(warehouse_id)');

        await client.query('COMMIT');
        console.log('✅ Migration v7 completed successfully');

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('❌ Migration failed:', error);
        process.exit(1);
    } finally {
        client.release();
    }
};

migrate().then(() => process.exit(0));
