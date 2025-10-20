"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const database_1 = __importDefault(require("./database"));
const revertMigration = async () => {
    console.log('Reverting database migration...');
    try {
        await new Promise((resolve, reject) => {
            database_1.default.serialize(() => {
                database_1.default.run('PRAGMA foreign_keys=OFF;', (err) => {
                    if (err)
                        return reject(err);
                    database_1.default.run('BEGIN TRANSACTION;', (err) => {
                        if (err)
                            return reject(err);
                        resolve();
                    });
                });
            });
        });
        const tables = ['Inventory', 'JobServices', 'ServiceItemParts', 'Invoices', 'Payments', 'Sales', 'SaleInventory'];
        for (const table of tables) {
            // Drop the new table if it exists
            await new Promise((resolve, reject) => {
                database_1.default.run(`DROP TABLE IF EXISTS ${table}`, (err) => {
                    if (err)
                        return reject(err);
                    console.log(`Dropped table ${table} if it existed.`);
                    resolve();
                });
            });
            // Rename the old table back
            await new Promise((resolve, reject) => {
                database_1.default.run(`ALTER TABLE ${table}_old RENAME TO ${table}`, (err) => {
                    // If the old table doesn't exist, that's fine
                    if (err && err.message.includes('no such table')) {
                        console.log(`Table ${table}_old not found, skipping rename.`);
                        return resolve();
                    }
                    if (err)
                        return reject(err);
                    console.log(`Renamed ${table}_old to ${table}.`);
                    resolve();
                });
            });
        }
        await new Promise((resolve, reject) => {
            database_1.default.run('COMMIT;', (err) => {
                if (err)
                    return reject(err);
                database_1.default.run('PRAGMA foreign_keys=ON;', (err) => {
                    if (err)
                        return reject(err);
                    console.log('Revert committed.');
                    resolve();
                });
            });
        });
        console.log('Database migration reverted successfully.');
    }
    catch (err) {
        console.error('Error during migration revert, rolling back:', err);
        await new Promise((resolve, reject) => {
            database_1.default.run('ROLLBACK;', (err) => {
                if (err)
                    return reject(err);
                database_1.default.run('PRAGMA foreign_keys=ON;', (err) => {
                    if (err)
                        return reject(err);
                    resolve();
                });
            });
        });
    }
    finally {
        database_1.default.close((err) => {
            if (err) {
                console.error(err.message);
            }
            console.log('Database connection closed.');
        });
    }
};
revertMigration();
