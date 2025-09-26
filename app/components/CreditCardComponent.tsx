'use client';

import { motion } from 'framer-motion';
import { CreditCard } from '../types';

interface CreditCardComponentProps {
  card: CreditCard;
  isSelected?: boolean;
  onClick?: () => void;
  showDetails?: boolean;
  getCurrentBalance?: (card: CreditCard) => number;
}

export const CreditCardComponent = ({
  card,
  isSelected = false,
  onClick,
  showDetails = true,
  getCurrentBalance
}: CreditCardComponentProps) => {
  const currentBalance = getCurrentBalance ? getCurrentBalance(card) : Math.round(card.balance);
  const utilizationPercentage = (currentBalance / card.limit) * 100;

  // Simplified priority indicator for students
  const getPriorityLevel = () => {
    if (card.interestRate >= 20) return { level: 'HIGH', emoji: '🔥', color: 'text-red-600' };
    if (card.interestRate >= 15) return { level: 'MEDIUM', emoji: '⚠️', color: 'text-orange-600' };
    return { level: 'LOW', emoji: '✅', color: 'text-green-600' };
  };

  const priority = getPriorityLevel();

  return (
    <motion.div
      className={`
        relative w-full h-52 rounded-xl cursor-pointer
        shadow-lg hover:shadow-xl transition-all duration-300 mb-4
        ${isSelected ? 'ring-4 ring-blue-400' : ''}
      `}
      style={{
        background: `linear-gradient(135deg, ${card.color} 0%, ${card.color}dd 100%)`,
      }}
      whileHover={{ scale: 1.05, rotateY: 5 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Card Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-4 right-4 w-12 h-12 rounded-full bg-white" />
        <div className="absolute top-6 right-2 w-12 h-12 rounded-full bg-white" />
      </div>

      {/* Card Content */}
      <div className="relative p-6 h-full flex flex-col justify-between text-white">
        <div>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xl font-bold">{card.name}</h3>
            {/* Priority Badge */}
            <div className={`px-2 py-1 rounded-full bg-white/20 flex items-center space-x-1`}>
              <span>{priority.emoji}</span>
              <span className="text-xs font-bold">{priority.level}</span>
            </div>
          </div>
          <p className="text-sm opacity-90">Click to pay this card</p>
        </div>

        {showDetails && (
          <div className="space-y-3">
            {/* Most Important Info - Bigger and Clearer */}
            <div className="bg-white/10 rounded-lg p-3">
              <div className="text-center">
                <div className="text-sm opacity-90">You Owe</div>
                <div className="text-2xl font-bold">${currentBalance}</div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="text-center">
                <div className="opacity-90">Interest</div>
                <div className="font-bold text-lg">{card.interestRate}%</div>
              </div>
              <div className="text-center">
                <div className="opacity-90">Min Pay</div>
                <div className="font-bold text-lg">${card.minimumPayment}</div>
              </div>
            </div>

            {/* Simplified Progress Bar */}
            <div className="mt-3">
              <div className="text-xs opacity-90 mb-1">Debt Level</div>
              <div className="w-full bg-white/20 rounded-full h-3">
                <motion.div
                  className={`h-3 rounded-full ${
                    utilizationPercentage > 80 ? 'bg-red-400' :
                    utilizationPercentage > 60 ? 'bg-yellow-400' : 'bg-green-400'
                  }`}
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(utilizationPercentage, 100)}%` }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Selection Indicator */}
      {isSelected && (
        <motion.div
          className="absolute -top-2 -right-2 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
        >
          <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        </motion.div>
      )}
    </motion.div>
  );
};