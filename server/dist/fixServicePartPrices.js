"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const database_1 = __importDefault(require("./database"));
const fixPrices = () => {
    const sql = 'UPDATE ServiceItemParts SET price = price / 100';
    database_1.default.run(sql, [], function (err) {
        if (err) {
            console.error('Error updating prices:', err.message);
            return;
        }
        console.log(`Prices updated successfully. Rows affected: ${this.changes}`);
    });
    // Close the database connection
    database_1.default.close((err) => {
        if (err) {
            console.error(err.message);
        }
        console.log('Closed the database connection.');
    });
};
fixPrices();
