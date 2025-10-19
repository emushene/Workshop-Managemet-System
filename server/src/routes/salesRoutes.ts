
import express = require('express');
const router = express.Router();
import db from '../database';

// Get all sales
router.get('/', async (req: express.Request, res: express.Response) => {
    try {
        const sales = await new Promise((resolve, reject) => {
            db.all("SELECT * FROM Sales", (err: Error, rows: any) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
        res.status(200).json({
            "message": "Sales retrieved successfully",
            "data": sales
        });
    } catch (error: any) {
        res.status(500).json({ "error": error.message });
    }
});

// Create a new sale
router.post('/', async (req: express.Request, res: express.Response) => {
    const { customerId, items, discountAmount, payments, status: requestStatus } = req.body;

    if (!items || items.length === 0) {
        return res.status(400).json({ "error": "Items are required" });
    }

    try {
        // Create a new job for the sale
        const job: any = await new Promise((resolve, reject) => {
            db.run('INSERT INTO Jobs (customerId, itemDescription, jobType, status) VALUES (?, ?, ?, ?)',
                [customerId, 'Direct Sale', 'PART', 'Completed'],
                function (this: any, err: Error) {
                    if (err) reject(err);
                    else resolve({ id: this.lastID });
                }
            );
        });

        let totalAmount = 0;
        for (const item of items) {
            const inventoryItem: any = await new Promise((resolve, reject) => {
                db.get("SELECT * FROM Inventory WHERE id = ?", [item.id], (err: Error, row: any) => {
                    if (err) reject(err);
                    else resolve(row);
                });
            });
            if (!inventoryItem) {
                return res.status(404).json({ "message": `Inventory item with id ${item.id} not found` });
            }
            totalAmount += inventoryItem.price * item.quantity;

            // Add item to JobInventory
            await new Promise((resolve, reject) => {
                db.run('INSERT INTO JobInventory (jobId, inventoryId, quantityUsed) VALUES (?, ?, ?)',
                    [job.id, item.id, item.quantity],
                    function (this: any, err: Error) {
                        if (err) reject(err);
                        else resolve(this.lastID);
                    }
                );
            });

            // Update inventory quantity
            const newQuantity = inventoryItem.quantity - item.quantity;
            await new Promise((resolve, reject) => {
                db.run('UPDATE Inventory SET quantity = ? WHERE id = ?', [newQuantity, item.id], function (this: any, err: Error) {
                    if (err) reject(err);
                    else resolve(this.changes);
                });
            });
        }

        const discountAmountInCents = discountAmount ? Math.round(discountAmount * 100) : 0;
        const paymentsInCents = payments ? payments.map((p: any) => ({ ...p, amount: Math.round(p.amount * 100) })) : [];

        const dateCreated = new Date().toISOString();
        const finalTotal = totalAmount - discountAmountInCents;
        const totalPaid = paymentsInCents.reduce((acc: number, p: any) => acc + p.amount, 0);

        let status = requestStatus;
        if (!status) {
            if (totalPaid > 0) {
                status = totalPaid >= finalTotal ? 'Paid' : 'Partially Paid';
            } else {
                status = 'Unpaid';
            }
        }

        // Create invoice for the job
        const invoice: any = await new Promise((resolve, reject) => {
            db.run('INSERT INTO Invoices (jobId, totalAmount, amountPaid, discountAmount, dateCreated, status) VALUES (?, ?, ?, ?, ?, ?)',
                [job.id, totalAmount, totalPaid, discountAmountInCents, dateCreated, status],
                function (this: any, err: Error) {
                    if (err) reject(err);
                    else resolve({ id: this.lastID, jobId: job.id, totalAmount, amountPaid: totalPaid, discountAmount: discountAmountInCents, dateCreated, status });
                }
            );
        });

        // Add payments to Payments table
        if (paymentsInCents) {
            for (const payment of paymentsInCents) {
                await new Promise((resolve, reject) => {
                    db.run('INSERT INTO Payments (invoiceId, amount, paymentDate, paymentMethod, type, notes) VALUES (?, ?, ?, ?, ?, ?)',
                        [invoice.jobId, payment.amount, new Date().toISOString(), payment.method, 'Full Payment', 'Payment for sale'],
                        function (this: any, err: Error) {
                            if (err) reject(err);
                            else resolve(this.lastID);
                        }
                    );
                });
            }
        }

        res.status(201).json({
            "message": "Sale created successfully as a job and invoice",
            "data": { jobId: job.id, invoiceId: invoice.id }
        });

    } catch (error: any) {
        console.error('Error creating sale:', error);
        res.status(500).json({ "error": error.message });
    }
});


export default router;