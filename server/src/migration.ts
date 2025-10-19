import db from './database';

const migrate = async () => {
  console.log('Starting database migration...');

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

    const tablesToMigrate = ['Inventory', 'JobServices', 'ServiceItemParts', 'Invoices', 'Payments', 'Sales', 'SaleInventory', 'JobInventory'];

    // 1. Rename all tables
    for (const table of tablesToMigrate) {
        await new Promise<void>((resolve, reject) => {
            db.run(`ALTER TABLE ${table} RENAME TO ${table}_old`, (err) => {
                if (err) return reject(err);
                console.log(`Renamed ${table} to ${table}_old`);
                resolve();
            });
        });
    }

    // 2. Create all new tables
    await new Promise<void>((resolve, reject) => {
        db.serialize(() => {
            db.run(`
                CREATE TABLE Inventory (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    name TEXT NOT NULL UNIQUE,
                    quantity INTEGER NOT NULL DEFAULT 0,
                    price INTEGER NOT NULL
                )
            `);
            db.run(`
                CREATE TABLE JobServices (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    jobId INTEGER,
                    serviceItemPartId INTEGER,
                    price INTEGER,
                    FOREIGN KEY (jobId) REFERENCES Jobs (id),
                    FOREIGN KEY (serviceItemPartId) REFERENCES ServiceItemParts (id)
                )
            `);
            db.run(`
                CREATE TABLE ServiceItemParts (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    part_name TEXT NOT NULL,
                    category TEXT NOT NULL,
                    common_services TEXT NOT NULL,
                    price INTEGER NOT NULL,
                    description TEXT
                )
            `);
            db.run(`
                CREATE TABLE Invoices (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    jobId INTEGER UNIQUE,
                    totalAmount INTEGER NOT NULL,
                    amountPaid INTEGER NOT NULL DEFAULT 0,
                    discountAmount INTEGER NOT NULL DEFAULT 0,
                    dateCreated TEXT NOT NULL,
                    status TEXT CHECK(status IN ('Unpaid', 'Partially Paid', 'Paid', 'Overdue', 'Refunded')) NOT NULL DEFAULT 'Unpaid',
                    FOREIGN KEY (jobId) REFERENCES Jobs (id)
                )
            `);
            db.run(`
                CREATE TABLE Payments (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    invoiceId INTEGER NOT NULL,
                    amount INTEGER NOT NULL,
                    paymentDate TEXT NOT NULL,
                    paymentMethod TEXT CHECK(paymentMethod IN ('Cash', 'Card', 'Bank Transfer', 'Other')) NOT NULL,
                    transactionId TEXT,
                    type TEXT CHECK(type IN ('Deposit', 'Full Payment', 'Partial Payment', 'Return')) NOT NULL,
                    notes TEXT,
                    FOREIGN KEY (invoiceId) REFERENCES Invoices (id)
                )
            `);
            db.run(`
                CREATE TABLE Sales (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    customerId INTEGER,
                    totalAmount INTEGER NOT NULL,
                    amountPaid INTEGER NOT NULL DEFAULT 0,
                    discountAmount INTEGER NOT NULL DEFAULT 0,
                    dateCreated TEXT NOT NULL,
                    status TEXT CHECK(status IN ('Unpaid', 'Partially Paid', 'Paid', 'Overdue', 'Refunded')) NOT NULL DEFAULT 'Unpaid',
                    FOREIGN KEY (customerId) REFERENCES Customers (id)
                )
            `);
            db.run(`
                CREATE TABLE SaleInventory (
                    saleId INTEGER,
                    inventoryId INTEGER,
                    quantitySold INTEGER NOT NULL,
                    priceAtSale INTEGER NOT NULL,
                    PRIMARY KEY (saleId, inventoryId),
                    FOREIGN KEY (saleId) REFERENCES Sales (id),
                    FOREIGN KEY (inventoryId) REFERENCES Inventory (id)
                )
            `);
            db.run(`
                CREATE TABLE JobInventory (
                    jobId INTEGER,
                    inventoryId INTEGER,
                    quantityUsed INTEGER NOT NULL,
                    PRIMARY KEY (jobId, inventoryId),
                    FOREIGN KEY (jobId) REFERENCES Jobs (id),
                    FOREIGN KEY (inventoryId) REFERENCES Inventory (id)
                )
            `, (err) => {
                if (err) return reject(err);
                console.log('Created all new tables.');
                resolve();
            });
        });
    });

    // 3. Copy all data
    await new Promise<void>((resolve, reject) => {
        db.serialize(() => {
            db.run(`INSERT INTO Inventory (id, name, quantity, price) SELECT id, name, quantity, CAST(ROUND(price * 100) AS INTEGER) FROM Inventory_old`);
            db.run(`INSERT INTO JobServices (id, jobId, serviceItemPartId, price) SELECT id, jobId, serviceItemPartId, CAST(ROUND(price * 100) AS INTEGER) FROM JobServices_old`);
            db.run(`INSERT INTO ServiceItemParts (id, part_name, category, common_services, price, description) SELECT id, part_name, category, common_services, CAST(ROUND(price * 100) AS INTEGER), description FROM ServiceItemParts_old`);
            db.run(`INSERT INTO Invoices (id, jobId, totalAmount, amountPaid, discountAmount, dateCreated, status) SELECT id, jobId, CAST(ROUND(totalAmount * 100) AS INTEGER), CAST(ROUND(amountPaid * 100) AS INTEGER), CAST(ROUND(discountAmount * 100) AS INTEGER), dateCreated, status FROM Invoices_old`);
            db.run(`INSERT INTO Payments (id, invoiceId, amount, paymentDate, paymentMethod, transactionId, type, notes) SELECT id, invoiceId, CAST(ROUND(amount * 100) AS INTEGER), paymentDate, paymentMethod, transactionId, type, notes FROM Payments_old`);
            db.run(`INSERT INTO Sales (id, customerId, totalAmount, amountPaid, discountAmount, dateCreated, status) SELECT id, customerId, CAST(ROUND(totalAmount * 100) AS INTEGER), CAST(ROUND(amountPaid * 100) AS INTEGER), CAST(ROUND(discountAmount * 100) AS INTEGER), dateCreated, status FROM Sales_old`);
            db.run(`INSERT INTO SaleInventory (saleId, inventoryId, quantitySold, priceAtSale) SELECT saleId, inventoryId, quantitySold, CAST(ROUND(priceAtSale * 100) AS INTEGER) FROM SaleInventory_old`);
            db.run(`INSERT INTO JobInventory (jobId, inventoryId, quantityUsed) SELECT jobId, inventoryId, quantityUsed FROM JobInventory_old`, (err) => {
                if (err) return reject(err);
                console.log('Copied all data.');
                resolve();
            });
        });
    });

    // 4. Drop all old tables
    for (const table of tablesToMigrate) {
        await new Promise<void>((resolve, reject) => {
            db.run(`DROP TABLE ${table}_old`, (err) => {
                if (err) return reject(err);
                console.log(`Dropped ${table}_old`);
                resolve();
            });
        });
    }

    await new Promise<void>((resolve, reject) => {
      db.run('COMMIT;', (err) => {
        if (err) return reject(err);
        db.run('PRAGMA foreign_keys=ON;', (err) => {
          if (err) return reject(err);
          console.log('Migration committed.');
          resolve();
        });
      });
    });

    console.log('Database migration finished successfully.');
  } catch (err) {
    console.error('Error during migration, rolling back:', err);
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
        console.log('Close the database connection.');
    });
  }
};

migrate();