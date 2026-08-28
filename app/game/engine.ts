// Pure game engine for the Debt Avalanche game.
// All money values are integer CENTS. Fractional daily interest is carried
// per-card in `interestCarry` so no sub-cent interest is ever lost or invented.

export type CardNetwork = "visa" | "mastercard" | "discover";

export interface CardTheme {
  from: string;
  to: string;
  glow: string;
  /** Colorblind-validated identity color for data marks (timeline dots, chart). */
  mark: string;
}

export interface CardState {
  id: string;
  name: string;
  network: CardNetwork;
  last4: string;
  balance: number; // cents
  startingBalance: number; // cents, for payoff progress
  limit: number; // cents
  apr: number; // e.g. 0.2399
  minPayment: number; // cents
  dueDay: number; // day of (30-day) month, 1..30
  paidThisCycle: number; // cents paid since last due date
  interestCarry: number; // fractional cents not yet posted
  interestAccrued: number; // cents of interest posted over the whole game
  lateFees: number; // count of late fees charged
  paidOffOnDay?: number;
  theme: CardTheme;
}

export type GameStage = "earn" | "pay" | "complete";

export interface LogEntry {
  day: number;
  kind: "payment" | "interest" | "late-fee" | "paycheck" | "payoff";
  cardId?: string;
  amount: number; // cents
}

export interface Snapshot {
  day: number;
  totalDebt: number; // cents
  totalInterest: number; // cents
}

export interface GameState {
  day: number; // 1-based absolute day
  money: number; // cents
  stage: GameStage;
  cards: CardState[];
  totalInterest: number; // cents
  totalLateFees: number; // cents
  totalPaid: number; // cents of payments made
  paycheckCount: number;
  log: LogEntry[];
  snapshots: Snapshot[];
}

export const DAYS_PER_MONTH = 30;
export const PAY_DAYS = [1, 15]; // days of month
export const LATE_FEE = 3500; // $35 in cents
export const BASE_PAYCHECK = 15000; // $150 guaranteed salary per payday

export const dayOfMonth = (day: number): number =>
  ((day - 1) % DAYS_PER_MONTH) + 1;
export const monthIndex = (day: number): number =>
  Math.floor((day - 1) / DAYS_PER_MONTH);

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];
export const monthName = (day: number): string =>
  MONTH_NAMES[monthIndex(day) % 12];

/** Absolute day of the next payday strictly after `day`. */
export const nextPaydayAfter = (day: number): number => {
  const dom = dayOfMonth(day);
  for (const pd of PAY_DAYS) {
    if (pd > dom) return day + (pd - dom);
  }
  return day + (DAYS_PER_MONTH - dom) + PAY_DAYS[0];
};

/** Absolute day of card's next due date strictly after `day`. */
export const nextDueDateAfter = (day: number, dueDay: number): number => {
  const dom = dayOfMonth(day);
  return dueDay > dom
    ? day + (dueDay - dom)
    : day + (DAYS_PER_MONTH - dom) + dueDay;
};

/** Interest one day would post on the card's current balance, in cents (fractional). */
export const dailyInterest = (card: CardState): number =>
  (card.balance * card.apr) / 365;

/** The minimum amount still owed this cycle, in cents. */
export const minimumDueNow = (card: CardState): number =>
  Math.max(
    0,
    Math.min(card.minPayment, card.balance + card.paidThisCycle) -
      card.paidThisCycle,
  );

const INITIAL_CARDS: CardState[] = [
  {
    id: "aurora",
    name: "Aurora Bank",
    network: "visa",
    last4: "4921",
    balance: 35000,
    startingBalance: 35000,
    limit: 300000,
    apr: 0.1999,
    minPayment: 2500,
    dueDay: 10,
    paidThisCycle: 0,
    interestCarry: 0,
    interestAccrued: 0,
    lateFees: 0,
    theme: { from: "#312e81", to: "#3b82f6", glow: "#60a5fa", mark: "#3b82f6" },
  },
  {
    id: "ember",
    name: "Ember Credit",
    network: "mastercard",
    last4: "7305",
    balance: 40000,
    startingBalance: 40000,
    limit: 200000,
    apr: 0.2399,
    minPayment: 2000,
    dueDay: 18,
    paidThisCycle: 0,
    interestCarry: 0,
    interestAccrued: 0,
    lateFees: 0,
    theme: { from: "#7f1d1d", to: "#f97316", glow: "#fb923c", mark: "#ea580c" },
  },
  {
    id: "meadow",
    name: "Meadow Card",
    network: "discover",
    last4: "1188",
    balance: 30000,
    startingBalance: 30000,
    limit: 150000,
    apr: 0.1699,
    minPayment: 1500,
    dueDay: 24,
    paidThisCycle: 0,
    interestCarry: 0,
    interestAccrued: 0,
    lateFees: 0,
    theme: { from: "#064e3b", to: "#10b981", glow: "#34d399", mark: "#059669" },
  },
];

