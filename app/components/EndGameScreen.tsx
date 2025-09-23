'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GameState, PaymentLogEntry } from '../types';

interface EndGameScreenProps {
  gameState: GameState;
  onPlayAgain: () => void;
  onClose: () => void;
}

// Simulate optimal avalanche method with exact same cash flow
const simulateOptimalAvalanche = (gameState: GameState) => {
  // Create virtual cards with same initial conditions
  const virtualCards = gameState.cards.map(card => ({
    ...card,
    balance: card.balance,
    interestPaid: 0,
  }));

  // Get the original card states (need initial balances)
  const INITIAL_BALANCES = {
    'visa': 600,
    'mastercard': 400,
    'discover': 300
  };

  // Reset to initial balances for fair comparison
  virtualCards.forEach(card => {
    card.balance = INITIAL_BALANCES[card.id as keyof typeof INITIAL_BALANCES] || card.balance;
  });

  let totalOptimalInterest = 0;
  let currentDay = 1;
  let paymentLog = [...gameState.paymentLog].sort((a, b) => a.day - b.day);

  // Simulate each payment on the optimal card (highest interest rate with balance)
  paymentLog.forEach(payment => {
    // Advance time and accrue interest
    const daysElapsed = payment.day - currentDay;
    virtualCards.forEach(card => {
      if (card.balance > 0) {
        const dailyRate = card.interestRate / 100 / 365;
        const interest = card.balance * dailyRate * daysElapsed;
        card.balance += interest;
        card.interestPaid += interest;
        totalOptimalInterest += interest;
      }
    });

    // Find card with highest interest rate that still has balance
    const targetCard = virtualCards
      .filter(card => card.balance > 0)
      .sort((a, b) => b.interestRate - a.interestRate)[0];

    if (targetCard) {
      targetCard.balance = Math.max(0, targetCard.balance - payment.amount);
    }

    currentDay = payment.day;
  });

  // Calculate final day when all cards would be paid off
  const maxDay = Math.max(...paymentLog.map(p => p.day));
  const optimalMonths = Math.ceil(maxDay / 30);

  return {
    totalInterestPaid: totalOptimalInterest,
    months: optimalMonths,
    cardsPayoffOrder: virtualCards
      .filter(card => INITIAL_BALANCES[card.id as keyof typeof INITIAL_BALANCES] > 0)
      .sort((a, b) => b.interestRate - a.interestRate)
      .map(card => ({
        name: card.name,
        interestRate: card.interestRate,
        interestPaid: card.interestPaid,
      })),
  };
};

// Analyze player's strategy vs optimal
const analyzePlayerStrategy = (gameState: GameState) => {
  const optimal = simulateOptimalAvalanche(gameState);
  const actualMonths = Math.ceil(gameState.currentDay / 30);

  // Check if player followed avalanche method
  const cardsByRate = [...gameState.cards].sort((a, b) => b.interestRate - a.interestRate);
  const highestRateCard = cardsByRate[0];

  // Check payment log to see if highest rate card got priority
  const paymentsToHighestRate = gameState.paymentLog.filter(p => p.cardId === highestRateCard.id);
  const totalPaymentsToHighestRate = paymentsToHighestRate.reduce((sum, p) => sum + p.amount, 0);
  const totalPayments = gameState.paymentLog.reduce((sum, p) => sum + p.amount, 0);

  const isOptimal = totalPaymentsToHighestRate / totalPayments > 0.6; // 60% of payments went to highest rate

  const mistakes = [];
  if (!isOptimal) {
    mistakes.push(`Should have focused more on ${highestRateCard.name} (${highestRateCard.interestRate}% APR)`);
  }

  if (gameState.totalLateFees > 0) {
    mistakes.push(`Paid $${gameState.totalLateFees.toFixed(0)} in unnecessary late fees`);
  }

  const extraInterest = gameState.totalInterestPaid - optimal.totalInterestPaid;
  const extraMonths = actualMonths - optimal.months;

  return {
    isOptimal,
    mistakes,
    extraInterest: Math.max(0, extraInterest),
    extraMonths: Math.max(0, extraMonths),
    optimal,
    actualMonths,
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

export const EndGameScreen = ({ gameState, onPlayAgain, onClose }: EndGameScreenProps) => {
  const [showDetails, setShowDetails] = useState(false);
  const analysis = analyzePlayerStrategy(gameState);

  useEffect(() => {
    const timer = setTimeout(() => setShowDetails(true), 1000);
    return () => clearTimeout(timer);
  }, []);

  const INITIAL_DEBT = 1300; // 600 + 400 + 300
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
              className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6"
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

              {/* Optimal Results */}
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20">
                <h3 className="text-lg font-bold text-white mb-3 text-center">🎯 Perfect Avalanche</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Interest Would Be:</span>
                    <span className="text-lg font-bold text-green-400">${analysis.optimal.totalInterestPaid.toFixed(0)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Time Would Be:</span>
                    <span className="text-lg font-bold text-blue-400">{analysis.optimal.months} months</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Late Fees:</span>
                    <span className="text-lg font-bold text-green-400">$0</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Total Would Be:</span>
                    <span className="text-lg font-bold text-green-400">${(INITIAL_DEBT + analysis.optimal.totalInterestPaid).toFixed(0)}</span>
                  </div>
                </div>
              </div>

              {/* Difference */}
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20">
                <h3 className="text-lg font-bold text-white mb-3 text-center">📈 Difference</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Extra Interest:</span>
                    <span className={`text-lg font-bold ${analysis.extraInterest > 0 ? 'text-red-400' : 'text-green-400'}`}>
                      {analysis.extraInterest > 0 ? '+' : ''}${analysis.extraInterest.toFixed(0)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Extra Time:</span>
                    <span className={`text-lg font-bold ${analysis.extraMonths > 0 ? 'text-red-400' : 'text-green-400'}`}>
                      {analysis.extraMonths > 0 ? '+' : ''}{analysis.extraMonths} months
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Strategy Grade:</span>
                    <span className={`text-lg font-bold ${analysis.isOptimal ? 'text-green-400' : 'text-yellow-400'}`}>
                      {analysis.isOptimal ? 'A+' : 'B'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Money Freed:</span>
                    <span className="text-lg font-bold text-purple-400">${gameState.freedMinimums}/month</span>
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

                  {/* Recommendations */}
                  <div className="bg-green-500/20 rounded-xl p-3 border border-green-500/30">
                    <h4 className="text-base font-bold text-green-400 mb-2">💡 Next Steps:</h4>
                    <p className="text-sm text-white">
                      {gameState.freedMinimums > 0
                        ? `You now have an extra $${gameState.freedMinimums}/month! Use this freed money to attack your next highest interest debt or build an emergency fund.`
                        : 'Always pay the card with the highest interest rate first, regardless of balance. This mathematically saves you the most money!'
                      }
                    </p>
                  </div>
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