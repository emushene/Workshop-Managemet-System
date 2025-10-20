"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express = require("express");
const router = express.Router();
const database_1 = __importDefault(require("../database"));
console.log('Invoice routes module loaded');
// GET all invoices
router.get('/', (req, res) => {
    const { jobId } = req.query;
    let sql = `
    SELECT 
      i.jobId as id, i.jobId, i.totalAmount, 
      (SELECT SUM(p.amount) FROM Payments p WHERE p.invoiceId = i.jobId) as amountPaid,
      i.status, i.dateCreated,
      c.name as customerName
    FROM Invoices i
    JOIN Jobs j ON i.jobId = j.id
    JOIN Customers c ON j.customerId = c.id
  `;
    const params = [];
    if (jobId) {
        sql += ' WHERE i.jobId = ?';
        params.push(jobId);
    }
    database_1.default.all(sql, params, (err, rows) => {
        if (err) {
            res.status(400).json({ "error": err.message });
            return;
        }
        res.json({
            "message": "success",
            "data": rows
        });
    });
});
// GET a single invoice by ID
router.get('/:id', async (req, res) => {
    const invoiceId = req.params.id;
    const invoiceSql = `
    SELECT 
      i.jobId as id, i.jobId, i.totalAmount, i.status, i.dateCreated,
      j.itemDescription,
      c.name as customerName
    FROM Invoices i
    JOIN Jobs j ON i.jobId = j.id
    JOIN Customers c ON j.customerId = c.id
    WHERE i.jobId = ?
  `;
    try {
        const invoice = await new Promise((resolve, reject) => {
            database_1.default.get(invoiceSql, [invoiceId], (err, row) => {
                if (err)
                    reject(err);
                resolve(row);
            });
        });
        if (!invoice) {
            return res.status(404).json({ message: 'Invoice not found' });
        }
        const servicesSql = `
      SELECT category, instructions, price
      FROM JobItems
      WHERE jobId = ?
    `;
        const services = await new Promise((resolve, reject) => {
            database_1.default.all(servicesSql, [invoice.jobId], (err, rows) => {
                if (err)
                    reject(err);
                const parsedRows = rows.map((row) => ({
                    ...row,
                    instructions: JSON.parse(row.instructions)
                }));
                resolve(parsedRows);
            });
        });
        const paymentsSql = `SELECT SUM(amount) as totalPaid FROM Payments WHERE invoiceId = ?`;
        const paymentInfo = await new Promise((resolve, reject) => {
            database_1.default.get(paymentsSql, [invoice.id], (err, row) => {
                if (err)
                    reject(err);
                resolve(row);
            });
        });
        invoice.amountPaid = paymentInfo.totalPaid || 0;
        res.json({
            message: 'success',
            data: { ...invoice, services },
        });
    }
    catch (err) {
        res.status(400).json({ error: err.message });
    }
});
// POST a new invoice from a job
router.post('/', async (req, res) => {
    const { jobId, totalAmount, status } = req.body;
    if (!jobId || totalAmount === undefined) {
        res.status(400).json({ "error": "Missing required fields: jobId and totalAmount" });
        return;
    }
    try {
        const dateCreated = new Date().toISOString();
        const sql = 'INSERT INTO Invoices (jobId, totalAmount, dateCreated, status) VALUES (?, ?, ?, ?)';
        const params = [jobId, totalAmount, dateCreated, status || 'Unpaid'];
        database_1.default.run(sql, params, function (err) {
            if (err) {
                res.status(400).json({ "error": err.message });
                return;
            }
            res.status(201).json({
                "message": "success",
                "data": { id: jobId, jobId, totalAmount, dateCreated, status: status || 'Unpaid' }
            });
        });
    }
    catch (error) {
        res.status(500).json({ "error": error.message });
    }
});
// Other routes (PUT, DELETE) would also need updating if used
exports.default = router;
