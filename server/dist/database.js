"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var sqlite3 = require("sqlite3");
var path = require("path");
var DBSOURCE = path.join(__dirname, '..', 'database.sqlite');
var db = new sqlite3.Database(DBSOURCE, function (err) {
    if (err) {
        // Cannot open database
        console.error(err.message);
        throw err;
    }
    console.log('Connected to the SQLite database.');
    // Enable foreign key support
    db.run('PRAGMA foreign_keys = ON;', function (err) {
        if (err) {
            console.error('Failed to enable foreign keys:', err.message);
        }
    });
});
exports.default = db;
