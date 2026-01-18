const pool = require('../config/db');

class Warehouse {
  static async findAll() {
    const result = await pool.query(`
      SELECT w.*
      FROM warehouses w
      ORDER BY w.id
    `);

    // Get products and zones for each warehouse
    const warehouses = result.rows;
    for (const warehouse of warehouses) {
      // Get Zones
      const zonesResult = await pool.query('SELECT * FROM warehouse_zones WHERE warehouse_id = $1 ORDER BY name', [warehouse.id]);
      warehouse.zones = zonesResult.rows;

      // Get Products with Zone info
      const productsResult = await pool.query(`
        SELECT pw.id, pw.warehouse_id, pw.product_id, pw.quantity as warehouse_quantity, pw.created_at, pw.updated_at,
               pw.shelf, pw.expiration_date, pw.zone_id,
               z.name as zone_name,
               p.name as product_name, p.sku, p.image, p.unit, p.quantity as product_quantity
        FROM product_warehouses pw
        INNER JOIN products p ON pw.product_id = p.id
        LEFT JOIN warehouse_zones z ON pw.zone_id = z.id
        WHERE pw.warehouse_id = $1
        ORDER BY p.name
      `, [warehouse.id]);
      warehouse.products = productsResult.rows;
      warehouse.product_count = productsResult.rows.length;
    }

    return warehouses;
  }

  static async findById(id) {
    const result = await pool.query('SELECT * FROM warehouses WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      return null;
    }

    const warehouse = result.rows[0];

    // Get Zones
    const zonesResult = await pool.query('SELECT * FROM warehouse_zones WHERE warehouse_id = $1 ORDER BY name', [id]);
    warehouse.zones = zonesResult.rows;

    // Get products in this warehouse
    const productsResult = await pool.query(`
      SELECT pw.id, pw.warehouse_id, pw.product_id, pw.quantity as warehouse_quantity, pw.created_at, pw.updated_at,
             pw.shelf, pw.expiration_date, pw.zone_id,
             z.name as zone_name,
             p.name as product_name, p.sku, p.image, p.unit, p.quantity as product_quantity
      FROM product_warehouses pw
      INNER JOIN products p ON pw.product_id = p.id
      LEFT JOIN warehouse_zones z ON pw.zone_id = z.id
      WHERE pw.warehouse_id = $1
      ORDER BY p.name
    `, [id]);
    warehouse.products = productsResult.rows;

    return warehouse;
  }

