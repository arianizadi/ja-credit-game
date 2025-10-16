'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GameState, PaymentLogEntry } from '../types';

interface EndGameScreenProps {
  gameState: GameState;
  onPlayAgain: () => void;
  onClose: () => void;
}

// Analyze player's payment strategy and patterns
const analyzePlayerStrategy = (gameState: GameState) => {
  console.log(`🎯 FINAL GAME ANALYSIS`);
  console.log(`Player completed game on day ${gameState.currentDay} (${Math.ceil(gameState.currentDay / 30)} months)`);
  console.log(`Total interest paid: $${gameState.totalInterestPaid}`);
  console.log(`Total late fees: $${gameState.totalLateFees}`);
  console.log(`Payment log entries: ${gameState.paymentLog.length}`);

  const actualMonths = Math.ceil(gameState.currentDay / 30);
  const totalPayments = gameState.paymentLog.reduce((sum, p) => sum + p.amount, 0);

  // Analyze payment distribution by card
  const paymentsByCard = new Map();
  gameState.paymentLog.forEach(payment => {
    const existing = paymentsByCard.get(payment.cardId) || { total: 0, count: 0 };
    paymentsByCard.set(payment.cardId, {
      total: existing.total + payment.amount,
      count: existing.count + 1
    });
  });

  // Check if player followed avalanche method
  const cardsByRate = [...gameState.cards].sort((a, b) => b.interestRate - a.interestRate);
  const highestRateCard = cardsByRate[0];
  const lowestRateCard = cardsByRate[cardsByRate.length - 1];

  const paymentsToHighestRate = paymentsByCard.get(highestRateCard.id)?.total || 0;
  const paymentsToLowestRate = paymentsByCard.get(lowestRateCard.id)?.total || 0;
  const avalancheRatio = totalPayments > 0 ? paymentsToHighestRate / totalPayments : 0;

  const mistakes = [];
  if (avalancheRatio < 0.4) {
    mistakes.push(`Should have focused more on ${highestRateCard.name} (${highestRateCard.interestRate}% APR) - the highest rate card`);
  }

  if (gameState.totalLateFees > 0) {
    const missedPayments = Math.round(gameState.totalLateFees / 35);
    mistakes.push(`Missed ${missedPayments} minimum payment${missedPayments > 1 ? 's' : ''} resulting in $${gameState.totalLateFees.toFixed(0)} in late fees`);
  }

  if (paymentsToLowestRate > paymentsToHighestRate && paymentsToLowestRate > 100) {
    mistakes.push(`Paid more to ${lowestRateCard.name} (${lowestRateCard.interestRate}% APR) than ${highestRateCard.name} (${highestRateCard.interestRate}% APR)`);
  }

  return {
    avalancheRatio,
    mistakes,
    actualMonths,
    paymentsByCard,
    totalPayments,
    cardsByRate,
  };
};

