import React, { useState, useEffect } from 'react';
import { useParams, Link, useLocation, useNavigate } from 'react-router-dom';
import { getInvoice, createPayment } from '../services/api';
import PaymentModal from '../components/pos/PaymentModal';

interface Service {
  part_name: string;
  price: number;
}

interface Invoice {
  id: number;
  dateCreated: string;
  customerName: string;
  totalAmount: number;
  amountPaid: number;
  services: Service[];
}

const InvoiceDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  // Fetch invoice on mount or when id changes
  useEffect(() => {
    const fetchInvoice = async () => {
      setLoading(true);
      try {
        const response = await getInvoice(Number(id));
        setInvoice(response.data.data);
      } catch (err) {
        setError('Failed to fetch invoice');
      } finally {
        setLoading(false);
      }
    };
    fetchInvoice();
  }, [id]);

  // Open payment modal if URL contains /generate
  useEffect(() => {
    if (location.pathname.includes('/generate') && invoice) {
      setIsPaymentModalOpen(true);
    }
  }, [location.pathname, invoice]);

  const handlePaymentSuccess = async (paymentDetails: any) => {
    if (!invoice) return;
    try {
      await createPayment({
        invoiceId: invoice.id,
        amount: paymentDetails.amount,
        paymentMethod: paymentDetails.paymentMethod,
      });
      setIsPaymentModalOpen(false);
      // Refetch invoice data after payment with a small delay
      setTimeout(async () => {
        const response = await getInvoice(Number(id));
        setInvoice(response.data.data);
      }, 100);
    } catch (error) {
      console.error('Failed to create payment', error);
    }
  };

  if (loading) return <div className="p-4">Loading...</div>;
  if (error) return <div className="p-4 text-red-500">{error}</div>;
  if (!invoice) return <div className="p-4">Invoice not found.</div>;

  const totalAmount = Number(invoice?.totalAmount) || 0;
  const amountPaid = Number(invoice?.amountPaid) || 0;
  const balanceDue = totalAmount - amountPaid;

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Invoice #{invoice?.id}</h1>
        <button
          onClick={() => setIsPaymentModalOpen(true)}
          className="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600"
        >
          Pay
        </button>
        <Link
          to={`/invoices/${id}/print`}
          className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600"
        >
          Print Invoice
        </Link>
      </div>

      <div className="bg-white shadow-md rounded-lg p-6 print-container">
        <div className="print-header mb-4">
          <h2 className="text-2xl font-bold">Workshop Pro</h2>
          <p>123 Workshop Lane, Mechanicville, 12345</p>
        </div>

        <div className="print-info mb-4">
          <p>
            <strong>Invoice Date:</strong>{' '}
            {invoice?.dateCreated ? new Date(invoice.dateCreated).toLocaleDateString() : 'N/A'}
          </p>
          <p>
            <strong>Invoice ID:</strong> {invoice?.id}
          </p>
        </div>

        <div className="print-bill-to mb-4">
          <h3 className="text-xl font-bold mb-2">Bill To:</h3>
          <p>{invoice?.customerName ?? 'N/A'}</p>
        </div>

        <div className="print-table">
          <table className="min-w-full leading-normal">
            <thead>
              <tr>
                <th className="text-left">Description</th>
                <th className="text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              {(invoice?.services || []).map((service, index) => (
                <tr key={index}>
                  <td className="text-left">{service.part_name}</td>
                  <td className="text-right">R{(Number(service.price) || 0).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td className="text-right font-bold">Total:</td>
                <td className="text-right">
                  R{totalAmount.toFixed(2)}
                </td>
              </tr>
              <tr>
                <td className="text-right font-bold">Amount Paid:</td>
                <td className="text-right">
                  R{amountPaid.toFixed(2)}
                </td>
              </tr>
              <tr>
                <td className="text-right font-bold">Balance Due:</td>
                <td className="text-right">
                  R{balanceDue.toFixed(2)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {isPaymentModalOpen && invoice && (
        <PaymentModal
          isOpen={isPaymentModalOpen}
          onClose={() => setIsPaymentModalOpen(false)}
          onPaymentSuccess={handlePaymentSuccess}
          balanceDue={balanceDue}
          invoiceId={invoice.id}
        />
      )}
    </div>
  );
};

export default InvoiceDetailPage;