const pool = require('../config/db');

const seedData = async () => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // Clear existing data (optional - comment out if you want to keep existing data)
    await client.query('TRUNCATE TABLE stock_movements, purchase_order_lines, purchase_orders, products, suppliers, categories RESTART IDENTITY CASCADE');
    
    // Insert Categories
    const categoryResult = await client.query(`
      INSERT INTO categories (name, description) VALUES
      ('Électronique', 'Appareils électroniques'),
      ('Mobilier', 'Meubles de bureau'),
      ('Fournitures', 'Fournitures de bureau')
      RETURNING id
    `);
    const categoryIds = categoryResult.rows.map(row => row.id);
    
    // Insert Suppliers
    const supplierResult = await client.query(`
      INSERT INTO suppliers (name, email, phone, address) VALUES
      ('TechSupply Co.', 'contact@techsupply.com', '01 23 45 67 89', '123 Avenue de la Tech, 75001 Paris'),
      ('FurniPro', 'sales@furnipro.com', '01 98 76 54 32', '45 Rue du Mobilier, 69001 Lyon'),
      ('Office Plus', 'info@officeplus.com', '01 11 22 33 44', '78 Boulevard des Fournitures, 13001 Marseille')
      RETURNING id
    `);
    const supplierIds = supplierResult.rows.map(row => row.id);
    
    // Insert Products
    const productResult = await client.query(`
      INSERT INTO products (name, sku, category_id, purchase_price, sale_price, quantity, unit, supplier_id, min_stock) VALUES
      ('Ordinateur Portable HP', 'HP-LAP-001', $1, 650.00, 899.00, 15, 'unité', $4, 5),
      ('Clavier Mécanique', 'KEY-MEC-002', $1, 45.00, 79.00, 32, 'unité', $4, 10),
      ('Bureau Réglable', 'DESK-ADJ-003', $2, 280.00, 450.00, 8, 'unité', $5, 3),
      ('Chaise Ergonomique', 'CHAIR-ERG-004', $2, 150.00, 249.00, 12, 'unité', $5, 5),
      ('Ramette Papier A4', 'PAP-A4-005', $3, 3.50, 6.99, 120, 'ramette', $6, 50),
      ('Stylos Bille (Boîte)', 'PEN-BOX-006', $3, 8.00, 14.99, 45, 'boîte', $6, 20),
      ('Écran 24 pouces', 'MON-24-007', $1, 120.00, 199.00, 3, 'unité', $4, 5)
      RETURNING id
    `, [
      categoryIds[0], categoryIds[1], categoryIds[2],
      supplierIds[0], supplierIds[1], supplierIds[2]
    ]);
    const productIds = productResult.rows.map(row => row.id);
    
    // Insert Purchase Orders
    const po1Result = await client.query(`
      INSERT INTO purchase_orders (supplier_id, date, status, total) VALUES
      ($1, '2025-01-15', 'received', 7400.00)
      RETURNING id
    `, [supplierIds[0]]);
    const po1Id = po1Result.rows[0].id;
    
    const po2Result = await client.query(`
      INSERT INTO purchase_orders (supplier_id, date, status, total) VALUES
      ($1, '2025-01-18', 'sent', 1400.00)
      RETURNING id
    `, [supplierIds[1]]);
    const po2Id = po2Result.rows[0].id;
    
    // Insert Purchase Order Lines
    await client.query(`
      INSERT INTO purchase_order_lines (purchase_order_id, product_id, quantity, unit_price) VALUES
      ($1, $2, 10, 650.00),
      ($1, $3, 20, 45.00),
      ($4, $5, 5, 280.00)
    `, [po1Id, productIds[0], productIds[1], po2Id, productIds[2]]);
    
    // Insert Stock Movements
    await client.query(`
      INSERT INTO stock_movements (product_id, type, quantity, date, reference, note) VALUES
      ($1, 'in', 10, '2025-01-15', 'PO-1', 'Réception commande'),
      ($2, 'in', 20, '2025-01-15', 'PO-1', 'Réception commande'),
      ($3, 'out', 30, '2025-01-16', NULL, 'Vente client XYZ'),
      ($4, 'adjustment', -2, '2025-01-17', NULL, 'Correction inventaire')
    `, [productIds[0], productIds[1], productIds[4], productIds[6]]);
    
    await client.query('COMMIT');
    console.log('✅ Sample data seeded successfully');
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error seeding data:', error);
    throw error;
  } finally {
    client.release();
  }
};

seedData()
  .then(() => {
    console.log('Seeding completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Seeding failed:', error);
    process.exit(1);
  });

