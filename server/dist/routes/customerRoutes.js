"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express = require("express");
const router = express.Router();
const database_1 = __importDefault(require("../database"));
console.log('Customer routes module loaded'); // a
// GET all customers
router.get('/', (req, res) => {
    const sql = "select * from Customers";
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
});
// GET a single customer by ID
router.get('/:id', (req, res) => {
    const sql = "select * from Customers where id = ?";
    const params = [req.params.id];
    database_1.default.get(sql, params, (err, row) => {
        if (err) {
            res.status(400).json({ "error": err.message });
            return;
        }
        if (!row) {
            res.status(404).json({ "message": "Customer not found" });
            return;
        }
        res.json({
            "message": "success",
            "data": row
        });
    });
});
// POST a new customer
router.post('/', (req, res) => {
    const { name, address, telephone, email } = req.body;
    if (!name || !telephone) {
        res.status(400).json({ "error": "Name and telephone are required" });
        return;
    }
    const sql = 'INSERT INTO Customers (name, address, telephone, email) VALUES (?, ?, ?, ?)';
    const params = [name, address, telephone, email];
    database_1.default.run(sql, params, function (err) {
        if (err) {
            res.status(400).json({ "error": err.message });
            return;
        }
        res.status(201).json({
            "message": "success",
            "data": { id: this.lastID, name, address, telephone, email }
        });
    });
});
// PUT update an existing customer
router.put('/:id', (req, res) => {
    const { name, address, telephone, email } = req.body;
    const { id } = req.params;
    if (!name || !telephone) {
        res.status(400).json({ "error": "Name and telephone are required" });
        return;
    }
    const sql = 'UPDATE Customers SET name = ?, address = ?, telephone = ?, email = ? WHERE id = ?';
    const params = [name, address, telephone, email, id];
    database_1.default.run(sql, params, function (err) {
        if (err) {
            res.status(400).json({ "error": err.message });
            return;
        }
        if (this.changes === 0) {
            res.status(404).json({ "message": "Customer not found or no changes made" });
            return;
        }
        res.json({
            "message": "success",
            "data": { id: Number(id), name, address, telephone, email }
        });
    });
});
// DELETE a customer
router.delete('/:id', (req, res) => {
    const { id } = req.params;
    const sql = 'DELETE FROM Customers WHERE id = ?';
    const params = [id];
    database_1.default.run(sql, params, function (err) {
        if (err) {
            res.status(400).json({ "error": err.message });
            return;
        }
        if (this.changes === 0) {
            res.status(404).json({ "message": "Customer not found" });
            return;
        }
        res.json({
            "message": "success",
            "data": { id: Number(id) }
        });
    });
});
exports.default = router;
