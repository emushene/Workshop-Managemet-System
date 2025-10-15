import express = require('express');
const router = express.Router();
import db from '../database';

console.log('Service Item Parts routes module loaded');

// GET all service item parts
router.get('/', (req: express.Request, res: express.Response) => {
  const sql = "select * from ServiceItemParts";
  db.all(sql, [], (err: Error, rows: any[]) => {
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
router.get('/:id', (req: express.Request, res: express.Response) => {
  const sql = "select * from ServiceItemParts where id = ?";
  const params = [req.params.id];
  db.get(sql, params, (err: Error, row: any) => {
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
router.post('/', (req: express.Request, res: express.Response) => {
  const { part_name, category, common_services, price, description } = req.body;
  if (!part_name || !category || !common_services || price === undefined) {
    res.status(400).json({ "error": "Missing required fields: part_name, category, common_services, and price" });
    return;
  }
  const sql = 'INSERT INTO ServiceItemParts (part_name, category, common_services, price, description) VALUES (?, ?, ?, ?, ?)';
  const params = [part_name, category, common_services, price, description];
  db.run(sql, params, function (this: any, err: Error) {
    if (err) {
      res.status(400).json({ "error": err.message });
      return;
    }
    res.status(201).json({
      "message": "success",
      "data": { id: this.lastID, part_name, category, common_services, price, description }
    });
  });
});

// PUT update an existing service item part
router.put('/:id', (req: express.Request, res: express.Response) => {
  const { part_name, category, common_services, price, description } = req.body;
  const { id } = req.params;
  if (!part_name || !category || !common_services || price === undefined) {
    res.status(400).json({ "error": "Missing required fields: part_name, category, common_services, and price" });
    return;
  }
  const sql = 'UPDATE ServiceItemParts SET part_name = ?, category = ?, common_services = ?, price = ?, description = ? WHERE id = ?';
  const params = [part_name, category, common_services, price, description, id];
  db.run(sql, params, function (this: any, err: Error) {
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
      "data": { id: Number(id), part_name, category, common_services, price, description }
    });
  });
});

// DELETE a service item part
router.delete('/:id', (req: express.Request, res: express.Response) => {
  const { id } = req.params;
  const sql = 'DELETE FROM ServiceItemParts WHERE id = ?';
  const params = [id];
  db.run(sql, params, function (this: any, err: Error) {
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

export default router;
