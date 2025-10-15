import db from './database';

const setupDatabase = () => {
  db.serialize(() => {
    console.log('Running database setup...');

    // Add telephone to Customers if it doesn't exist
    db.run(`ALTER TABLE Customers ADD COLUMN telephone TEXT`, (err) => {
      if (err && !err.message.includes('duplicate column name')) {
        console.error('Error adding telephone column to Customers:', err.message);
      } else {
        console.log('Column telephone already exists or was added to Customers.');
      }
    });
  });
};

export default setupDatabase;