// Progress Graph Component
const ProgressGraph = ({ dailySnapshots }: { dailySnapshots: any[] }) => {
  const maxBalance = Math.max(...dailySnapshots.map(s => s.totalBalance));
  const maxDay = Math.max(...dailySnapshots.map(s => s.day));

  return (
    <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
      <h3 className="text-xl font-bold text-white mb-4 text-center">📈 Debt Payoff Progress</h3>

      {/* Graph Container */}
      <div className="relative h-48 bg-black/20 rounded-xl p-4">
        {/* Y-axis labels */}
        <div className="absolute left-0 top-0 h-full flex flex-col justify-between text-xs text-gray-400">
          <span>${Math.round(maxBalance).toLocaleString()}</span>
          <span>${Math.round(maxBalance * 0.75).toLocaleString()}</span>
          <span>${Math.round(maxBalance * 0.5).toLocaleString()}</span>
          <span>${Math.round(maxBalance * 0.25).toLocaleString()}</span>
          <span>$0</span>
        </div>

        {/* Graph area */}
        <div className="ml-12 h-full relative">
          {/* Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map(ratio => (
            <div
              key={ratio}
              className="absolute w-full border-t border-white/20"
              style={{ top: `${(1 - ratio) * 100}%` }}
            />
          ))}

          {/* Data line */}
          <svg className="absolute inset-0 w-full h-full">
            <path
              d={dailySnapshots.map((snapshot, index) => {
                const x = (index / (dailySnapshots.length - 1)) * 100;
                const y = ((maxBalance - snapshot.totalBalance) / maxBalance) * 100;
                return `${index === 0 ? 'M' : 'L'} ${x}% ${y}%`;
              }).join(' ')}
              stroke="#10b981"
              strokeWidth="3"
              fill="none"
              className="drop-shadow-lg"
            />

            {/* Data points */}
            {dailySnapshots.map((snapshot, index) => {
              const x = (index / (dailySnapshots.length - 1)) * 100;
              const y = ((maxBalance - snapshot.totalBalance) / maxBalance) * 100;
              return (
                <circle
                  key={index}
                  cx={`${x}%`}
                  cy={`${y}%`}
                  r="4"
                  fill="#10b981"
                  className="drop-shadow-lg"
                />
              );
            })}
          </svg>
        </div>

        {/* X-axis labels */}
        <div className="absolute bottom-0 left-12 right-0 flex justify-between text-xs text-gray-400 mt-2">
          <span>Day 1</span>
          <span>Day {Math.round(maxDay / 2)}</span>
          <span>Day {maxDay}</span>
        </div>
      </div>

      {/* Graph legend */}
      <div className="flex justify-center mt-4 text-sm text-gray-300">
        <div className="flex items-center">
          <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
          Total Remaining Debt
        </div>
      </div>
    </div>
  );
};

// Payment Distribution Chart Component
const PaymentDistributionChart = ({ gameState, analysis }: { gameState: GameState; analysis: any }) => {
  const cardColors = {
    visa: '#1a365d',
    mastercard: '#e53e3e',
    discover: '#38a169'
  };

  return (
    <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
      <h3 className="text-xl font-bold text-white mb-4 text-center">💳 Payment Distribution by Card</h3>

      <div className="space-y-4">
        {analysis.cardsByRate.map((card: any) => {
          const cardPayments = analysis.paymentsByCard.get(card.id);
          const percentage = cardPayments ? (cardPayments.total / analysis.totalPayments) * 100 : 0;
          const paymentCount = cardPayments?.count || 0;

          return (
            <div key={card.id} className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>{card.name} ({card.interestRate}% APR)</span>
                <span>${cardPayments?.total.toFixed(0) || '0'} ({paymentCount} payments)</span>
              </div>
              <div className="w-full bg-black/30 rounded-full h-3">
                <div
                  className="h-3 rounded-full transition-all duration-1000"
                  style={{
                    width: `${percentage}%`,
                    backgroundColor: cardColors[card.id as keyof typeof cardColors] || '#6b7280'
                  }}
                />
              </div>
              <div className="text-xs text-gray-400 text-right">{percentage.toFixed(1)}%</div>
            </div>
          );
        })}
      </div>

      <div className="mt-4 p-3 bg-blue-500/20 rounded-lg border border-blue-500/30">
        <div className="text-sm text-center text-blue-200">
          {analysis.avalancheRatio > 0.6 ?
            '🎯 Great job focusing on the highest interest rate card!' :
            '⚠️ For optimal savings, focus more payments on the highest interest rate card'}
        </div>
      </div>
    </div>
  );
};

