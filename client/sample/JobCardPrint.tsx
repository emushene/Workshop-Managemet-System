import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams } from 'react-router-dom';
import api from '../api';
import { Job, Product, JobPart } from '../types';
import { useReactToPrint } from 'react-to-print';
// import './JobCardPrint.css'; // No longer needed

interface JobCardPrintProps {}

const JobCardPrint: React.FC<JobCardPrintProps> = () => {
  const { id } = useParams<{ id: string }>();
  const [job, setJob] = useState<Job | null>(null);
  const [error, setError] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState('');
  const [quantityToAdd, setQuantityToAdd] = useState(1);
  const [addPartError, setAddPartError] = useState('');

  const componentRef = useRef<HTMLDivElement>(null);
  const handlePrint = useReactToPrint({
    content: () => componentRef.current,
    pageStyle: `
      @page {
        size: 80mm auto;
        margin: 0;
      }
      body {
        width: 80mm;
        margin: 0;
        font-family: monospace;
        font-size: 10px;
      }
      /* Hide elements not needed for print */
      .no-print {
        display: none;
      }
    `,
  });

  const fetchJobDetails = useCallback(async () => {
    try {
      const jobResponse = await api.get(`/api/jobs/${id}`);
      const fetchedJob: Job = jobResponse.data.data;

      let customer = { name: 'N/A', phone: 'N/A', email: 'N/A' };
      if (fetchedJob.customerId) {
        try {
          const customerResponse = await api.get(`/api/customers/${fetchedJob.customerId}`);
          customer = customerResponse.data.data;
        } catch (customerError) {
          console.error('Could not fetch customer details', customerError);
          // Keep default N/A values if customer fetch fails
        }
      }

      const jobPartsResponse = await api.get(`/api/jobs/${id}/parts`);

      setJob({
        ...fetchedJob,
        customerName: customer.name,
        customerPhone: customer.phone,
        customerEmail: customer.email,
        parts: jobPartsResponse.data.data,
      });

    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch job details');
    }
  }, [id]);

  useEffect(() => {
    fetchJobDetails();

    const fetchProducts = async () => {
      try {
        const response = await api.get('/api/products');
        setProducts(response.data.data || []);
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to fetch products');
      }
    };
    fetchProducts();
  }, [fetchJobDetails]);

  const handleAddPartToJob = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddPartError('');

    if (!selectedProduct || quantityToAdd <= 0) {
      setAddPartError('Please select a product and enter a valid quantity.');
      return;
    }

    const product = products.find(p => p.id === parseInt(selectedProduct));
    if (!product) {
      setAddPartError('Selected product not found.');
      return;
    }

    try {
      // Assuming defaultServicingPrice is used for job parts
      await api.post(`/api/jobs/${id}/parts`, {
        productId: parseInt(selectedProduct),
        quantityUsed: quantityToAdd,
        unitPriceAtTimeOfUse: (() => {
          // Get the first available price (servicingPrice or sellingPrice)
          const priceObj = product.prices && Object.values(product.prices)[0];
          return priceObj?.servicingPrice ?? priceObj?.sellingPrice ?? 0;
        })(), // Use product price
      });
      fetchJobDetails();
      setSelectedProduct('');
      setQuantityToAdd(1);
    } catch (err: any) {
      setAddPartError(err.response?.data?.message || 'Failed to add part to job');
    }
  };

  if (error) {
    return <p className="p-5 text-red-500">{error}</p>;
  }

  if (!job) {
    return <p className="p-5">Loading job card...</p>;
  }

  return (
    <div className="p-5">
      <div className="no-print flex justify-end mb-4">
        <button onClick={handlePrint} className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
          Print Job Card
        </button>
      </div>
      <div ref={componentRef} className="bg-white p-8 mx-auto shadow-md print:p-0 print:shadow-none" style={{ maxWidth: '80mm', fontFamily: 'monospace', fontSize: '10px' }}>
        <div className="text-center mb-4">
          <h1 className="text-lg font-bold">Job Card #{job.id}</h1>
          <div className="text-xs">
            <strong>Galaxy Engineering</strong><br />
            12 Main Str<br />
            Johannesburg, Gauteng, 2005
          </div>
        </div>

        <div className="mb-4 border-b border-dashed pb-2">
          <h3 className="font-bold text-xs mb-1">Customer Details</h3>
          <p className="text-xs"><strong>Name:</strong> {job.customerName}</p>
          <p className="text-xs"><strong>Phone:</strong> {job.customerPhone}</p>
          <p className="text-xs"><strong>Email:</strong> {job.customerEmail}</p>
        </div>

        <div className="mb-4 border-b border-dashed pb-2">
          <h3 className="font-bold text-xs mb-1">Job Details</h3>
          <p className="text-xs"><strong>Service:</strong> {job.service}</p>
          <p className="text-xs"><strong>Status:</strong> {job.status}</p>
          <p className="text-xs"><strong>Price:</strong> R {job.price ? job.price.toFixed(2) : 'N/A'}</p>
          <p className="text-xs"><strong>Date Booked:</strong> {new Date(job.createdAt).toLocaleDateString()}</p>
          {job.expectedCompletionDate && <p className="text-xs"><strong>Expected Completion:</strong> {new Date(job.expectedCompletionDate).toLocaleDateString()}</p>}
          {job.vehicleMakeModel && <p className="text-xs"><strong>Vehicle Make/Model:</strong> {job.vehicleMakeModel}</p>}
          {job.partNumber && <p className="text-xs"><strong>Part Number:</strong> {job.partNumber}</p>}
          {job.serialNumber && <p className="text-xs"><strong>Serial Number:</strong> {job.serialNumber}</p>}
        </div>

        <div className="mb-4 border-b border-dashed pb-2">
          <h3 className="font-bold text-xs mb-1">Initial Condition / Complaint</h3>
          <p className="text-xs">{job.initialCondition || 'N/A'}</p>
        </div>

        <div className="mb-4 border-b border-dashed pb-2">
          <h3 className="font-bold text-xs mb-1">Parts Used:</h3>
          {job.parts && job.parts.length > 0 ? (
            <table className="w-full text-xs">
              <thead>
                <tr>
                  <th className="text-left">Item</th>
                  <th className="text-right">Qty</th>
                  <th className="text-right">Price</th>
                  <th className="text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {job.parts.map((part, index) => (
                  <tr key={index}>
                    <td>{part.productName}</td>
                    <td className="text-right">{part.quantityUsed}</td>
                    <td className="text-right">{part.unitPriceAtTimeOfUse.toFixed(2)}</td>
                    <td className="text-right">{part.totalPrice.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="text-xs">No parts added yet.</p>
          )}
        </div>

        <div className="mb-4 border-b border-dashed pb-2">
          <h3 className="font-bold text-xs mb-1">Technician Notes:</h3>
          {/* Placeholder for technician notes */}
          <p className="text-xs">____________________________________</p>
          <p className="text-xs">____________________________________</p>
        </div>

        <div className="text-center mt-4">
          <p className="text-xs">Thank you for your business!</p>
        </div>
      </div>

      {/* Add Part Form - No Print */}
      <div className="no-print bg-white p-5 rounded-lg shadow-md mt-5">
        <h3 className="text-xl font-bold mb-4">Add Parts to Job</h3>
        {addPartError && <p className="bg-red-100 text-red-700 p-3 rounded mb-4">{addPartError}</p>}
        <form onSubmit={handleAddPartToJob} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Product</label>
            <select value={selectedProduct} onChange={(e) => setSelectedProduct(e.target.value)} required className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500">
              <option value="" disabled>Select a product</option>
              {products.map(product => (
                <option key={product.id} value={product.id}>
                  {product.name} (Stock: {product.currentStock})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Quantity</label>
            <input 
              type="number" 
              value={quantityToAdd} 
              onChange={(e) => setQuantityToAdd(parseInt(e.target.value))}
              min="1" 
              required 
              className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          <div className="md:col-span-2 flex justify-end">
            <button type="submit" className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">Add Part</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default JobCardPrint;