const snapshot = (state: GameState): Snapshot => ({
  day: state.day,
  totalDebt: state.cards.reduce((sum, c) => sum + c.balance, 0),
  totalInterest: state.totalInterest,
});

export const createInitialState = (): GameState => {
  const state: GameState = {
    day: 1,
    money: 20000, // $200 starting cash
    stage: "earn", // day 1 is a payday
    cards: INITIAL_CARDS.map((c) => ({ ...c, theme: { ...c.theme } })),
    totalInterest: 0,
    totalLateFees: 0,
    totalPaid: 0,
    paycheckCount: 0,
    log: [],
    snapshots: [],
  };
  state.snapshots.push(snapshot(state));
  return state;
};

export const totalDebt = (state: GameState): number =>
  state.cards.reduce((sum, c) => sum + c.balance, 0);

const allPaidOff = (cards: CardState[]): boolean =>
  cards.every((c) => c.balance === 0);

/**
 * Simulate one day passing for one card: post daily interest (with sub-cent
 * carry), and if the day landing is the card's due date, charge a late fee when
 * the cycle's minimum wasn't met, then start a new cycle.
 * Mutates the passed-in copies; callers own the cloning.
 */
const advanceCardOneDay = (
  card: CardState,
  landedDay: number,
  ledger: { interest: number; lateFees: number; log: LogEntry[] },
): void => {
  if (card.balance > 0) {
    card.interestCarry += dailyInterest(card);
    const posted = Math.floor(card.interestCarry);
    if (posted > 0) {
      card.interestCarry -= posted;
      card.balance += posted;
      card.interestAccrued += posted;
      ledger.interest += posted;
    }
  }

  if (dayOfMonth(landedDay) === card.dueDay) {
    const owedThisCycle = Math.min(
      card.minPayment,
      card.balance + card.paidThisCycle,
    );
    if (card.balance > 0 && card.paidThisCycle < owedThisCycle) {
      card.balance += LATE_FEE;
      card.lateFees += 1;
      ledger.lateFees += LATE_FEE;
      ledger.log.push({
        day: landedDay,
        kind: "late-fee",
        cardId: card.id,
        amount: LATE_FEE,
      });
    }
    card.paidThisCycle = 0; // new billing cycle starts after the due date
  }
};

/** Advance the clock day-by-day to the next payday, accruing interest and fees. */
export const advanceToNextPayday = (state: GameState): GameState => {
  if (state.stage === "complete") return state;

  const target = nextPaydayAfter(state.day);
  const cards = state.cards.map((c) => ({ ...c }));
  const ledger = { interest: 0, lateFees: 0, log: [] as LogEntry[] };
  const snapshots = [...state.snapshots];

  for (let day = state.day + 1; day <= target; day++) {
    for (const card of cards) advanceCardOneDay(card, day, ledger);
    snapshots.push({
      day,
      totalDebt: cards.reduce((sum, c) => sum + c.balance, 0),
      totalInterest: state.totalInterest + ledger.interest,
    });
  }

  return {
    ...state,
    day: target,
    cards,
    stage: "earn",
    totalInterest: state.totalInterest + ledger.interest,
    totalLateFees: state.totalLateFees + ledger.lateFees,
    log: [...state.log, ...ledger.log],
    snapshots,
  };
};

/** Deposit a paycheck earned in the payday mini-game and move to the pay stage. */
export const collectPaycheck = (
  state: GameState,
  amount: number,
): GameState => {
  const total = Math.max(0, Math.round(amount));
  return {
    ...state,
    money: state.money + total,
    stage: allPaidOff(state.cards) ? "complete" : "pay",
    paycheckCount: state.paycheckCount + 1,
    log: [...state.log, { day: state.day, kind: "paycheck", amount: total }],
  };
};

/**
 * Pay `amount` cents toward a card. The amount is clamped to both the player's
 * cash and the card's balance, so money can never go negative and cards can
 * never be overpaid.
 */
