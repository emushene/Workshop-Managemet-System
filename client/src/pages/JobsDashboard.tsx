import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { getJobs, updateJob, getInvoiceByJobId, createPayment } from '../services/api';
import PaymentModal from '../components/pos/PaymentModal';
import { 
    useReactTable, 
    getCoreRowModel, 
    getFilteredRowModel, 
    getPaginationRowModel, 
    flexRender, 
    type ColumnDef 
} from '@tanstack/react-table';

interface Job {
  id: number;
  customerName: string;
  itemDescription: string;
  serviceDescription: string;
  status: string;
  invoiceStatus?: string;
}

const JobsDashboard: React.FC = () => {
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [invoice, setInvoice] = useState<any | null>(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [globalFilter, setGlobalFilter] = useState('');

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
      setJobs(response.data.data || []);
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
      fetchJobs();
    } catch (err) {
      console.error('Failed to create payment', err);
      setError('Payment failed');
    }
  };

  const columns = useMemo<ColumnDef<Job>[]>(() => [
    { accessorKey: 'id', header: 'Job ID' },
    { accessorKey: 'customerName', header: 'Customer' },
    { accessorKey: 'serviceDescription', header: 'Part' },
    {
        accessorKey: 'status',
        header: 'Job Status',
        cell: ({ row }) => (
            <select
                value={row.original.status}
                onChange={(e) => handleStatusChange(row.original.id, e.target.value)}
                className={`appearance-none rounded-full px-3 py-1 text-xs font-semibold leading-tight ${statusTextColors[row.original.status]} ${statusColors[row.original.status]}`}
            >
                <option value="Booked">Booked</option>
                <option value="In Progress">In Progress</option>
                <option value="Completed">Completed</option>
                <option value="Invoiced">Invoiced</option>
                <option value="Cancelled">Cancelled</option>
            </select>
        )
    },
    {
        accessorKey: 'invoiceStatus',
        header: 'Invoice Status',
        cell: ({ row }) => row.original.invoiceStatus ? (
            <span className={`relative inline-block px-3 py-1 font-semibold leading-tight rounded-full ${statusTextColors[row.original.invoiceStatus]} ${statusColors[row.original.invoiceStatus]}`}>
                {row.original.invoiceStatus}
            </span>
        ) : <span className="text-gray-500">N/A</span>
    },
    {
        id: 'actions',
        header: 'Actions',
        cell: ({ row }) => (
            <div className="text-right">
                <Link to={`/jobs/${row.original.id}`} className="text-indigo-600 hover:text-indigo-900 mr-4">Details</Link>
                {row.original.status === 'Invoiced' && row.original.invoiceStatus !== 'Paid' && (
                    <button onClick={() => handlePayInvoice(row.original)} className="text-green-600 hover:text-green-900">Pay Invoice</button>
                )}
            </div>
        )
    }
  ], [jobs]);

  const table = useReactTable({
    data: jobs,
    columns,
    state: {
        globalFilter,
    },
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  if (loading) return <div className="p-4">Loading...</div>;
  if (error) return <div className="p-4 text-red-500">{error}</div>;

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Jobs Dashboard</h1>
        <Link to="/jobs/new" className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600">Book New Job</Link>
      </div>

      <div className="mb-4">
        <input
          type="text"
          placeholder="Search jobs..."
          value={globalFilter}
          onChange={(e) => setGlobalFilter(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
        />
      </div>

      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <table className="min-w-full leading-normal">
          <thead>
            {table.getHeaderGroups().map(headerGroup => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map(header => (
                  <th key={header.id} className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    {flexRender(header.column.columnDef.header, header.getContext())}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map(row => (
              <tr key={row.id} className={`${statusColors[row.original.status] || 'bg-white'} hover:bg-gray-200 hover:bg-opacity-50`}>
                {row.getVisibleCells().map(cell => (
                  <td key={cell.id} className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="py-4 flex items-center justify-between">
        <div className="flex-1 flex justify-between sm:hidden">
            <button onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>Previous</button>
            <button onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>Next</button>
        </div>
        <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
                <p className="text-sm text-gray-700">
                    Showing page <span className="font-medium">{table.getState().pagination.pageIndex + 1}</span> of <span className="font-medium">{table.getPageCount()}</span>
                </p>
            </div>
            <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                    <button onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()} className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50">Previous</button>
                    <button onClick={() => table.nextPage()} disabled={!table.getCanNextPage()} className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50">Next</button>
                </nav>
            </div>
        </div>
      </div>

      {isPaymentModalOpen && invoice && ( 
        <PaymentModal
          isOpen={isPaymentModalOpen}
          onClose={() => setIsPaymentModalOpen(false)}
          invoiceId={invoice.id}
          onPaymentSuccess={handlePaymentSuccess}
          balanceDue={invoice.totalAmount - invoice.amountPaid}
        />
      )}
    </div>
  );
};

export default JobsDashboard;