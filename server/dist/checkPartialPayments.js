"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var database_1 = require("./database");
var checkPartialPayments = function (invoiceId) {
    var sql = "\n    SELECT i.id AS invoiceId, i.status, p.id AS paymentId, p.amount, p.type\n    FROM Invoices i\n    JOIN Payments p ON i.id = p.invoiceId\n    WHERE i.status = 'Partially Paid' AND p.type = 'Partial Payment'\n  ";
    var params = [];
    if (invoiceId) {
        sql += " AND i.id = ?";
        params.push(invoiceId);
    }
    database_1.default.all(sql, params, function (err, rows) {
        if (err) {
            console.error('Error querying the database:', err.message);
            return;
        }
        var hangingPayments = {};
        rows.forEach(function (row) {
            if (!hangingPayments[row.invoiceId]) {
                hangingPayments[row.invoiceId] = [];
            }
            hangingPayments[row.invoiceId].push(row);
        });
        var hangingCount = Object.keys(hangingPayments).length;
        if (invoiceId) {
            console.log("Checking invoice ".concat(invoiceId, " for hanging partial payments."));
        }
        else {
            console.log("Found ".concat(hangingCount, " invoices with hanging partial payments."));
        }
        if (hangingCount > 0) {
            console.log('Details:');
            for (var invId in hangingPayments) {
                console.log("  Invoice ID: ".concat(invId));
                hangingPayments[invId].forEach(function (payment) {
                    console.log("    - Payment ID: ".concat(payment.paymentId, ", Amount: ").concat(payment.amount, ", Type: ").concat(payment.type));
                });
            }
        }
        else if (invoiceId) {
            console.log("Invoice ".concat(invoiceId, " has no hanging partial payments."));
        }
    });
    database_1.default.close();
};
var invoiceIdArg = process.argv[2];
if (invoiceIdArg) {
    checkPartialPayments(Number(invoiceIdArg));
}
else {
    checkPartialPayments();
}
