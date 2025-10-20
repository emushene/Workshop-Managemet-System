"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express = require("express");
const router = express.Router();
const database_1 = __importDefault(require("../database"));
console.log('Inventory routes module loaded');
// GET all inventory items
router.get('/', (req, res) => {
    const sql = "select * from Inventory";
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
// GET a single inventory item by ID
router.get('/:id', (req, res) => {
    const sql = "select * from Inventory where id = ?";
    const params = [req.params.id];
    database_1.default.get(sql, params, (err, row) => {
        if (err) {
            res.status(400).json({ "error": err.message });
            return;
        }
        if (!row) {
            res.status(404).json({ "message": "Inventory item not found" });
            return;
        }
        res.json({
            "message": "success",
            "data": row
        });
    });
});
// POST a new inventory item
router.post('/', (req, res) => {
    const { name, quantity, price } = req.body;
    if (!name || quantity === undefined || price === undefined) {
        res.status(400).json({ "error": "Missing required fields" });
        return;
    }
    const priceInCents = Math.round(price * 100);
    const sql = 'INSERT INTO Inventory (name, quantity, price) VALUES (?, ?, ?)';
    const params = [name, quantity, priceInCents];
    database_1.default.run(sql, params, function (err) {
        if (err) {
            res.status(400).json({ "error": err.message });
            return;
        }
        res.status(201).json({
            "message": "success",
            "data": { id: this.lastID, name, quantity, price: priceInCents }
        });
    });
});
// PUT update an existing inventory item
router.put('/:id', (req, res) => {
    const { name, quantity, price } = req.body;
    const { id } = req.params;
    if (!name || quantity === undefined || price === undefined) {
        res.status(400).json({ "error": "Missing required fields" });
        return;
    }
    const priceInCents = Math.round(price * 100);
    const sql = 'UPDATE Inventory SET name = ?, quantity = ?, price = ? WHERE id = ?';
    const params = [name, quantity, priceInCents, id];
    database_1.default.run(sql, params, function (err) {
        if (err) {
            res.status(400).json({ "error": err.message });
            return;
        }
        if (this.changes === 0) {
            res.status(404).json({ "message": "Inventory item not found or no changes made" });
            return;
        }
        res.json({
            "message": "success",
            "data": { id: Number(id), name, quantity, price: priceInCents }
        });
    });
});
// DELETE an inventory item
router.delete('/:id', (req, res) => {
    const { id } = req.params;
    const sql = 'DELETE FROM Inventory WHERE id = ?';
    const params = [id];
    database_1.default.run(sql, params, function (err) {
        if (err) {
            res.status(400).json({ "error": err.message });
            return;
        }
        if (this.changes === 0) {
            res.status(404).json({ "message": "Inventory item not found" });
            return;
        }
        res.json({
            "message": "success",
            "data": { id: Number(id) }
        });
    });
});
exports.default = router;
