
import db from './database';

const closeDb = () => {
  console.log('Attempting to close database connection...');
  db.close((err) => {
    if (err) {
      console.error('Error closing database:', err.message);
    } else {
      console.log('Database connection closed.');
    }
  });
};

closeDb();
