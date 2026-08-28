"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import {
  type CardState,
  fmtApr,
  fmtMoney,
  minimumDueNow,
  nextDueDateAfter,
  nextPaydayAfter,
} from "../game/engine";

interface PaymentModalProps {
  card: CardState | null;
  money: number; // cents
  day: number;
  onPay: (cents: number) => void;
  onClose: () => void;
}

export const PaymentModal = ({
  card,
  money,
  day,
  onPay,
  onClose,
}: PaymentModalProps) => {
  const [amount, setAmount] = useState(0); // cents

  const maxPay = card ? Math.min(money, card.balance) : 0;
  const minDue = card ? minimumDueNow(card) : 0;

  // sensible default: the minimum still due, or everything if less than that
  useEffect(() => {
    if (card) setAmount(Math.min(Math.max(minDue, 0) || maxPay, maxPay));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [card?.id, maxPay, card, minDue]);

  const projection = useMemo(() => {
    if (!card) return null;
    const daysToPayday = nextPaydayAfter(day) - day;
    const perDayNow = (card.balance * card.apr) / 365;
    const perDayAfter = (Math.max(0, card.balance - amount) * card.apr) / 365;
    return {
      daysToPayday,
      savedByPayday: Math.round((perDayNow - perDayAfter) * daysToPayday),
      perDayAfter,
      dueOn: nextDueDateAfter(day, card.dueDay),
    };
  }, [card, amount, day]);

  const clamp = (v: number) => Math.min(Math.max(0, Math.round(v)), maxPay);

  const quicks = card
    ? [
        { label: "Min due", value: Math.min(minDue, maxPay), show: minDue > 0 },
        { label: "Half", value: clamp(card.balance / 2), show: true },
        {
          label: "Full balance",
          value: Math.min(card.balance, maxPay),
          show: true,
        },
        { label: "All my cash", value: maxPay, show: money < card.balance },
      ].filter((q) => q.show && q.value > 0)
    : [];

  return (
    <AnimatePresence>
      {card && (
        <motion.div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-4 backdrop-blur-sm sm:items-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="glass w-full max-w-md rounded-3xl p-6"
            style={{ background: "rgba(13,18,32,0.92)" }}
            initial={{ y: 40, opacity: 0, scale: 0.97 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 40, opacity: 0, scale: 0.97 }}
            transition={{ type: "spring", stiffness: 320, damping: 28 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* header */}
            <div className="mb-5 flex items-center gap-3">
              <svg
                aria-hidden="true"
                viewBox="0 0 44 30"
                className="h-8 w-12 shrink-0"
              >
                <defs>
                  <linearGradient
                    id={`mini-${card.id}`}
                    x1="0"
                    y1="0"
                    x2="1"
                    y2="1"
                  >
                    <stop offset="0%" stopColor={card.theme.from} />
                    <stop offset="100%" stopColor={card.theme.to} />
                  </linearGradient>
                </defs>
                <rect
                  width="44"
                  height="30"
                  rx="5"
                  fill={`url(#mini-${card.id})`}
                />
                <rect
                  x="5"
                  y="8"
                  width="9"
                  height="7"
                  rx="1.5"
                  fill="#fde68a"
                  opacity="0.9"
                />
              </svg>
              <div className="min-w-0 flex-1">
                <h2 className="truncate text-lg font-bold">{card.name}</h2>
                <p className="text-xs text-[color:var(--ink-secondary)]">
                  {fmtApr(card.apr)} APR · due the {card.dueDay}th
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                className="rounded-full p-2 text-[color:var(--ink-secondary)] hover:bg-white/10"
              >
                <svg
                  aria-hidden="true"
                  viewBox="0 0 20 20"
                  className="h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                >
                  <path d="M5 5 L15 15 M15 5 L5 15" />
                </svg>
              </button>
            </div>

            {/* numbers */}
            <div className="mb-5 grid grid-cols-2 gap-3">
              <div className="rounded-2xl bg-white/5 p-3">
                <div className="text-[11px] uppercase tracking-wider text-[color:var(--ink-muted)]">
                  Balance
                </div>
                <div className="mono text-xl font-bold text-rose-300">
                  {fmtMoney(card.balance, { alwaysCents: true })}
                </div>
              </div>
              <div className="rounded-2xl bg-white/5 p-3">
                <div className="text-[11px] uppercase tracking-wider text-[color:var(--ink-muted)]">
                  Your cash
                </div>
                <div className="mono text-xl font-bold text-emerald-300">
                  {fmtMoney(money, { alwaysCents: true })}
                </div>
              </div>
            </div>

            {minDue > 0 && (
              <p className="mb-4 rounded-xl border border-amber-400/30 bg-amber-400/10 px-3 py-2 text-sm text-amber-200">
                Minimum of <strong className="mono">{fmtMoney(minDue)}</strong>{" "}
                due by the {card.dueDay}th — missing it costs a{" "}
                <strong>$35 late fee</strong>.
              </p>
            )}

            {/* amount picker */}
            <div className="mb-2 flex items-baseline justify-between">
              <label
                htmlFor="pay-amount"
                className="text-sm font-medium text-[color:var(--ink-secondary)]"
              >
                Payment amount
              </label>
              <output
                htmlFor="pay-amount"
                className="mono text-2xl font-extrabold"
              >
                {fmtMoney(amount, { alwaysCents: true })}
              </output>
            </div>
            <input
              id="pay-amount"
              type="range"
              min={0}
              max={maxPay}
              step={100}
              value={Math.min(amount, maxPay)}
              onChange={(e) => setAmount(clamp(Number(e.target.value)))}
              className="mb-3 w-full"
            />
            <div className="mb-5 flex flex-wrap gap-2">
              {quicks.map((q) => (
                <button
                  key={q.label}
                  type="button"
                  onClick={() => setAmount(q.value)}
                  className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
                    amount === q.value
                      ? "border-blue-400 bg-blue-500/25 text-blue-200"
                      : "border-white/15 bg-white/5 text-[color:var(--ink-secondary)] hover:bg-white/10"
                  }`}
                >
                  {q.label} · {fmtMoney(q.value)}
                </button>
              ))}
            </div>

            {/* projection */}
            {projection && amount > 0 && (
              <p className="mb-5 rounded-xl bg-emerald-400/10 px-3 py-2 text-sm text-emerald-200">
                Paying this now saves about{" "}
                <strong className="mono">
                  {fmtMoney(Math.max(projection.savedByPayday, 1), {
                    alwaysCents: true,
                  })}
                </strong>{" "}
                in interest before your next payday
                {amount >= card.balance &&
                  " — and clears this card for good! 🎉"}
              </p>
            )}

            <button
              type="button"
              onClick={() => {
                if (amount > 0) {
                  onPay(amount);
                  onClose();
                }
              }}
              disabled={amount <= 0}
              className="w-full rounded-2xl bg-gradient-to-r from-blue-500 to-indigo-500 py-3.5 text-base font-bold text-white shadow-lg shadow-blue-500/25 transition-transform hover:scale-[1.01] active:scale-[0.99] disabled:opacity-40"
            >
              {amount >= card.balance && amount > 0
                ? "Pay it off 🏆"
                : "Make payment"}
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
