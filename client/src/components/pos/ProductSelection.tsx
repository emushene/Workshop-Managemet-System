
import React, { useState, useEffect } from 'react';
import { getInventory } from '../../services/api';

interface ProductSelectionProps {
    addToCart: (productId: string) => void;
}

const ProductSelection: React.FC<ProductSelectionProps> = ({ addToCart }) => {
    const [products, setProducts] = useState<any[]>([]);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchProducts = async () => {
            try {
                const response = await getInventory();
                setProducts(response.data.data || []);
            } catch (err) {
                setError('Failed to fetch products');
            }
        };
        fetchProducts();
    }, []);

    return (
        <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700">Add Product to Cart</label>
            <select onChange={(e) => addToCart(e.target.value)} defaultValue="" className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500">
                <option value="" disabled>Select a product</option>
                {products.map(product => (
                    <option key={product.id} value={product.id}>{product.name}</option>
                ))}
            </select>
            {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
        </div>
    );
};

export default ProductSelection;
