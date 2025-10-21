import * as sqlite3 from 'sqlite3';
import * as path from 'path';

const DBSOURCE = path.join(__dirname, '..', 'database.sqlite');

const db = new sqlite3.Database(DBSOURCE, (err: Error | null) => {
  if (err) {
    // Cannot open database
    console.error(err.message);
    throw err;
  }
  console.log('Connected to the SQLite database.');

  // Enable foreign key support
  db.run('PRAGMA foreign_keys = ON;', (err: Error | null) => {
    if (err) {
      console.error('Failed to enable foreign keys:', err.message);
    }
  });
});

export default db;