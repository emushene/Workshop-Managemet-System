"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express = require("express");
const router = express.Router();
const database_1 = __importDefault(require("../database"));
// GET all jobs
router.get('/', (req, res) => {
    const sql = `
    SELECT 
      j.id, j.customerId, j.vehicleId, j.itemDescription, j.jobType, 
      j.status, j.vehicleYear, j.partNumber, j.serialNumber, j.conditionIn, 
      j.dateBookedIn, j.technicianNotes, j.updates,
      c.name as customerName,
      i.status as invoiceStatus,
      v.make as vehicleMake,
      v.model as vehicleModel,
      (SELECT GROUP_CONCAT(ji.category, ': ' || ji.instructions) FROM JobItems ji WHERE ji.jobId = j.id) as serviceDescription
    FROM Jobs j
    LEFT JOIN Customers c ON j.customerId = c.id
    LEFT JOIN Invoices i ON j.id = i.jobId
    LEFT JOIN Vehicles v ON j.vehicleId = v.id
    GROUP BY j.id
  `;
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
// GET a single job by ID
router.get('/:id', async (req, res) => {
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
    SELECT id, category, instructions, price
    FROM JobItems
    WHERE jobId = ?
  `;
    try {
        const job = await new Promise((resolve, reject) => {
            database_1.default.get(jobSql, [jobId], (err, row) => {
                if (err)
                    reject(err);
                resolve(row);
            });
        });
        if (!job) {
            res.status(404).json({ "message": "Job not found" });
            return;
        }
        const services = await new Promise((resolve, reject) => {
            database_1.default.all(servicesSql, [jobId], (err, rows) => {
                if (err)
                    reject(err);
                // Here we parse the instructions back into an array
                const parsedRows = rows.map((row) => ({
                    ...row,
                    instructions: JSON.parse(row.instructions)
                }));
                resolve(parsedRows);
            });
        });
        res.json({
            "message": "success",
            "data": { ...job, services }
        });
    }
    catch (err) {
        res.status(400).json({ "error": err.message });
    }
});
// POST a new job
router.post('/', (req, res) => {
    const { customerId, itemDescription, jobType, status, vehicleId, vehicleYear, partNumber, serialNumber, conditionIn, dateBookedIn, services } = req.body;
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
    database_1.default.run(jobSql, jobParams, function (err) {
        if (err) {
            res.status(400).json({ "error": err.message });
            return;
        }
        const newJobId = this.lastID;
        const itemStmt = database_1.default.prepare('INSERT INTO JobItems (jobId, category, instructions, price) VALUES (?, ?, ?, ?)');
        for (const service of services) {
            // Stringify instructions array for storage
            const instructionsJson = JSON.stringify(service.instructions);
            itemStmt.run(newJobId, service.category, instructionsJson, service.price);
        }
        itemStmt.finalize((err) => {
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
router.put('/:id', (req, res) => {
    const { id } = req.params;
    const { customerId, itemDescription, jobType, status, vehicleId, vehicleYear, partNumber, serialNumber, conditionIn, dateBookedIn, technicianNotes, updates, services } = req.body;
    const fields = [];
    const params = [];
    if (customerId !== undefined) {
        fields.push('customerId = ?');
        params.push(customerId);
    }
    if (itemDescription !== undefined) {
        fields.push('itemDescription = ?');
        params.push(itemDescription);
    }
    if (jobType !== undefined) {
        fields.push('jobType = ?');
        params.push(jobType);
    }
    if (status !== undefined) {
        fields.push('status = ?');
        params.push(status);
    }
    const finalVehicleId = vehicleId === '' ? null : vehicleId;
    if (finalVehicleId !== undefined) {
        fields.push('vehicleId = ?');
        params.push(finalVehicleId);
    }
    if (vehicleYear !== undefined) {
        fields.push('vehicleYear = ?');
        params.push(vehicleYear);
    }
    if (partNumber !== undefined) {
        fields.push('partNumber = ?');
        params.push(partNumber);
    }
    if (serialNumber !== undefined) {
        fields.push('serialNumber = ?');
        params.push(serialNumber);
    }
    if (conditionIn !== undefined) {
        fields.push('conditionIn = ?');
        params.push(conditionIn);
    }
    if (dateBookedIn !== undefined) {
        fields.push('dateBookedIn = ?');
        params.push(dateBookedIn);
    }
    if (technicianNotes !== undefined) {
        fields.push('technicianNotes = ?');
        params.push(technicianNotes);
    }
    if (updates !== undefined) {
        fields.push('updates = ?');
        params.push(updates);
    }
    const updateJob = () => {
        if (fields.length > 0) {
            params.push(id);
            const sql = `UPDATE Jobs SET ${fields.join(', ')} WHERE id = ?`;
            database_1.default.run(sql, params, function (err) {
                if (err) {
                    res.status(400).json({ "error": err.message });
                    return;
                }
                if (this.changes === 0) {
                    // This can happen if the job doesn't exist or if the data is the same.
                    // To avoid errors on the client, we can treat it as a success.
                }
                res.json({ "message": "success", "data": { id: Number(id), ...req.body } });
            });
        }
        else {
            res.json({ "message": "success", "data": { id: Number(id), ...req.body } });
        }
    };
    if (services && Array.isArray(services)) {
        database_1.default.serialize(() => {
            database_1.default.run('DELETE FROM JobItems WHERE jobId = ?', [id], (err) => {
                if (err) {
                    res.status(400).json({ "error": "Failed to update services: " + err.message });
                    return;
                }
                const itemStmt = database_1.default.prepare('INSERT INTO JobItems (jobId, category, instructions, price) VALUES (?, ?, ?, ?)');
                for (const service of services) {
                    const instructionsJson = JSON.stringify(service.instructions);
                    itemStmt.run(id, service.category, instructionsJson, service.price);
                }
                itemStmt.finalize((err) => {
                    if (err) {
                        res.status(400).json({ "error": "Failed to finalize services update: " + err.message });
                        return;
                    }
                    updateJob();
                });
            });
        });
    }
    else {
        updateJob();
    }
});
// DELETE a job
router.delete('/:id', (req, res) => {
    const { id } = req.params;
    database_1.default.serialize(() => {
        // The JobItems table will be cleared automatically due to ON DELETE CASCADE
        database_1.default.run('DELETE FROM Jobs WHERE id = ?', [id], function (err) {
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
router.get('/:id/job-card', async (req, res) => {
    const { id } = req.params;
    try {
        const jobDetails = await new Promise((resolve, reject) => {
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
            database_1.default.get(sql, [id], (err, row) => {
                if (err)
                    reject(err);
                else
                    resolve(row);
            });
        });
        if (!jobDetails) {
            return res.status(404).json({ "message": "Job not found" });
        }
        const services = await new Promise((resolve, reject) => {
            const sql = "SELECT category, instructions, price FROM JobItems WHERE jobId = ?";
            database_1.default.all(sql, [id], (err, rows) => {
                if (err)
                    reject(err);
                else {
                    const parsedRows = rows.map((row) => ({
                        ...row,
                        instructions: JSON.parse(row.instructions)
                    }));
                    resolve(parsedRows);
                }
            });
        });
        res.json({
            "message": "success",
            "data": {
                job: jobDetails,
                services: services
            }
        });
    }
    catch (error) {
        res.status(500).json({ "error": error.message });
    }
});
exports.default = router;
