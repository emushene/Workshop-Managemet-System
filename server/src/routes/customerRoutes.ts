import express = require('express');
const router = express.Router();
import db from '../database';

console.log('Customer routes module loaded'); // a

// GET all customers
router.get('/', (req: express.Request, res: express.Response) => {
  const sql = "select * from Customers";
  db.all(sql, [], (err: Error, rows: any[]) => {
    if (err) {
      console.log(err);
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
router.get('/:id', (req: express.Request, res: express.Response) => {
  const sql = "select * from Customers where id = ?";
  const params = [req.params.id];
  db.get(sql, params, (err: Error, row: any) => {
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
router.post('/', (req: express.Request, res: express.Response) => {
  const { name, address, telephone, email } = req.body;
  if (!name || !telephone) {
    res.status(400).json({ "error": "Name and telephone are required" });
    return;
  }
  const sql = 'INSERT INTO Customers (name, address, telephone, email) VALUES (?, ?, ?, ?)';
  const params = [name, address, telephone, email];
  db.run(sql, params, function (this: any, err: Error) {
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
router.put('/:id', (req: express.Request, res: express.Response) => {
  const { name, address, telephone, email } = req.body;
  const { id } = req.params;
  if (!name || !telephone) {
    res.status(400).json({ "error": "Name and telephone are required" });
    return;
  }
  const sql = 'UPDATE Customers SET name = ?, address = ?, telephone = ?, email = ? WHERE id = ?';
  const params = [name, address, telephone, email, id];
  db.run(sql, params, function (this: any, err: Error) {
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
router.delete('/:id', (req: express.Request, res: express.Response) => {
  const { id } = req.params;
  const sql = 'DELETE FROM Customers WHERE id = ?';
  const params = [id];
  db.run(sql, params, function (this: any, err: Error) {
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

export default router;
