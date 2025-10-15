// ✅ Updated JobDetailPage with proper printing
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getJob, getInventory, updateJob, getServiceItemPart, createInvoice } from '../services/api';
import { useReactToPrint } from 'react-to-print';

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

  // 👇 Only the job card section will be printed
  const printRef = useRef<HTMLDivElement>(null);

  // Setup the print handler - Fixed: Use callback returning .current
  const handlePrint = useReactToPrint({
  content: () => printRef.current,  // Return the ref object as required by react-to-print types
  documentTitle: `JobCard-${id}`,
});

  // ✅ Wrap print click to ensure job is loaded
  const handlePrintClick = () => {
    if (!job || !printRef.current) {
      alert('Job data is still loading or print area not ready, please wait...');
      return;
    }
    handlePrint();
  };

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
      const newUpdates = JSON.stringify([
        ...(job.updates ? JSON.parse(job.updates) : []),
        { date: new Date().toISOString(), note }
      ]);
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
      const serviceTotal = job.servicePrice || 0;
      const partsTotal = parts.reduce((sum, part) => sum + (part.price * part.quantity), 0);
      const totalAmount = serviceTotal + partsTotal;

      const response = await createInvoice({ jobId: job.id, totalAmount });
      const newInvoice = response.data.data;

      await updateJob(job.id, { status: 'Invoiced' });
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
          {/* ✅ Print only the job card */}
          <button
            onClick={handlePrintClick}
            className="bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600"
          >
            Print Job Card
          </button>

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

      {/* 👇 Job card to print */}
      <div ref={printRef} className="bg-white shadow-md rounded-lg p-6 print:p-0 print:shadow-none">
        <h2 className="text-2xl font-bold mb-4">Job Card</h2>
        <p><strong>Customer:</strong> {job.customerName}</p>
        <p><strong>Item:</strong> {job.itemDescription}</p>
        <p><strong>Service:</strong> {job.serviceDescription}</p>
        {serviceItemPart && (
          <p><strong>Service Item Part:</strong> {serviceItemPart.part_name} ({serviceItemPart.category})</p>
        )}
        <p><strong>Status:</strong> {job.status}</p>
        <p><strong>Service Price:</strong> R{job.servicePrice.toFixed(2)}</p>
        <h3 className="text-xl mt-4 font-semibold">Parts Used</h3>
        {parts.length > 0 ? (
          <ul>
            {parts.map(part => (
              <li key={part.id}>{part.name} x {part.quantity}</li>
            ))}
          </ul>
        ) : (
          <p>No parts used.</p>
        )}
      </div>

      {/* Other UI remains visible on screen but NOT printed */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6 no-print">
        <div className="md:col-span-2">
          <div className="bg-white shadow-md rounded-lg p-6">
            <h2 className="text-2xl font-bold mb-4">Job Updates</h2>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              rows={3}
              placeholder="Add a new note..."
            ></textarea>
            <button onClick={handleAddNote} className="bg-blue-500 text-white px-4 py-2 rounded-md mt-2">
              Add Note
            </button>
          </div>
        </div>
        <div>
          <div className="bg-white shadow-md rounded-lg p-6">
            <h2 className="text-2xl font-bold mb-4">Parts Inventory</h2>
            <select onChange={(e) => handleAddPart(inventory.find(i => i.id === parseInt(e.target.value)))} className="w-full px-3 py-2 border border-gray-300 rounded-md">
              <option>Select a part</option>
              {inventory.map(item => (
                <option key={item.id} value={item.id}>{item.name}</option>
              ))}
            </select>
            <button onClick={handleUpdateParts} className="bg-green-500 text-white px-4 py-2 rounded-md mt-4">Save Parts</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default JobDetailPage;