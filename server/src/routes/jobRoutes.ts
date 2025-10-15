import express = require('express');
const router = express.Router();
import db from '../database';

console.log('Job routes module loaded');

// GET all jobs
router.get('/', (req: express.Request, res: express.Response) => {
  const sql = `
    SELECT 
      Jobs.*, 
      Customers.name as customerName,
      Invoices.status as invoiceStatus
    FROM Jobs 
    JOIN Customers ON Jobs.customerId = Customers.id
    LEFT JOIN Invoices ON Jobs.id = Invoices.jobId
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

// GET a single job by ID
router.get('/:id', (req: express.Request, res: express.Response) => {
  const sql = "SELECT Jobs.*, Customers.name as customerName FROM Jobs JOIN Customers ON Jobs.customerId = Customers.id WHERE Jobs.id = ?";
  const params = [req.params.id];
  db.get(sql, params, (err: Error, row: any) => {
    if (err) {
      res.status(400).json({ "error": err.message });
      return;
    }
    if (!row) {
      res.status(404).json({ "message": "Job not found" });
      return;
    }
    res.json({
      "message": "success",
      "data": row
    });
  });
});

// POST a new job
router.post('/', (req: express.Request, res: express.Response) => {
  const { customerId, itemDescription, serviceDescription, jobType, status, 
          vehicleMake, vehicleModel, vehicleYear, partNumber, serialNumber, 
          servicePrice, conditionIn, dateBookedIn, dateExpectedOut, 
          technicianNotes, updates, partsProcured } = req.body;
  if (!customerId || !itemDescription || !serviceDescription || !jobType) {
    res.status(400).json({ "error": "Missing required fields" });
    return;
  }
  const sql = `INSERT INTO Jobs (customerId, itemDescription, serviceDescription, jobType, status, 
                   vehicleMake, vehicleModel, vehicleYear, partNumber, serialNumber, 
                   servicePrice, conditionIn, dateBookedIn, dateExpectedOut, 
                   technicianNotes, updates, partsProcured) 
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
  const params = [customerId, itemDescription, serviceDescription, jobType, status || 'Booked',
                  vehicleMake, vehicleModel, vehicleYear, partNumber, serialNumber,
                  servicePrice, conditionIn, dateBookedIn, dateExpectedOut,
                  technicianNotes, updates, partsProcured];
  db.run(sql, params, function (this: any, err: Error) {
    if (err) {
      res.status(400).json({ "error": err.message });
      return;
    }
    res.status(201).json({
      "message": "success",
      "data": { id: this.lastID, customerId, itemDescription, serviceDescription, jobType, status: status || 'Booked',
                vehicleMake, vehicleModel, vehicleYear, partNumber, serialNumber,
                servicePrice, conditionIn, dateBookedIn, dateExpectedOut,
                technicianNotes, updates, partsProcured }
    });
  });
});

// PUT update an existing job
router.put('/:id', (req: express.Request, res: express.Response) => {
  const { id } = req.params;
  const { customerId, itemDescription, serviceDescription, jobType, status,
          vehicleMake, vehicleModel, vehicleYear, partNumber, serialNumber,
          servicePrice, conditionIn, dateBookedIn, dateExpectedOut,
          technicianNotes, updates, partsProcured } = req.body;

  const fields: string[] = [];
  const params: any[] = [];

  if (customerId !== undefined) { fields.push('customerId = ?'); params.push(customerId); }
  if (itemDescription !== undefined) { fields.push('itemDescription = ?'); params.push(itemDescription); }
  if (serviceDescription !== undefined) { fields.push('serviceDescription = ?'); params.push(serviceDescription); }
  if (jobType !== undefined) { fields.push('jobType = ?'); params.push(jobType); }
  if (status !== undefined) { fields.push('status = ?'); params.push(status); }
  if (vehicleMake !== undefined) { fields.push('vehicleMake = ?'); params.push(vehicleMake); }
  if (vehicleModel !== undefined) { fields.push('vehicleModel = ?'); params.push(vehicleModel); }
  if (vehicleYear !== undefined) { fields.push('vehicleYear = ?'); params.push(vehicleYear); }
  if (partNumber !== undefined) { fields.push('partNumber = ?'); params.push(partNumber); }
  if (serialNumber !== undefined) { fields.push('serialNumber = ?'); params.push(serialNumber); }
  if (servicePrice !== undefined) { fields.push('servicePrice = ?'); params.push(servicePrice); }
  if (conditionIn !== undefined) { fields.push('conditionIn = ?'); params.push(conditionIn); }
  if (dateBookedIn !== undefined) { fields.push('dateBookedIn = ?'); params.push(dateBookedIn); }
  if (dateExpectedOut !== undefined) { fields.push('dateExpectedOut = ?'); params.push(dateExpectedOut); }
  if (technicianNotes !== undefined) { fields.push('technicianNotes = ?'); params.push(technicianNotes); }
  if (updates !== undefined) { fields.push('updates = ?'); params.push(updates); }
  if (partsProcured !== undefined) { fields.push('partsProcured = ?'); params.push(partsProcured); }

  if (fields.length === 0) {
    return res.status(400).json({ "error": "No fields to update provided" });
  }

  params.push(id); // Add the job ID for the WHERE clause

  const sql = `UPDATE Jobs SET ${fields.join(', ')} WHERE id = ?`;

  db.run(sql, params, function (this: any, err: Error) {
    if (err) {
      res.status(400).json({ "error": err.message });
      return;
    }
    if (this.changes === 0) {
      res.status(404).json({ "message": "Job not found or no changes made" });
      return;
    }
    res.json({
      "message": "success",
      "data": { id: Number(id), ...req.body }
    });
  });
});

// DELETE a job
router.delete('/:id', (req: express.Request, res: express.Response) => {
  const { id } = req.params;
  const sql = 'DELETE FROM Jobs WHERE id = ?';
  const params = [id];
  db.run(sql, params, function (this: any, err: Error) {
    if (err) {
      res.status(400).json({ "error": err.message });
      return;
    }
    if (this.changes === 0) {
      res.status(404).json({ "message": "Job not found" });
      return;
    }
    res.json({
      "message": "success",
      "data": { id: Number(id) }
    });
  });
});

// GET job card data for a single job by ID
router.get('/:id/job-card', async (req: express.Request, res: express.Response) => {
  const { id } = req.params;

  try {
    // Fetch job and customer details
    const jobDetails: any = await new Promise((resolve, reject) => {
      const sql = "SELECT Jobs.*, Customers.name as customerName, Customers.contact as customerContact FROM Jobs JOIN Customers ON Jobs.customerId = Customers.id WHERE Jobs.id = ?";
      db.get(sql, [id], (err: Error, row: any) => {
        if (err) reject(err);
        else resolve(row);
      });
    });

    if (!jobDetails) {
      return res.status(404).json({ "message": "Job not found" });
    }

    // Fetch inventory parts used on the job
    const partsUsed: any[] = await new Promise((resolve, reject) => {
      const sql = "SELECT Inventory.name, Inventory.price, JobInventory.quantityUsed FROM JobInventory JOIN Inventory ON JobInventory.inventoryId = Inventory.id WHERE JobInventory.jobId = ?";
      db.all(sql, [id], (err: Error, rows: any[]) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });

    res.json({
      "message": "success",
      "data": {
        job: jobDetails,
        partsUsed: partsUsed
      }
    });

  } catch (error: any) {
    res.status(500).json({ "error": error.message });
  }
});

export default router;