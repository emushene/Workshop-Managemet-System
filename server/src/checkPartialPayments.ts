import db from './database';

const checkPartialPayments = (invoiceId?: number) => {
  let sql = `
    SELECT i.id AS invoiceId, i.status, p.id AS paymentId, p.amount, p.type
    FROM Invoices i
    JOIN Payments p ON i.id = p.invoiceId
    WHERE i.status = 'Partially Paid' AND p.type = 'Partial Payment'
  `;
  const params: any[] = [];

  if (invoiceId) {
    sql += ` AND i.id = ?`;
    params.push(invoiceId);
  }

  db.all(sql, params, (err, rows) => {
    if (err) {
      console.error('Error querying the database:', err.message);
      return;
    }

    const hangingPayments: { [key: number]: any[] } = {};
    rows.forEach((row: any) => {
      if (!hangingPayments[row.invoiceId]) {
        hangingPayments[row.invoiceId] = [];
      }
      hangingPayments[row.invoiceId].push(row);
    });

    const hangingCount = Object.keys(hangingPayments).length;

    if (invoiceId) {
      console.log(`Checking invoice ${invoiceId} for hanging partial payments.`);
    } else {
      console.log(`Found ${hangingCount} invoices with hanging partial payments.`);
    }

    if (hangingCount > 0) {
      console.log('Details:');
      for (const invId in hangingPayments) {
        console.log(`  Invoice ID: ${invId}`);
        hangingPayments[invId].forEach(payment => {
          console.log(`    - Payment ID: ${payment.paymentId}, Amount: ${payment.amount}, Type: ${payment.type}`);
        });
      }
    } else if (invoiceId) {
      console.log(`Invoice ${invoiceId} has no hanging partial payments.`);
    }
  });

  db.close();
};

const invoiceIdArg = process.argv[2];
if (invoiceIdArg) {
  checkPartialPayments(Number(invoiceIdArg));
} else {
  checkPartialPayments();
}
