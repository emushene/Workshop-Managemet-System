"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const database_1 = __importDefault(require("./database"));
const fixInvoices = async () => {
    console.log('Starting to fix invoices...');
    try {
        // Get all invoices
        const invoices = await new Promise((resolve, reject) => {
            database_1.default.all('SELECT * FROM Invoices', (err, rows) => {
                if (err) {
                    reject(err);
                }
                else {
                    resolve(rows);
                }
            });
        });
        for (const invoice of invoices) {
            // Calculate the total payments for the invoice
            const totalPayments = await new Promise((resolve, reject) => {
                database_1.default.get('SELECT SUM(amount) AS total FROM Payments WHERE invoiceId = ?', [invoice.jobId], (err, row) => {
                    if (err) {
                        reject(err);
                    }
                    else {
                        resolve(row.total || 0);
                    }
                });
            });
            // Update the invoice if the amountPaid is incorrect
            if (invoice.amountPaid !== totalPayments) {
                console.log(`Fixing invoice ${invoice.jobId}: old amountPaid: ${invoice.amountPaid}, new amountPaid: ${totalPayments}`);
                await new Promise((resolve, reject) => {
                    database_1.default.run('UPDATE Invoices SET amountPaid = ? WHERE jobId = ?', [totalPayments, invoice.jobId], (err) => {
                        if (err) {
                            reject(err);
                        }
                        else {
                            resolve();
                        }
                    });
                });
            }
        }
        console.log('Finished fixing invoices.');
    }
    catch (err) {
        console.error('Error fixing invoices:', err);
    }
    finally {
        database_1.default.close((err) => {
            if (err) {
                console.error('Error closing database:', err.message);
            }
            else {
                console.log('Database connection closed.');
            }
        });
    }
};
fixInvoices();
