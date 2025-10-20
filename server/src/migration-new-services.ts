import db from './database';

const migrateDatabase = () => {
  db.serialize(() => {
    console.log('Running database migration for new service structure...');

    // 1. Drop the old tables
    db.run(`DROP TABLE IF EXISTS JobServices;`, (err) => {
      if (err) {
        console.error('Error dropping JobServices table:', err.message);
      } else {
        console.log('Table JobServices dropped successfully.');
      }
    });

    db.run(`DROP TABLE IF EXISTS ServiceItemParts;`, (err) => {
      if (err) {
        console.error('Error dropping ServiceItemParts table:', err.message);
      } else {
        console.log('Table ServiceItemParts dropped successfully.');
      }
    });

    // 2. Create the new JobItems table
    const createJobItemsTable = `
      CREATE TABLE IF NOT EXISTS JobItems (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        jobId INTEGER NOT NULL,
        category TEXT NOT NULL,
        instructions TEXT NOT NULL, -- Stored as JSON string
        price INTEGER NOT NULL, -- Stored in cents
        FOREIGN KEY (jobId) REFERENCES Jobs (id) ON DELETE CASCADE
      );
    `;

    db.run(createJobItemsTable, (err) => {
      if (err) {
        console.error('Error creating JobItems table:', err.message);
      } else {
        console.log('Table JobItems created successfully.');
      }
    });

    // Close the database connection
    db.close((err) => {
      if (err) {
        return console.error('Error closing db:', err.message);
      }
      console.log('Migration complete. Closed the database connection.');
    });
  });
};

migrateDatabase();
