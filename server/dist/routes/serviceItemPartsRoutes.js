"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express = require("express");
const router = express.Router();
const database_1 = __importDefault(require("../database"));
console.log('Service Item Parts routes module loaded');
// GET all service item parts
router.get('/', (req, res) => {
    const sql = "select * from ServiceItemParts";
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
// GET a single service item part by ID
router.get('/:id', (req, res) => {
    const sql = "select * from ServiceItemParts where id = ?";
    const params = [req.params.id];
    database_1.default.get(sql, params, (err, row) => {
        if (err) {
            res.status(400).json({ "error": err.message });
            return;
        }
        if (!row) {
            res.status(404).json({ "message": "Service item part not found" });
            return;
        }
        res.json({
            "message": "success",
            "data": row
        });
    });
});
// POST a new service item part
router.post('/', (req, res) => {
    const { part_name, category, common_services, price, description } = req.body;
    if (!part_name || !category || !common_services || price === undefined) {
        res.status(400).json({ "error": "Missing required fields: part_name, category, common_services, and price" });
        return;
    }
    const priceInCents = Math.round(price * 100);
    const sql = 'INSERT INTO ServiceItemParts (part_name, category, common_services, price, description) VALUES (?, ?, ?, ?, ?)';
    const params = [part_name, category, common_services, priceInCents, description];
    database_1.default.run(sql, params, function (err) {
        if (err) {
            res.status(400).json({ "error": err.message });
            return;
        }
        res.status(201).json({
            "message": "success",
            "data": { id: this.lastID, part_name, category, common_services, price: priceInCents, description }
        });
    });
});
// PUT update an existing service item part
router.put('/:id', (req, res) => {
    const { part_name, category, common_services, price, description } = req.body;
    const { id } = req.params;
    if (!part_name || !category || !common_services || price === undefined) {
        res.status(400).json({ "error": "Missing required fields: part_name, category, common_services, and price" });
        return;
    }
    const priceInCents = Math.round(price * 100);
    const sql = 'UPDATE ServiceItemParts SET part_name = ?, category = ?, common_services = ?, price = ?, description = ? WHERE id = ?';
    const params = [part_name, category, common_services, priceInCents, description, id];
    database_1.default.run(sql, params, function (err) {
        if (err) {
            res.status(400).json({ "error": err.message });
            return;
        }
        if (this.changes === 0) {
            res.status(404).json({ "message": "Service item part not found or no changes made" });
            return;
        }
        res.json({
            "message": "success",
            "data": { id: Number(id), part_name, category, common_services, price: priceInCents, description }
        });
    });
});
// DELETE a service item part
router.delete('/:id', (req, res) => {
    const { id } = req.params;
    const sql = 'DELETE FROM ServiceItemParts WHERE id = ?';
    const params = [id];
    database_1.default.run(sql, params, function (err) {
        if (err) {
            res.status(400).json({ "error": err.message });
            return;
        }
        if (this.changes === 0) {
            res.status(404).json({ "message": "Service item part not found" });
            return;
        }
        res.json({
            "message": "success",
            "data": { id: Number(id) }
        });
    });
});
exports.default = router;
