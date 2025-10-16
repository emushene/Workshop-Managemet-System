import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { getInvoice } from '../services/api';


// Define types
interface Part {
  name: string;
  quantity: number;
  price: number;
}

interface Invoice {
  id: number;
  dateCreated: string;
  status: string;
  job?: Job;
  totalAmount?: number;
  discountAmount?: number;
  amountPaid?: number;
  partsProcured?: string; // Add partsProcured directly to Invoice interface
  serviceDescription?: string; // Add serviceDescription directly to Invoice interface
  servicePrice?: number; // Add servicePrice directly to Invoice interface
}

interface Job {
  customerName: string;
  // serviceDescription: string; // Remove from Job interface as it's now on Invoice
  // servicePrice: number;     // Remove from Job interface as it's now on Invoice
}

import logo from '../images/logo.png';

const InvoicePrintPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [error, setError] = useState('');

  // Automatically print when the component has loaded the invoice data
  useEffect(() => {
    if (invoice) {
        console.log('Printing invoice:', invoice);
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

  const parts: Part[] = []; // Initialize as empty array
  if (invoice.partsProcured) {
    try {
      const parsed = JSON.parse(invoice.partsProcured);
      if (Array.isArray(parsed)) {
        parts.push(...parsed);
      }
    } catch (parseError) {
      console.error("Failed to parse partsProcured:", parseError);
    }
  }

  // const job = invoice.job; // Remove job constant as serviceDescription and servicePrice are now on invoice

  return (
    <div className="p-5 print-preview-page">
      <div
        className="printable-area bg-white p-8 mx-auto shadow-md print:p-0 print:shadow-none"
        style={{ maxWidth: '80mm', fontFamily: 'monospace', fontSize: '10px' }}
      >
        <div className="text-center mb-4">
                    <img src={logo} alt="Company Logo" style={{ width: '100px', margin: '0 auto' }} />
                    <h2 style={{ textAlign: 'center', margin: '0' }}>DA MASIH MOTOR ENGINEERING</h2>
                    <p style={{ textAlign: 'center', margin: '0' }}>409 Rotweiller Road, Mayibuye-Tembisa</p>
                    <p style={{ textAlign: 'center', margin: '0' }}>Tel: 081 527 6080</p>
                    <p style={{ textAlign: 'center', margin: '0' }}>Tel: 010 335 0492</p>
                    <p style={{ textAlign: 'center', margin: '0' }}>www.masihmotoreng.co.za</p>
                    <hr style={{ borderTop: '1px dashed black', margin: '10px 0' }} />
                    <h1 className="text-lg font-bold">Invoice #{invoice.id}</h1>
                </div>

        {/* Customer Details */}
        <div className="mb-4 border-b border-dashed pb-2">
          <h3 className="font-bold text-xs mb-1">Customer Details</h3>
          <p className="text-xs">
            <strong>Name:</strong> {invoice.customerName ?? 'N/A'}
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
              {invoice.services?.map((service: any, index: number) => (
                <tr key={`service-${index}`}>
                  <td>{service.part_name}</td>
                  <td style={{ textAlign: 'right' }}>1</td>
                  <td style={{ textAlign: 'right' }}>{service.price.toFixed(2)}</td>
                  <td style={{ textAlign: 'right' }}>{service.price.toFixed(2)}</td>
                </tr>
              ))}

              {parts.map((part, index) => (
                <tr key={`part-${index}`}>
                  <td>{part.name}</td>
                  <td style={{ textAlign: 'right' }}>{part.quantity}</td>
                  <td style={{ textAlign: 'right' }}>{part.price.toFixed(2)}</td>
                  <td style={{ textAlign: 'right' }}>{(part.price * part.quantity).toFixed(2)}</td>
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

        <div style={{ textAlign: 'center', marginTop: '20px' }}>
                    <p style={{ textAlign: 'center', marginTop: '20px' }}>TERMS & CONDITIONS</p>
                    <p style={{ textAlign: 'center', marginTop: '20px' }}>1. 3 Months warranty for each and everyjob, excluding the Crankshaft & Overheatings.</p>
                    <p style={{ textAlign: 'center', marginTop: '20px' }}>2. After 3 Months the company is not responsible for any goods!</p>
                    <p style={{ textAlign: 'center', marginTop: '20px' }}>3. After 3 months the company has the right to sell unclaimed finished work to cover the loss</p>
                    <br />
                    <br />
                    <br />
                    <p style={{ textAlign: 'center', marginTop: '20px' }}>Customer Signature ...........................</p>
                    <p style={{ textAlign: 'center', marginTop: '20px' }}>Thank you for your business!</p>
                </div>
      </div>
    </div>
  );
};

export default InvoicePrintPage;
