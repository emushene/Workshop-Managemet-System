import React from 'react';

interface ReceiptProps {
  saleData: {
    invoiceId: number;
    saleItems: any[];
    total: number;
    discount: number;
  };
}

const Receipt: React.FC<ReceiptProps> = ({ saleData }) => {
  const subtotal = saleData.saleItems.reduce((acc, item) => acc + (item.quantity * item.unitPrice), 0);

  return (
    <div style={{ width: '80mm', fontFamily: 'monospace', padding: '10px' }}>
      <h2 style={{ textAlign: 'center', margin: '0' }}>Galaxy Engineering</h2>
      <p style={{ textAlign: 'center', margin: '0' }}>12 Main Str, Johannesbrg</p>
      <p style={{ textAlign: 'center', margin: '0' }}>Tel: 011- 555-1234</p>
      <hr style={{ borderTop: '1px dashed black', margin: '10px 0' }} />
      <p>Invoice #: {saleData.invoiceId}</p>
      <p>Date: {new Date().toLocaleString()}</p>
      <hr style={{ borderTop: '1px dashed black', margin: '10px 0' }} />
      <table style={{ width: '100%', fontSize: '12px' }}>
        <thead>
          <tr>
            <th style={{ textAlign: 'left' }}>Item</th>
            <th style={{ textAlign: 'right' }}>Qty</th>
            <th style={{ textAlign: 'right' }}>Price</th>
            <th style={{ textAlign: 'right' }}>Total</th>
          </tr>
        </thead>
        <tbody>
          {saleData.saleItems.map((item, index) => (
            <tr key={index}>
              <td>{item.name}</td>
              <td style={{ textAlign: 'right' }}>{item.quantity}</td>
              <td style={{ textAlign: 'right' }}>{item.unitPrice.toFixed(2)}</td>
              <td style={{ textAlign: 'right' }}>{(item.quantity * item.unitPrice).toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <hr style={{ borderTop: '1px dashed black', margin: '10px 0' }} />
      <div style={{ textAlign: 'right' }}>
        <p>Subtotal: {subtotal.toFixed(2)}</p>
        <p>Discount: {saleData.discount.toFixed(2)}</p>
        <h3 style={{ margin: '5px 0' }}>Total: {saleData.total.toFixed(2)} ZAR</h3>
      </div>
      <hr style={{ borderTop: '1px dashed black', margin: '10px 0' }} />
      <p style={{ textAlign: 'center', marginTop: '20px' }}>Thank you for your business!</p>
    </div>
  );
};

export default Receipt;
