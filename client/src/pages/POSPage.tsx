import React, { useState, useEffect } from 'react';
import CustomerSelection from '../components/pos/CustomerSelection';
import ProductSelection from '../components/pos/ProductSelection';
import Cart from '../components/pos/Cart';
import PaymentModal from '../components/pos/PaymentModal';
import Receipt from '../components/pos/Receipt';
import { getInventory, createSale, createPayment } from '../services/api';

const POSPage: React.FC = () => {
        const [products, setProducts] = useState<any[]>([]);
    const [cart, setCart] = useState<any[]>([]);
    const [selectedCustomer, setSelectedCustomer] = useState('');
    const [discount, setDiscount] = useState(0);
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');
    const [lastSale, setLastSale] = useState<any>(null);
    const [currentInvoiceId, setCurrentInvoiceId] = useState<number | null>(null);


    useEffect(() => {
        fetchProducts();
    }, []);

    const fetchProducts = async () => {
        try {
            const response = await getInventory();
            setProducts(response.data.data || []);
        } catch (err) {
            setError('Failed to fetch products');
        }
    };

    const addToCart = (productId: string) => {
        const product = products.find(p => p.id === parseInt(productId));
        if (!product) return;

        const existingItem = cart.find(item => item.id === product.id);
        if (existingItem) {
            setCart(cart.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item));
        } else {
            setCart([...cart, { ...product, quantity: 1 }]);
        }
    };

    const removeFromCart = (productId: number) => {
        setCart(cart.filter(item => item.id !== productId));
    };

    const updateQuantity = (productId: number, quantity: number) => {
        if (quantity <= 0) {
            removeFromCart(productId);
        } else {
            setCart(cart.map(item => item.id === productId ? { ...item, quantity } : item));
        }
    };

    const handleProceedToPayment = async () => {
        if (!selectedCustomer) {
            setError('Please select a customer.');
            return;
        }
        if (cart.length === 0) {
            setError('Cart is empty.');
            return;
        }
        setError('');

        const saleItems = cart.map(item => ({
            id: item.id,
            quantity: item.quantity,
        }));

        try {
            const response = await createSale({
                customerId: selectedCustomer,
                items: saleItems,
                discountAmount: discount,
                status: 'Unpaid',
            });
            
            const { id: saleId, invoiceId } = response.data.data;
            setCurrentInvoiceId(invoiceId);

            setMessage(`Sale ${saleId} created. Awaiting payment.`);
            setIsPaymentModalOpen(true);

        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to create sale.');
        }
    };

    const handlePaymentSuccess = async (payment: { amount: number; paymentMethod: string; type: string }) => {
        if (!currentInvoiceId) {
            setError('No invoice is currently being processed.');
            return;
        }
        try {
            await createPayment({
                invoiceId: currentInvoiceId,
                ...payment,
            });
            setMessage(`Payment for invoice ${currentInvoiceId} successful.`);
            setLastSale({ 
                invoiceId: currentInvoiceId, 
                saleItems: cart.map(item => ({...item, unitPrice: item.price})), 
                total: total * 100, 
                discount: discount * 100, 
                customerName: selectedCustomer 
            });
            // Optionally, you can refresh sale data here to update status
        } catch (err: any) {
            setError(err.response?.data?.message || 'Payment failed.');
        }
    };

    const handleModalClose = () => {
        setIsPaymentModalOpen(false);
        // Reset state for next sale
        setCart([]);
        setDiscount(0);
        setSelectedCustomer('');
        setCurrentInvoiceId(null);
        // Optionally, trigger a refresh of sales data or navigate
    };

    const handlePrint = () => {
        window.print();
    };

    const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const total = subtotal - discount;

    return (
        <div className="p-5">
            <div className="no-print">
                <h1 className="text-2xl font-bold mb-5">Point of Sale</h1>
                {error && <p className="bg-red-100 text-red-700 p-3 rounded mb-4">{error}</p>}
                {message &&
                    <div className="bg-green-100 text-green-700 p-3 rounded mb-4 flex justify-between items-center">
                        <span>{message}</span>
                        {lastSale && (
                            <button onClick={handlePrint} className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-1 px-3 rounded">Print Receipt</button>
                        )}
                    </div>}
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    <div className="md:col-span-1 bg-white p-5 rounded-lg shadow-md">
                        <CustomerSelection selectedCustomer={selectedCustomer} setSelectedCustomer={setSelectedCustomer} />
                        <ProductSelection addToCart={addToCart} />
                    </div>
                    <Cart cart={cart} updateQuantity={updateQuantity} removeFromCart={removeFromCart} />
                </div>

                <div className="flex justify-end items-center mt-5 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Discount (ZAR)</label>
                        <input
                            type="number"
                            value={discount}
                            onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                            className="w-32 px-2 py-1 border border-gray-300 rounded-md"
                        />
                    </div>
                    <div className="text-right">
                        <p className="text-gray-500">Subtotal: {(subtotal / 100).toFixed(2)}</p>
                        <p className="text-xl font-bold">Total: {(total / 100).toFixed(2)} ZAR</p>
                    </div>
                </div>
                <div className="flex justify-end mt-4">
                    <button onClick={handleProceedToPayment} className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded">
                        Proceed to Payment
                    </button>
                </div>

                {isPaymentModalOpen && currentInvoiceId && (
                    <PaymentModal
                        isOpen={isPaymentModalOpen}
                        onClose={handleModalClose}
                        balanceDue={total}
                        invoiceId={currentInvoiceId}
                        onPaymentSuccess={handlePaymentSuccess}
                    />
                )}
            </div>
            {/* This div is hidden from view but used for printing */}
            <div className="hidden print:block printable-area">
                {lastSale && <Receipt saleData={lastSale} />}
            </div>
        </div>
    );
};

export default POSPage;
