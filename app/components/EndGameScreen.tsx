'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GameState, PaymentLogEntry } from '../types';

interface EndGameScreenProps {
  gameState: GameState;
  onPlayAgain: () => void;
  onClose: () => void;
}

// Simulate optimal avalanche method with exact same income schedule
const simulateOptimalAvalanche = (gameState: GameState) => {
  // Get initial balances from game state constants
  const INITIAL_BALANCES = {
    'visa': 600,
    'mastercard': 400,
    'discover': 300
  };

  // Create virtual cards starting from initial state
  const virtualCards = Object.entries(INITIAL_BALANCES).map(([id, balance]) => {
    const originalCard = gameState.cards.find(c => c.id === id);
    return {
      id,
      name: originalCard?.name || id,
      balance,
      interestRate: originalCard?.interestRate || 0,
      minimumPayment: originalCard?.minimumPayment || 0,
      dueDate: originalCard?.dueDate || 1,
      lastPaymentDate: undefined as number | undefined,
    };
  });

  let totalOptimalInterest = 0;
  let currentDay = 1;
  let totalOptimalLateFees = 0;
  let availableMoney = 200; // Starting money

  // Calculate income pattern from player's actual cash flow
  const paymentsByDay = new Map<number, number>();
  gameState.paymentLog.forEach(payment => {
    const existing = paymentsByDay.get(payment.day) || 0;
    paymentsByDay.set(payment.day, existing + payment.amount);
  });

  // Infer income schedule: when player had money to make payments
  const incomeEvents = new Map<number, number>();
  let runningCash = 200; // Starting money

  Array.from(paymentsByDay.keys()).sort((a, b) => a - b).forEach(day => {
    const paymentAmount = paymentsByDay.get(day) || 0;
    if (paymentAmount > runningCash) {
      // Player must have earned money before this payment
      const incomeNeeded = paymentAmount - runningCash;
      incomeEvents.set(day, incomeNeeded);
      runningCash += incomeNeeded;
    }
    runningCash -= paymentAmount;
  });

  console.log(`💰 INFERRED INCOME SCHEDULE:`);
  Array.from(incomeEvents.keys()).sort((a, b) => a - b).forEach(day => {
    console.log(`  Day ${day}: +$${incomeEvents.get(day)}`);
  });

  const allIncomeEventsAndPaydays = Array.from(incomeEvents.keys()).sort((a, b) => a - b);

  // Determine income frequency pattern (estimate based on when player earned money)
  const incomePattern = allIncomeEventsAndPaydays.length > 1 ?
    allIncomeEventsAndPaydays[1] - allIncomeEventsAndPaydays[0] : 15; // Default to every 15 days

  console.log(`🔄 SIMULATING OPTIMAL AVALANCHE WITH INCOME PATTERN`);
  console.log(`Estimated income every ${incomePattern} days`);
  console.log(`Starting simulation...`);

  // Simulation loop
  const maxSimulationDays = 3650; // 10 years max
  while (virtualCards.some(card => card.balance > 0.01) && currentDay < maxSimulationDays) {
    // Check if it's an income day
    if (incomeEvents.has(currentDay)) {
      availableMoney += incomeEvents.get(currentDay) || 0;
      console.log(`💰 Day ${currentDay}: Earned $${incomeEvents.get(currentDay)}, total cash: $${availableMoney}`);
    } else if (currentDay > Math.max(...allIncomeEventsAndPaydays) && currentDay % incomePattern === allIncomeEventsAndPaydays[0] % incomePattern) {
      // Continue earning income on the same pattern after observed period
      const typicalIncome = Array.from(incomeEvents.values()).reduce((a, b) => a + b, 0) / incomeEvents.size;
      availableMoney += typicalIncome;
      console.log(`💰 Day ${currentDay}: Earned $${typicalIncome} (pattern), total cash: $${availableMoney}`);
    }

    // Accrue daily interest
    virtualCards.forEach(card => {
      if (card.balance > 0) {
        const dailyRate = card.interestRate / 100 / 365;
        const dailyInterest = card.balance * dailyRate;
        card.balance += dailyInterest;
        totalOptimalInterest += dailyInterest;
      }
    });

    // Check for late fees on due dates
    const dayOfMonth = ((currentDay - 1) % 30) + 1;
    virtualCards.forEach(card => {
      if (dayOfMonth === card.dueDate && card.balance > 0) {
        const currentMonth = Math.floor((currentDay - 1) / 30);
        const lastMinMonth = card.lastPaymentDate ? Math.floor((card.lastPaymentDate - 1) / 30) : -1;

        if (lastMinMonth < currentMonth) {
          card.balance += 35; // Late fee
          totalOptimalLateFees += 35;
        }
      }
    });

    // Apply optimal payment strategy if we have money
    if (availableMoney > 0) {
      let remainingMoney = availableMoney;

      // First: pay minimums on all cards with balance
      const cardsWithBalance = virtualCards.filter(card => card.balance > 0);
      cardsWithBalance.forEach(card => {
        const minPayment = Math.min(card.minimumPayment, card.balance, remainingMoney);
        if (minPayment > 0) {
          card.balance = Math.max(0, card.balance - minPayment);
          card.lastPaymentDate = currentDay;
          remainingMoney -= minPayment;
          availableMoney -= minPayment;
        }
      });

      // Second: put remaining money on highest interest rate card
      if (remainingMoney > 0) {
        const highestRateCard = virtualCards
          .filter(card => card.balance > 0)
          .sort((a, b) => b.interestRate - a.interestRate)[0];

        if (highestRateCard) {
          const extraPayment = Math.min(remainingMoney, highestRateCard.balance);
          if (extraPayment > 0) {
            highestRateCard.balance = Math.max(0, highestRateCard.balance - extraPayment);
            highestRateCard.lastPaymentDate = currentDay;
            availableMoney -= extraPayment;
            console.log(`💳 Day ${currentDay}: Optimal payment $${extraPayment} to ${highestRateCard.name}`);
          }
        }
      }
    }

    currentDay++;
  }

  const optimalMonths = Math.ceil((currentDay - 1) / 30);
  const totalRemainingDebt = virtualCards.reduce((sum, card) => sum + card.balance, 0);

  console.log(`✅ OPTIMAL SIMULATION COMPLETE`);
  console.log(`Final day: ${currentDay - 1} (${optimalMonths} months)`);
  console.log(`Total interest paid: $${Math.round(totalOptimalInterest)}`);
  console.log(`Total late fees: $${Math.round(totalOptimalLateFees)}`);
  console.log(`Remaining debt: $${Math.round(totalRemainingDebt)}`);
  console.log(`Cards final balances:`, virtualCards.map(c => `${c.name}: $${Math.round(c.balance)}`));

  return {
    totalInterestPaid: Math.round(totalOptimalInterest),
    totalLateFees: Math.round(totalOptimalLateFees),
    months: optimalMonths,
    finalDay: currentDay - 1,
    cardsPayoffOrder: virtualCards
      .sort((a, b) => b.interestRate - a.interestRate)
      .map(card => ({
        name: card.name,
        interestRate: card.interestRate,
        finalBalance: Math.round(card.balance * 100) / 100,
      })),
  };
};

