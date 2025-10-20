"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express = require("express");
const router = express.Router();
const database_1 = __importDefault(require("../database"));
console.log('POS routes module loaded');
// POST finalize a job and create an invoice
router.post('/finalize-job', async (req, res) => {
    const { jobId, discountAmount, initialPayment } = req.body;
    if (!jobId) {
        return res.status(400).json({ "error": "jobId is required" });
    }
    try {
        // Fetch job services and inventory to calculate total amount
        const jobServices = await new Promise((resolve, reject) => {
            database_1.default.all("SELECT * FROM JobServices WHERE jobId = ?", [jobId], (err, rows) => {
                if (err)
                    reject(err);
                else
                    resolve(rows);
            });
        });
        const jobInventory = await new Promise((resolve, reject) => {
            database_1.default.all("SELECT ji.*, i.price FROM JobInventory ji JOIN Inventory i ON ji.inventoryId = i.id WHERE ji.jobId = ?", [jobId], (err, rows) => {
                if (err)
                    reject(err);
                else
                    resolve(rows);
            });
        });
        let totalAmount = 0;
        jobServices.forEach(service => totalAmount += service.price);
        jobInventory.forEach(item => totalAmount += item.price * item.quantityUsed);
        // Convert amounts from client (in dollars) to cents
        const discountAmountInCents = discountAmount ? Math.round(discountAmount * 100) : 0;
        const initialPaymentAmountInCents = initialPayment ? Math.round(initialPayment.amount * 100) : 0;
        // Create invoice
        const dateCreated = new Date().toISOString();
        const finalTotal = totalAmount - discountAmountInCents;
        let status = 'Unpaid';
        if (initialPaymentAmountInCents > 0) {
            status = initialPaymentAmountInCents >= finalTotal ? 'Paid' : 'Partially Paid';
        }
        const invoice = await new Promise((resolve, reject) => {
            database_1.default.run('INSERT INTO Invoices (jobId, totalAmount, amountPaid, discountAmount, dateCreated, status) VALUES (?, ?, ?, ?, ?, ?)', [jobId, totalAmount, initialPaymentAmountInCents, discountAmountInCents, dateCreated, status], function (err) {
                if (err)
                    reject(err);
                else
                    resolve({ id: this.lastID, jobId, totalAmount, amountPaid: initialPaymentAmountInCents, discountAmount: discountAmountInCents, dateCreated, status });
            });
        });
        // Create initial payment if provided
        if (initialPayment && initialPayment.amount > 0) {
            await new Promise((resolve, reject) => {
                database_1.default.run('INSERT INTO Payments (invoiceId, amount, paymentDate, paymentMethod, type, notes) VALUES (?, ?, ?, ?, ?, ?)', [jobId, initialPaymentAmountInCents, new Date().toISOString(), initialPayment.paymentMethod, initialPayment.type, initialPayment.notes], function (err) {
                    if (err)
                        reject(err);
                    else
                        resolve(this.lastID);
                });
            });
        }
        // Update job status to 'Invoiced'
        await new Promise((resolve, reject) => {
            database_1.default.run('UPDATE Jobs SET status = ? WHERE id = ?', ['Invoiced', jobId], function (err) {
                if (err)
                    reject(err);
                else
                    resolve(this.changes);
            });
        });
        res.status(201).json({
            "message": "Job finalized and invoice created",
            "invoice": invoice,
            "jobId": jobId,
            "newJobStatus": 'Invoiced'
        });
    }
    catch (error) {
        res.status(500).json({ "error": error.message });
    }
});
// POST a new payment for an invoice
router.post('/payments', async (req, res) => {
    const { invoiceId, amount, paymentMethod, type, notes } = req.body;
    if (!invoiceId || !amount || !paymentMethod || !type) {
        return res.status(400).json({ "error": "Missing required fields" });
    }
    try {
        // Fetch invoice details
        const invoice = await new Promise((resolve, reject) => {
            database_1.default.get("SELECT * FROM Invoices WHERE jobId = ?", [invoiceId], (err, row) => {
                if (err)
                    reject(err);
                else
                    resolve(row);
            });
        });
        if (!invoice) {
            return res.status(404).json({ "message": "Invoice not found" });
        }
        const amountInCents = Math.round(amount * 100);
        // Create new payment
        const paymentDate = new Date().toISOString();
        const newPayment = await new Promise((resolve, reject) => {
            database_1.default.run('INSERT INTO Payments (invoiceId, amount, paymentDate, paymentMethod, type, notes) VALUES (?, ?, ?, ?, ?, ?)', [invoiceId, amountInCents, paymentDate, paymentMethod, type, notes], function (err) {
                if (err)
                    reject(err);
                else
                    resolve({ id: this.lastID, invoiceId, amount: amountInCents, paymentDate, paymentMethod, type, notes });
            });
        });
        // Get the new total paid amount
        const paymentsSql = `SELECT SUM(amount) as totalPaid FROM Payments WHERE invoiceId = ?`;
        const paymentInfo = await new Promise((resolve, reject) => {
            database_1.default.get(paymentsSql, [invoiceId], (err, row) => {
                if (err)
                    reject(err);
                resolve(row);
            });
        });
        const newAmountPaid = paymentInfo.totalPaid || 0;
        // Update invoice status
        const finalTotal = invoice.totalAmount - invoice.discountAmount;
        const newStatus = newAmountPaid >= finalTotal ? 'Paid' : 'Partially Paid';
        await new Promise((resolve, reject) => {
            database_1.default.run('UPDATE Invoices SET status = ? WHERE jobId = ?', [newStatus, invoiceId], function (err) {
                if (err)
                    reject(err);
                else
                    resolve(this.changes);
            });
        });
        res.status(201).json({
            "message": "Payment recorded successfully",
            "payment": newPayment,
            "invoiceId": invoiceId,
            "newInvoiceStatus": newStatus
        });
    }
    catch (error) {
        res.status(500).json({ "error": error.message });
    }
});
exports.default = router;
