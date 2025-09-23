'use client';

import { motion } from 'framer-motion';
import { GameState } from '../types';

interface GameStatsProps {
  gameState: GameState;
}

export const GameStats = ({ gameState }: GameStatsProps) => {
  const totalDebt = gameState.cards.reduce((sum, card) => sum + card.balance, 0);
  const highestInterestRate = Math.max(...gameState.cards.map(card => card.interestRate));
  const nextDueDate = Math.min(...gameState.cards.filter(card => card.balance > 0).map(card => card.dueDate));

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Game Stats</h2>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <motion.div
          className="bg-blue-50 p-4 rounded-lg"
          whileHover={{ scale: 1.02 }}
        >
          <div className="text-2xl font-bold text-blue-600">{gameState.currentDay}</div>
          <div className="text-sm text-gray-600">Days Played</div>
        </motion.div>

        <motion.div
          className="bg-green-50 p-4 rounded-lg"
          whileHover={{ scale: 1.02 }}
        >
          <div className="text-2xl font-bold text-green-600">${gameState.totalMoney.toFixed(0)}</div>
          <div className="text-sm text-gray-600">Available Money</div>
        </motion.div>

        <motion.div
          className="bg-red-50 p-4 rounded-lg"
          whileHover={{ scale: 1.02 }}
        >
          <div className="text-2xl font-bold text-red-600">${totalDebt.toFixed(0)}</div>
          <div className="text-sm text-gray-600">Total Debt</div>
        </motion.div>

        <motion.div
          className="bg-purple-50 p-4 rounded-lg"
          whileHover={{ scale: 1.02 }}
        >
          <div className="text-2xl font-bold text-purple-600">{highestInterestRate.toFixed(1)}%</div>
          <div className="text-sm text-gray-600">Highest Rate</div>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <motion.div
          className="bg-orange-50 p-4 rounded-lg"
          whileHover={{ scale: 1.02 }}
        >
          <div className="text-xl font-bold text-orange-600">${gameState.totalInterestPaid.toFixed(2)}</div>
          <div className="text-sm text-gray-600">Total Interest Paid</div>
        </motion.div>

        <motion.div
          className="bg-red-50 p-4 rounded-lg"
          whileHover={{ scale: 1.02 }}
        >
          <div className="text-xl font-bold text-red-600">${gameState.totalLateFees.toFixed(2)}</div>
          <div className="text-sm text-gray-600">Late Fees Paid</div>
        </motion.div>
      </div>

      {!gameState.gameComplete && (
        <div className="mt-6 p-4 bg-yellow-50 rounded-lg">
          <h3 className="font-semibold text-yellow-800 mb-2">💡 Strategy Tip</h3>
          <p className="text-sm text-yellow-700">
            Pay off the highest interest rate cards first to minimize total interest paid!
            Next due date is on the {nextDueDate}th of the month.
          </p>
        </div>
      )}
    </div>
  );
};