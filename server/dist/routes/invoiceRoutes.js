"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express = require("express");
const fs_1 = __importDefault(require("fs"));
const router = express.Router();
const database_1 = __importDefault(require("../database"));
console.log('Invoice routes module loaded');
// GET all invoices, or a single invoice by jobId
router.get('/', (req, res) => {
    const { jobId } = req.query;
    if (jobId) {
        // Get a single invoice by jobId
        const sql = "SELECT Invoices.*, Jobs.itemDescription, Jobs.serviceDescription, Customers.name as customerName FROM Invoices JOIN Jobs ON Invoices.jobId = Jobs.id JOIN Customers ON Jobs.customerId = Customers.id WHERE Invoices.jobId = ?";
        database_1.default.get(sql, [jobId], (err, row) => {
            if (err) {
                res.status(400).json({ "error": err.message });
                return;
            }
            if (!row) {
                // No invoice found is not a server error, could be expected. Return empty data.
                res.json({
                    "message": "success",
                    "data": null
                });
                return;
            }
            res.json({
                "message": "success",
                "data": row
            });
        });
    }
    else {
        // Get all invoices
        const sql = "SELECT i.*, c.name as customerName, j.itemDescription, j.serviceDescription FROM Invoices i JOIN Customers c ON i.customerId = c.id LEFT JOIN Jobs j ON i.jobId = j.id";
        database_1.default.all(sql, [], (err, rows) => {
            if (err) {
                res.status(400).json({ "error": err.message });
                return;
            }
            res.json({
                "message": "success",
                "data": rows
            });
        });
    }
});
// GET a single invoice by ID
router.get('/:id', (req, res) => {
    const sql = "SELECT Invoices.*, Jobs.itemDescription, Jobs.serviceDescription, Jobs.servicePrice, Jobs.partsProcured, Customers.name as customerName FROM Invoices JOIN Customers ON Invoices.customerId = Customers.id LEFT JOIN Jobs ON Invoices.jobId = Jobs.id WHERE Invoices.id = ?";
    const params = [parseInt(req.params.id, 10)];
    database_1.default.get(sql, params, (err, row) => {
        if (err) {
            fs_1.default.appendFileSync('error.log', `Error fetching invoice: ${JSON.stringify(err)}\n`);
            res.status(400).json({ "error": err.message });
            return;
        }
        if (!row) {
            res.status(404).json({ "message": "Invoice not found" });
            return;
        }
        res.json({
            "message": "success",
            "data": row
        });
    });
});
// POST a new invoice from a job
router.post('/', async (req, res) => {
    const { jobId, totalAmount, status } = req.body;
    if (!jobId || !totalAmount) {
        res.status(400).json({ "error": "Missing required fields: jobId and totalAmount" });
        return;
    }
    try {
        // Get customerId from the job
        const job = await new Promise((resolve, reject) => {
            database_1.default.get("SELECT customerId FROM Jobs WHERE id = ?", [jobId], (err, row) => {
                if (err)
                    reject(err);
                else
                    resolve(row);
            });
        });
        if (!job || !job.customerId) {
            return res.status(404).json({ "message": "Job or associated customer not found" });
        }
        const customerId = job.customerId;
        const dateCreated = new Date().toISOString();
        const sql = 'INSERT INTO Invoices (jobId, customerId, totalAmount, dateCreated, status) VALUES (?, ?, ?, ?, ?)';
        const params = [jobId, customerId, totalAmount, dateCreated, status || 'Unpaid'];
        database_1.default.run(sql, params, function (err) {
            if (err) {
                res.status(400).json({ "error": err.message });
                return;
            }
            res.status(201).json({
                "message": "success",
                "data": { id: this.lastID, jobId, customerId, totalAmount, dateCreated, status: status || 'Unpaid' }
            });
        });
    }
    catch (error) {
        res.status(500).json({ "error": error.message });
    }
});
// PUT update an existing invoice
router.put('/:id', (req, res) => {
    const { totalAmount, status } = req.body;
    const { id } = req.params;
    if (!totalAmount || !status) {
        res.status(400).json({ "error": "Missing required fields: totalAmount and status" });
        return;
    }
    const sql = 'UPDATE Invoices SET totalAmount = ?, status = ? WHERE id = ?';
    const params = [totalAmount, status, id];
    database_1.default.run(sql, params, function (err) {
        if (err) {
            res.status(400).json({ "error": err.message });
            return;
        }
        if (this.changes === 0) {
            res.status(404).json({ "message": "Invoice not found or no changes made" });
            return;
        }
        res.json({
            "message": "success",
            "data": { id: Number(id), totalAmount, status }
        });
    });
});
// DELETE an invoice
router.delete('/:id', (req, res) => {
    const { id } = req.params;
    const sql = 'DELETE FROM Invoices WHERE id = ?';
    const params = [id];
    database_1.default.run(sql, params, function (err) {
        if (err) {
            res.status(400).json({ "error": err.message });
            return;
        }
        if (this.changes === 0) {
            res.status(404).json({ "message": "Invoice not found" });
            return;
        }
        res.json({
            "message": "success",
            "data": { id: Number(id) }
        });
    });
});
exports.default = router;
