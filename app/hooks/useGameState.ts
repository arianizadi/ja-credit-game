'use client';

import { useState, useCallback, useEffect } from 'react';
import { CreditCard, GameState, PaymentAction, PaymentLogEntry, DailySnapshot } from '../types';

const INITIAL_CARDS: CreditCard[] = [
  {
    id: 'visa',
    name: 'Visa Card',
    balance: 350,
    limit: 3000,
    interestRate: 19,
    minimumPayment: 25,
    dueDate: 15,
    color: '#1a365d',
  },
  {
    id: 'mastercard',
    name: 'MasterCard',
    balance: 400,
    limit: 2000,
    interestRate: 23,
    minimumPayment: 20,
    dueDate: 5,
    color: '#e53e3e',
  },
  {
    id: 'discover',
    name: 'Discover Card',
    balance: 300,
    limit: 1500,
    interestRate: 16,
    minimumPayment: 15,
    dueDate: 25,
    color: '#38a169',
  },
];

const calculateNextPayDay = (currentDay: number): number => {
  const daysInMonth = 30;
  const payDays = [1, 15]; // 1st and 15th of each month

  for (const payDay of payDays) {
    if (payDay > (currentDay % daysInMonth)) {
      return Math.floor(currentDay / daysInMonth) * daysInMonth + payDay;
    }
  }
  // Next month's first payday
  return Math.floor(currentDay / daysInMonth + 1) * daysInMonth + payDays[0];
};

const calculateNextDueDate = (cards: CreditCard[], currentDay: number): number => {
  const currentDayOfMonth = ((currentDay - 1) % 30) + 1;
  let nextDue = Infinity;

  for (const card of cards) {
    if (card.balance > 0) {
      let cardDueDay = card.dueDate;
      if (cardDueDay <= currentDayOfMonth) {
        cardDueDay += 30; // Next month
      }
      const fullDueDate = Math.floor((currentDay - 1) / 30) * 30 + cardDueDay;
      if (fullDueDate < nextDue) {
        nextDue = fullDueDate;
      }
    }
  }

  return nextDue === Infinity ? currentDay + 30 : nextDue;
};

// Helper function to calculate current balance including accrued interest
const calculateCurrentBalance = (card: CreditCard, currentDay: number): number => {
  const daysElapsed = card.lastPaymentDate ? currentDay - card.lastPaymentDate : Math.max(0, currentDay - 1);
  const dailyInterestRate = card.interestRate / 100 / 365;
  const interestAccrued = Math.round(card.balance * dailyInterestRate * daysElapsed);
  return Math.round(card.balance + interestAccrued);
};

// Helper function to create daily snapshot
const createDailySnapshot = (gameState: GameState): DailySnapshot => {
  const totalBalance = Math.round(gameState.cards.reduce((sum, card) => sum + card.balance, 0));
  const cardsRemaining = gameState.cards.filter(card => Math.round(card.balance) > 0).length;

  return {
    day: gameState.currentDay,
    totalBalance,
    totalInterestPaid: gameState.totalInterestPaid,
    cardsRemaining
  };
};