export const applyPayment = (
  state: GameState,
  cardId: string,
  amount: number,
): GameState => {
  const idx = state.cards.findIndex((c) => c.id === cardId);
  if (idx === -1) return state;

  const card = state.cards[idx];
  const pay = Math.min(
    Math.max(0, Math.round(amount)),
    state.money,
    card.balance,
  );
  if (pay <= 0) return state;

  const newCard: CardState = {
    ...card,
    balance: card.balance - pay,
    paidThisCycle: card.paidThisCycle + pay,
  };
  const paidOff = newCard.balance === 0;
  if (paidOff) {
    newCard.paidOffOnDay = state.day;
    newCard.interestCarry = 0;
  }

  const cards = state.cards.map((c, i) => (i === idx ? newCard : c));
  const complete = allPaidOff(cards);
  const log: LogEntry[] = [
    ...state.log,
    { day: state.day, kind: "payment", cardId, amount: pay },
  ];
  if (paidOff) log.push({ day: state.day, kind: "payoff", cardId, amount: 0 });

  const next: GameState = {
    ...state,
    cards,
    money: state.money - pay,
    totalPaid: state.totalPaid + pay,
    stage: complete ? "complete" : state.stage,
    log,
  };
  next.snapshots = [...state.snapshots, snapshot(next)];
  return next;
};

/** Pay every card in full (only valid when the player can afford it). */
export const payEverything = (state: GameState): GameState => {
  let next = state;
  for (const card of state.cards) {
    if (card.balance > 0) next = applyPayment(next, card.id, card.balance);
  }
  return next;
};

// ---------------------------------------------------------------------------
// Scoring & analysis

export interface ScoreBreakdown {
  score: number;
  grade: "S" | "A" | "B" | "C" | "D";
  avalancheFollowed: boolean;
}

/**
 * Did payoffs happen in descending-APR order? (The avalanche method.)
 * Cards never carrying a balance are ignored.
 */
const followedAvalanche = (cards: CardState[]): boolean => {
  const paidOff = cards
    .filter((c) => c.paidOffOnDay !== undefined)
    .sort((a, b) => (a.paidOffOnDay ?? 0) - (b.paidOffOnDay ?? 0));
  for (let i = 1; i < paidOff.length; i++) {
    if (paidOff[i].apr > paidOff[i - 1].apr) return false;
  }
  return paidOff.length === cards.length;
};

export const computeScore = (state: GameState): ScoreBreakdown => {
  const interestDollars = state.totalInterest / 100;
  const feeDollars = state.totalLateFees / 100;
  const avalancheFollowed = followedAvalanche(state.cards);

  let score = 1000;
  score -= interestDollars * 4;
  score -= feeDollars * 3;
  score -= Math.max(0, state.day - 1) * 1.5;
  if (avalancheFollowed) score += 150;
  score = Math.max(0, Math.round(score));

  const grade =
    score >= 950
      ? "S"
      : score >= 850
        ? "A"
        : score >= 700
          ? "B"
          : score >= 500
            ? "C"
            : "D";

  return { score, grade, avalancheFollowed };
};

export interface BaselineResult {
  days: number;
  totalInterest: number; // cents
  capped: boolean;
}

/**
 * What would have happened paying ONLY the minimum on each due date?
 * Used on the results screen to show how much the player's strategy saved.
 * Capped at 10 simulated years.
 */
export const simulateMinimumOnly = (): BaselineResult => {
  const cards = INITIAL_CARDS.map((c) => ({ ...c }));
  const CAP = 3650;
  let totalInterest = 0;
  let day = 1;

  while (day < CAP && !allPaidOff(cards)) {
    day++;
    for (const card of cards) {
      if (card.balance > 0) {
        card.interestCarry += dailyInterest(card);
        const posted = Math.floor(card.interestCarry);
        card.interestCarry -= posted;
        card.balance += posted;
        totalInterest += posted;
      }
      if (dayOfMonth(day) === card.dueDay && card.balance > 0) {
        card.balance -= Math.min(card.minPayment, card.balance);
      }
    }
  }

  return { days: day, totalInterest, capped: day >= CAP };
};

// ---------------------------------------------------------------------------
// Formatting

/** Format cents as dollars: fmtMoney(123456) → "$1,234.56"; whole dollars omit cents. */
export const fmtMoney = (
  cents: number,
  opts?: { alwaysCents?: boolean },
): string => {
  const dollars = cents / 100;
  const hasCents = opts?.alwaysCents || Math.round(cents) % 100 !== 0;
  return dollars.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: hasCents ? 2 : 0,
    maximumFractionDigits: hasCents ? 2 : 0,
  });
};

export const fmtApr = (apr: number): string => `${(apr * 100).toFixed(2)}%`;
