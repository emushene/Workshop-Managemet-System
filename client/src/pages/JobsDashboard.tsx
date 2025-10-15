import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getJobs, updateJob, getInvoiceByJobId, createPayment } from '../services/api';
import PaymentModal from '../components/pos/PaymentModal';

interface Job {
  id: number;
  customerName: string;
  itemDescription: string;
  status: string;
  invoiceStatus?: string;
}

const JobsDashboard: React.FC = () => {
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [invoice, setInvoice] = useState<any | null>(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

  const statusColors: { [key: string]: string } = {
    'Booked': 'bg-blue-100',
    'In Progress': 'bg-yellow-100',
    'Completed': 'bg-green-100',
    'Invoiced': 'bg-purple-100',
    'Cancelled': 'bg-red-100',
    'Paid': 'bg-green-200',
    'Partially Paid': 'bg-orange-100',
    'Unpaid': 'bg-gray-100',
  };

  const statusTextColors: { [key: string]: string } = {
    'Booked': 'text-blue-800',
    'In Progress': 'text-yellow-800',
    'Completed': 'text-green-800',
    'Invoiced': 'text-purple-800',
    'Cancelled': 'text-red-800',
    'Paid': 'text-green-800',
    'Partially Paid': 'text-orange-800',
    'Unpaid': 'text-gray-800',
  };

  const fetchJobs = async () => {
    try {
      const response = await getJobs();
      setJobs(response.data.data);
    } catch (err) {
      setError('Failed to fetch jobs');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  const handleStatusChange = async (jobId: number, newStatus: string) => {
    try {
      await updateJob(jobId, { status: newStatus });
      setJobs(jobs.map(job => (job.id === jobId ? { ...job, status: newStatus } : job)));
    } catch (err) {
      setError('Failed to update job status');
      console.error(err);
    }
  };

  const handlePayInvoice = async (job: any) => {
    try {
      const response = await getInvoiceByJobId(job.id);
      if (response.data.data) {
        setInvoice(response.data.data);
        setIsPaymentModalOpen(true);
      } else {
        setError('No invoice found for this job. Please create one from the Job Details page.');
      }
    } catch (err) {
      console.error('Failed to fetch invoice', err);
      setError('Failed to fetch invoice');
    }
  };

  const handlePaymentSuccess = async (paymentDetails: any) => {
    if (!invoice) return;
    try {
      await createPayment({ 
        invoiceId: invoice.id, 
        amount: paymentDetails.amount, 
        paymentMethod: paymentDetails.paymentMethod,
        type: paymentDetails.type
      });
      setIsPaymentModalOpen(false);
      setInvoice(null);
      // Re-fetch jobs to show the updated invoice status
      fetchJobs();
    } catch (err) {
      console.error('Failed to create payment', err);
      setError('Payment failed');
    }
  };

  if (loading) return <div className="p-4">Loading...</div>;
  if (error) return <div className="p-4 text-red-500">{error}</div>;

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
      <h1 className="text-3xl font-bold">Jobs Dashboard</h1>
      <Link to="/jobs/new" className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600">
        Book New Job
      </Link>
      </div>

      <div className="bg-white shadow-md rounded-lg overflow-hidden">
      <table className="min-w-full leading-normal">
        <thead>
        <tr>
          <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Job ID</th>
          <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Customer</th>
          <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Item Description</th>
          <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Job Status</th>
          <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Invoice Status</th>
          <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100"></th>
        </tr>
        </thead>
        <tbody>
        {jobs.map((job: Job) => ( 
          <tr key={job.id} className={`hover:bg-gray-50`}>
            <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">{job.id}</td>
            <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">{job.customerName}</td>
            <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">{job.itemDescription}</td>
            <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
              <select
                value={job.status}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => handleStatusChange(job.id, e.target.value)}
                className={`appearance-none rounded-full px-3 py-1 text-xs font-semibold leading-tight ${statusTextColors[job.status]} ${statusColors[job.status]}`}
              >
                <option value="Booked">Booked</option>
                <option value="In Progress">In Progress</option>
                <option value="Completed">Completed</option>
                <option value="Invoiced">Invoiced</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </td>
            <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
              {job.invoiceStatus ? (
                <span className={`relative inline-block px-3 py-1 font-semibold leading-tight rounded-full ${statusTextColors[job.invoiceStatus]} ${statusColors[job.invoiceStatus]}`}>
                  {job.invoiceStatus}
                </span>
              ) : (
                <span className="text-gray-500">N/A</span>
              )}
            </td>
            <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm text-right">
              <Link to={`/jobs/${job.id}`} className="text-indigo-600 hover:text-indigo-900 mr-4">
                Details
              </Link>
              {job.status === 'Invoiced' && job.invoiceStatus !== 'Paid' && (
                <button
                  onClick={() => handlePayInvoice(job)}
                  className="text-green-600 hover:text-green-900"
                >
                  Pay Invoice
                </button>
              )}
            </td>
          </tr>
        ))}
        </tbody>
      </table>
      </div>

      {/* Payment Modal */}
      {isPaymentModalOpen && invoice && ( 
      <PaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        invoiceId={invoice.id}
        onPaymentSuccess={handlePaymentSuccess}
        totalAmount={invoice.totalAmount ?? 0}
      />
      )}
    </div>
  );
};

export default JobsDashboard;
