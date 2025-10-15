import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCustomers, createCustomer, getServiceItemParts, getInventory, createJob } from '../services/api';

// Interfaces
interface Customer {
  id: number;
  name: string;
  telephone: string;
  email?: string;
}

interface ServicePart {
  id: number;
  part_name: string;
  price: number;
  category: string;
  description: string;
}

interface InventoryItem {
    id: number;
    name: string;
    price: number;
    quantity: number;
}

const NewJobPage: React.FC = () => {
  // State Management
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [serviceParts, setServiceParts] = useState<ServicePart[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  
  // Form State
  const [jobType, setJobType] = useState(''); // VEHICLE or PART
  const [selectedCustomer, setSelectedCustomer] = useState('');
  const [selectedServicePartId, setSelectedServicePartId] = useState('');
  
  const [itemDescription, setItemDescription] = useState('');
  const [price, setPrice] = useState('');
  const [expectedCompletionDate, setExpectedCompletionDate] = useState('');
  const [initialCondition, setInitialCondition] = useState('');

  // Vehicle-specific state
  const [vehicleMake, setVehicleMake] = useState('');
  const [vehicleModel, setVehicleModel] = useState('');
  const [vehicleYear, setVehicleYear] = useState('');

  // Part-specific state
  const [partNumber, setPartNumber] = useState('');
  const [serialNumber, setSerialNumber] = useState('');

  // Inventory parts state
  const [partsUsed, setPartsUsed] = useState<any[]>([]);
  const [selectedInventoryId, setSelectedInventoryId] = useState('');
  const [quantityToAdd, setQuantityToAdd] = useState(1);
  
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // New Customer Form State
  const [showNewCustomerForm, setShowNewCustomerForm] = useState(false);
  const [newCustomerName, setNewCustomerName] = useState('');
  const [newCustomerPhone, setNewCustomerPhone] = useState('');
  const [newCustomerEmail, setNewCustomerEmail] = useState('');

  const navigate = useNavigate();

  // Data Fetching
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [customersRes, partsRes, inventoryRes] = await Promise.all([
            getCustomers(), 
            getServiceItemParts(),
            getInventory()
        ]);
        setCustomers(customersRes.data.data || []);
        setServiceParts(partsRes.data.data || []);
        setInventory(inventoryRes.data.data || []);
      } catch (err) {
        setError('Failed to fetch initial data.');
        console.error(err);
      }
    };
    fetchData();
  }, []);

  // Auto-calculate price and set description based on selected service part
  useEffect(() => {
    if (selectedServicePartId) {
      const part = serviceParts.find(p => p.id === parseInt(selectedServicePartId));
      if (part) {
        setPrice(part.price.toString());
        setItemDescription(part.description || ''); // Auto-fill the main description
      } else {
        setPrice('');
        setItemDescription('');
      }
    } else {
      setPrice('');
      setItemDescription('');
    }
  }, [selectedServicePartId, serviceParts]);

  const grandTotal = useMemo(() => {
    const mainServicePrice = parseFloat(price) || 0;
    const partsTotal = partsUsed.reduce((sum, part) => sum + (part.price * part.quantity), 0);
    return mainServicePrice + partsTotal;
  }, [price, partsUsed]);

  const selectedServicePart = useMemo(() => {
    return serviceParts.find(p => p.id === parseInt(selectedServicePartId));
  }, [selectedServicePartId, serviceParts]);

  // Handlers
  const handleAddNewCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!newCustomerName || !newCustomerPhone) {
        setError('Customer name and phone are required.');
        return;
    }
    try {
      const response = await createCustomer({ name: newCustomerName, telephone: newCustomerPhone, email: newCustomerEmail });
      const newCustomer = response.data.data;
      setCustomers([...customers, newCustomer]);
      setSelectedCustomer(newCustomer.id.toString());
      setShowNewCustomerForm(false);
      setNewCustomerName('');
      setNewCustomerPhone('');
      setNewCustomerEmail('');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to add customer');
    }
  };

  const handleAddPart = () => {
    if (!selectedInventoryId) return;
    const item = inventory.find(i => i.id === parseInt(selectedInventoryId));
    if (!item) return;

    const newPart = {
        id: item.id,
        name: item.name,
        quantity: quantityToAdd,
        price: item.price
    };

    setPartsUsed([...partsUsed, newPart]);
    setSelectedInventoryId('');
    setQuantityToAdd(1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!jobType || !selectedCustomer || !selectedServicePartId) {
      setError('Please select a Job Type, Customer, and Service/Item.');
      return;
    }
    setLoading(true);

    const jobData = { 
      customerId: selectedCustomer, 
      itemDescription: itemDescription,
      serviceDescription: selectedServicePart?.part_name,
      jobType: jobType, // Correctly set from state
      status: 'Booked',
      vehicleMake: jobType === 'VEHICLE' ? vehicleMake : '',
      vehicleModel: jobType === 'VEHICLE' ? vehicleModel : '',
      vehicleYear: jobType === 'VEHICLE' ? vehicleYear : '',
      partNumber: jobType === 'PART' ? partNumber : '',
      serialNumber: jobType === 'PART' ? serialNumber : '',
      servicePrice: price,
      conditionIn: initialCondition,
      dateBookedIn: new Date().toISOString().split('T')[0],
      dateExpectedOut: expectedCompletionDate,
      partsProcured: JSON.stringify(partsUsed) // Add the parts list as a JSON string
    };

    try {
      const response = await createJob(jobData);
      const newJobId = response.data.id;
      setLoading(false);
      navigate(`/jobs/${newJobId}`);
    } catch (err: any) {
      setLoading(false);
      setError(err.response?.data?.error || 'Failed to book job');
      console.error(err);
    }
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="bg-white p-5 rounded-lg shadow-lg w-full max-w-4xl mx-auto">
        <h2 className="text-2xl font-bold mb-4">Book New Job</h2>
        {error && <p className="text-red-500 p-3 bg-red-100 rounded-md mb-4">{error}</p>}
        
        <form onSubmit={handleSubmit} className="text-left space-y-6">
          
          <fieldset className="border p-4 rounded-md">
            <legend className="text-lg font-semibold px-2">Job Setup</legend>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2">Job Type*</label>
                <select value={jobType} onChange={(e) => setJobType(e.target.value)} required className="shadow-sm border rounded w-full py-2 px-3 text-gray-700">
                  <option value="" disabled>-- Select a job type --</option>
                  <option value="VEHICLE">Vehicle</option>
                  <option value="PART">Part</option>
                </select>
              </div>
              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2">Customer*</label>
                <div className="flex items-center">
                  <select value={selectedCustomer} onChange={(e) => { setSelectedCustomer(e.target.value); setShowNewCustomerForm(false); }} required className="flex-grow shadow-sm border rounded w-full py-2 px-3 text-gray-700">
                    <option value="" disabled>-- Select a customer --</option>
                    {customers.map(customer => (
                      <option key={customer.id} value={customer.id}>{customer.name} ({customer.telephone})</option>
                    ))}
                  </select>
                  <button type="button" onClick={() => setShowNewCustomerForm(!showNewCustomerForm)} className="ml-3 flex-shrink-0 bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-4 rounded">
                    {showNewCustomerForm ? 'Cancel' : 'New'}
                  </button>
                </div>
              </div>
            </div>
          </fieldset>

          {showNewCustomerForm && (
            <fieldset className="border p-4 rounded-md bg-gray-50">
                <legend className="text-lg font-semibold px-2">Add New Customer</legend>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div><label className="block text-sm font-bold mb-2">Name*</label><input type="text" value={newCustomerName} onChange={(e) => setNewCustomerName(e.target.value)} required className="shadow-sm border rounded w-full py-2 px-3" /></div>
                    <div><label className="block text-sm font-bold mb-2">Phone*</label><input type="text" value={newCustomerPhone} onChange={(e) => setNewCustomerPhone(e.target.value)} required className="shadow-sm border rounded w-full py-2 px-3" /></div>
                    <div><label className="block text-sm font-bold mb-2">Email</label><input type="email" value={newCustomerEmail} onChange={(e) => setNewCustomerEmail(e.target.value)} className="shadow-sm border rounded w-full py-2 px-3" /></div>
                </div>
                <div className="mt-4"><button type="button" onClick={handleAddNewCustomer} className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded">Save Customer</button></div>
            </fieldset>
          )}

          {jobType && (
            <>
              <fieldset className="border p-4 rounded-md">
                <legend className="text-lg font-semibold px-2">Item Details</legend>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-gray-700 text-sm font-bold mb-2">Service / Item*</label>
                    <select value={selectedServicePartId} onChange={(e) => setSelectedServicePartId(e.target.value)} required className="shadow-sm border rounded w-full py-2 px-3">
                      <option value="" disabled>-- Select a service --</option>
                      {serviceParts.map(part => (
                        <option key={part.id} value={part.id}>{part.part_name} ({part.category})</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-gray-700 text-sm font-bold mb-2">Price*</label>
                    <div className="relative">
                      <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">ZAR</span>
                      <input 
                        type="number" 
                        value={price} 
                        onChange={(e) => setPrice(e.target.value)} 
                        required 
                        className="shadow-sm border rounded w-full py-2 px-3 pl-12" 
                        placeholder="0.00"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-gray-700 text-sm font-bold mb-2">Overall Item Description</label>
                  <input type="text" value={itemDescription} onChange={(e) => setItemDescription(e.target.value)} className="shadow-sm border rounded w-full py-2 px-3" placeholder="e.g., White Toyota Hilux 2.4L" />
                </div>

                {jobType === 'VEHICLE' && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                    <div><label className="block text-sm font-bold mb-2">Vehicle Make</label><input type="text" value={vehicleMake} onChange={(e) => setVehicleMake(e.target.value)} className="shadow-sm border rounded w-full py-2 px-3" placeholder="e.g., Toyota"/></div>
                    <div><label className="block text-sm font-bold mb-2">Vehicle Model</label><input type="text" value={vehicleModel} onChange={(e) => setVehicleModel(e.target.value)} className="shadow-sm border rounded w-full py-2 px-3" placeholder="e.g., Hilux"/></div>
                    <div><label className="block text-sm font-bold mb-2">Vehicle Year</label><input type="text" value={vehicleYear} onChange={(e) => setVehicleYear(e.target.value)} className="shadow-sm border rounded w-full py-2 px-3" placeholder="e.g., 2019"/></div>
                  </div>
                )}

                {jobType === 'PART' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    <div><label className="block text-sm font-bold mb-2">Part Number</label><input type="text" value={partNumber} onChange={(e) => setPartNumber(e.target.value)} className="shadow-sm border rounded w-full py-2 px-3" /></div>
                    <div><label className="block text-sm font-bold mb-2">Serial Number</label><input type="text" value={serialNumber} onChange={(e) => setSerialNumber(e.target.value)} className="shadow-sm border rounded w-full py-2 px-3" /></div>
                  </div>
                )}
              </fieldset>

              <fieldset className="border p-4 rounded-md">
                <legend className="text-lg font-semibold px-2">Scheduling & Notes</legend>

                {/* Parts Used from Inventory Section */}
                <div className="pb-6 border-b">
                    <h3 className="text-md font-semibold mb-2">Parts Used from Inventory</h3>
                    <div className="grid grid-cols-3 gap-4 items-end">
                        <div className="col-span-2">
                            <label className="block text-sm font-bold mb-2">Part</label>
                            <select value={selectedInventoryId} onChange={(e) => setSelectedInventoryId(e.target.value)} className="shadow-sm border rounded w-full py-2 px-3">
                                <option value="" disabled>-- Select an inventory item --</option>
                                {inventory.map(item => (
                                    <option key={item.id} value={item.id}>{item.name} (Stock: {item.quantity})</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-bold mb-2">Quantity</label>
                            <input type="number" value={quantityToAdd} onChange={(e) => setQuantityToAdd(parseInt(e.target.value) || 1)} min="1" className="shadow-sm border rounded w-full py-2 px-3" />
                        </div>
                    </div>
                    <div className="mt-4 flex justify-end">
                        <button type="button" onClick={handleAddPart} className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded">Add Part</button>
                    </div>
                    {partsUsed.length > 0 && (
                        <div className="mt-4">
                            <h4 className="font-semibold mb-2">Selected Parts</h4>
                            <ul className="list-disc list-inside">
                                {partsUsed.map((part, index) => (
                                    <li key={index}>{part.name} (Qty: {part.quantity}) - @ {part.price.toFixed(2)} each</li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>

                <div className="mt-4">
                  <label className="block text-gray-700 text-sm font-bold mb-2">Initial Condition / Complaint</label>
                  <textarea value={initialCondition} onChange={(e) => setInitialCondition(e.target.value)} rows={3} className="shadow-sm border rounded w-full py-2 px-3"></textarea>
                </div>
                <div className="mt-4">
                  <label className="block text-gray-700 text-sm font-bold mb-2">Expected Completion Date</label>
                  <input type="date" value={expectedCompletionDate} onChange={(e) => setExpectedCompletionDate(e.target.value)} className="shadow-sm border rounded w-full py-2 px-3" />
                </div>
              </fieldset>

                <fieldset className="border p-4 rounded-md mt-6">
                    <legend className="text-lg font-semibold px-2">Job Summary</legend>
                    <table className="w-full text-sm text-left text-gray-500">
                        <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                            <tr>
                                <th scope="col" className="px-6 py-3">Description</th>
                                <th scope="col" className="px-6 py-3 text-right">Quantity</th>
                                <th scope="col" className="px-6 py-3 text-right">Unit Price</th>
                                <th scope="col" className="px-6 py-3 text-right">Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            {selectedServicePart && (
                                <tr className="bg-white border-b">
                                    <th scope="row" className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap">
                                        {selectedServicePart.part_name} (Service)
                                    </th>
                                    <td className="px-6 py-4 text-right">1</td>
                                    <td className="px-6 py-4 text-right">{parseFloat(price || '0').toFixed(2)}</td>
                                    <td className="px-6 py-4 text-right">{parseFloat(price || '0').toFixed(2)}</td>
                                </tr>
                            )}
                            {partsUsed.map((part, index) => (
                                <tr key={index} className="bg-white border-b">
                                    <th scope="row" className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap">
                                        {part.name}
                                    </th>
                                    <td className="px-6 py-4 text-right">{part.quantity}</td>
                                    <td className="px-6 py-4 text-right">{part.price.toFixed(2)}</td>
                                    <td className="px-6 py-4 text-right">{(part.quantity * part.price).toFixed(2)}</td>
                                </tr>
                            ))}
                        </tbody>
                        <tfoot>
                            <tr className="font-semibold text-gray-900">
                                <th scope="row" colSpan={3} className="px-6 py-3 text-base text-right">Grand Total</th>
                                <td className="px-6 py-3 text-base text-right">{grandTotal.toFixed(2)} ZAR</td>
                            </tr>
                        </tfoot>
                    </table>
                </fieldset>
            </>
          )}

          {/* Submission */}
          <div className="flex justify-end mt-6 gap-4">
            <button type="button" onClick={() => navigate('/jobs')} className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded">Cancel</button>
            <button type="submit" disabled={loading || !jobType} className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-6 rounded disabled:bg-gray-400">
                {loading ? 'Booking Job...' : 'Book Job'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NewJobPage;