// Analyze player's strategy vs optimal
const analyzePlayerStrategy = (gameState: GameState) => {
  console.log(`🎯 FINAL GAME ANALYSIS`);
  console.log(`Player completed game on day ${gameState.currentDay} (${Math.ceil(gameState.currentDay / 30)} months)`);
  console.log(`Total interest paid: $${gameState.totalInterestPaid}`);
  console.log(`Total late fees: $${gameState.totalLateFees}`);
  console.log(`Payment log entries: ${gameState.paymentLog.length}`);

  const optimal = simulateOptimalAvalanche(gameState);
  console.log(`Perfect Avalanche would take: ${optimal.months} months (day ${optimal.finalDay})`);
  console.log(`Perfect Avalanche interest: $${optimal.totalInterestPaid}`);
  console.log(`Perfect Avalanche late fees: $${optimal.totalLateFees}`);

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

  const extraInterest = (gameState.totalInterestPaid + gameState.totalLateFees) - (optimal.totalInterestPaid + (optimal.totalLateFees || 0));
  const extraMonths = actualMonths - optimal.months;

  console.log(`📊 FINAL COMPARISON:`);
  console.log(`Player: ${actualMonths} months, $${gameState.totalInterestPaid} interest, $${gameState.totalLateFees} late fees`);
  console.log(`Optimal: ${optimal.months} months, $${optimal.totalInterestPaid} interest, $${optimal.totalLateFees} late fees`);
  console.log(`Difference: ${extraMonths} months, $${Math.round(extraInterest)} extra cost`);

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
                    <span className="text-lg font-bold text-green-400">${analysis.optimal.totalLateFees?.toFixed(0) || '0'}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Total Would Be:</span>
                    <span className="text-lg font-bold text-green-400">${(INITIAL_DEBT + analysis.optimal.totalInterestPaid + (analysis.optimal.totalLateFees || 0)).toFixed(0)}</span>
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
                  <div className="space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Money Freed:</span>
                      <span className="text-lg font-bold text-purple-400">${gameState.freedMinimums}/month</span>
                    </div>
                    <div className="text-xs text-gray-400 text-center">
                      Visa $25 + MasterCard $20 + Discover $15 = $60
                    </div>
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