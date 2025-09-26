'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CreditCard } from '../types';

interface PaymentPanelProps {
  selectedCard: CreditCard | null;
  availableMoney: number;
  onPayment: (amount: number) => void;
  onClose: () => void;
}

export const PaymentPanel = ({
  selectedCard,
  availableMoney,
  onPayment,
  onClose
}: PaymentPanelProps) => {
  const [paymentAmount, setPaymentAmount] = useState('');

  if (!selectedCard) return null;

  const handlePayment = () => {
    const amount = parseFloat(paymentAmount);
    // Add small tolerance for floating point precision issues
    const tolerance = 0.01;
    if (amount > 0 && amount <= (availableMoney + tolerance) && amount <= (selectedCard.balance + tolerance)) {
      onPayment(amount);
      setPaymentAmount('');
      onClose();
    }
  };

  const minPayment = Math.min(selectedCard.minimumPayment, selectedCard.balance);

  const suggestedAmounts = [
    { label: 'Minimum', amount: minPayment },
    { label: 'Half Balance', amount: selectedCard.balance / 2 },
    { label: 'Full Balance', amount: selectedCard.balance },
    { label: 'All Money', amount: Math.min(availableMoney, selectedCard.balance) },
  ];

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          className="bg-white rounded-xl p-4 sm:p-6 max-w-md w-full mx-4 shadow-2xl max-h-screen overflow-y-auto"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.8, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
        >
          <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-3 sm:mb-4">
            Make Payment
          </h2>

          <div className="mb-3 sm:mb-4">
            <h3 className="text-base sm:text-lg font-semibold text-gray-700">{selectedCard.name}</h3>
            <p className="text-sm sm:text-base text-gray-600">Balance: ${selectedCard.balance.toFixed(2)}</p>
            <p className="text-sm sm:text-base text-gray-600">Available Money: ${availableMoney.toFixed(2)}</p>
          </div>

          <div className="mb-3 sm:mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Payment Amount
            </label>
            <input
              type="number"
              value={paymentAmount}
              onChange={(e) => setPaymentAmount(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base"
              placeholder="Enter amount"
              min="0"
              max={Math.min(availableMoney, selectedCard.balance)}
              step="0.01"
            />
          </div>

          <div className="mb-4 sm:mb-6">
            <p className="text-sm font-medium text-gray-700 mb-2">Quick Options:</p>
            <div className="grid grid-cols-2 gap-2">
              {suggestedAmounts.map((option) => (
                <motion.button
                  key={option.label}
                  className="p-2 sm:p-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-xs sm:text-sm"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setPaymentAmount(option.amount.toFixed(2))}
                  disabled={option.amount > availableMoney || option.amount > selectedCard.balance}
                >
                  <div className="font-semibold">{option.label}</div>
                  <div className="text-xs">${option.amount.toFixed(2)}</div>
                </motion.button>
              ))}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
            <motion.button
              className="flex-1 py-3 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition-colors text-sm sm:text-base"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onClose}
            >
              Cancel
            </motion.button>
            <motion.button
              className="flex-1 py-3 bg-blue-500 text-white rounded-lg font-semibold hover:bg-blue-600 transition-colors disabled:bg-gray-400 text-sm sm:text-base"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handlePayment}
              disabled={
                !paymentAmount ||
                parseFloat(paymentAmount) <= 0 ||
                parseFloat(paymentAmount) > (availableMoney + 0.01) ||
                parseFloat(paymentAmount) > (selectedCard.balance + 0.01)
              }
            >
              Make Payment
            </motion.button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};