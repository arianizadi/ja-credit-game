import { CreditCard, GameState } from '../types';

export const calculateOptimalPaymentStrategy = (
  cards: CreditCard[],
  availableMoney: number
): { cardId: string; amount: number; reasoning: string }[] => {
  // Sort cards by interest rate (highest first) - avalanche method
  const sortedCards = [...cards]
    .filter(card => card.balance > 0)
    .sort((a, b) => b.interestRate - a.interestRate);

  const payments: { cardId: string; amount: number; reasoning: string }[] = [];
  let remainingMoney = availableMoney;

  // First, ensure minimum payments on all cards
  for (const card of sortedCards) {
    const minPayment = Math.min(card.minimumPayment, card.balance, remainingMoney);
    if (minPayment > 0) {
      payments.push({
        cardId: card.id,
        amount: minPayment,
        reasoning: `Minimum payment to avoid late fees`
      });
      remainingMoney -= minPayment;
    }
  }

  // Then, pay extra on highest interest rate card
  if (remainingMoney > 0 && sortedCards.length > 0) {
    const targetCard = sortedCards[0];
    const existingPayment = payments.find(p => p.cardId === targetCard.id);
    const remainingBalance = targetCard.balance - (existingPayment?.amount || 0);
    const extraPayment = Math.min(remainingMoney, remainingBalance);

    if (extraPayment > 0) {
      if (existingPayment) {
        existingPayment.amount += extraPayment;
        existingPayment.reasoning = `Minimum payment + extra on highest interest rate (${targetCard.interestRate}%)`;
      } else {
        payments.push({
          cardId: targetCard.id,
          amount: extraPayment,
          reasoning: `Pay highest interest rate card first (${targetCard.interestRate}%)`
        });
      }
    }
  }

  return payments;
};

export const calculateEfficiencyScore = (gameState: GameState): number => {
  const totalDebt = gameState.cards.reduce((sum, card) => sum + card.balance, 0);
  const baseScore = 1000;

  // Deduct points for interest and late fees
  const interestPenalty = gameState.totalInterestPaid * 2;
  const lateFeesPenalty = gameState.totalLateFees * 5;
  const timePenalty = gameState.currentDay * 0.5;

  // Bonus for paying off high-interest cards first
  const sortedCards = [...gameState.cards].sort((a, b) => b.interestRate - a.interestRate);
  let strategyBonus = 0;
  for (let i = 0; i < sortedCards.length - 1; i++) {
    if (sortedCards[i].balance === 0 && sortedCards[i + 1].balance > 0) {
      strategyBonus += 50; // Bonus for following avalanche method
    }
  }

  return Math.max(0, baseScore - interestPenalty - lateFeesPenalty - timePenalty + strategyBonus);
};

export const getPaymentAdvice = (cards: CreditCard[], availableMoney: number): string => {
  const cardsWithBalance = cards.filter(card => card.balance > 0);

  if (cardsWithBalance.length === 0) {
    return "🎉 Congratulations! You've mastered the Debt Avalanche Method!";
  }

  const highestInterestCard = cardsWithBalance.reduce((prev, current) =>
    current.interestRate > prev.interestRate ? current : prev
  );

  const totalMinimumPayments = cardsWithBalance.reduce((sum, card) => sum + card.minimumPayment, 0);

  if (availableMoney < totalMinimumPayments) {
    return "⚠️ Use the Debt Avalanche Method: Pay minimums first, then focus on the highest interest rate cards to avoid late fees.";
  }

  if (availableMoney >= totalMinimumPayments) {
    return `🏔️ Debt Avalanche Method: Make minimum payments on all cards, then put extra money toward the ${highestInterestCard.name} (${highestInterestCard.interestRate}% interest) to save the most money.`;
  }

  return "📊 Remember the Debt Avalanche Method: Highest interest rate first!";
};

export const simulatePaymentOutcome = (
  card: CreditCard,
  paymentAmount: number,
  daysUntilDue: number
): {
  newBalance: number;
  interestSaved: number;
  timeToPayOff: number;
} => {
  const newBalance = Math.max(0, card.balance - paymentAmount);
  const dailyInterestRate = card.interestRate / 100 / 365;

  // Calculate interest that would have been paid
  const interestSaved = paymentAmount * dailyInterestRate * daysUntilDue;

  // Estimate time to pay off with minimum payments
  let timeToPayOff = 0;
  let remainingBalance = newBalance;

  while (remainingBalance > 0 && timeToPayOff < 1000) { // Cap at 1000 days
    const dailyInterest = remainingBalance * dailyInterestRate;
    remainingBalance = remainingBalance + dailyInterest - (card.minimumPayment / 30);
    timeToPayOff++;
  }

  return {
    newBalance,
    interestSaved,
    timeToPayOff: Math.ceil(timeToPayOff / 30), // Convert to months
  };
};