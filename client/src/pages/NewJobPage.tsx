import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCustomers, createCustomer, createJob, getVehicles } from '../services/api';
import { SERVICE_CATEGORIES, MISC_SERVICE } from '../constants';

// Interfaces
interface Customer {
  id: number;
  name: string;
  telephone: string;
  email?: string;
}

interface Vehicle {
  id: number;
  make: string;
  model: string;
}

interface SelectedService {
  id: number;
  category: string;
  instructions: string[];
  price: string; // Store price as a string for direct input control
}

const NewJobPage: React.FC = () => {
  // State Management
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  
  // Form State
  const [jobType, setJobType] = useState(''); // VEHICLE or PART
  const [selectedCustomer, setSelectedCustomer] = useState('');
  const [selectedServices, setSelectedServices] = useState<SelectedService[]>([]);
  const [selectedMake, setSelectedMake] = useState('');
  const [selectedModel, setSelectedModel] = useState('');
  const [selectedVehicleId, setSelectedVehicleId] = useState('');
  
  const [itemDescription, setItemDescription] = useState('');
  const [initialCondition, setInitialCondition] = useState('');

  // New Service selection state
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [instructions, setInstructions] = useState<Record<string, boolean>>({});
  const [miscInstruction, setMiscInstruction] = useState('');

  // Vehicle-specific state
  const [vehicleYear, setVehicleYear] = useState('');

  // Part-specific state
  const [partNumber, setPartNumber] = useState('');
  const [serialNumber, setSerialNumber] = useState('');
  
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
        const [customersRes, vehiclesRes] = await Promise.all([
            getCustomers(), 
            getVehicles()
        ]);
        setCustomers(customersRes.data.data || []);
        setVehicles(vehiclesRes.data.data || []);
      } catch (err) {
        setError('Failed to fetch initial data.');
        console.error(err);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    if (selectedMake && selectedModel) {
      const vehicle = vehicles.find(v => v.make === selectedMake && v.model === selectedModel);
      if (vehicle) {
        setSelectedVehicleId(vehicle.id.toString());
      }
    } else {
      setSelectedVehicleId('');
    }
  }, [selectedMake, selectedModel, vehicles]);

  useEffect(() => {
    const description = selectedServices
      .map(service => `${service.category}: ${service.instructions.join(', ')}`)
      .join('; ');
    setItemDescription(description);
  }, [selectedServices]);

  const makes = useMemo(() => [...new Set(vehicles.map(v => v.make))], [vehicles]);
  const models = useMemo(() => {
    if (!selectedMake) return [];
    return vehicles.filter(v => v.make === selectedMake).map(v => v.model);
  }, [selectedMake, vehicles]);

  const grandTotal = useMemo(() => {
    return selectedServices.reduce((sum, service) => sum + (parseFloat(service.price) || 0), 0);
  }, [selectedServices]);

  // Handlers
  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
    setInstructions({});
    setMiscInstruction('');
  };

  const handleInstructionChange = (instruction: string) => {
    setInstructions(prev => ({ ...prev, [instruction]: !prev[instruction] }));
  };

  const handleAddService = () => {
    if (!selectedCategory) return;

    const selectedInstructions = Object.entries(instructions)
      .filter(([, isSelected]) => isSelected)
      .map(([instruction]) => {
        if (instruction === MISC_SERVICE && miscInstruction) {
          return miscInstruction;
        }
        return instruction;
      });

    if (selectedInstructions.length === 0) {
      setError('Please select at least one instruction for the category.');
      return;
    }
    
    if (selectedServices.some(s => s.category === selectedCategory)) {
        setError(`Category "${selectedCategory}" has already been added.`);
        return;
    }

    const newService: SelectedService = {
      id: Date.now(),
      category: selectedCategory,
      instructions: selectedInstructions,
      price: '', // Default price to an empty string
    };

    setSelectedServices([...selectedServices, newService]);
    setSelectedCategory('');
    setInstructions({});
    setMiscInstruction('');
    setError('');
  };

  const handleRemoveService = (serviceId: number) => {
    setSelectedServices(selectedServices.filter(s => s.id !== serviceId));
  };

  const handleServicePriceChange = (serviceId: number, newPrice: string) => {
    // Allow only numbers and a single decimal point
    const sanitizedPrice = newPrice.replace(/[^\d.]/g, '');
    setSelectedServices(selectedServices.map(s => 
      s.id === serviceId ? { ...s, price: sanitizedPrice } : s
    ));
  };

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!jobType || !selectedCustomer || selectedServices.length === 0) {
      setError('Please select a Job Type, Customer, and at least one Service/Item.');
      return;
    }
    setLoading(true);

    const jobData = { 
      customerId: selectedCustomer, 
      itemDescription: itemDescription,
      jobType: jobType,
      status: 'Booked',
      vehicleId: selectedVehicleId,
      vehicleYear: vehicleYear,
      partNumber: jobType === 'PART' ? partNumber : '',
      serialNumber: jobType === 'PART' ? serialNumber : '',
      conditionIn: initialCondition,
      dateBookedIn: new Date().toISOString().split('T')[0],
      // Convert price string to cents for backend
      services: selectedServices.map(({ category, instructions, price }) => ({
        category,
        instructions,
        price: Math.round((parseFloat(price) || 0) * 100),
      }))
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
                
                <div className="bg-gray-50 p-4 rounded-md grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Column 1: Category Selection */}
                  <div>
                    <label className="block text-gray-700 text-sm font-bold mb-2">Service Category*</label>
                    <select value={selectedCategory} onChange={(e) => handleCategoryChange(e.target.value)} className="shadow-sm border rounded w-full py-2 px-3">
                      <option value="" disabled>-- Select a category --</option>
                      {Object.keys(SERVICE_CATEGORIES).map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>

                  {/* Column 2: Instructions */}
                  <div>
                    {selectedCategory && (
                      <>
                        <label className="block text-gray-700 text-sm font-bold mb-2">Instructions for Technician*</label>
                        <div className="border p-3 rounded-md bg-white">
                          {(SERVICE_CATEGORIES[selectedCategory as keyof typeof SERVICE_CATEGORIES] || []).map(instruction => (
                            <div key={instruction} className="flex items-center my-2">
                              <input
                                type="checkbox"
                                id={`instr-${instruction}`}
                                checked={!!instructions[instruction]}
                                onChange={() => handleInstructionChange(instruction)}
                                className="mr-2"
                              />
                              <label htmlFor={`instr-${instruction}`}>{instruction}</label>
                              {instruction === MISC_SERVICE && instructions[MISC_SERVICE] && (
                                <input
                                  type="text"
                                  value={miscInstruction}
                                  onChange={(e) => setMiscInstruction(e.target.value)}
                                  className="ml-4 shadow-sm border rounded py-1 px-2 flex-grow"
                                  placeholder="Describe miscellaneous work..."
                                />
                              )}
                            </div>
                          ))}
                        </div>
                        <button type="button" onClick={handleAddService} className="mt-4 bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded">
                          Add Service Category
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {selectedServices.length > 0 && (
                  <div className="my-6">
                    <h4 className="font-semibold mb-2 text-lg">Job Items</h4>
                    <ul className="space-y-3">
                      {selectedServices.map(service => (
                        <li key={service.id} className="bg-white shadow-sm border rounded-lg p-4">
                          <div className="flex justify-between items-start">
                            <div>
                                <h5 className="font-bold text-lg">{service.category}</h5>
                                <p className="text-sm text-gray-600">
                                    Instructions: {service.instructions.join(', ')}
                                </p>
                            </div>
                            <div className="flex items-center">
                                <span className="mr-2 font-bold">R</span>
                                <input 
                                  type="text"
                                  value={service.price}
                                  onChange={(e) => handleServicePriceChange(service.id, e.target.value)}
                                  className="shadow-sm border rounded w-32 py-1 px-2 text-gray-700 text-right"
                                  placeholder="0.00"
                                />
                                <button type="button" onClick={() => handleRemoveService(service.id)} className="ml-4 text-red-500 hover:text-red-700 font-semibold">Remove</button>
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div>
                  <label className="block text-gray-700 text-sm font-bold mb-2 mt-6">Overall Item Description</label>
                  <input type="text" value={itemDescription} readOnly className="shadow-sm border rounded w-full py-2 px-3 bg-gray-100" placeholder="Generated from selected job items..." />
                </div>

                {(jobType === 'VEHICLE' || jobType === 'PART') && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                    <div>
                      <label className="block text-sm font-bold mb-2">Vehicle Make</label>
                      <select value={selectedMake} onChange={(e) => { setSelectedMake(e.target.value); setSelectedModel(''); }} className="shadow-sm border rounded w-full py-2 px-3">
                        <option value="" disabled>-- Select a make --</option>
                        {makes.map(make => (
                          <option key={make} value={make}>{make}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-bold mb-2">Vehicle Model</label>
                      <select value={selectedModel} onChange={(e) => setSelectedModel(e.target.value)} className="shadow-sm border rounded w-full py-2 px-3" disabled={!selectedMake}>
                        <option value="" disabled>-- Select a model --</option>
                        {models.map(model => (
                          <option key={model} value={model}>{model}</option>
                        ))}
                      </select>
                    </div>
                    <div><label className="block text-sm font-bold mb-2">Vehicle Year</label><input type="text" value={vehicleYear} onChange={(e) => setVehicleYear(e.target.value)} className="shadow-sm border rounded w-full py-2 px-3" placeholder="e.g., 2019"/></div>
                  </div>
                )}

                {jobType === 'PART' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    <div><label className="block text-sm font-bold mb-2">Part Number</label><input type="text" value={partNumber} onChange={(e) => setPartNumber(e.target.value)} className="shadow-sm border rounded w-full py-2 px-3" /></div>
                    <div><label className="block text-sm font-bold mb-2">Engine Number</label><input type="text" value={serialNumber} onChange={(e) => setSerialNumber(e.target.value)} className="shadow-sm border rounded w-full py-2 px-3" /></div>
                  </div>
                )}
              </fieldset>

              <fieldset className="border p-4 rounded-md">
                <legend className="text-lg font-semibold px-2">Scheduling & Notes</legend>
                <div className="mt-4">
                  <label className="block text-gray-700 text-sm font-bold mb-2">Initial Condition / Complaint</label>
                  <textarea value={initialCondition} onChange={(e) => setInitialCondition(e.target.value)} rows={3} className="shadow-sm border rounded w-full py-2 px-3"></textarea>
                </div>
              </fieldset>

                <fieldset className="border p-4 rounded-md mt-6">
                    <legend className="text-lg font-semibold px-2">Job Summary</legend>
                    <table className="w-full text-sm text-left text-gray-500">
                        <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                            <tr>
                                <th scope="col" className="px-6 py-3">Item/Category</th>
                                <th scope="col" className="px-6 py-3">Instructions</th>
                                <th scope="col" className="px-6 py-3 text-right">Price</th>
                            </tr>
                        </thead>
                        <tbody>
                            {selectedServices.map((service) => (
                                <tr key={service.id} className="bg-white border-b">
                                    <th scope="row" className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap">
                                        {service.category}
                                    </th>
                                    <td className="px-6 py-4">{service.instructions.join(', ')}</td>
                                    <td className="px-6 py-4 text-right">{(parseFloat(service.price) || 0).toFixed(2)}</td>
                                </tr>
                            ))}
                        </tbody>
                        <tfoot>
                            <tr className="font-semibold text-gray-900">
                                <th scope="row" colSpan={2} className="px-6 py-3 text-base text-right">Grand Total</th>
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