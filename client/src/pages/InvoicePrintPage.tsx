import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { getInvoice } from '../services/api';

// Define types
interface Part {
  name: string;
  quantity: number;
  price: number;
}

interface Job {
  customerName: string;
  serviceDescription: string;
  servicePrice: number;
  partsProcured?: string; // JSON string
}

interface Invoice {
  id: number;
  dateCreated: string;
  status: string;
  job?: Job;
  totalAmount?: number;
  discountAmount?: number;
  amountPaid?: number;
}

const InvoicePrintPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [error, setError] = useState('');

  // Automatically print when the component has loaded the invoice data
  useEffect(() => {
    if (invoice) {
        // We add a small timeout to allow content to render before printing
        setTimeout(() => {
            window.print();
        }, 500);
    }
  }, [invoice]);

  // Fetch invoice from API
  useEffect(() => {
    const fetchInvoice = async () => {
      try {
        if (!id) return;
        const response = await getInvoice(parseInt(id));
        setInvoice(response.data.data);
      } catch (err) {
        setError('Failed to fetch invoice details');
      }
    };
    fetchInvoice();
  }, [id]);

  if (error) return <p className="p-5 text-red-500">{error}</p>;
  if (!invoice) return <p className="p-5">Loading invoice...</p>;

  // Safely parse partsProcured
  const parts: Part[] = invoice.job?.partsProcured
    ? JSON.parse(invoice.job.partsProcured)
    : [];

  const job = invoice.job;

  return (
    <div className="p-5">
      <div
        className="bg-white p-8 mx-auto shadow-md print:p-0 print:shadow-none"
        style={{ maxWidth: '80mm', fontFamily: 'monospace', fontSize: '10px' }}
      >
        {/* Header */}
        <div className="text-center mb-4">
          <h1 className="text-lg font-bold">Invoice #{invoice.id}</h1>
          <div className="text-xs">
            <strong>Galaxy Engineering</strong>
            <br />
            12 Main Str
            <br />
            Johannesburg, Gauteng, 2005
          </div>
        </div>

        {/* Customer Details */}
        <div className="mb-4 border-b border-dashed pb-2">
          <h3 className="font-bold text-xs mb-1">Customer Details</h3>
          <p className="text-xs">
            <strong>Name:</strong> {job?.customerName ?? 'N/A'}
          </p>
        </div>

        {/* Invoice Details */}
        <div className="mb-4 border-b border-dashed pb-2">
          <h3 className="font-bold text-xs mb-1">Invoice Details</h3>
          <p className="text-xs">
            <strong>Date:</strong>{' '}
            {invoice.dateCreated ? new Date(invoice.dateCreated).toLocaleDateString() : 'N/A'}
          </p>
          <p className="text-xs">
            <strong>Status:</strong> {invoice.status ?? 'N/A'}
          </p>
        </div>

        {/* Items Table */}
        <div className="mb-4 border-b border-dashed pb-2">
          <h3 className="font-bold text-xs mb-1">Items:</h3>
          <table className="w-full text-xs">
            <thead>
              <tr>
                <th className="text-left">Item</th>
                <th className="text-right">Qty</th>
                <th className="text-right">Price</th>
                <th className="text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>{job?.serviceDescription ?? ''}</td>
                <td className="text-right">1</td>
                <td className="text-right">{(job?.servicePrice ?? 0).toFixed(2)}</td>
                <td className="text-right">{(job?.servicePrice ?? 0).toFixed(2)}</td>
              </tr>

              {parts.map((part, index) => (
                <tr key={index}>
                  <td>{part.name}</td>
                  <td className="text-right">{part.quantity}</td>
                  <td className="text-right">{part.price.toFixed(2)}</td>
                  <td className="text-right">{(part.price * part.quantity).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals */}
        <div className="text-right mt-4">
          <p>
            <strong>Subtotal:</strong> {(invoice.totalAmount ?? 0).toFixed(2)}
          </p>
          <p>
            <strong>Discount:</strong> {(invoice.discountAmount ?? 0).toFixed(2)}
          </p>
          <p>
            <strong>Total:</strong>{' '}
            {((invoice.totalAmount ?? 0) - (invoice.discountAmount ?? 0)).toFixed(2)}
          </p>
          <p>
            <strong>Amount Paid:</strong> {(invoice.amountPaid ?? 0).toFixed(2)}
          </p>
          <p>
            <strong>Balance Due:</strong>{' '}
            {((invoice.totalAmount ?? 0) -
              (invoice.discountAmount ?? 0) -
              (invoice.amountPaid ?? 0)
            ).toFixed(2)}
          </p>
        </div>

        {/* Footer */}
        <div className="text-center mt-4">
          <p className="text-xs">Thank you for your business!</p>
        </div>
      </div>
    </div>
  );
};

export default InvoicePrintPage;