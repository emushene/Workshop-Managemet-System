import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getJob, getInventory, updateJob, getServiceItemPart, createInvoice } from '../services/api';

const JobDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [job, setJob] = useState<any>(null);
  const [inventory, setInventory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [note, setNote] = useState('');
  const [parts, setParts] = useState<any[]>([]);
  const [serviceItemPart, setServiceItemPart] = useState<any>(null);
  const [isCreatingInvoice, setIsCreatingInvoice] = useState(false);


  useEffect(() => {
    const fetchData = async () => {
      try {
        if (!id) return;
        setLoading(true);
        const jobResponse = await getJob(parseInt(id));
        setJob(jobResponse.data.data);
        const inventoryResponse = await getInventory();
        setInventory(inventoryResponse.data.data);
        if (jobResponse.data.data.partsProcured) {
          setParts(JSON.parse(jobResponse.data.data.partsProcured));
        }
        if (jobResponse.data.data.serviceItemPartId) {
          const serviceItemPartResponse = await getServiceItemPart(jobResponse.data.data.serviceItemPartId);
          setServiceItemPart(serviceItemPartResponse.data.data);
        }
      } catch (err) {
        setError('Failed to fetch data');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  const handleAddNote = async () => {
    if (!note) return;
    try {
      const newUpdates = JSON.stringify([...(job.updates ? JSON.parse(job.updates) : []), { date: new Date().toISOString(), note }]);
      const updatedJob = { ...job, updates: newUpdates };
      await updateJob(job.id, updatedJob);
      setJob(updatedJob);
      setNote('');
    } catch (err) {
      setError('Failed to add note');
    }
  };

  const handleAddPart = (part: any) => {
    const existingPart = parts.find(p => p.id === part.id);
    if (existingPart) {
      setParts(parts.map(p => p.id === part.id ? { ...p, quantity: p.quantity + 1 } : p));
    } else {
      setParts([...parts, { ...part, quantity: 1 }]);
    }
  };

  const handleUpdateParts = async () => {
    try {
      const updatedJob = { ...job, partsProcured: JSON.stringify(parts) };
      await updateJob(job.id, updatedJob);
      setJob(updatedJob);
    } catch (err) {
      setError('Failed to update parts');
    }
  };

  const handleCreateInvoice = async () => {
    setIsCreatingInvoice(true);
    setError('');
    try {
      // 1. Calculate total amount
      const serviceTotal = job.servicePrice || 0;
      const partsTotal = parts.reduce((sum, part) => sum + (part.price * part.quantity), 0);
      const totalAmount = serviceTotal + partsTotal;

      // 2. Create the invoice
      const response = await createInvoice({ jobId: job.id, totalAmount });
      const newInvoice = response.data.data;

      // 3. Update job status to 'Invoiced'
      await updateJob(job.id, { status: 'Invoiced' });

      // 4. Navigate to the new invoice page
      navigate(`/invoices/${newInvoice.id}`);

    } catch (err) {
        setError('Failed to create invoice. Please try again.');
        console.error(err);
    } finally {
        setIsCreatingInvoice(false);
    }
  };

  if (loading) return <div className="p-4">Loading...</div>;
  if (error) return <div className="p-4 text-red-500">{error}</div>;
  if (!job) return <div className="p-4">Job not found.</div>;

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Job Details - #{job.id}</h1>
        <div className="flex gap-2">
          <Link to={`/jobs/${id}/print`} className="bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600">
            Print Job Card
          </Link>
          {['Booked', 'In Progress', 'Completed'].includes(job.status) && (
            <button 
              onClick={handleCreateInvoice}
              disabled={isCreatingInvoice}
              className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 disabled:bg-blue-300"
            >
              {isCreatingInvoice ? 'Creating...' : 'Create Invoice'}
            </button>
          )}
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <div className="bg-white shadow-md rounded-lg p-6 mb-6">
            <h2 className="text-2xl font-bold mb-4">Job Information</h2>
            <p><strong>Customer:</strong> {job.customerName}</p>
            <p><strong>Item:</strong> {job.itemDescription}</p>
            <p><strong>Service:</strong> {job.serviceDescription}</p>
            {serviceItemPart && (
              <p><strong>Service Item Part:</strong> {serviceItemPart.part_name} ({serviceItemPart.category})</p>
            )}
            <p><strong>Status:</strong> {job.status}</p>
            <p><strong>Service Price:</strong> R{job.servicePrice.toFixed(2)}</p>
          </div>
          <div className="bg-white shadow-md rounded-lg p-6">
            <h2 className="text-2xl font-bold mb-4">Job Updates</h2>
            <div className="mb-4">
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                rows={3}
                placeholder="Add a new note..."
              ></textarea>
              <button onClick={handleAddNote} className="bg-blue-500 text-white px-4 py-2 rounded-md mt-2">Add Note</button>
            </div>
            <div>
              {job.updates && JSON.parse(job.updates).map((update: any, index: number) => (
                <div key={index} className="border-b py-2">
                  <p className="text-sm text-gray-500">{new Date(update.date).toLocaleString()}</p>
                  <p>{update.note}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div>
          <div className="bg-white shadow-md rounded-lg p-6">
            <h2 className="text-2xl font-bold mb-4">Parts Used</h2>
            <div className="mb-4">
              <select onChange={(e) => handleAddPart(inventory.find(i => i.id === parseInt(e.target.value)))} className="w-full px-3 py-2 border border-gray-300 rounded-md">
                <option>Select a part</option>
                {inventory.map(item => (
                  <option key={item.id} value={item.id}>{item.name}</option>
                ))}
              </select>
            </div>
            <ul>
              {parts.map(part => (
                <li key={part.id} className="flex justify-between items-center py-1">
                  <span>{part.name} x {part.quantity}</span>
                </li>
              ))}
            </ul>
            <button onClick={handleUpdateParts} className="bg-green-500 text-white px-4 py-2 rounded-md mt-4">Save Parts</button>
          </div>
        </div>
      </div>

    </div>
  );
};

export default JobDetailPage;
