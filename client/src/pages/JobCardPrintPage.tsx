import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { getJob, getInventory, updateJob } from '../services/api';


import logo from '../images/logo.png';

const JobCardPrintPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const [job, setJob] = useState<any | null>(null);
    const [error, setError] = useState('');
    const [products, setProducts] = useState<any[]>([]);
    const [selectedProduct, setSelectedProduct] = useState('');
    const [quantityToAdd, setQuantityToAdd] = useState(1);
    const [addPartError, setAddPartError] = useState('');

    // Automatically print when the component has loaded the job data
    useEffect(() => {
        if (job) {
            console.log('Printing job:', job);
            // We add a small timeout to allow content to render before printing
            setTimeout(() => {
                window.print();
            }, 500);
        }
    }, [job]);

    const fetchJobDetails = useCallback(async () => {
        try {
            if (!id) return;
            const jobResponse = await getJob(parseInt(id));
            const fetchedJob: any = jobResponse.data.data;
            setJob(fetchedJob);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to fetch job details');
        }
    }, [id]);

    useEffect(() => {
        fetchJobDetails();

        const fetchProducts = async () => {
            try {
                const response = await getInventory();
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
            const newPart = {
                id: product.id,
                name: product.name,
                quantity: quantityToAdd,
                price: product.price,
            };

            const existingParts = job.partsProcured ? JSON.parse(job.partsProcured) : [];
            const updatedParts = [...existingParts, newPart];

            await updateJob(job.id, { ...job, partsProcured: JSON.stringify(updatedParts) });

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

    const parts: any[] = []; // Initialize as empty array
    if (job.partsProcured) {
        try {
            const parsed = JSON.parse(job.partsProcured);
            if (Array.isArray(parsed)) {
                parts.push(...parsed);
            }
        } catch (parseError) {
            console.error("Failed to parse partsProcured:", parseError);
        }
    }

    return (
        <div className="p-5 print-preview-page">
            <div className="printable-area bg-white p-8 mx-auto shadow-md print:p-1 print:shadow-none" style={{ width: '80mm', fontFamily: 'monospace', padding: '10px' }}>
                <div className="text-center mb-4">
                    <img src={logo} alt="Company Logo" style={{ width: '100px', margin: '0 auto' }} />
                    <h2 style={{ textAlign: 'center', margin: '0' }}>DA MASIH MOTOR ENGINEERING</h2>
                    <p style={{ textAlign: 'center', margin: '0' }}>409 Rotweiller Road, Mayibuye-Tembisa</p>
                    <p style={{ textAlign: 'center', margin: '0' }}>Tel: 081 527 6080</p>
                    <p style={{ textAlign: 'center', margin: '0' }}>Tel: 010 335 0492</p>
                    <p style={{ textAlign: 'center', margin: '0' }}>www.masihmotoreng.co.za</p>
                    <hr style={{ borderTop: '1px dashed black', margin: '10px 0' }} />
                    <h1 className="text-lg font-bold">Job Card #{job.id}</h1>
                </div>

                <div className="mb-4 border-b border-dashed pb-2">
                    <h3 className="font-bold text-xs mb-1">Customer Details</h3>
                    <p className="text-xs"><strong>Name:</strong> {job.customerName}</p>
                </div>

                <div className="mb-4 border-b border-dashed pb-2">
                    <h3 className="font-bold text-xs mb-1">Job Details</h3>
                    <p className="text-xs"><strong>Service:</strong> {job.services?.map((s: any) => s.part_name).join(', ')}</p>
                    <p className="text-xs"><strong>Status:</strong> {job.status}</p>
                    
                    <p className="text-xs"><strong>Date Booked:</strong> {new Date(job.dateBookedIn).toLocaleDateString()}</p>
                    {job.dateExpectedOut && <p className="text-xs"><strong>Expected Completion:</strong> {new Date(job.dateExpectedOut).toLocaleDateString()}</p>}
                    {job.vehicleMake && <p className="text-xs"><strong>Vehicle Make:</strong> {job.vehicleMake}</p>}
                    {job.vehicleModel && <p className="text-xs"><strong>Vehicle Model:</strong> {job.vehicleModel}</p>}
                    {job.vehicleYear && <p className="text-xs"><strong>Vehicle Year:</strong> {job.vehicleYear}</p>}
                    {job.partNumber && <p className="text-xs"><strong>Part Number:</strong> {job.partNumber}</p>}
                    {job.serialNumber && <p className="text-xs"><strong>Serial Number:</strong> {job.serialNumber}</p>}
                    {job.itemDescription && <p className="text-xs"><strong>Description:</strong> {job.itemDescription}</p>}
                </div>

                <div className="mb-4 border-b border-dashed pb-2">
                    <h3 className="font-bold text-xs mb-1">Initial Condition / Complaint</h3>
                    <p className="text-xs">{job.conditionIn || 'N/A'}</p>
                </div>

                <div className="mb-4 border-b border-dashed pb-2">
                    <h3 className="font-bold text-xs mb-1">Services:</h3>
                    {job.services && job.services.length > 0 ? (
                        <table style={{ width: '100%', fontSize: '12px' }}>
                            <thead>
                                <tr>
                                    <th style={{ textAlign: 'left' }}>Service</th>
                                    <th style={{ textAlign: 'right' }}>Price</th>
                                </tr>
                            </thead>
                            <tbody>
                                {job.services.map((service: any, index: number) => (
                                    <tr key={index}>
                                        <td>{service.part_name}</td>
                                        <td style={{ textAlign: 'right' }}>{service.price ? service.price.toFixed(2) : 'N/A'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        <p className="text-xs">No services added yet.</p>
                    )}
                </div>

                <div className="mb-4 border-b border-dashed pb-2">
                    <h3 className="font-bold text-xs mb-1">Technician Notes:</h3>
                    <p className="text-xs">{job.technicianNotes || 'N/A'}</p>
                </div>

                <div style={{ textAlign: 'center', marginTop: '20px' }}>
                    <p style={{ textAlign: 'center', marginTop: '20px', textDecoration: 'bold' }}>TERMS & CONDITIONS</p>
                    <p style={{ marginTop: '2px' }}>1. 3 Months warranty for each and everyjob, excluding the Crankshaft & Overheatings.</p>
                    <p style={{ marginTop: '2px' }}>2. After 3 Months the company is not responsible for any goods!</p>
                    <p style={{ marginTop: '2px' }}>3. After 3 months the company has the right to sell unclaimed finished work to cover the loss</p>
                    <br />
                    <br />
                    <br />
                    <p style={{ textAlign: 'center', marginTop: '20px' }}>Customer Signature ...........................</p>
                    <p style={{ textAlign: 'center', marginTop: '20px' }}>Thank you for your business!</p>
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
                                    {product.name} (Stock: {product.quantity})
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

export default JobCardPrintPage;
