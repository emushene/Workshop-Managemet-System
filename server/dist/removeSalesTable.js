"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const database_1 = __importDefault(require("./database"));
const removeSalesTables = async () => {
    console.log('Removing Sales and SaleInventory tables...');
    try {
        await new Promise((resolve, reject) => {
            database_1.default.serialize(() => {
                database_1.default.run('DROP TABLE IF EXISTS Sales', (err) => {
                    if (err)
                        return reject(err);
                    console.log('Sales table removed.');
                    database_1.default.run('DROP TABLE IF EXISTS SaleInventory', (err) => {
                        if (err)
                            return reject(err);
                        console.log('SaleInventory table removed.');
                        resolve();
                    });
                });
            });
        });
        console.log('Tables removed successfully.');
    }
    catch (err) {
        console.error('Error removing tables:', err);
    }
    finally {
        database_1.default.close((err) => {
            if (err) {
                console.error('Error closing database:', err.message);
            }
            console.log('Database connection closed.');
        });
    }
};
removeSalesTables();
