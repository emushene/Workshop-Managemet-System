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
        // Fetch job details
        const job = await new Promise((resolve, reject) => {
            database_1.default.get("SELECT * FROM Jobs WHERE id = ?", [jobId], (err, row) => {
                if (err)
                    reject(err);
                else
                    resolve(row);
            });
        });
        if (!job) {
            return res.status(404).json({ "message": "Job not found" });
        }
        // Calculate total amount
        let totalAmount = job.servicePrice || 0;
        // Add cost of parts procured
        if (job.partsProcured) {
            try {
                const partsProcured = JSON.parse(job.partsProcured);
                if (Array.isArray(partsProcured)) {
                    partsProcured.forEach((part) => {
                        if (part.cost && part.quantity) {
                            totalAmount += (part.cost * part.quantity);
                        }
                    });
                }
            }
            catch (parseError) {
                console.error("Error parsing partsProcured JSON:", parseError);
                // Continue without adding parts cost if parsing fails
            }
        }
        // Create invoice
        const dateCreated = new Date().toISOString();
        const amountPaid = initialPayment ? initialPayment.amount : 0;
        const finalTotal = totalAmount - (discountAmount || 0);
        let status = 'Unpaid';
        if (amountPaid > 0) {
            status = amountPaid >= finalTotal ? 'Paid' : 'Partially Paid';
        }
        const invoice = await new Promise((resolve, reject) => {
            database_1.default.run('INSERT INTO Invoices (jobId, totalAmount, amountPaid, discountAmount, dateCreated, status) VALUES (?, ?, ?, ?, ?, ?)', [jobId, totalAmount, amountPaid, discountAmount || 0, dateCreated, status], function (err) {
                if (err)
                    reject(err);
                else
                    resolve({ id: this.lastID, jobId, totalAmount, amountPaid, discountAmount: discountAmount || 0, dateCreated, status });
            });
        });
        // Create initial payment if provided
        if (initialPayment && initialPayment.amount > 0) {
            await new Promise((resolve, reject) => {
                database_1.default.run('INSERT INTO Payments (invoiceId, amount, paymentDate, paymentMethod, type, notes) VALUES (?, ?, ?, ?, ?, ?)', [invoice.id, initialPayment.amount, new Date().toISOString(), initialPayment.paymentMethod, initialPayment.type, initialPayment.notes], function (err) {
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
            database_1.default.get("SELECT * FROM Invoices WHERE id = ?", [invoiceId], (err, row) => {
                if (err)
                    reject(err);
                else
                    resolve(row);
            });
        });
        if (!invoice) {
            return res.status(404).json({ "message": "Invoice not found" });
        }
        // Create new payment
        const paymentDate = new Date().toISOString();
        const newPayment = await new Promise((resolve, reject) => {
            database_1.default.run('INSERT INTO Payments (invoiceId, amount, paymentDate, paymentMethod, type, notes) VALUES (?, ?, ?, ?, ?, ?)', [invoiceId, amount, paymentDate, paymentMethod, type, notes], function (err) {
                if (err)
                    reject(err);
                else
                    resolve({ id: this.lastID, invoiceId, amount, paymentDate, paymentMethod, type, notes });
            });
        });
        // Update invoice amountPaid and status
        const newAmountPaid = invoice.amountPaid + amount;
        const finalTotal = invoice.totalAmount - invoice.discountAmount;
        const newStatus = newAmountPaid >= finalTotal ? 'Paid' : 'Partially Paid';
        await new Promise((resolve, reject) => {
            database_1.default.run('UPDATE Invoices SET amountPaid = ?, status = ? WHERE id = ?', [newAmountPaid, newStatus, invoiceId], function (err) {
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
