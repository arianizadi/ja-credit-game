'use client';

import { motion } from 'framer-motion';
import { GameState } from '../types';
import { calculateEfficiencyScore } from '../utils/gameLogic';

interface ScoreBoardProps {
  gameState: GameState;
}

export const ScoreBoard = ({ gameState }: ScoreBoardProps) => {
  const efficiencyScore = calculateEfficiencyScore(gameState);
  const totalDebt = gameState.cards.reduce((sum, card) => sum + card.balance, 0);
  const initialDebt = 4500; // Sum of initial balances
  const debtPaidPercentage = ((initialDebt - totalDebt) / initialDebt) * 100;

  const getScoreColor = (score: number) => {
    if (score >= 800) return 'text-green-600';
    if (score >= 600) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreGrade = (score: number) => {
    if (score >= 900) return 'A+';
    if (score >= 800) return 'A';
    if (score >= 700) return 'B';
    if (score >= 600) return 'C';
    if (score >= 500) return 'D';
    return 'F';
  };

  return (
    <motion.div
      className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl shadow-lg p-6 border-2 border-blue-200"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold text-gray-800">Score Board</h2>
        <motion.div
          className={`text-4xl font-bold ${getScoreColor(efficiencyScore)}`}
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 2 }}
        >
          {getScoreGrade(efficiencyScore)}
        </motion.div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <motion.div
          className="text-center p-4 bg-white rounded-lg shadow"
          whileHover={{ scale: 1.05 }}
        >
          <div className={`text-3xl font-bold ${getScoreColor(efficiencyScore)}`}>
            {efficiencyScore.toFixed(0)}
          </div>
          <div className="text-sm text-gray-600">Efficiency Score</div>
        </motion.div>

        <motion.div
          className="text-center p-4 bg-white rounded-lg shadow"
          whileHover={{ scale: 1.05 }}
        >
          <div className="text-3xl font-bold text-blue-600">
            {debtPaidPercentage.toFixed(1)}%
          </div>
          <div className="text-sm text-gray-600">Debt Paid Off</div>
        </motion.div>

        <motion.div
          className="text-center p-4 bg-white rounded-lg shadow"
          whileHover={{ scale: 1.05 }}
        >
          <div className="text-3xl font-bold text-purple-600">
            {gameState.currentDay}
          </div>
          <div className="text-sm text-gray-600">Days Played</div>
        </motion.div>
      </div>

      {/* Progress Bar */}
      <div className="mb-4">
        <div className="flex justify-between text-sm text-gray-600 mb-2">
          <span>Debt Progress</span>
          <span>{debtPaidPercentage.toFixed(1)}% Complete</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3">
          <motion.div
            className="bg-gradient-to-r from-blue-500 to-purple-500 h-3 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${debtPaidPercentage}%` }}
            transition={{ duration: 1, ease: "easeOut" }}
          />
        </div>
      </div>

      {/* Performance Metrics */}
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div className="bg-white p-3 rounded-lg">
          <div className="font-semibold text-red-600">
            ${gameState.totalInterestPaid.toFixed(2)}
          </div>
          <div className="text-gray-600">Interest Paid</div>
        </div>

        <div className="bg-white p-3 rounded-lg">
          <div className="font-semibold text-orange-600">
            ${gameState.totalLateFees.toFixed(2)}
          </div>
          <div className="text-gray-600">Late Fees</div>
        </div>
      </div>

      {gameState.gameComplete && (
        <motion.div
          className="mt-4 p-4 bg-green-100 rounded-lg border-2 border-green-300"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <div className="text-center">
            <div className="text-2xl mb-2">🎉</div>
            <div className="font-bold text-green-800">Congratulations!</div>
            <div className="text-sm text-green-700">
              You've successfully paid off all your debt!
            </div>
            <div className="text-xs text-green-600 mt-1">
              Final Score: {efficiencyScore.toFixed(0)} ({getScoreGrade(efficiencyScore)})
            </div>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};