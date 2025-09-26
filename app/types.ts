export interface CreditCard {
  id: string;
  name: string;
  balance: number;
  limit: number;
  interestRate: number; // Annual percentage rate
  minimumPayment: number;
  dueDate: number; // Day of month (1-31)
  color: string;
  lastPaymentDate?: number; // Days since game start
  lastMinimumPaymentMonth?: number; // Track which month minimum payment was made
  totalPaymentsThisMonth?: number; // Track total payments made this month
  currentMonth?: number; // Track current month for payment totals
}

export type GameStage = 'money-making' | 'debt-paying' | 'complete';

export interface PaymentLogEntry {
  day: number;          // gameState.currentDay when payment occurred
  cardId: string;
  amount: number;       // actual amount paid
  interestAccrued: number; // interest that had accrued on that card since last payment
  lateFee?: number;     // if any fee hit that day
  balanceAfter: number; // card balance after payment
}

export interface PayoffMilestone {
  day: number;
  totalInterest: number;
  cardName: string;
  interestRate: number;
}

export interface DailySnapshot {
  day: number;
  totalBalance: number;
  totalInterestPaid: number;
  cardsRemaining: number;
}

export interface GameState {
  cards: CreditCard[];
  currentDay: number;
  totalMoney: number;
  score: number;
  totalInterestPaid: number;
  totalLateFees: number;
  gameComplete: boolean;
  selectedCard?: string;
  stage: GameStage;
  payDay: number; // Day of month for payday (e.g., 1st and 15th)
  nextPayDay: number;
  nextDueDate: number;
  moneyEarnedThisRound: number;
  paymentLog: PaymentLogEntry[];      // NEW: Track all payments
  payoffMilestones: { [cardId: string]: PayoffMilestone }; // NEW: Track when cards are paid off
  dailySnapshots: DailySnapshot[];    // NEW: Track debt progress over time
  freedMinimums: number;              // NEW: Track freed minimum payments
}

export interface PaymentAction {
  cardId: string;
  amount: number;
  day: number;
}

export interface GameStats {
  totalDebtPaid: number;
  totalInterestPaid: number;
  totalLateFees: number;
  daysToComplete: number;
  efficiencyScore: number;
}