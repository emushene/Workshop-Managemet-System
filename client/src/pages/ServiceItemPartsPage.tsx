import React, { useState, useEffect } from 'react';
import { getServiceItemParts, createServiceItemPart, updateServiceItemPart, deleteServiceItemPart } from '../services/api';

const ServiceItemPartsPage: React.FC = () => {
  const [serviceItemParts, setServiceItemParts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentServiceItemPart, setCurrentServiceItemPart] = useState<any>(null);
  const [formData, setFormData] = useState({ part_name: '', category: '', common_services: '', price: '', description: '' });

  useEffect(() => {
    fetchServiceItemParts();
  }, []);

  const fetchServiceItemParts = async () => {
    try {
      setLoading(true);
      const response = await getServiceItemParts();
      setServiceItemParts(response.data.data);
      setError('');
    } catch (err) {
      setError('Failed to fetch service item parts');
      console.error(err);
    }
    finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (item: any = null) => {
    setCurrentServiceItemPart(item);
    setFormData(item ? { part_name: item.part_name, category: item.category, common_services: item.common_services, price: item.price, description: item.description } : { part_name: '', category: '', common_services: '', price: '', description: '' });
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setCurrentServiceItemPart(null);
    setFormData({ part_name: '', category: '', common_services: '', price: '', description: '' });
  };

  const handleSave = async () => {
    if (!formData.part_name || !formData.category || !formData.common_services || formData.price === '') {
      setError('Part Name, Category, Common Services, and Price are required.');
      return;
    }
    try {
      const data = { ...formData, price: parseFloat(formData.price as string) };
      if (currentServiceItemPart) {
        await updateServiceItemPart(currentServiceItemPart.id, data);
      } else {
        await createServiceItemPart(data);
      }
      fetchServiceItemParts();
      handleCloseModal();
    } catch (err) {
      setError('Failed to save service item part');
      console.error(err);
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this service item part?')) {
      try {
        await deleteServiceItemPart(id);
        fetchServiceItemParts();
      } catch (err) {
        setError('Failed to delete service item part');
        console.error(err);
      }
    }
  };

  if (loading) return <div className="p-4">Loading...</div>;
  if (error) return <div className="p-4 text-red-500">{error}</div>;

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Service Item Parts Management</h1>
        <button onClick={() => handleOpenModal()} className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600">
          Add Service Item Part
        </button>
      </div>
      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <table className="min-w-full leading-normal">
          <thead>
            <tr>
              <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Part Name</th>
              <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Category</th>
              <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Common Services</th>
              <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Price</th>
              <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Description</th>
              <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100"></th>
            </tr>
          </thead>
          <tbody>
            {serviceItemParts.map(item => (
              <tr key={item.id}>
                <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">{item.part_name}</td>
                <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">{item.category}</td>
                <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">{item.common_services}</td>
                <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">R{item.price.toFixed(2)}</td>
                <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">{item.description}</td>
                <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm text-right">
                  <button onClick={() => handleOpenModal(item)} className="text-indigo-600 hover:text-indigo-900 mr-4">Edit</button>
                  <button onClick={() => handleDelete(item.id)} className="text-red-600 hover:text-red-900">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center">
          <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-md">
            <h2 className="text-2xl font-bold mb-4">{currentServiceItemPart ? 'Edit Service Item Part' : 'Add Service Item Part'}</h2>
            {error && <p className="text-red-500 text-center mb-4">{error}</p>}
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2">Part Name</label>
              <input
                type="text"
                value={formData.part_name}
                onChange={(e) => setFormData({ ...formData, part_name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                required
              />
            </div>
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2">Category</label>
              <input
                type="text"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                required
              />
            </div>
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2">Common Services</label>
              <textarea
                value={formData.common_services}
                onChange={(e) => setFormData({ ...formData, common_services: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                rows={3}
                required
              ></textarea>
            </div>
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2">Price</label>
              <input
                type="number"
                step="0.01"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                required
              />
            </div>
            <div className="mb-4">
              <label className="block text-gray-700 text-sm font-bold mb-2">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                rows={3}
              ></textarea>
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

export default ServiceItemPartsPage;
