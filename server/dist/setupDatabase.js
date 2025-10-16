"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const database_1 = __importDefault(require("./database"));
const setupDatabase = () => {
    database_1.default.serialize(() => {
        console.log('Running database setup...');
        // Add telephone to Customers if it doesn't exist
        database_1.default.run(`ALTER TABLE Customers ADD COLUMN telephone TEXT`, (err) => {
            if (err && !err.message.includes('duplicate column name')) {
                console.error('Error adding telephone column to Customers:', err.message);
            }
            else {
                console.log('Column telephone already exists or was added to Customers.');
            }
        });
        // Add customerId to Invoices if it doesn't exist
        database_1.default.run(`ALTER TABLE Invoices ADD COLUMN customerId INTEGER`, (err) => {
            if (err && !err.message.includes('duplicate column name')) {
                console.error('Error adding customerId column to Invoices:', err.message);
            }
            else {
                console.log('Column customerId already exists or was added to Invoices.');
            }
        });
    });
};
exports.default = setupDatabase;
