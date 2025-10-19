import React, { useState, useMemo, useEffect } from 'react';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoiceId: number;
  balanceDue: number;
  onPaymentSuccess: (payment: { invoiceId: number; amount: number; paymentMethod: string; type: string }) => Promise<void>;
}

const PaymentModal: React.FC<PaymentModalProps> = ({ isOpen, onClose, invoiceId, balanceDue, onPaymentSuccess }) => {
  const [payments, setPayments] = useState<{ method: string; amount: number }[]>([]);
  const [currentMethod, setCurrentMethod] = useState('Cash');
  const [currentAmount, setCurrentAmount] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      setPayments([]);
      setCurrentAmount('');
    }
  }, [isOpen, balanceDue]);

  const totalPaid = useMemo(() => payments.reduce((acc, p) => acc + p.amount, 0), [payments]);
  const numericBalanceDue = Number(balanceDue) || 0;
  const remainingBalance = useMemo(() => numericBalanceDue - totalPaid, [numericBalanceDue, totalPaid]);
  const change = useMemo(() => (totalPaid > numericBalanceDue ? totalPaid - numericBalanceDue : 0), [numericBalanceDue, totalPaid]);

  const addPayment = () => {
    const amount = parseFloat(currentAmount);
    if (!amount || amount <= 0) return alert('Enter a valid amount');

    setPayments([...payments, { method: currentMethod, amount }]);
    setCurrentAmount('');
  };

  const handleFinalize = async () => {
    if (remainingBalance > 0) return alert('Remaining balance must be zero to finalize');
    try {
      for (const p of payments) {
        await onPaymentSuccess({
          invoiceId,
          amount: p.amount,
          paymentMethod: p.method,
          type: 'Full Payment',
        });
      }
      onClose();
    } catch (err: any) {
      console.error(err);
      alert('Payment failed');
    }
  };

  const handlePartialPayment = async () => {
    if (totalPaid <= 0) return alert('Add at least one payment');
    try {
      for (const p of payments) {
        await onPaymentSuccess({
          invoiceId,
          amount: p.amount,
          paymentMethod: p.method,
          type: 'Partial Payment',
        });
      }
      onClose();
    } catch (err: any) {
      console.error(err);
      alert('Partial payment failed');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 w-full h-full bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white p-5 rounded-lg shadow-lg w-full max-w-lg">
        <h2 className="text-2xl font-bold mb-4">Process Payment</h2>

        <div className="mb-4 p-4 bg-gray-100 rounded-lg">
          <div className="flex justify-between text-xl font-bold">
            <span>Total Due:</span>
            <span>{numericBalanceDue.toFixed(2)} ZAR</span>
          </div>
          <div className="flex justify-between text-lg text-green-600">
            <span>Total Paid:</span>
            <span>{totalPaid.toFixed(2)} ZAR</span>
          </div>
          {change > 0 && (
            <div className="flex justify-between text-lg text-blue-600 font-bold mt-2 border-t pt-2">
                <span>Change:</span>
                <span>{change.toFixed(2)} ZAR</span>
            </div>
          )}
          {remainingBalance > 0 && (
            <div className="flex justify-between text-lg font-semibold mt-2 border-t pt-2">
                <span>Remaining:</span>
                <span>{remainingBalance.toFixed(2)} ZAR</span>
            </div>
          )}
        </div>

        <div className="mb-4">
          <h3 className="text-lg font-bold mb-2">Payments Added</h3>
          {payments.length === 0 ? (
            <p className="text-gray-500">No payments added yet.</p>
          ) : (
            <ul className="list-disc list-inside">
              {payments.map((p, i) => (
                <li key={i}>
                  {p.method}: {p.amount.toFixed(2)} ZAR
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="flex items-end gap-4 mb-5 p-4 border rounded-lg">
          <div className="flex-grow">
            <label className="block text-sm font-medium text-gray-700">Payment Method</label>
            <select
              value={currentMethod}
              onChange={(e) => setCurrentMethod(e.target.value)}
              className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm"
            >
              <option>Cash</option>
              <option>Card</option>
            </select>
          </div>

          <div className="flex-grow">
            <label className="block text-sm font-medium text-gray-700">Amount (ZAR)</label>
            <input
              type="number"
              value={currentAmount}
              onChange={(e) => setCurrentAmount(e.target.value)}
              className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm"
            />
          </div>

          <button
            onClick={addPayment}
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          >
            Add Payment
          </button>
        </div>

        <div className="flex justify-between items-center mt-5">
          <div className="flex gap-4">
            <button onClick={onClose} className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded">
              Cancel
            </button>
            {totalPaid > 0 && remainingBalance > 0 && (
              <button
                onClick={handlePartialPayment}
                className="bg-orange-500 hover:bg-orange-600 text-white font-bold py-2 px-4 rounded"
              >
                Confirm Partial Payment
              </button>
            )}
            <button
              onClick={handleFinalize}
              disabled={remainingBalance > 0}
              className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Finalize Sale
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentModal;
