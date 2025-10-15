
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
        // Calculate total amount
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
        }

        const dateCreated = new Date().toISOString();
        const finalTotal = totalAmount - (discountAmount || 0);
        const totalPaid = payments ? payments.reduce((acc: number, p: any) => acc + p.amount, 0) : 0;

        let status = requestStatus;
        if (!status) {
            if (totalPaid > 0) {
                status = totalPaid >= finalTotal ? 'Paid' : 'Partially Paid';
            } else {
                status = 'Unpaid';
            }
        }

        // Create sale
        const sale: any = await new Promise((resolve, reject) => {
            db.run('INSERT INTO Sales (customerId, totalAmount, amountPaid, discountAmount, dateCreated, status) VALUES (?, ?, ?, ?, ?, ?)',
                [customerId, totalAmount, totalPaid, discountAmount || 0, dateCreated, status],
                function (this: any, err: Error) {
                    if (err) reject(err);
                    else resolve({ id: this.lastID, customerId, totalAmount, amountPaid: totalPaid, discountAmount: discountAmount || 0, dateCreated, status });
                }
            );
        });

        // Create a corresponding invoice for the sale
        await new Promise((resolve, reject) => {
            const sql = 'INSERT INTO Invoices (id, customerId, totalAmount, amountPaid, dateCreated, status, discountAmount) VALUES (?, ?, ?, ?, ?, ?, ?)';
            const params = [sale.id, customerId, finalTotal, totalPaid, dateCreated, status, discountAmount || 0];
            db.run(sql, params, function (this: any, err: Error) {
                if (err) reject(err);
                else resolve(this.lastID);
            });
        });

        // Add items to SaleInventory and update inventory quantity
        for (const item of items) {
            const inventoryItem: any = await new Promise((resolve, reject) => {
                db.get("SELECT * FROM Inventory WHERE id = ?", [item.id], (err: Error, row: any) => {
                    if (err) reject(err);
                    else resolve(row);
                });
            });

            await new Promise((resolve, reject) => {
                db.run('INSERT INTO SaleInventory (saleId, inventoryId, quantitySold, priceAtSale) VALUES (?, ?, ?, ?)',
                    [sale.id, item.id, item.quantity, inventoryItem.price],
                    function (this: any, err: Error) {
                        if (err) reject(err);
                        else resolve(this.lastID);
                    }
                );
            });

            const newQuantity = inventoryItem.quantity - item.quantity;
            await new Promise((resolve, reject) => {
                db.run('UPDATE Inventory SET quantity = ? WHERE id = ?', [newQuantity, item.id], function (this: any, err: Error) {
                    if (err) reject(err);
                    else resolve(this.changes);
                });
            });
        }

        // Add payments to Payments table
        if (payments) {
            for (const payment of payments) {
                await new Promise((resolve, reject) => {
                    db.run('INSERT INTO Payments (invoiceId, amount, paymentDate, paymentMethod, type, notes) VALUES (?, ?, ?, ?, ?, ?)',
                        [sale.id, payment.amount, new Date().toISOString(), payment.method, 'Full Payment', 'Payment for sale'],
                        function (this: any, err: Error) {
                            if (err) reject(err);
                            else resolve(this.lastID);
                        }
                    );
                });
            }
        }

        res.status(201).json({
            "message": "Sale created successfully",
            "data": sale
        });

    } catch (error: any) {
        res.status(500).json({ "error": error.message });
    }
});

// Create a new payment
router.post('/payment', async (req: express.Request, res: express.Response) => {
    const { invoiceId, amount, paymentMethod } = req.body;

    if (!invoiceId || !amount || !paymentMethod) {
        return res.status(400).json({ "error": "Invoice ID, amount, and payment method are required" });
    }

    try {
        // Create payment
        await new Promise((resolve, reject) => {
            db.run('INSERT INTO Payments (invoiceId, amount, paymentDate, paymentMethod, type, notes) VALUES (?, ?, ?, ?, ?, ?)',
                [invoiceId, amount, new Date().toISOString(), paymentMethod, 'Full Payment', 'Payment for invoice'],
                function (this: any, err: Error) {
                    if (err) reject(err);
                    else resolve(this.lastID);
                }
            );
        });

        // Update invoice
        const invoice: any = await new Promise((resolve, reject) => {
            db.get("SELECT * FROM Invoices WHERE id = ?", [invoiceId], (err: Error, row: any) => {
                if (err) reject(err);
                else resolve(row);
            });
        });

        const newAmountPaid = invoice.amountPaid + amount;
        const newStatus = newAmountPaid >= invoice.totalAmount ? 'Paid' : 'Partially Paid';

        await new Promise((resolve, reject) => {
            db.run('UPDATE Invoices SET amountPaid = ?, status = ? WHERE id = ?', [newAmountPaid, newStatus, invoiceId], function (this: any, err: Error) {
                if (err) reject(err);
                else resolve(this.changes);
            });
        });

        res.status(201).json({
            "message": "Payment created successfully",
        });

    } catch (error: any) {
        res.status(500).json({ "error": error.message });
    }
});
export default router;