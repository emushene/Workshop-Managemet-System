
import db from './database';

const fixInvoices = async () => {
  console.log('Starting to fix invoices...');

  try {
    // Get all invoices
    const invoices = await new Promise<any[]>((resolve, reject) => {
      db.all('SELECT * FROM Invoices', (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });

    for (const invoice of invoices) {
      // Calculate the total payments for the invoice
      const totalPayments = await new Promise<number>((resolve, reject) => {
        db.get('SELECT SUM(amount) AS total FROM Payments WHERE invoiceId = ?', [invoice.jobId], (err, row: any) => {
          if (err) {
            reject(err);
          } else {
            resolve(row.total || 0);
          }
        });
      });

      // Update the invoice if the amountPaid is incorrect
      if (invoice.amountPaid !== totalPayments) {
        console.log(`Fixing invoice ${invoice.jobId}: old amountPaid: ${invoice.amountPaid}, new amountPaid: ${totalPayments}`);
        await new Promise<void>((resolve, reject) => {
          db.run('UPDATE Invoices SET amountPaid = ? WHERE jobId = ?', [totalPayments, invoice.jobId], (err) => {
            if (err) {
              reject(err);
            } else {
              resolve();
            }
          });
        });
      }
    }

    console.log('Finished fixing invoices.');
  } catch (err) {
    console.error('Error fixing invoices:', err);
  } finally {
    db.close((err) => {
      if (err) {
        console.error('Error closing database:', err.message);
      } else {
        console.log('Database connection closed.');
      }
    });
  }
};

fixInvoices();
