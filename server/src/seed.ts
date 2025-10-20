import db from './database';
const bcrypt = require('bcrypt');
import fs from 'fs';
import path from 'path';

const saltRounds = 10;

const seed = () => {
  console.log('Resetting and seeding database...');

  bcrypt.hash('admin', saltRounds, (err: Error | null, adminPassword: string) => {
    if (err) {
      console.error('Error hashing password:', err);
      return;
    }

    db.serialize(() => {
      // Enable foreign keys to ensure proper deletion order
      db.run('PRAGMA foreign_keys = ON;');

      // Create tables
      const createTablesQueries = [
        `CREATE TABLE IF NOT EXISTS Users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          username TEXT UNIQUE,
          password TEXT,
          role TEXT CHECK(role IN ('admin', 'user'))
        )`,
        `CREATE TABLE IF NOT EXISTS Customers (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          address TEXT,
          telephone TEXT NOT NULL,
          email TEXT
        )`,
        `CREATE TABLE IF NOT EXISTS Vehicles (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          make TEXT NOT NULL,
          model TEXT NOT NULL,
          UNIQUE(make, model)
        )`,
        `CREATE TABLE IF NOT EXISTS Jobs (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          customerId INTEGER,
          vehicleId INTEGER,
          itemDescription TEXT NOT NULL,
          jobType TEXT CHECK(jobType IN ('PART', 'VEHICLE')) NOT NULL,
          status TEXT CHECK(status IN ('Booked', 'In Progress', 'Completed', 'Invoiced', 'Cancelled')) NOT NULL DEFAULT 'Booked',
          vehicleYear INTEGER,
          partNumber TEXT,
          serialNumber TEXT,
          conditionIn TEXT,
          dateBookedIn TEXT,
          technicianNotes TEXT,
          updates TEXT,
          FOREIGN KEY (customerId) REFERENCES Customers (id) ON DELETE SET NULL,
          FOREIGN KEY (vehicleId) REFERENCES Vehicles (id) ON DELETE SET NULL
        )`,
        `CREATE TABLE IF NOT EXISTS JobItems (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          jobId INTEGER NOT NULL,
          category TEXT NOT NULL,
          instructions TEXT NOT NULL, -- Stored as JSON string
          price INTEGER NOT NULL, -- Stored in cents
          FOREIGN KEY (jobId) REFERENCES Jobs (id) ON DELETE CASCADE
        )`,
        `CREATE TABLE IF NOT EXISTS Inventory (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL UNIQUE,
          quantity INTEGER NOT NULL DEFAULT 0,
          price REAL NOT NULL
        )`,
        `CREATE TABLE IF NOT EXISTS JobInventory (
            jobId INTEGER,
            inventoryId INTEGER,
            quantityUsed INTEGER NOT NULL,
            PRIMARY KEY (jobId, inventoryId),
            FOREIGN KEY (jobId) REFERENCES Jobs (id) ON DELETE CASCADE,
            FOREIGN KEY (inventoryId) REFERENCES Inventory (id) ON DELETE CASCADE
        )`,
        `CREATE TABLE IF NOT EXISTS Invoices (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          jobId INTEGER UNIQUE,
          totalAmount REAL NOT NULL,
          amountPaid REAL NOT NULL DEFAULT 0,
          discountAmount REAL NOT NULL DEFAULT 0,
          dateCreated TEXT NOT NULL,
          status TEXT CHECK(status IN ('Unpaid', 'Partially Paid', 'Paid', 'Overdue', 'Refunded')) NOT NULL DEFAULT 'Unpaid',
          FOREIGN KEY (jobId) REFERENCES Jobs (id) ON DELETE SET NULL
        )`,
        `CREATE TABLE IF NOT EXISTS Payments (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          invoiceId INTEGER NOT NULL,
          amount REAL NOT NULL,
          paymentDate TEXT NOT NULL,
          paymentMethod TEXT CHECK(paymentMethod IN ('Cash', 'Card', 'Bank Transfer', 'Other')) NOT NULL,
          transactionId TEXT,
          type TEXT CHECK(type IN ('Deposit', 'Full Payment', 'Partial Payment', 'Return')) NOT NULL,
          notes TEXT,
          FOREIGN KEY (invoiceId) REFERENCES Invoices (id) ON DELETE CASCADE
        )`,
        `CREATE TABLE IF NOT EXISTS Sales (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          customerId INTEGER,
          totalAmount REAL NOT NULL,
          amountPaid REAL NOT NULL DEFAULT 0,
          discountAmount REAL NOT NULL DEFAULT 0,
          dateCreated TEXT NOT NULL,
          status TEXT CHECK(status IN ('Unpaid', 'Partially Paid', 'Paid', 'Overdue', 'Refunded')) NOT NULL DEFAULT 'Unpaid',
          FOREIGN KEY (customerId) REFERENCES Customers (id) ON DELETE SET NULL
        )`,
        `CREATE TABLE IF NOT EXISTS SaleInventory (
          saleId INTEGER,
          inventoryId INTEGER,
          quantitySold INTEGER NOT NULL,
          priceAtSale REAL NOT NULL,
          PRIMARY KEY (saleId, inventoryId),
          FOREIGN KEY (saleId) REFERENCES Sales (id) ON DELETE CASCADE,
          FOREIGN KEY (inventoryId) REFERENCES Inventory (id) ON DELETE CASCADE
        )`
      ];

      createTablesQueries.forEach(query => {
        db.run(query, (err: Error | null) => {
          if (err) {
            console.error('Error creating table:', err.message);
          }
        });
      });

      // Clear all data in the correct order to respect foreign key constraints
      const tablesToClear = [
        'Payments',
        'Invoices',
        'JobItems',
        'JobInventory',
        'SaleInventory',
        'Sales',
        'Jobs',
        'Customers',
        'Vehicles',
        'Inventory',
        'Users'
      ];

      tablesToClear.forEach(table => {
        db.run(`DELETE FROM ${table}`, (err) => {
            if (err) console.error(`Error clearing table ${table}:`, err.message)
        });
        db.run(`DELETE FROM sqlite_sequence WHERE name = '${table}'`, (err) => {
            if (err) console.error(`Error resetting sequence for table ${table}:`, err.message)
        });
      });

      console.log('All tables cleared.');

      // Re-seed essential data

      // 1. Add Admin User
      const adminUserStmt = db.prepare("INSERT OR IGNORE INTO Users (username, password, role) VALUES (?, ?, ?)");
      adminUserStmt.run('admin', adminPassword, 'admin');
      adminUserStmt.finalize();

      // 2. Seed Vehicles
      const vehiclesPath = path.join(__dirname, 'vehicle.json');
      const vehiclesData = JSON.parse(fs.readFileSync(vehiclesPath, 'utf8'));
      const vehicleStmt = db.prepare("INSERT OR IGNORE INTO Vehicles (make, model) VALUES (?, ?)");
      vehiclesData.forEach((v: { make: string, model: string }) => vehicleStmt.run(v.make, v.model));
      vehicleStmt.finalize();
      console.log('Vehicles seeded.');

      console.log('Database reset and seeding complete.');

      // Close the database connection after all operations
      db.close((err: Error | null) => {
        if (err) {
          return console.error('Error closing db:', err.message);
        }
        console.log('Closed the database connection.');
      });
    });
  });
};

seed();
