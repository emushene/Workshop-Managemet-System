
import db from './database';

const cleanup = async () => {
  console.log('Starting database cleanup...');

  try {
    await new Promise<void>((resolve, reject) => {
      db.serialize(() => {
        db.run('PRAGMA foreign_keys=OFF;', (err) => {
          if (err) return reject(err);
          db.run('BEGIN TRANSACTION;', (err) => {
            if (err) return reject(err);
            resolve();
          });
        });
      });
    });

    const tables = ['Inventory', 'JobServices', 'ServiceItemParts', 'Invoices', 'Payments', 'Sales', 'SaleInventory'];

    for (const table of tables) {
      // Drop the new table if it exists
      await new Promise<void>((resolve, reject) => {
        db.run(`DROP TABLE IF EXISTS ${table}`, (err) => {
          if (err) return reject(err);
          console.log(`Dropped table ${table} if it existed.`);
          resolve();
        });
      });

      // Rename the old table back if it exists
      await new Promise<void>((resolve, reject) => {
        db.run(`ALTER TABLE ${table}_old RENAME TO ${table}`, (err) => {
          if (err && err.message.includes('no such table')) {
            console.log(`Table ${table}_old not found, skipping rename.`);
            return resolve();
          }
          if (err) return reject(err);
          console.log(`Renamed ${table}_old to ${table}.`);
          resolve();
        });
      });
    }
    
    await new Promise<void>((resolve, reject) => {
        db.run(`DROP TABLE IF EXISTS JobInventory`, (err) => {
            if (err) return reject(err);
            console.log(`Dropped table JobInventory if it existed.`);
            resolve();
        });
    });
    
    await new Promise<void>((resolve, reject) => {
        db.run(`ALTER TABLE JobInventory_old RENAME TO JobInventory`, (err) => {
            if (err && err.message.includes('no such table')) {
                console.log(`Table JobInventory_old not found, skipping rename.`);
                return resolve();
            }
            if (err) return reject(err);
            console.log(`Renamed JobInventory_old to JobInventory.`);
            resolve();
        });
    });


    await new Promise<void>((resolve, reject) => {
      db.run('COMMIT;', (err) => {
        if (err) return reject(err);
        db.run('PRAGMA foreign_keys=ON;', (err) => {
          if (err) return reject(err);
          console.log('Cleanup committed.');
          resolve();
        });
      });
    });

    console.log('Database cleanup finished successfully.');
  } catch (err) {
    console.error('Error during cleanup, rolling back:', err);
    await new Promise<void>((resolve, reject) => {
      db.run('ROLLBACK;', (err) => {
        if (err) return reject(err);
        db.run('PRAGMA foreign_keys=ON;', (err) => {
          if (err) return reject(err);
          resolve();
        });
      });
    });
  } finally {
    db.close((err) => {
      if (err) {
        console.error(err.message);
      }
      console.log('Database connection closed.');
    });
  }
};

cleanup();