  static async create(data) {
    const { name, address, description, zones, shelves } = data;
    const client = await pool.connect();

    try {
      await client.query('BEGIN');
      const result = await client.query(
        'INSERT INTO warehouses (name, address, description, shelves) VALUES ($1, $2, $3, $4) RETURNING *',
        [name, address || null, description || null, shelves || null]
      );
      const warehouse = result.rows[0];

      if (zones && typeof zones === 'string' && zones.trim()) {
        const zoneList = zones.split(',').map(z => z.trim()).filter(z => z);
        for (const zoneName of zoneList) {
          await client.query(
            'INSERT INTO warehouse_zones (warehouse_id, name) VALUES ($1, $2)',
            [warehouse.id, zoneName]
          );
        }
      }

      await client.query('COMMIT');

      // Return full warehouse object
      return Warehouse.findById(warehouse.id);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  static async update(id, data) {
    const { name, address, description, zones, shelves } = data;
    const client = await pool.connect();

    try {
      await client.query('BEGIN');
      const result = await client.query(
        'UPDATE warehouses SET name = $1, address = $2, description = $3, shelves = $4, updated_at = CURRENT_TIMESTAMP WHERE id = $5 RETURNING *',
        [name, address || null, description || null, shelves || null, id]
      );
      const warehouse = result.rows[0];

      if (!warehouse) {
        await client.query('ROLLBACK');
        return null;
      }

      // Sync Zones
      if (zones !== undefined) { // Only update zones if provided in payload
        // Get current zones
        const currentZonesResult = await client.query('SELECT * FROM warehouse_zones WHERE warehouse_id = $1', [id]);
        const currentZones = currentZonesResult.rows;

        const newZoneNames = (typeof zones === 'string' && zones.trim())
          ? zones.split(',').map(z => z.trim()).filter(z => z)
          : [];

        // Determine zones to add and delete
        // Note: We match by name for simplicity here. If a name changes, it's treated as a delete/add.
        // Ideally updates should track IDs, but for this simpler UI (string list), naively rebuilding is safer/easier.
        // However, deleting zones with assigned products sets zone_id to NULL (ON DELETE SET NULL).

        const toAdd = newZoneNames.filter(name => !currentZones.find(z => z.name === name));
        const toDelete = currentZones.filter(z => !newZoneNames.includes(z.name));

        // Delete removed zones
        for (const zone of toDelete) {
          await client.query('DELETE FROM warehouse_zones WHERE id = $1', [zone.id]);
        }

        // Add new zones
        for (const name of toAdd) {
          await client.query(
            'INSERT INTO warehouse_zones (warehouse_id, name) VALUES ($1, $2)',
            [id, name]
          );
        }
      }

      await client.query('COMMIT');

      // Return full warehouse object including products and zones
      return Warehouse.findById(id);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  static async delete(id) {
    // Check if warehouse has products
    const productCheck = await pool.query('SELECT COUNT(*) FROM product_warehouses WHERE warehouse_id = $1', [id]);
    if (parseInt(productCheck.rows[0].count) > 0) {
      throw new Error('Cannot delete warehouse with assigned products');
    }

    const result = await pool.query('DELETE FROM warehouses WHERE id = $1 RETURNING *', [id]);
    return result.rows[0];
  }

  // Assign product to warehouse (one product can only be in one warehouse)
  static async assignProduct(warehouseId, productId, quantity = 0, shelf = null, expirationDate = null, zoneId = null) {
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // Check if product is already in another warehouse
      const existingCheck = await client.query(
        'SELECT warehouse_id FROM product_warehouses WHERE product_id = $1',
        [productId]
      );

      if (existingCheck.rows.length > 0) {
        const existingWarehouseId = existingCheck.rows[0].warehouse_id;
        if (existingWarehouseId.toString() !== warehouseId.toString()) {
          throw new Error('Ce produit est déjà assigné à un autre entrepôt');
        }
        // Product already in this warehouse, just update quantity
        const result = await client.query(
          `UPDATE product_warehouses 
           SET quantity = $1, shelf = COALESCE($2, shelf), expiration_date = COALESCE($3, expiration_date), zone_id = COALESCE($4, zone_id), updated_at = CURRENT_TIMESTAMP
           WHERE warehouse_id = $5 AND product_id = $6
           RETURNING *`,
          [quantity, shelf, expirationDate, zoneId, warehouseId, productId]
        );
        await client.query('COMMIT');
        return result.rows[0];
      }

      // Product not in any warehouse, assign it
      try {
        const result = await client.query(
          `INSERT INTO product_warehouses (warehouse_id, product_id, quantity, shelf, expiration_date, zone_id)
           VALUES ($1, $2, $3, $4, $5, $6)
           RETURNING *`,
          [warehouseId, productId, quantity, shelf, expirationDate, zoneId]
        );

        await client.query('COMMIT');
        return result.rows[0];
      } catch (insertError) {
        // Handle unique constraint violation (race condition)
        if (insertError.code === '23505' || insertError.message.includes('unique')) {
          // Product was assigned in another transaction, check which warehouse
          const checkResult = await client.query(
            'SELECT warehouse_id FROM product_warehouses WHERE product_id = $1',
            [productId]
          );
          if (checkResult.rows.length > 0) {
            const existingWarehouseId = checkResult.rows[0].warehouse_id;
            if (existingWarehouseId.toString() !== warehouseId.toString()) {
              throw new Error('Ce produit est déjà assigné à un autre entrepôt');
            }
            // Same warehouse, just update quantity
            const updateResult = await client.query(
              `UPDATE product_warehouses 
               SET quantity = $1, shelf = COALESCE($2, shelf), expiration_date = COALESCE($3, expiration_date), zone_id = COALESCE($4, zone_id), updated_at = CURRENT_TIMESTAMP
               WHERE warehouse_id = $5 AND product_id = $6
               RETURNING *`,
              [quantity, shelf, expirationDate, zoneId, warehouseId, productId]
            );
            await client.query('COMMIT');
            return updateResult.rows[0];
          }
        }
        throw insertError;
      }
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  // Remove product from warehouse
  static async removeProduct(warehouseId, productId) {
    const result = await pool.query(
      'DELETE FROM product_warehouses WHERE warehouse_id = $1 AND product_id = $2 RETURNING *',
      [warehouseId, productId]
    );
    return result.rows[0];
  }

  // Update product quantity in warehouse
  static async updateProductQuantity(warehouseId, productId, quantity) {
    const result = await pool.query(
      `UPDATE product_warehouses 
       SET quantity = $1, updated_at = CURRENT_TIMESTAMP
       WHERE warehouse_id = $2 AND product_id = $3
       RETURNING *`,
      [quantity, warehouseId, productId]
    );
    return result.rows[0];
  }

  // Move product from one warehouse to another (since product can only be in one warehouse, this moves it completely)
  static async moveProduct(fromWarehouseId, toWarehouseId, productId, quantity, shelf = null, expirationDate = null, zoneId = null) {
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // Check if product exists in source warehouse
      const sourceCheck = await client.query(
        'SELECT quantity FROM product_warehouses WHERE warehouse_id = $1 AND product_id = $2',
        [fromWarehouseId, productId]
      );

      if (sourceCheck.rows.length === 0) {
        throw new Error('Produit non trouvé dans l\'entrepôt source');
      }

      const sourceQuantity = parseInt(sourceCheck.rows[0].quantity);
      if (sourceQuantity < quantity) {
        throw new Error('Quantité insuffisante dans l\'entrepôt source');
      }

      // Remove from source warehouse
      await client.query(
        'DELETE FROM product_warehouses WHERE warehouse_id = $1 AND product_id = $2',
        [fromWarehouseId, productId]
      );

      // Add to destination warehouse (product_id is unique, so this will work)
      await client.query(
        `INSERT INTO product_warehouses (warehouse_id, product_id, quantity, shelf, expiration_date, zone_id)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [toWarehouseId, productId, quantity, shelf, expirationDate, zoneId]
      );

      await client.query('COMMIT');
      return true;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
}

module.exports = Warehouse;

