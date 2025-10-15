
import React, { useState, useEffect } from 'react';
import { getCustomers } from '../../services/api';

interface CustomerSelectionProps {
    selectedCustomer: string;
    setSelectedCustomer: (customerId: string) => void;
}

const CustomerSelection: React.FC<CustomerSelectionProps> = ({ selectedCustomer, setSelectedCustomer }) => {
    const [customers, setCustomers] = useState<any[]>([]);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchCustomers = async () => {
            try {
                const response = await getCustomers();
                setCustomers(response.data.data || []);
            } catch (err) {
                setError('Failed to fetch customers');
            }
        };
        fetchCustomers();
    }, []);

    return (
        <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700">Customer</label>
            <select value={selectedCustomer} onChange={(e) => setSelectedCustomer(e.target.value)} required className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500">
                <option value="" disabled>Select a customer</option>
                {customers.map(customer => (
                    <option key={customer.id} value={customer.id}>{customer.name}</option>
                ))}
            </select>
            {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
        </div>
    );
};

export default CustomerSelection;
