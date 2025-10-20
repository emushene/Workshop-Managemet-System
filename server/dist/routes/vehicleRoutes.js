"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const database_1 = __importDefault(require("../database"));
const router = express_1.default.Router();
// GET all vehicles
router.get('/', (req, res) => {
    const sql = 'SELECT * FROM Vehicles ORDER BY make, model';
    database_1.default.all(sql, [], (err, rows) => {
        if (err) {
            res.status(400).json({ error: err.message });
            return;
        }
        res.json({ message: 'Success', data: rows });
    });
});
// GET a single vehicle by ID
router.get('/:id', (req, res) => {
    const sql = 'SELECT * FROM Vehicles WHERE id = ?';
    database_1.default.get(sql, [req.params.id], (err, row) => {
        if (err) {
            res.status(400).json({ error: err.message });
            return;
        }
        res.json({ message: 'Success', data: row });
    });
});
// POST a new vehicle
router.post('/', (req, res) => {
    const { make, model } = req.body;
    if (!make || !model) {
        res.status(400).json({ error: 'Make and model are required' });
        return;
    }
    const sql = 'INSERT INTO Vehicles (make, model) VALUES (?, ?)';
    database_1.default.run(sql, [make, model], function (err) {
        if (err) {
            res.status(400).json({ error: err.message });
            return;
        }
        res.status(201).json({ message: 'Success', data: { id: this.lastID, make, model } });
    });
});
// PUT update a vehicle
router.put('/:id', (req, res) => {
    const { make, model } = req.body;
    if (!make || !model) {
        res.status(400).json({ error: 'Make and model are required' });
        return;
    }
    const sql = 'UPDATE Vehicles SET make = ?, model = ? WHERE id = ?';
    database_1.default.run(sql, [make, model, req.params.id], function (err) {
        if (err) {
            res.status(400).json({ error: err.message });
            return;
        }
        res.json({ message: 'Success', data: { id: req.params.id, make, model } });
    });
});
// DELETE a vehicle
router.delete('/:id', (req, res) => {
    const sql = 'DELETE FROM Vehicles WHERE id = ?';
    database_1.default.run(sql, [req.params.id], function (err) {
        if (err) {
            res.status(400).json({ error: err.message });
            return;
        }
        if (this.changes === 0) {
            res.status(404).json({ message: "Vehicle not found" });
            return;
        }
        res.json({ message: 'Deleted successfully', data: { id: req.params.id } });
    });
});
exports.default = router;