export const useGameState = () => {
  const [gameState, setGameState] = useState<GameState>(() => {
    // Try to load from localStorage first
    if (typeof window !== 'undefined') {
      try {
        const savedState = localStorage.getItem('creditGameState');
        if (savedState) {
          const parsed = JSON.parse(savedState);
          // Validate that the saved state has the required structure
          if (parsed && parsed.cards && parsed.currentDay !== undefined) {
            return parsed;
          }
        }
      } catch (error) {
        console.warn('Failed to load game state from localStorage:', error);
      }
    }

    // If no saved state or loading failed, create initial state
    const initialState: GameState = {
      cards: INITIAL_CARDS,
      currentDay: 1,
      totalMoney: 200, // Start with less money to make earning important
      score: 0,
      totalInterestPaid: 0,
      totalLateFees: 0,
      gameComplete: false,
      stage: 'debt-paying', // Start in debt-paying mode, let tutorial handle the flow
      payDay: 1,
      nextPayDay: 1,
      nextDueDate: 5,
      moneyEarnedThisRound: 0,
      paymentLog: [],
      payoffMilestones: {},
      dailySnapshots: [],
      freedMinimums: 0,
    };

    // Create initial daily snapshot
    initialState.dailySnapshots = [createDailySnapshot(initialState)];
    return initialState;
  });

  // Save game state to localStorage whenever it changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('creditGameState', JSON.stringify(gameState));
      } catch (error) {
        console.warn('Failed to save game state to localStorage:', error);
      }
    }
  }, [gameState]);

  const makePayment = useCallback((cardId: string, amount: number) => {
    setGameState(prev => {
      const targetCard = prev.cards.find(card => card.id === cardId);
      if (!targetCard) return prev;

      // Calculate interest accrued since last payment
      const daysElapsed = targetCard.lastPaymentDate ? prev.currentDay - targetCard.lastPaymentDate : Math.max(0, prev.currentDay - 1);
      const dailyInterestRate = targetCard.interestRate / 100 / 365;
      const interestAccrued = Math.round(targetCard.balance * dailyInterestRate * daysElapsed);

      console.log(`🏦 PAYMENT TRANSACTION - Day ${prev.currentDay}`);
      console.log(`Card: ${targetCard.name} (${cardId})`);
      console.log(`Balance before interest: $${targetCard.balance}`);
      console.log(`Days elapsed: ${daysElapsed}`);
      console.log(`Daily rate: ${(dailyInterestRate * 100).toFixed(6)}%`);
      console.log(`Interest accrued: $${interestAccrued}`);
      console.log(`Payment amount: $${amount}`);

      const newCards = prev.cards.map(card => {
        if (card.id === cardId) {
          // Apply interest first, then payment
          const balanceWithInterest = Math.round(card.balance + interestAccrued);
          const newBalance = Math.max(0, balanceWithInterest - amount);
          const wasPaidOff = Math.round(card.balance) > 0 && newBalance === 0;

          console.log(`Balance with interest: $${balanceWithInterest}`);
          console.log(`New balance after payment: $${newBalance}`);
          console.log(`Card paid off: ${wasPaidOff}`);

          // If card was paid off, add to freed minimums
          if (wasPaidOff) {
            prev.freedMinimums += card.minimumPayment;
          }

          // Track cumulative payments this month
          const currentMonth = Math.floor((prev.currentDay - 1) / 30);
          let totalPaymentsThisMonth = card.totalPaymentsThisMonth || 0;

          // Reset if new month
          if (card.currentMonth !== currentMonth) {
            totalPaymentsThisMonth = 0;
          }

          totalPaymentsThisMonth += amount;
          const lastMinimumPaymentMonth = totalPaymentsThisMonth >= card.minimumPayment ? currentMonth : card.lastMinimumPaymentMonth;

          return {
            ...card,
            balance: newBalance,
            lastPaymentDate: prev.currentDay,
            lastMinimumPaymentMonth,
            totalPaymentsThisMonth,
            currentMonth,
          };
        }
        return card;
      });

      // Create payment log entry
      const paymentLogEntry: PaymentLogEntry = {
        day: prev.currentDay,
        cardId,
        amount,
        interestAccrued,
        balanceAfter: Math.max(0, Math.round(targetCard.balance) - amount),
      };

      // Check if card was paid off and create milestone
      const newPayoffMilestones = { ...prev.payoffMilestones };
      const cardAfterPayment = newCards.find(card => card.id === cardId);
      if (cardAfterPayment && Math.round(targetCard.balance) > 0 && cardAfterPayment.balance === 0) {
        newPayoffMilestones[cardId] = {
          day: prev.currentDay,
          totalInterest: prev.totalInterestPaid + interestAccrued,
          cardName: targetCard.name,
          interestRate: targetCard.interestRate,
        };
      }

      // Create daily snapshot
      const newState = {
        ...prev,
        cards: newCards,
        totalMoney: prev.totalMoney - amount,
        totalInterestPaid: prev.totalInterestPaid + interestAccrued,
        paymentLog: [...prev.paymentLog, paymentLogEntry],
        payoffMilestones: newPayoffMilestones,
      };

      newState.dailySnapshots = [...prev.dailySnapshots, createDailySnapshot(newState)];

      return newState;
    });
  }, []);

  const completeMoneyMaking = useCallback((earnedAmount: number) => {
    setGameState(prev => ({
      ...prev,
      totalMoney: prev.totalMoney + earnedAmount,
      moneyEarnedThisRound: earnedAmount,
      stage: 'debt-paying',
    }));
  }, []);

  const advanceToNextPayday = useCallback(() => {
    setGameState(prev => {
      const nextPayDay = calculateNextPayDay(prev.currentDay);
      const daysToAdvance = nextPayDay - prev.currentDay;

      console.log(`⏰ ADVANCING TO PAYDAY - From Day ${prev.currentDay} to Day ${nextPayDay} (${daysToAdvance} days)`);

      let newTotalInterestPaid = prev.totalInterestPaid;
      let newTotalLateFees = prev.totalLateFees;

      // Calculate interest & apply late fees for all days until payday
      const newCards = prev.cards.map(card => {
        let newCard = { ...card };

        // 1) Interest accrual (simple interest over the period)
        const dailyInterestRate = card.interestRate / 100 / 365;
        const totalInterest = Math.round(card.balance * dailyInterestRate * daysToAdvance);
        newCard.balance = Math.round(newCard.balance + totalInterest);
        newCard.lastPaymentDate = nextPayDay; // Update to prevent double counting
        newTotalInterestPaid += totalInterest;

        // 2) Detect any due-dates that occur between prev.currentDay (exclusive) and nextPayDay (inclusive)
        for (let day = prev.currentDay + 1; day <= nextPayDay; day++) {
          const dayOfMonth = ((day - 1) % 30) + 1;
          const monthIndex = Math.floor((day - 1) / 30); // 0-based

          if (
            dayOfMonth === card.dueDate &&
            Math.round(newCard.balance) > 0 &&
            (card.lastMinimumPaymentMonth === undefined || card.lastMinimumPaymentMonth < monthIndex)
          ) {
            const lateFee = 35;
            newCard.balance = Math.round(newCard.balance + lateFee);
            newTotalLateFees += lateFee;

            console.log(`💸 LATE FEE APPLIED DURING PAYDAY ADVANCE - ${card.name}`);
            console.log(`  Day advanced to: ${day}`);
            console.log(`  Month index: ${monthIndex}`);
            console.log(`  Late fee: $${lateFee}`);
            console.log(`  New balance: $${newCard.balance}`);
          }
        }

        // 3) Reset monthly payment tracking if we've moved to a new month
        const currentMonth = Math.floor((nextPayDay - 1) / 30);
        if (card.currentMonth !== currentMonth) {
          newCard.totalPaymentsThisMonth = 0;
          newCard.currentMonth = currentMonth;
        }

        return newCard;
      });

      const newState = {
        ...prev,
        cards: newCards,
        currentDay: nextPayDay,
        totalInterestPaid: newTotalInterestPaid,
        totalLateFees: newTotalLateFees,
        stage: 'money-making' as const,
        nextPayDay: calculateNextPayDay(nextPayDay),
        nextDueDate: calculateNextDueDate(newCards, nextPayDay),
        moneyEarnedThisRound: 0,
      };

      // Create daily snapshot
      newState.dailySnapshots = [...prev.dailySnapshots, createDailySnapshot(newState)];

      return newState;
    });
  }, []);

  const advanceToNextDueDate = useCallback(() => {
    setGameState(prev => {
      const nextDue = calculateNextDueDate(prev.cards, prev.currentDay);
      const daysToAdvance = nextDue - prev.currentDay;

      console.log(`⚠️ ADVANCING TO DUE DATE - From Day ${prev.currentDay} to Day ${nextDue} (${daysToAdvance} days)`);

      let newTotalInterestPaid = prev.totalInterestPaid;
      let newTotalLateFees = prev.totalLateFees;

      const newCards = prev.cards.map(card => {
        let newCard = { ...card };

        // Add interest for each day
        const dailyInterestRate = card.interestRate / 100 / 365;
        const totalInterest = Math.round(card.balance * dailyInterestRate * daysToAdvance);
        newCard.balance = Math.round(newCard.balance + totalInterest);
        newCard.lastPaymentDate = nextDue; // Update to prevent double counting
        newTotalInterestPaid += totalInterest;

        // Reset monthly payment tracking if we've moved to a new month
        const currentMonth = Math.floor((nextDue - 1) / 30);
        if (card.currentMonth !== currentMonth) {
          newCard.totalPaymentsThisMonth = 0;
          newCard.currentMonth = currentMonth;
        }

        // Check if this card's due date is reached and minimum payment was not made
        const currentDayOfMonth = ((nextDue - 1) % 30) + 1;
        if (currentDayOfMonth === card.dueDate &&
            Math.round(card.balance) > 0 &&
            (card.lastMinimumPaymentMonth === undefined || card.lastMinimumPaymentMonth < currentMonth)) {
          const lateFee = 35;
          newCard.balance = Math.round(newCard.balance + lateFee);
          newTotalLateFees += lateFee;

          console.log(`💸 LATE FEE APPLIED - ${card.name}`);
          console.log(`  Due date: ${card.dueDate}th of month`);
          console.log(`  Current day of month: ${currentDayOfMonth}`);
          console.log(`  Current month: ${currentMonth}`);
          console.log(`  Last min payment month: ${card.lastMinimumPaymentMonth}`);
          console.log(`  Late fee: $${lateFee}`);
          console.log(`  New balance: $${newCard.balance}`);
        }

        return newCard;
      });

      const gameComplete = newCards.every(card => Math.round(card.balance) === 0);

      const newState = {
        ...prev,
        cards: newCards,
        currentDay: nextDue,
        totalInterestPaid: newTotalInterestPaid,
        totalLateFees: newTotalLateFees,
        nextDueDate: calculateNextDueDate(newCards, nextDue),
        gameComplete: gameComplete ? true : prev.gameComplete,
        stage: gameComplete ? ('complete' as const) : prev.stage,
      };

      // Create daily snapshot
      newState.dailySnapshots = [...prev.dailySnapshots, createDailySnapshot(newState)];

      return newState;
    });
  }, []);

  const resetGame = useCallback(() => {
    // Clear localStorage
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem('creditGameState');
      } catch (error) {
        console.warn('Failed to clear localStorage:', error);
      }
    }

    const initialState: GameState = {
      cards: INITIAL_CARDS,
      currentDay: 1,
      totalMoney: 200,
      score: 0,
      totalInterestPaid: 0,
      totalLateFees: 0,
      gameComplete: false,
      stage: 'debt-paying',
      payDay: 1,
      nextPayDay: 1,
      nextDueDate: 5,
      moneyEarnedThisRound: 0,
      paymentLog: [],
      payoffMilestones: {},
      dailySnapshots: [],
      freedMinimums: 0,
    };

    // Create initial daily snapshot
    initialState.dailySnapshots = [createDailySnapshot(initialState)];
    setGameState(initialState);
  }, []);

  const payAllDebts = useCallback(() => {
    setGameState(prev => {
      const totalDebt = prev.cards.reduce((sum, card) => sum + Math.round(card.balance), 0);
      if (totalDebt <= prev.totalMoney) {
        // Pay off all cards completely
        const newCards = prev.cards.map(card => {
          const wasPaidOff = card.balance > 0;
          if (wasPaidOff) {
            prev.freedMinimums += card.minimumPayment;
          }
          return {
            ...card,
            balance: 0,
            lastPaymentDate: prev.currentDay,
          };
        });

        const newState = {
          ...prev,
          cards: newCards,
          totalMoney: prev.totalMoney - totalDebt,
          gameComplete: true,
          stage: 'complete' as const,
        };

        // Create daily snapshot
        newState.dailySnapshots = [...prev.dailySnapshots, createDailySnapshot(newState)];
        return newState;
      }
      return prev;
    });
  }, []);

  const getCurrentBalance = useCallback((card: CreditCard) => {
    return calculateCurrentBalance(card, gameState.currentDay);
  }, [gameState.currentDay]);

  return {
    gameState,
    makePayment,
    payAllDebts,
    getCurrentBalance,
    completeMoneyMaking,
    advanceToNextPayday,
    advanceToNextDueDate,
    resetGame,
  };
};
