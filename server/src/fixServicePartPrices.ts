import db from './database';

const fixPrices = () => {
  const sql = 'UPDATE ServiceItemParts SET price = price / 100';

  db.run(sql, [], function (err: Error) {
    if (err) {
      console.error('Error updating prices:', err.message);
      return;
    }
    console.log(`Prices updated successfully. Rows affected: ${this.changes}`);
  });

  // Close the database connection
  db.close((err: Error | null) => {
    if (err) {
      console.error(err.message);
    }
    console.log('Closed the database connection.');
  });
};

fixPrices();
