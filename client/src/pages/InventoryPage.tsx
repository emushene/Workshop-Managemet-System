import React, { useState, useEffect, useMemo } from 'react';
import { getInventory, createInventoryItem, updateInventoryItem, deleteInventoryItem } from '../services/api';
import { 
    useReactTable, 
    getCoreRowModel, 
    getFilteredRowModel, 
    getPaginationRowModel, 
    flexRender, 
    type ColumnDef 
} from '@tanstack/react-table';

interface InventoryItem {
    id: number;
    name: string;
    quantity: number;
    price: number;
}

const InventoryPage: React.FC = () => {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentItem, setCurrentItem] = useState<any>(null);
  const [formData, setFormData] = useState({ name: '', quantity: '', price: '' });
  const [globalFilter, setGlobalFilter] = useState('');

  useEffect(() => {
    fetchInventory();
  }, []);

  const fetchInventory = async () => {
    try {
      setLoading(true);
      const response = await getInventory();
      setInventory(response.data.data || []);
      setError('');
    } catch (err) {
      setError('Failed to fetch inventory');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (item: any = null) => {
    setCurrentItem(item);
    setFormData(item ? { name: item.name, quantity: item.quantity, price: (item.price / 100).toFixed(2) } : { name: '', quantity: '', price: '' });
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setCurrentItem(null);
    setFormData({ name: '', quantity: '', price: '' });
  };

  const handleSave = async () => {
    try {
      const data = { ...formData, quantity: parseInt(formData.quantity), price: parseFloat(formData.price) };
      if (currentItem) {
        await updateInventoryItem(currentItem.id, data);
      } else {
        await createInventoryItem(data);
      }
      fetchInventory();
      handleCloseModal();
    } catch (err) {
      setError('Failed to save inventory item');
      console.error(err);
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this item?')) {
      try {
        await deleteInventoryItem(id);
        fetchInventory();
      } catch (err) {
        setError('Failed to delete inventory item');
        console.error(err);
      }
    }
  };

  const columns = useMemo<ColumnDef<InventoryItem>[]>(() => [
    { accessorKey: 'name', header: 'Name' },
    { accessorKey: 'quantity', header: 'Quantity' },
    {
        accessorKey: 'price',
        header: 'Price',
        cell: ({ row }) => `R${(row.original.price / 100).toFixed(2)}`
    },
    {
        id: 'actions',
        header: 'Actions',
        cell: ({ row }) => (
            <div className="text-right">
                <button onClick={() => handleOpenModal(row.original)} className="text-indigo-600 hover:text-indigo-900 mr-4">Edit</button>
                <button onClick={() => handleDelete(row.original.id)} className="text-red-600 hover:text-red-900">Delete</button>
            </div>
        )
    }
  ], []);

  const table = useReactTable({
    data: inventory,
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
        <h1 className="text-3xl font-bold">Inventory Management</h1>
        <button onClick={() => handleOpenModal()} className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600">
          Add Item
        </button>
      </div>

      <div className="mb-4">
        <input
          type="text"
          placeholder="Search inventory..."
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

      {isModalOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center">
          <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-md">
            <h2 className="text-2xl font-bold mb-4">{currentItem ? 'Edit Item' : 'Add Item'}</h2>
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2">Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2">Quantity</label>
              <input
                type="number"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2">Price</label>
              <input
                type="number"
                step="0.01"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            <div className="flex justify-end">
              <button onClick={handleCloseModal} className="bg-gray-300 text-gray-800 px-4 py-2 rounded-md mr-2">Cancel</button>
              <button onClick={handleSave} className="bg-blue-500 text-white px-4 py-2 rounded-md">Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InventoryPage;