-- 1. Create a new table with the desired schema
CREATE TABLE Invoices_new (
    jobId INTEGER PRIMARY KEY,
    totalAmount REAL NOT NULL,
    amountPaid REAL DEFAULT 0,
    status TEXT DEFAULT 'Unpaid',
    dateCreated TEXT NOT NULL,
    FOREIGN KEY (jobId) REFERENCES Jobs(id)
);

-- 2. Copy data from the old table to the new table
INSERT INTO Invoices_new (jobId, totalAmount, amountPaid, status, dateCreated)
SELECT jobId, totalAmount, amountPaid, status, dateCreated FROM Invoices;

-- 3. Drop the old table
DROP TABLE Invoices;

-- 4. Rename the new table to the original name
ALTER TABLE Invoices_new RENAME TO Invoices;
