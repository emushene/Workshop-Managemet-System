import express = require('express');
const router = express.Router();
import db from '../database';

console.log('Invoice routes module loaded');

// GET all invoices, or a single invoice by jobId
router.get('/', (req: express.Request, res: express.Response) => {
  const { jobId } = req.query;

  if (jobId) {
    // Get a single invoice by jobId
    const sql = "SELECT Invoices.*, Jobs.itemDescription, Jobs.serviceDescription, Customers.name as customerName FROM Invoices JOIN Jobs ON Invoices.jobId = Jobs.id JOIN Customers ON Jobs.customerId = Customers.id WHERE Invoices.jobId = ?";
    db.get(sql, [jobId], (err: Error, row: any) => {
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
  } else {
    // Get all invoices
    const sql = "SELECT i.*, c.name as customerName, j.itemDescription, j.serviceDescription FROM Invoices i JOIN Customers c ON i.customerId = c.id LEFT JOIN Jobs j ON i.jobId = j.id";
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
  }
});

// GET a single invoice by ID
router.get('/:id', (req: express.Request, res: express.Response) => {
  const sql = "SELECT Invoices.*, Jobs.itemDescription, Jobs.serviceDescription, Customers.name as customerName FROM Invoices JOIN Jobs ON Invoices.jobId = Jobs.id JOIN Customers ON Jobs.customerId = Customers.id WHERE Invoices.id = ?";
  const params = [req.params.id];
  db.get(sql, params, (err: Error, row: any) => {
    if (err) {
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
router.post('/', async (req: express.Request, res: express.Response) => {
  const { jobId, totalAmount, status } = req.body;
  if (!jobId || !totalAmount) {
    res.status(400).json({ "error": "Missing required fields: jobId and totalAmount" });
    return;
  }

  try {
    // Get customerId from the job
    const job: any = await new Promise((resolve, reject) => {
        db.get("SELECT customerId FROM Jobs WHERE id = ?", [jobId], (err, row) => {
            if (err) reject(err);
            else resolve(row);
        });
    });

    if (!job || !job.customerId) {
        return res.status(404).json({ "message": "Job or associated customer not found" });
    }

    const customerId = job.customerId;
    const dateCreated = new Date().toISOString();
    const sql = 'INSERT INTO Invoices (jobId, customerId, totalAmount, dateCreated, status) VALUES (?, ?, ?, ?, ?)';
    const params = [jobId, customerId, totalAmount, dateCreated, status || 'Unpaid'];

    db.run(sql, params, function (this: any, err: Error) {
      if (err) {
        res.status(400).json({ "error": err.message });
        return;
      }
      res.status(201).json({
        "message": "success",
        "data": { id: this.lastID, jobId, customerId, totalAmount, dateCreated, status: status || 'Unpaid' }
      });
    });
  } catch (error: any) {
      res.status(500).json({ "error": error.message });
  }
});

// PUT update an existing invoice
router.put('/:id', (req: express.Request, res: express.Response) => {
  const { totalAmount, status } = req.body;
  const { id } = req.params;
  if (!totalAmount || !status) {
    res.status(400).json({ "error": "Missing required fields: totalAmount and status" });
    return;
  }
  const sql = 'UPDATE Invoices SET totalAmount = ?, status = ? WHERE id = ?';
  const params = [totalAmount, status, id];
  db.run(sql, params, function (this: any, err: Error) {
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
router.delete('/:id', (req: express.Request, res: express.Response) => {
  const { id } = req.params;
  const sql = 'DELETE FROM Invoices WHERE id = ?';
  const params = [id];
  db.run(sql, params, function (this: any, err: Error) {
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

export default router;
