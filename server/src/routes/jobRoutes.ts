import express = require('express');
const router = express.Router();
import db from '../database';

console.log('Job routes module loaded');

// GET all jobs
router.get('/', (req: express.Request, res: express.Response) => {
  const sql = `
    SELECT 
      j.id, j.customerId, j.vehicleId, j.itemDescription, j.jobType, 
      j.status, j.vehicleYear, j.partNumber, j.serialNumber, j.conditionIn, 
      j.dateBookedIn, j.technicianNotes, j.updates,
      c.name as customerName,
      i.status as invoiceStatus,
      v.make as vehicleMake,
      v.model as vehicleModel,
      GROUP_CONCAT(s.part_name, ', ') as serviceDescription
    FROM Jobs j
    LEFT JOIN Customers c ON j.customerId = c.id
    LEFT JOIN Invoices i ON j.id = i.jobId
    LEFT JOIN Vehicles v ON j.vehicleId = v.id
    LEFT JOIN JobServices js ON j.id = js.jobId
    LEFT JOIN ServiceItemParts s ON js.serviceItemPartId = s.id
    GROUP BY j.id
  `;
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

// GET a single job by ID
router.get('/:id', async (req: express.Request, res: express.Response) => {
  const jobId = req.params.id;
  const jobSql = `
    SELECT 
      j.id, j.customerId, j.vehicleId, j.itemDescription, j.jobType, 
      j.status, j.vehicleYear, j.partNumber, j.serialNumber, j.conditionIn, 
      j.dateBookedIn, j.technicianNotes, j.updates,
      c.name as customerName,
      v.make as vehicleMake,
      v.model as vehicleModel
    FROM Jobs j
    LEFT JOIN Customers c ON j.customerId = c.id
    LEFT JOIN Vehicles v ON j.vehicleId = v.id
    WHERE j.id = ?
  `;
  const servicesSql = `
    SELECT s.part_name, s.price, s.category, s.description
    FROM JobServices js
    JOIN ServiceItemParts s ON js.serviceItemPartId = s.id
    WHERE js.jobId = ?
  `;

  try {
    const job = await new Promise((resolve, reject) => {
      db.get(jobSql, [jobId], (err, row) => {
        if (err) reject(err);
        resolve(row);
      });
    });

    if (!job) {
      res.status(404).json({ "message": "Job not found" });
      return;
    }

    const services = await new Promise((resolve, reject) => {
      db.all(servicesSql, [jobId], (err, rows) => {
        if (err) reject(err);
        resolve(rows);
      });
    });

    res.json({
      "message": "success",
      "data": { ...job, services }
    });

  } catch (err: any) {
    res.status(400).json({ "error": err.message });
  }
});

// POST a new job
router.post('/', (req: express.Request, res: express.Response) => {
  const { customerId, itemDescription, jobType, status, 
          vehicleId, vehicleYear, partNumber, serialNumber, 
          conditionIn, dateBookedIn, services } = req.body;

  console.log('customerId:', customerId);
  console.log('jobType:', jobType);
  console.log('services:', services);

  if (!customerId || !jobType || !services || !Array.isArray(services) || services.length === 0) {
    res.status(400).json({ "error": "Missing required fields" });
    return;
  }

  const finalVehicleId = vehicleId === '' ? null : vehicleId;

  const jobSql = `INSERT INTO Jobs (customerId, itemDescription, jobType, status, 
                   vehicleId, vehicleYear, partNumber, serialNumber, 
                   conditionIn, dateBookedIn) 
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
  const jobParams = [customerId, itemDescription, jobType, status || 'Booked',
                  finalVehicleId, vehicleYear, partNumber, serialNumber,
                  conditionIn, dateBookedIn];

  db.run(jobSql, jobParams, function (this: any, err: Error) {
    if (err) {
      res.status(400).json({ "error": err.message });
      return;
    }
    const newJobId = this.lastID;
    const serviceStmt = db.prepare('INSERT INTO JobServices (jobId, serviceItemPartId, price) VALUES (?, ?, ?)');
    for (const service of services) {
      serviceStmt.run(newJobId, service.id, service.price);
    }
    serviceStmt.finalize((err) => {
        if (err) {
            res.status(400).json({ "error": "Failed to add services to job: " + err.message });
            return;
        }
        res.status(201).json({
            "message": "success",
            "data": { id: newJobId, ...req.body }
        });
    });
  });
});

// PUT update an existing job
router.put('/:id', (req: express.Request, res: express.Response) => {
  const { id } = req.params;
  const { customerId, itemDescription, jobType, status,
          vehicleId, vehicleYear, partNumber, serialNumber,
          conditionIn, dateBookedIn,
          technicianNotes, updates, services } = req.body;

  const fields: string[] = [];
  const params: any[] = [];

  if (customerId !== undefined) { fields.push('customerId = ?'); params.push(customerId); }
  if (itemDescription !== undefined) { fields.push('itemDescription = ?'); params.push(itemDescription); }
  if (jobType !== undefined) { fields.push('jobType = ?'); params.push(jobType); }
  if (status !== undefined) { fields.push('status = ?'); params.push(status); }
  const finalVehicleId = vehicleId === '' ? null : vehicleId;
  if (finalVehicleId !== undefined) { fields.push('vehicleId = ?'); params.push(finalVehicleId); }
  if (vehicleYear !== undefined) { fields.push('vehicleYear = ?'); params.push(vehicleYear); }
  if (partNumber !== undefined) { fields.push('partNumber = ?'); params.push(partNumber); }
  if (serialNumber !== undefined) { fields.push('serialNumber = ?'); params.push(serialNumber); }
  if (conditionIn !== undefined) { fields.push('conditionIn = ?'); params.push(conditionIn); }
  if (dateBookedIn !== undefined) { fields.push('dateBookedIn = ?'); params.push(dateBookedIn); }
  if (technicianNotes !== undefined) { fields.push('technicianNotes = ?'); params.push(technicianNotes); }
  if (updates !== undefined) { fields.push('updates = ?'); params.push(updates); }

  const updateJob = () => {
    if (fields.length > 0) {
        params.push(id);
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
            res.json({ "message": "success", "data": { id: Number(id), ...req.body } });
        });
    } else {
        res.json({ "message": "success", "data": { id: Number(id), ...req.body } });
    }
  }

  if (services && Array.isArray(services)) {
    db.serialize(() => {
        db.run('DELETE FROM JobServices WHERE jobId = ?', [id], (err) => {
            if (err) {
                res.status(400).json({ "error": "Failed to update services: " + err.message });
                return;
            }
            const serviceStmt = db.prepare('INSERT INTO JobServices (jobId, serviceItemPartId, price) VALUES (?, ?, ?)');
            for (const service of services) {
                serviceStmt.run(id, service.id, service.price);
            }
            serviceStmt.finalize((err) => {
                if (err) {
                    res.status(400).json({ "error": "Failed to finalize services update: " + err.message });
                    return;
                }
                updateJob();
            });
        });
    });
  } else {
    updateJob();
  }
});

// DELETE a job
router.delete('/:id', (req: express.Request, res: express.Response) => {
  const { id } = req.params;
  db.serialize(() => {
    db.run('DELETE FROM JobServices WHERE jobId = ?', [id]);
    db.run('DELETE FROM Jobs WHERE id = ?', [id], function (this: any, err: Error) {
        if (err) {
            res.status(400).json({ "error": err.message });
            return;
        }
        if (this.changes === 0) {
            res.status(404).json({ "message": "Job not found" });
            return;
        }
        res.json({ "message": "success", "data": { id: Number(id) } });
    });
  });
});

// GET job card data for a single job by ID
router.get('/:id/job-card', async (req: express.Request, res: express.Response) => {
  const { id } = req.params;

  try {
    // Fetch job and customer details
    const jobDetails: any = await new Promise((resolve, reject) => {
      const sql = `
        SELECT 
          j.id, j.customerId, j.vehicleId, j.itemDescription, j.jobType, 
          j.status, j.vehicleYear, j.partNumber, j.serialNumber, j.conditionIn, 
          j.dateBookedIn, j.technicianNotes, j.updates,
          c.name as customerName, c.telephone as customerContact,
          v.make as vehicleMake,
          v.model as vehicleModel
        FROM Jobs j
        LEFT JOIN Customers c ON j.customerId = c.id
        LEFT JOIN Vehicles v ON j.vehicleId = v.id
        WHERE j.id = ?
      `;
      db.get(sql, [id], (err: Error, row: any) => {
        if (err) reject(err);
        else resolve(row);
      });
    });

    if (!jobDetails) {
      return res.status(404).json({ "message": "Job not found" });
    }

    const services: any[] = await new Promise((resolve, reject) => {
        const sql = "SELECT s.part_name, s.price FROM JobServices js JOIN ServiceItemParts s ON js.serviceItemPartId = s.id WHERE js.jobId = ?";
        db.all(sql, [id], (err: Error, rows: any[]) => {
            if (err) reject(err);
            else resolve(rows);
        });
    });

    res.json({
      "message": "success",
      "data": {
        job: jobDetails,
        services: services
      }
    });

  } catch (error: any) {
    res.status(500).json({ "error": error.message });
  }
});

export default router;
