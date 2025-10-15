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

    // Add customerId to Invoices if it doesn't exist
    db.run(`ALTER TABLE Invoices ADD COLUMN customerId INTEGER`, (err) => {
      if (err && !err.message.includes('duplicate column name')) {
        console.error('Error adding customerId column to Invoices:', err.message);
      } else {
        console.log('Column customerId already exists or was added to Invoices.');
      }
    });
  });
};

export default setupDatabase;
