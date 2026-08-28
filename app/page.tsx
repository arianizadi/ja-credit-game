"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import { Background } from "./components/Background";
import { CardArt } from "./components/CardArt";
import { EndScreen } from "./components/EndScreen";
import { PaydayGame } from "./components/PaydayGame";
import { PaymentModal } from "./components/PaymentModal";
import { Timeline } from "./components/Timeline";
import { Tutorial } from "./components/Tutorial";
import {
  dayOfMonth,
  fmtMoney,
  minimumDueNow,
  monthName,
  nextPaydayAfter,
  totalDebt,
} from "./game/engine";
import { useGameState } from "./hooks/useGameState";

const TUTORIAL_SEEN_KEY = "ja-credit-game-tutorial-seen";

export default function Home() {
  const {
    state,
    hydrated,
    makePayment,
    payEverything,
    collectPaycheck,
    advanceToPayday,
    resetGame,
  } = useGameState();
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [showTutorial, setShowTutorial] = useState(false);
  const [showPaydayGame, setShowPaydayGame] = useState(false);

  // First visit: show the tutorial once.
  useEffect(() => {
    if (!hydrated) return;
    try {
      if (!localStorage.getItem(TUTORIAL_SEEN_KEY)) setShowTutorial(true);
    } catch {
      setShowTutorial(true);
    }
  }, [hydrated]);

  const closeTutorial = () => {
    setShowTutorial(false);
    try {
      localStorage.setItem(TUTORIAL_SEEN_KEY, "1");
    } catch {
      /* ignore */
    }
  };

  const debt = totalDebt(state);
  const selectedCard = state.cards.find((c) => c.id === selectedCardId) ?? null;
  const highestAprId = useMemo(() => {
    const open = state.cards.filter((c) => c.balance > 0);
    if (open.length === 0) return null;
    return open.reduce((a, b) => (b.apr > a.apr ? b : a)).id;
  }, [state.cards]);

  const payday = nextPaydayAfter(state.day);
  const dailyBurn = state.cards.reduce(
    (sum, c) => sum + (c.balance * c.apr) / 365,
    0,
  );
  const minsOutstanding = state.cards.reduce(
    (sum, c) => sum + minimumDueNow(c),
    0,
  );

  if (!hydrated) {
    return <main className="min-h-dvh" />;
  }

  return (
    <main className="min-h-dvh pb-16">
      <Background />
      <Tutorial open={showTutorial} onClose={closeTutorial} />

      <div className="mx-auto max-w-5xl px-4 pt-6 sm:pt-10">
        {/* header */}
        <motion.header
          className="mb-6 flex flex-wrap items-center justify-between gap-3"
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div>
            <h1 className="text-2xl font-black tracking-tight sm:text-3xl">
              Debt{" "}
              <span className="bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent">
                Avalanche
              </span>
            </h1>
            <p className="text-sm text-[color:var(--ink-secondary)]">
              {monthName(state.day)} {dayOfMonth(state.day)} · day {state.day}
            </p>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setShowTutorial(true)}
              className="glass rounded-xl px-4 py-2 text-sm font-semibold text-[color:var(--ink-secondary)] hover:bg-white/10"
            >
              How to play
            </button>
            <button
              type="button"
              onClick={() => {
                if (
                  window.confirm(
                    "Start over? Your current game will be erased.",
                  )
                )
                  resetGame();
              }}
              className="glass rounded-xl px-4 py-2 text-sm font-semibold text-[color:var(--ink-secondary)] hover:bg-white/10"
            >
              Reset
            </button>
          </div>
        </motion.header>

        {/* stat tiles */}
        <motion.div
          className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
        >
          <div className="glass rounded-2xl p-4">
            <div className="text-[11px] uppercase tracking-wider text-[color:var(--ink-muted)]">
              Cash
            </div>
            <div className="mono text-2xl font-extrabold text-emerald-300">
              {fmtMoney(state.money)}
            </div>
          </div>
          <div className="glass rounded-2xl p-4">
            <div className="text-[11px] uppercase tracking-wider text-[color:var(--ink-muted)]">
              Total debt
            </div>
            <div className="mono text-2xl font-extrabold text-rose-300">
              {fmtMoney(debt)}
            </div>
          </div>
          <div className="glass rounded-2xl p-4">
            <div className="text-[11px] uppercase tracking-wider text-[color:var(--ink-muted)]">
              Interest paid
            </div>
            <div className="mono text-2xl font-extrabold text-[color:var(--ink)]">
              {fmtMoney(state.totalInterest, { alwaysCents: true })}
            </div>
          </div>
          <div className="glass rounded-2xl p-4">
            <div className="text-[11px] uppercase tracking-wider text-[color:var(--ink-muted)]">
              Costing you daily
            </div>
            <div className="mono text-2xl font-extrabold text-amber-300">
              {fmtMoney(Math.round(dailyBurn), { alwaysCents: true })}
            </div>
          </div>
        </motion.div>

        {/* timeline */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Timeline day={state.day} cards={state.cards} />
        </motion.div>

        {/* stage content */}
        <AnimatePresence mode="wait">
          {state.stage === "earn" && (
            <motion.section
              key="earn"
              className="mt-10 text-center"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
            >
              <h2 className="mb-2 text-3xl font-extrabold">
                It&apos;s payday 💵
              </h2>
              <p className="mx-auto mb-6 max-w-md text-[color:var(--ink-secondary)]">
                Work your shift to collect your paycheck — then put it to work
                against your debt.
              </p>
              <button
                type="button"
                onClick={() => setShowPaydayGame(true)}
                className="rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 px-10 py-4 text-lg font-bold text-white shadow-lg shadow-emerald-500/25 transition-transform hover:scale-105 active:scale-95"
              >
                Collect paycheck →
              </button>
            </motion.section>
          )}

          {state.stage === "pay" && (
            <motion.section
              key="pay"
              className="mt-8"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
            >
              <div className="mb-6 text-center">
                <h2 className="text-2xl font-extrabold sm:text-3xl">
                  Which card do you pay?
                </h2>
                <p className="mt-1 text-sm text-[color:var(--ink-secondary)]">
                  🏔️ Avalanche tip: minimums on everything, then hammer the
                  highest APR.
                  {minsOutstanding > 0 && (
                    <>
                      {" "}
                      Minimums still due:{" "}
                      <strong className="mono text-amber-300">
                        {fmtMoney(minsOutstanding)}
                      </strong>
                    </>
                  )}
                </p>
              </div>

              <div className="grid grid-cols-1 justify-items-center gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {state.cards.map((card, i) => (
                  <motion.div
                    key={card.id}
                    className="w-full max-w-[352px]"
                    initial={{ opacity: 0, y: 24 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.08 * i }}
                  >
                    <CardArt
                      card={card}
                      highestApr={card.id === highestAprId}
                      minDueSoon={minimumDueNow(card) > 0}
                      selected={selectedCardId === card.id}
                      onClick={() => setSelectedCardId(card.id)}
                    />
                  </motion.div>
                ))}
              </div>

              <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={advanceToPayday}
                  className="w-full rounded-2xl bg-gradient-to-r from-blue-500 to-indigo-500 px-8 py-3.5 font-bold text-white shadow-lg shadow-blue-500/25 transition-transform hover:scale-[1.03] active:scale-[0.97] sm:w-auto"
                >
                  Skip to next payday ({dayOfMonth(payday)}
                  {dayOfMonth(payday) === 1 ? "st" : "th"}) →
                </button>
                {debt > 0 && state.money >= debt && (
                  <button
                    type="button"
                    onClick={payEverything}
                    className="w-full rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 px-8 py-3.5 font-bold text-white shadow-lg shadow-emerald-500/25 transition-transform hover:scale-[1.03] active:scale-[0.97] sm:w-auto"
                  >
                    Pay everything off · {fmtMoney(debt)} 🏆
                  </button>
                )}
              </div>
              <p className="mt-3 text-center text-xs text-[color:var(--ink-muted)]">
                Skipping ahead lets interest accrue daily — and any missed
                minimum on the way costs a $35 late fee.
              </p>
            </motion.section>
          )}
        </AnimatePresence>
      </div>

      {/* overlays */}
      <AnimatePresence>
        {showPaydayGame && (
          <PaydayGame
            onComplete={(cents) => {
              collectPaycheck(cents);
              setShowPaydayGame(false);
            }}
          />
        )}
      </AnimatePresence>

      <PaymentModal
        card={selectedCard}
        money={state.money}
        day={state.day}
        onPay={(cents) => selectedCardId && makePayment(selectedCardId, cents)}
        onClose={() => setSelectedCardId(null)}
      />

      {state.stage === "complete" && (
        <EndScreen state={state} onPlayAgain={resetGame} />
      )}
    </main>
  );
}
