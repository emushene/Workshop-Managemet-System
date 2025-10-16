"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const database_1 = __importDefault(require("./database"));
const bcrypt = require('bcrypt');
const saltRounds = 10;
const seed = () => {
    console.log('Seeding database...');
    bcrypt.hash('admin', saltRounds, (err, adminPassword) => {
        if (err) {
            console.error('Error hashing password:', err);
            return;
        }
        database_1.default.serialize(() => {
            database_1.default.run('DROP TABLE IF EXISTS ServiceItemParts');
            // Create tables
            const createTablesQueries = [
                `CREATE TABLE IF NOT EXISTS Users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          username TEXT UNIQUE,
          password TEXT,
          role TEXT CHECK(role IN ('admin', 'user'))
        )`,
                `CREATE TABLE IF NOT EXISTS Customers (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          address TEXT,
          telephone TEXT NOT NULL,
          email TEXT
        )`,
                `CREATE TABLE IF NOT EXISTS Jobs (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          customerId INTEGER,
          itemDescription TEXT NOT NULL,
          serviceDescription TEXT NOT NULL,
          jobType TEXT CHECK(jobType IN ('PART', 'VEHICLE')) NOT NULL,
          status TEXT CHECK(status IN ('Booked', 'In Progress', 'Completed', 'Invoiced', 'Cancelled')) NOT NULL DEFAULT 'Booked',
          vehicleMake TEXT,
          vehicleModel TEXT,
          vehicleYear INTEGER,
          partNumber TEXT,
          serialNumber TEXT,
          servicePrice REAL,
          conditionIn TEXT,
          dateBookedIn TEXT,
          dateExpectedOut TEXT,
          technicianNotes TEXT,
          updates TEXT,
          partsProcured TEXT,
          FOREIGN KEY (customerId) REFERENCES Customers (id)
        )`,
                `CREATE TABLE IF NOT EXISTS Inventory (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL UNIQUE,
          quantity INTEGER NOT NULL DEFAULT 0,
          price REAL NOT NULL
        )`,
                `CREATE TABLE IF NOT EXISTS JobInventory (
            jobId INTEGER,
            inventoryId INTEGER,
            quantityUsed INTEGER NOT NULL,
            PRIMARY KEY (jobId, inventoryId),
            FOREIGN KEY (jobId) REFERENCES Jobs (id),
            FOREIGN KEY (inventoryId) REFERENCES Inventory (id)
        )`,
                `CREATE TABLE IF NOT EXISTS Invoices (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          jobId INTEGER UNIQUE,
          totalAmount REAL NOT NULL,
          amountPaid REAL NOT NULL DEFAULT 0,
          discountAmount REAL NOT NULL DEFAULT 0,
          dateCreated TEXT NOT NULL,
          status TEXT CHECK(status IN ('Unpaid', 'Partially Paid', 'Paid', 'Overdue', 'Refunded')) NOT NULL DEFAULT 'Unpaid',
          FOREIGN KEY (jobId) REFERENCES Jobs (id)
        )`,
                `CREATE TABLE IF NOT EXISTS ServiceItemParts (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          part_name TEXT NOT NULL,
          category TEXT NOT NULL,
          common_services TEXT NOT NULL,
          price REAL NOT NULL,
          description TEXT
        )`,
                `CREATE TABLE IF NOT EXISTS Payments (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          invoiceId INTEGER NOT NULL,
          amount REAL NOT NULL,
          paymentDate TEXT NOT NULL,
          paymentMethod TEXT CHECK(paymentMethod IN ('Cash', 'Card', 'Bank Transfer', 'Other')) NOT NULL,
          transactionId TEXT,
          type TEXT CHECK(type IN ('Deposit', 'Full Payment', 'Partial Payment', 'Return')) NOT NULL,
          notes TEXT,
          FOREIGN KEY (invoiceId) REFERENCES Invoices (id)
        )`,
                `CREATE TABLE IF NOT EXISTS Sales (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          customerId INTEGER,
          totalAmount REAL NOT NULL,
          amountPaid REAL NOT NULL DEFAULT 0,
          discountAmount REAL NOT NULL DEFAULT 0,
          dateCreated TEXT NOT NULL,
          status TEXT CHECK(status IN ('Unpaid', 'Partially Paid', 'Paid', 'Overdue', 'Refunded')) NOT NULL DEFAULT 'Unpaid',
          FOREIGN KEY (customerId) REFERENCES Customers (id)
        )`,
                `CREATE TABLE IF NOT EXISTS SaleInventory (
          saleId INTEGER,
          inventoryId INTEGER,
          quantitySold INTEGER NOT NULL,
          priceAtSale REAL NOT NULL,
          PRIMARY KEY (saleId, inventoryId),
          FOREIGN KEY (saleId) REFERENCES Sales (id),
          FOREIGN KEY (inventoryId) REFERENCES Inventory (id)
        )`
            ];
            createTablesQueries.forEach(query => {
                database_1.default.run(query, (err) => {
                    if (err) {
                        console.error('Error creating table:', err.message);
                    }
                });
            });
            database_1.default.run('PRAGMA foreign_keys = ON;'); // Re-enable foreign key checks
            // 1. Add Admin User
            const adminUserStmt = database_1.default.prepare("INSERT OR IGNORE INTO Users (username, password, role) VALUES (?, ?, ?)");
            adminUserStmt.run('admin', adminPassword, 'admin');
            adminUserStmt.finalize();
            // 2. Add Sample Customers
            const customers = [
                { name: 'John Doe', address: '123 Main St', telephone: '555-1234', email: 'john.d@example.com' },
                { name: 'Jane Smith', address: '456 Oak Ave', telephone: '555-5678', email: 'jane.s@example.com' },
            ];
            const customerStmt = database_1.default.prepare("INSERT OR IGNORE INTO Customers (name, address, telephone, email) VALUES (?, ?, ?, ?)");
            customers.forEach(c => customerStmt.run(c.name, c.address, c.telephone, c.email));
            customerStmt.finalize();
            // 3. Add Sample Jobs
            const jobs = [
                {
                    customerId: 1,
                    itemDescription: 'Brake Pad Replacement',
                    serviceDescription: 'Replace front and rear brake pads',
                    jobType: 'VEHICLE',
                    status: 'Completed',
                    vehicleMake: 'Toyota',
                    vehicleModel: 'Camry',
                    vehicleYear: 2018,
                    servicePrice: 250.00,
                    dateBookedIn: new Date().toISOString(),
                    dateExpectedOut: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
                },
                {
                    customerId: 2,
                    itemDescription: 'Oil Change',
                    serviceDescription: 'Perform synthetic oil and filter change',
                    jobType: 'VEHICLE',
                    status: 'Invoiced',
                    vehicleMake: 'Honda',
                    vehicleModel: 'Civic',
                    vehicleYear: 2020,
                    servicePrice: 75.00,
                    dateBookedIn: new Date().toISOString(),
                    dateExpectedOut: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(),
                },
            ];
            const jobStmt = database_1.default.prepare("INSERT OR IGNORE INTO Jobs (customerId, itemDescription, serviceDescription, jobType, status, vehicleMake, vehicleModel, vehicleYear, servicePrice, dateBookedIn, dateExpectedOut) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
            jobs.forEach(j => jobStmt.run(j.customerId, j.itemDescription, j.serviceDescription, j.jobType, j.status, j.vehicleMake, j.vehicleModel, j.vehicleYear, j.servicePrice, j.dateBookedIn, j.dateExpectedOut));
            jobStmt.finalize();
            // 4. Add Sample Inventory Items
            const inventoryItems = [
                { name: 'Standard Gasket', quantity: 100, price: 5.50 },
                { name: 'Engine Oil (1L)', quantity: 50, price: 15.00 },
                { name: 'Spark Plug', quantity: 80, price: 8.25 },
                { name: 'Brake Fluid (500ml)', quantity: 40, price: 12.75 },
            ];
            const inventoryStmt = database_1.default.prepare("INSERT OR IGNORE INTO Inventory (name, quantity, price) VALUES (?, ?, ?)");
            inventoryItems.forEach(i => inventoryStmt.run(i.name, i.quantity, i.price));
            inventoryStmt.finalize();
            // 5. Add Sample Invoices
            const invoices = [
                {
                    jobId: 1,
                    totalAmount: 250.00,
                    amountPaid: 0,
                    discountAmount: 0,
                    dateCreated: new Date().toISOString(),
                    status: 'Unpaid',
                },
                {
                    jobId: 2,
                    totalAmount: 75.00,
                    amountPaid: 75.00,
                    discountAmount: 0,
                    dateCreated: new Date().toISOString(),
                    status: 'Paid',
                },
            ];
            const invoiceStmt = database_1.default.prepare("INSERT OR IGNORE INTO Invoices (jobId, totalAmount, amountPaid, discountAmount, dateCreated, status) VALUES (?, ?, ?, ?, ?, ?)");
            invoices.forEach(inv => invoiceStmt.run(inv.jobId, inv.totalAmount, inv.amountPaid, inv.discountAmount, inv.dateCreated, inv.status));
            invoiceStmt.finalize();
            // 6. Add Sample ServiceItemParts
            const serviceItemParts = [
                {
                    "part_name": "Cylinder Head",
                    "category": "Engine",
                    "common_services": "Skimming, Valve seat cutting, Valve guide replacement, Pressure testing, Porting and polishing",
                    "price": 1200.00,
                    "description": "Critical engine component, often skimmed to ensure flatness for head gasket sealing."
                },
                {
                    "part_name": "Engine Block",
                    "category": "Engine",
                    "common_services": "Reboring, Honing, Sleeving, Line boring, Deck resurfacing, Crack repair",
                    "price": 2500.00,
                    "description": "Main structure of the engine, machined to restore cylinder and bearing surfaces."
                },
                {
                    "part_name": "Crankshaft",
                    "category": "Engine",
                    "common_services": "Grinding, Polishing, Balancing, Crack testing, Straightening",
                    "price": 1800.00,
                    "description": "Converts piston movement to rotational force, often reground to repair worn journals."
                },
                {
                    "part_name": "Brake Drum",
                    "category": "Brakes",
                    "common_services": "Skimming, Turning, Balancing",
                    "price": 400.00,
                    "description": "Used in drum brake systems, skimmed to remove scoring or warping."
                },
                {
                    "part_name": "Brake Disc",
                    "category": "Brakes",
                    "common_services": "Skimming, Resurfacing, Runout correction",
                    "price": 350.00,
                    "description": "Part of disc brake systems, machined to ensure smooth braking."
                },
                {
                    "part_name": "Prop Shaft",
                    "category": "Drivetrain",
                    "common_services": "Balancing, U-joint replacement, Straightening, Yoke repair",
                    "price": 800.00,
                    "description": "Transmits power to the wheels, often balanced or repaired for vibration issues."
                },
                {
                    "part_name": "Flywheel",
                    "category": "Engine",
                    "common_services": "Skimming, Lightening, Balancing, Dowel pin replacement",
                    "price": 500.00,
                    "description": "Connects engine to clutch, resurfaced for smooth clutch engagement."
                },
                {
                    "part_name": "Clutch Assembly",
                    "category": "Drivetrain",
                    "common_services": "Pressure plate resurfacing, Clutch plate relining, Release bearing replacement",
                    "price": 600.00,
                    "description": "Transfers engine power to transmission, often refurbished."
                },
                {
                    "part_name": "Connecting Rods",
                    "category": "Engine",
                    "common_services": "Resizing big ends, Bushing replacement, Balancing, Crack testing",
                    "price": 900.00,
                    "description": "Links pistons to crankshaft, machined for precise fitment."
                },
                {
                    "part_name": "Camshaft",
                    "category": "Engine",
                    "common_services": "Regrinding, Polishing, Bearing replacement, Performance profiling",
                    "price": 1000.00,
                    "description": "Controls valve timing, reground for wear or performance."
                },
                {
                    "part_name": "Turbocharger",
                    "category": "Engine",
                    "common_services": "Rebuilding, Balancing, Housing machining",
                    "price": 2000.00,
                    "description": "Boosts engine power, rebuilt to restore performance."
                },
                {
                    "part_name": "Differential",
                    "category": "Drivetrain",
                    "common_services": "Crown wheel and pinion setup, Bearing replacement, Gear machining",
                    "price": 1500.00,
                    "description": "Distributes power to wheels, adjusted for optimal performance."
                },
                {
                    "part_name": "Axles",
                    "category": "Drivetrain",
                    "common_services": "Straightening, Splining, Bearing surface repair",
                    "price": 700.00,
                    "description": "Transmits power to wheels, repaired for wear or damage."
                },
                {
                    "part_name": "Wheel Hubs",
                    "category": "Suspension",
                    "common_services": "Bearing seat machining, Resurfacing, Stud hole repair",
                    "price": 450.00,
                    "description": "Supports wheels, machined for bearingstand fitment."
                },
                {
                    "part_name": "Control Arms",
                    "category": "Suspension",
                    "common_services": "Bushing seat machining, Ball joint seat repair",
                    "price": 600.00,
                    "description": "Links suspension to chassis, repaired for wear."
                },
                {
                    "part_name": "Steering Rack",
                    "category": "Steering",
                    "common_services": "Housing repair, Tie rod end rethreading",
                    "price": 800.00,
                    "description": "Controls steering, refurbished for precision."
                },
                {
                    "part_name": "Gearbox",
                    "category": "Drivetrain",
                    "common_services": "Gear regrinding, Synchronizer sleeve machining, Bearing seat repair",
                    "price": 2000.00,
                    "description": "Transmits power to wheels, repaired for smooth shifting."
                },
                {
                    "part_name": "Pistons",
                    "category": "Engine",
                    "common_services": "Machining for oversized rings, Skirt knurling",
                    "price": 300.00,
                    "description": "Drives crankshaft, machined for fitment or repair."
                },
                {
                    "part_name": "Valves",
                    "category": "Engine",
                    "common_services": "Grinding, Lapping, Stem machining",
                    "price": 200.00,
                    "description": "Controls air/fuel flow, reground for sealing."
                },
                {
                    "part_name": "Exhaust Manifold",
                    "category": "Engine",
                    "common_services": "Resurfacing, Crack welding, Custom fabrication",
                    "price": 700.00,
                    "description": "Directs exhaust gases, repaired or modified."
                },
                {
                    "part_name": "Intake Manifold",
                    "category": "Engine",
                    "common_services": "Resurfacing, Porting, Crack welding",
                    "price": 650.00,
                    "description": "Distributes air/fuel mixture, machined for performance."
                },
                {
                    "part_name": "Oil Pump",
                    "category": "Engine",
                    "common_services": "Housing machining, Gear resurfacing, Pressure testing",
                    "price": 500.00,
                    "description": "Circulates engine oil, repaired for efficiency."
                },
                {
                    "part_name": "Water Pump",
                    "category": "Cooling",
                    "common_services": "Impeller repair, Housing machining, Shaft repair",
                    "price": 450.00,
                    "description": "Circulates coolant, refurbished for reliability."
                },
                {
                    "part_name": "Radiator",
                    "category": "Cooling",
                    "common_services": "Core repair, Welding, Soldering",
                    "price": 600.00,
                    "description": "Cools engine, repaired for leaks."
                },
                {
                    "part_name": "Chassis",
                    "category": "Frame",
                    "common_services": "Straightening, Crossmember repair, Fabrication",
                    "price": 1500.00,
                    "description": "Vehicle structure, repaired for alignment."
                },
                {
                    "part_name": "Brake Caliper",
                    "category": "Brakes",
                    "common_services": "Piston bore machining, Seal groove repair, Rebuilding",
                    "price": 500.00,
                    "description": "Applies brake pads, refurbished for performance."
                },
                {
                    "part_name": "Engine Mounts",
                    "category": "Engine",
                    "common_services": "Fabrication, Machining, Bushing seat repair",
                    "price": 400.00,
                    "description": "Secures engine to chassis, repaired or modified."
                },
                {
                    "part_name": "Roll Cage",
                    "category": "Frame",
                    "common_services": "Fabrication, Welding",
                    "price": 3000.00,
                    "description": "Safety structure, custom-built for racing or off-road."
                }
            ];
            const serviceItemPartStmt = database_1.default.prepare("INSERT OR IGNORE INTO ServiceItemParts (part_name, category, common_services, price, description) VALUES (?, ?, ?, ?, ?)");
            serviceItemParts.forEach(s => serviceItemPartStmt.run(s.part_name, s.category, s.common_services, s.price, s.description));
            serviceItemPartStmt.finalize();
            console.log('Seeding complete.');
            // Close the database connection after all operations
            database_1.default.close((err) => {
                if (err) {
                    return console.error('Error closing db:', err.message);
                }
                console.log('Closed the database connection.');
            });
        });
    });
};
seed();
