"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const sqlite3_1 = __importDefault(require("sqlite3"));
const path_1 = __importDefault(require("path"));
const DBSOURCE = path_1.default.join(__dirname, '..', 'database.sqlite');
const db = new sqlite3_1.default.Database(DBSOURCE, (err) => {
    if (err) {
        // Cannot open database
        console.error(err.message);
        throw err;
    }
    console.log('Connected to the SQLite database.');
    // Enable foreign key support
    db.run('PRAGMA foreign_keys = ON;', (err) => {
        if (err) {
            console.error('Failed to enable foreign keys:', err.message);
        }
    });
});
exports.default = db;
