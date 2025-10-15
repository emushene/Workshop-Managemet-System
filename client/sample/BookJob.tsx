import React, { useState, useEffect } from 'react';
import api from '../api';
import { Customer, Product } from '../types';
import { vehicleTypes } from '../constants';

interface BookJobProps {
  onJobBooked: () => void;
  onClose: () => void;
}

const BookJob: React.FC<BookJobProps> = ({ onJobBooked, onClose }) => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState('');
  const [selectedProductId, setSelectedProductId] = useState('');
  const [selectedVehicleType, setSelectedVehicleType] = useState(vehicleTypes[0]);
  const [price, setPrice] = useState('');
  const [expectedCompletionDate, setExpectedCompletionDate] = useState('');
  const [vehicleMakeModel, setVehicleMakeModel] = useState('');
  const [partNumber, setPartNumber] = useState('');
  const [serialNumber, setSerialNumber] = useState('');
  const [initialCondition, setInitialCondition] = useState('');
  const [error, setError] = useState('');
  
  const [showNewCustomerForm, setShowNewCustomerForm] = useState(false);
  const [newCustomerName, setNewCustomerName] = useState('');
  const [newCustomerPhone, setNewCustomerPhone] = useState('');
  const [newCustomerEmail, setNewCustomerEmail] = useState('');

  useEffect(() => {
    fetchCustomers();
    fetchProducts();
  }, []);

  useEffect(() => {
    if (selectedProductId && selectedVehicleType) {
      const product = products.find(p => p.id === parseInt(selectedProductId));
      if (product && product.prices && product.prices[selectedVehicleType]) {
        setPrice(product.prices[selectedVehicleType].servicingPrice.toString());
      } else {
        setPrice(''); // Clear price if no match
      }
    } else {
      setPrice(''); // Clear price if selections are incomplete
    }
  }, [selectedProductId, selectedVehicleType, products]);

  const fetchCustomers = async () => {
    try {
      const response = await api.get('/api/customers');
      setCustomers(response.data.data || []);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch customers');
    }
  };

  const fetchProducts = async () => {
    try {
      const response = await api.get('/api/products');
      setProducts(response.data.data || []);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch products');
    }
  };

  const handleAddNewCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const response = await api.post('/api/customers', { name: newCustomerName, phone: newCustomerPhone, email: newCustomerEmail });
      const newCustomer: Customer = {
        id: response.data.id,
        name: newCustomerName,
        phone: newCustomerPhone,
        email: newCustomerEmail,
      };
      setCustomers([...customers, newCustomer]);
      setSelectedCustomer(response.data.id.toString());
      setShowNewCustomerForm(false);
      setNewCustomerName('');
      setNewCustomerPhone('');
      setNewCustomerEmail('');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to add customer');
    }
  };

  const handleBookJob = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!selectedCustomer || !selectedProductId) {
      setError('Please select a customer and a service/item.');
      return;
    }

    const selectedProduct = products.find(p => p.id === parseInt(selectedProductId));
    const calculatedPrice = selectedProduct && selectedProduct.prices && selectedProduct.prices[selectedVehicleType]
      ? selectedProduct.prices[selectedVehicleType].servicingPrice.toString()
      : '';
    console.log('calculatedPrice:', calculatedPrice);

    const jobData = { 
      customerId: selectedCustomer, 
      service: selectedProduct?.name, 
      status: 'Booked In',
      price: calculatedPrice,
      expectedCompletionDate,
      vehicleMakeModel: vehicleMakeModel,
      vehicleType: selectedVehicleType,
      partNumber,
      serialNumber,
      initialCondition
    };

    try {
      await api.post('/api/jobs', jobData);
      onJobBooked();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to book job');
    }
  };

  return (
    <div className="fixed inset-0 w-full h-full bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white p-5 rounded-lg shadow-lg w-full max-w-3xl overflow-y-auto" style={{ maxHeight: '90vh' }}>
        <h2 className="text-2xl font-bold mb-4">Book New Job</h2>
        {error && <p className="text-red-500 mb-4">{error}</p>}
        <form onSubmit={handleBookJob} className="text-left">
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2">Customer</label>
            <div className="flex items-center">
              <select 
                value={selectedCustomer} 
                onChange={(e) => {
                  setSelectedCustomer(e.target.value);
                  setShowNewCustomerForm(false);
                }} 
                required 
                className="flex-grow shadow border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              >
                <option value="" disabled>Select a customer</option>
                {customers.map(customer => (
                  <option key={customer.id} value={customer.id}>{customer.name}</option>
                ))}
              </select>
              <button type="button" onClick={() => setShowNewCustomerForm(!showNewCustomerForm)} className="ml-2 flex-shrink-0 bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded">
                {showNewCustomerForm ? 'Cancel' : 'New Customer'}
              </button>
            </div>
          </div>

          {showNewCustomerForm && (
            <div className="p-4 border border-gray-200 rounded my-4">
              <h4 className="text-lg font-bold mb-2">Add New Customer</h4>
              <div>
                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-bold mb-2">Name</label>
                  <input type="text" value={newCustomerName} onChange={(e) => setNewCustomerName(e.target.value)} required className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" />
                </div>
                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-bold mb-2">Phone</label>
                  <input type="text" value={newCustomerPhone} onChange={(e) => setNewCustomerPhone(e.target.value)} className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" />
                </div>
                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-bold mb-2">Email</label>
                  <input type="email" value={newCustomerEmail} onChange={(e) => setNewCustomerEmail(e.target.value)} className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" />
                </div>
                <button type="button" onClick={handleAddNewCustomer} className="bg-gray-800 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded">Save Customer</button>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-gray-700 text-sm font-bold mb-2">Vehicle Type</label>
              <select value={selectedVehicleType} onChange={(e) => setSelectedVehicleType(e.target.value)} required className="shadow border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline">
                {vehicleTypes.map(vt => (
                  <option key={vt} value={vt}>{vt.replace('_', ' ')}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-gray-700 text-sm font-bold mb-2">Vehicle Make/Model</label>
              <input type="text" value={vehicleMakeModel} onChange={(e) => setVehicleMakeModel(e.target.value)} className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-gray-700 text-sm font-bold mb-2">Service / Item</label>
              <select value={selectedProductId} onChange={(e) => setSelectedProductId(e.target.value)} required className="shadow border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline">
                <option value="" disabled>Select a service or item</option>
                {products.map(product => (
                  <option key={product.id} value={product.id}>{product.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-gray-700 text-sm font-bold mb-2">Price (ZAR)</label>
              <input type="number" value={price} onChange={(e) => setPrice(e.target.value)} required className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline bg-gray-100" readOnly />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-gray-700 text-sm font-bold mb-2">Part Number</label>
              <input type="text" value={partNumber} onChange={(e) => setPartNumber(e.target.value)} className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" />
            </div>
            <div>
              <label className="block text-gray-700 text-sm font-bold mb-2">Serial Number</label>
              <input type="text" value={serialNumber} onChange={(e) => setSerialNumber(e.target.value)} className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" />
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2">Initial Condition / Complaint</label>
            <textarea value={initialCondition} onChange={(e) => setInitialCondition(e.target.value)} rows={3} className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"></textarea>
          </div>

          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2">Expected Completion Date</label>
            <input type="date" value={expectedCompletionDate} onChange={(e) => setExpectedCompletionDate(e.target.value)} className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" />
          </div>

          <div className="flex justify-end mt-5 gap-6">
            <button type="submit" className="bg-gray-800 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded ml-4">Book Job</button>
            <button type="button" onClick={onClose} className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BookJob;