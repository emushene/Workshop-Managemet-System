
import db from './database';

const removeSalesTables = async () => {
  console.log('Removing Sales and SaleInventory tables...');

  try {
    await new Promise<void>((resolve, reject) => {
      db.serialize(() => {
        db.run('DROP TABLE IF EXISTS Sales', (err) => {
          if (err) return reject(err);
          console.log('Sales table removed.');
          db.run('DROP TABLE IF EXISTS SaleInventory', (err) => {
            if (err) return reject(err);
            console.log('SaleInventory table removed.');
            resolve();
          });
        });
      });
    });

    console.log('Tables removed successfully.');
  } catch (err) {
    console.error('Error removing tables:', err);
  } finally {
    db.close((err) => {
      if (err) {
        console.error('Error closing database:', err.message);
      }
      console.log('Database connection closed.');
    });
  }
};

removeSalesTables();
