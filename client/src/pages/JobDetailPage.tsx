import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getJob, updateJob, createInvoice } from '../services/api';

const JobDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [job, setJob] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [note, setNote] = useState('');
  const [isCreatingInvoice, setIsCreatingInvoice] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (!id) return;
        setLoading(true);
        const jobResponse = await getJob(parseInt(id));
        setJob(jobResponse.data.data);
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

  const handleCreateInvoice = async () => {
    setIsCreatingInvoice(true);
    setError('');
    try {
      const totalAmount = job.services.reduce((sum: number, service: any) => sum + service.price, 0);
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
            {job.vehicleMake && <p><strong>Vehicle:</strong> {job.vehicleMake} {job.vehicleModel} ({job.vehicleYear})</p>}
            <p><strong>Status:</strong> {job.status}</p>
            <h3 className="text-xl font-bold mt-4 mb-2">Services</h3>
            <ul className="list-disc list-inside">
              {job.services && job.services.map((service: any, index: number) => (
                <li key={index}>{service.part_name} - R{service.price.toFixed(2)}</li>
              ))}
            </ul>
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
          {/* Further details can be added here */}
        </div>
      </div>

    </div>
  );
};

export default JobDetailPage;