// Interest Timeline Chart Component  
const InterestTimelineChart = ({ gameState }: { gameState: GameState }) => {
  const dailyInterestData: { day: number; interest: number; cardId: string }[] = [];
  let cumulativeInterest = 0;

  gameState.paymentLog.forEach(payment => {
    cumulativeInterest += payment.interestAccrued;
    dailyInterestData.push({
      day: payment.day,
      interest: cumulativeInterest,
      cardId: payment.cardId
    });
  });

  const maxInterest = Math.max(...dailyInterestData.map(d => d.interest), 1);
  const maxDay = Math.max(...dailyInterestData.map(d => d.day), 1);

  return (
    <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
      <h3 className="text-xl font-bold text-white mb-4 text-center">📈 Interest Accumulation Over Time</h3>

      <div className="relative h-48 bg-black/20 rounded-xl p-4">
        {/* Y-axis labels */}
        <div className="absolute left-0 top-0 h-full flex flex-col justify-between text-xs text-gray-400">
          <span>${Math.round(maxInterest)}</span>
          <span>${Math.round(maxInterest * 0.75)}</span>
          <span>${Math.round(maxInterest * 0.5)}</span>
          <span>${Math.round(maxInterest * 0.25)}</span>
          <span>$0</span>
        </div>

        {/* Graph area */}
        <div className="ml-12 h-full relative">
          {/* Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map(ratio => (
            <div
              key={ratio}
              className="absolute w-full border-t border-white/20"
              style={{ top: `${(1 - ratio) * 100}%` }}
            />
          ))}

          {/* Data line */}
          <svg className="absolute inset-0 w-full h-full">
            <path
              d={dailyInterestData.map((point, index) => {
                const x = (point.day / maxDay) * 100;
                const y = ((maxInterest - point.interest) / maxInterest) * 100;
                return `${index === 0 ? 'M' : 'L'} ${x}% ${y}%`;
              }).join(' ')}
              stroke="#ef4444"
              strokeWidth="3"
              fill="none"
              className="drop-shadow-lg"
            />
          </svg>
        </div>

        {/* X-axis labels */}
        <div className="absolute bottom-0 left-12 right-0 flex justify-between text-xs text-gray-400 mt-2">
          <span>Day 1</span>
          <span>Day {Math.round(maxDay / 2)}</span>
          <span>Day {maxDay}</span>
        </div>
      </div>

      <div className="flex justify-center mt-4 text-sm text-gray-300">
        <div className="flex items-center">
          <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
          Cumulative Interest Paid
        </div>
      </div>

      <div className="mt-4 p-3 bg-red-500/20 rounded-lg border border-red-500/30">
        <div className="text-sm text-center text-red-200">
          Average daily interest: ${(gameState.totalInterestPaid / gameState.currentDay).toFixed(2)}/day
        </div>
      </div>
    </div>
  );
};

