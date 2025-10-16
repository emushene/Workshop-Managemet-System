import express = require('express');
const router = express.Router();
import db from '../database';

console.log('Invoice routes module loaded');

// GET all invoices
router.get('/', (req: express.Request, res: express.Response) => {
  const sql = `
    SELECT 
      i.id, i.jobId, i.totalAmount, i.amountPaid, i.status, i.dateCreated,
      c.name as customerName
    FROM Invoices i
    JOIN Jobs j ON i.jobId = j.id
    JOIN Customers c ON j.customerId = c.id
  `;
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

// GET a single invoice by ID
router.get('/:id', async (req: express.Request, res: express.Response) => {
  const invoiceId = req.params.id;

  const invoiceSql = `
    SELECT 
      i.id, i.jobId, i.totalAmount, i.amountPaid, i.discountAmount, i.status, i.dateCreated,
      j.itemDescription,
      c.name as customerName
    FROM Invoices i
    JOIN Jobs j ON i.jobId = j.id
    JOIN Customers c ON j.customerId = c.id
    WHERE i.id = ?
  `;

  try {
    const invoice: any = await new Promise((resolve, reject) => {
      db.get(invoiceSql, [invoiceId], (err, row) => {
        if (err) reject(err);
        resolve(row);
      });
    });

    if (!invoice) {
      return res.status(404).json({ message: 'Invoice not found' });
    }

    const servicesSql = `
      SELECT s.part_name, js.price
      FROM JobServices js
      JOIN ServiceItemParts s ON js.serviceItemPartId = s.id
      WHERE js.jobId = ?
    `;

    const services = await new Promise((resolve, reject) => {
      db.all(servicesSql, [invoice.jobId], (err, rows) => {
        if (err) reject(err);
        resolve(rows);
      });
    });

    // For the frontend, we can concatenate service names into a single string
    const serviceDescription = (services as any[]).map(s => s.part_name).join(', ');

    res.json({
      message: 'success',
      data: { ...invoice, services, serviceDescription },
    });

  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// POST a new invoice from a job
router.post('/', async (req: express.Request, res: express.Response) => {
  const { jobId, totalAmount, status } = req.body;
  if (!jobId || totalAmount === undefined) {
    res.status(400).json({ "error": "Missing required fields: jobId and totalAmount" });
    return;
  }

  try {
    const dateCreated = new Date().toISOString();
    const sql = 'INSERT INTO Invoices (jobId, totalAmount, dateCreated, status) VALUES (?, ?, ?, ?)';
    const params = [jobId, totalAmount, dateCreated, status || 'Unpaid'];

    db.run(sql, params, function (this: any, err: Error) {
      if (err) {
        res.status(400).json({ "error": err.message });
        return;
      }
      res.status(201).json({
        "message": "success",
        "data": { id: this.lastID, jobId, totalAmount, dateCreated, status: status || 'Unpaid' }
      });
    });
  } catch (error: any) {
      res.status(500).json({ "error": error.message });
  }
});

// Other routes (PUT, DELETE) would also need updating if used

export default router;