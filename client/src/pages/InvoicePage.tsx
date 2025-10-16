import React, { useState, useEffect, useMemo } from 'react';
import { getInvoices } from '../services/api';
import { Link } from 'react-router-dom';
import { 
    useReactTable, 
    getCoreRowModel, 
    getFilteredRowModel, 
    getPaginationRowModel, 
    flexRender, 
    type ColumnDef 
} from '@tanstack/react-table';

interface Invoice {
    id: number;
    customerName: string;
    totalAmount: number;
    amountPaid: number;
    status: string;
}

const InvoicePage: React.FC = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [globalFilter, setGlobalFilter] = useState('');

  useEffect(() => {
    const fetchInvoices = async () => {
      try {
        setLoading(true);
        const response = await getInvoices();
        setInvoices(response.data.data || []);
      } catch (err) {
        setError('Failed to fetch invoices');
      } finally {
        setLoading(false);
      }
    };
    fetchInvoices();
  }, []);

  const columns = useMemo<ColumnDef<Invoice>[]>(() => [
    { accessorKey: 'id', header: 'Invoice ID' },
    { accessorKey: 'customerName', header: 'Customer' },
    {
        accessorKey: 'totalAmount',
        header: 'Amount',
        cell: ({ row }) => `R${row.original.totalAmount.toFixed(2)}`
    },
    {
        accessorKey: 'amountPaid',
        header: 'Amount Paid',
        cell: ({ row }) => `R${row.original.amountPaid.toFixed(2)}`
    },
    {
        id: 'balanceDue',
        header: 'Balance Due',
        cell: ({ row }) => `R${(row.original.totalAmount - row.original.amountPaid).toFixed(2)}`
    },
    { accessorKey: 'status', header: 'Status' },
    {
        id: 'actions',
        header: 'Actions',
        cell: ({ row }) => (
            <div className="text-right">
                <Link to={`/invoices/${row.original.id}`} className="text-indigo-600 hover:text-indigo-900">View</Link>
            </div>
        )
    }
  ], []);

  const table = useReactTable({
    data: invoices,
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
      <h1 className="text-3xl font-bold mb-6">Invoices</h1>

      <div className="mb-4">
        <input
          type="text"
          placeholder="Search invoices..."
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
              <tr key={row.id}>
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
    </div>
  );
};

export default InvoicePage;