export const EndGameScreen = ({ gameState, onPlayAgain, onClose }: EndGameScreenProps) => {
  const [showDetails, setShowDetails] = useState(false);
  const analysis = analyzePlayerStrategy(gameState);

  useEffect(() => {
    const timer = setTimeout(() => setShowDetails(true), 1000);
    return () => clearTimeout(timer);
  }, []);

  const INITIAL_DEBT = 1050; // 350 + 400 + 300
  const actualMonths = Math.ceil(gameState.currentDay / 30);

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div
          className="bg-gradient-to-br from-slate-900 via-blue-900 to-purple-900 rounded-3xl max-w-7xl w-full max-h-[95vh] overflow-hidden shadow-2xl border border-white/20 backdrop-blur-sm"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.8, opacity: 0 }}
          transition={{ type: "spring", stiffness: 200 }}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-green-600/80 to-blue-600/80 text-white p-6 backdrop-blur-sm border-b border-white/20">
            <motion.div
              className="text-center"
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              <h1 className="text-4xl font-bold mb-3">🎉 Debt Freedom Achieved! 🎉</h1>
              <p className="text-xl text-green-100">You paid off ${INITIAL_DEBT.toLocaleString()} in debt!</p>
            </motion.div>
          </div>

          {/* Content */}
          <div className="p-6 max-h-[65vh] overflow-y-auto">
            {/* Performance Summary */}
            <motion.div
              className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              {/* Your Results */}
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20">
                <h3 className="text-lg font-bold text-white mb-3 text-center">📊 Your Results</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Total Interest Paid:</span>
                    <span className="text-lg font-bold text-red-400">${gameState.totalInterestPaid.toFixed(0)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Time to Pay Off:</span>
                    <span className="text-lg font-bold text-blue-400">{actualMonths} months</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Late Fees Paid:</span>
                    <span className="text-lg font-bold text-orange-400">${gameState.totalLateFees.toFixed(0)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Total Paid:</span>
                    <span className="text-lg font-bold text-purple-400">${(INITIAL_DEBT + gameState.totalInterestPaid + gameState.totalLateFees).toFixed(0)}</span>
                  </div>
                </div>
              </div>

              {/* Interest & Fees Breakdown */}
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20">
                <h3 className="text-lg font-bold text-white mb-3 text-center">💰 Cost Breakdown</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Original Debt:</span>
                    <span className="text-lg font-bold text-white">${INITIAL_DEBT.toFixed(0)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Interest Charges:</span>
                    <span className="text-lg font-bold text-red-400">+${gameState.totalInterestPaid.toFixed(0)}</span>
                  </div>
                  {gameState.totalLateFees > 0 && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Late Fees ({Math.round(gameState.totalLateFees / 35)} missed payments):</span>
                      <span className="text-lg font-bold text-orange-400">+${gameState.totalLateFees.toFixed(0)}</span>
                    </div>
                  )}
                  <div className="border-t border-white/30 pt-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-semibold">Grand Total:</span>
                      <span className="text-xl font-bold text-purple-400">${(INITIAL_DEBT + gameState.totalInterestPaid + gameState.totalLateFees).toFixed(0)}</span>
                    </div>
                  </div>
                  <div className="text-xs text-center text-gray-300 mt-2">
                    You paid {(((gameState.totalInterestPaid + gameState.totalLateFees) / INITIAL_DEBT) * 100).toFixed(1)}% extra due to interest and fees
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Progress Graph */}
            {gameState.dailySnapshots && gameState.dailySnapshots.length > 1 && (
              <motion.div
                className="mb-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
              >
                <ProgressGraph dailySnapshots={gameState.dailySnapshots} />
              </motion.div>
            )}

            {/* Performance Analysis */}
            {showDetails && (
              <motion.div
                className="mb-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.9 }}
              >
                <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20">
                  <h3 className="text-lg font-bold text-white mb-4 text-center">🔍 Detailed Analysis</h3>

                  {/* Payoff Milestones */}
                  {Object.keys(gameState.payoffMilestones).length > 0 && (
                    <div className="mb-4">
                      <h4 className="text-base font-bold text-blue-400 mb-2">🏆 Cards Paid Off:</h4>
                      <div className="space-y-2">
                        {Object.entries(gameState.payoffMilestones)
                          .sort(([, a], [, b]) => a.day - b.day)
                          .map(([cardId, milestone]) => (
                            <div key={cardId} className="flex justify-between text-sm">
                              <span>{milestone.cardName} ({milestone.interestRate}% APR)</span>
                              <span>Day {milestone.day} (${milestone.totalInterest.toFixed(0)} interest)</span>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}

                  {/* Mistakes Made */}
                  {analysis.mistakes.length > 0 && (
                    <div className="mb-4">
                      <h4 className="text-base font-bold text-red-400 mb-2">⚠️ Areas for Improvement:</h4>
                      <ul className="space-y-1">
                        {analysis.mistakes.map((mistake, index) => (
                          <li key={index} className="text-sm text-white flex items-center">
                            <span className="text-red-400 mr-2">•</span>
                            {mistake}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                </div>
              </motion.div>
            )}

            {/* Disclaimers */}
            <motion.div
              className="text-center text-xs text-gray-400 space-y-1"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.1 }}
            >
              <p>• Interest compounds daily • Promotional rates may change • Numbers are approximate</p>
              <p>• Always pay minimums to avoid late fees • Consider balance transfer offers</p>
            </motion.div>
          </div>

          {/* Footer Actions */}
          <div className="border-t border-white/20 bg-black/20 backdrop-blur-sm px-6 py-4 flex justify-between items-center">
            <motion.button
              className="px-6 py-3 text-white/80 hover:text-white transition-colors hover:bg-white/10 rounded-xl border border-white/20 backdrop-blur-sm font-semibold"
              onClick={onClose}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              Close
            </motion.button>

            <motion.button
              className="px-8 py-3 bg-gradient-to-r from-green-600 to-blue-600 text-white rounded-xl font-bold text-lg hover:from-green-700 hover:to-blue-700 transition-colors shadow-lg border border-white/20"
              onClick={onPlayAgain}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              🚀 Play Again!
            </motion.button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
