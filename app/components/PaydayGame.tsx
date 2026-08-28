"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useEffect, useRef, useState } from "react";
import { BASE_PAYCHECK, fmtMoney } from "../game/engine";

const GAME_SECONDS = 15;
const W = 400;
const H = 640;

interface Bill {
  id: number;
  x: number;
  y: number;
  speed: number; // px/s
  sway: number; // phase
  spin: number; // deg/s
  rot: number;
  value: number; // cents
  collected: boolean;
  collectedAt?: number;
}

interface Popup {
  id: number;
  x: number;
  y: number;
  value: number;
}

const BILL_KINDS = [
  { value: 1000, weight: 46, color: "#059669", edge: "#34d399" },
  { value: 2000, weight: 30, color: "#0369a1", edge: "#38bdf8" },
  { value: 5000, weight: 18, color: "#b45309", edge: "#fbbf24" },
  { value: 10000, weight: 6, color: "#be123c", edge: "#fb7185" },
];

const pickKind = (r: number) => {
  let acc = 0;
  const total = BILL_KINDS.reduce((s, k) => s + k.weight, 0);
  for (const kind of BILL_KINDS) {
    acc += kind.weight;
    if (r * total <= acc) return kind;
  }
  return BILL_KINDS[0];
};

const kindFor = (value: number) =>
  BILL_KINDS.find((k) => k.value === value) ?? BILL_KINDS[0];

interface PaydayGameProps {
  onComplete: (totalCents: number) => void;
}

/** 15-second "catch your paycheck" mini-game, rendered entirely in SVG. */
export const PaydayGame = ({ onComplete }: PaydayGameProps) => {
  const [phase, setPhase] = useState<"intro" | "playing" | "done">("intro");
  const [bills, setBills] = useState<Bill[]>([]);
  const [popups, setPopups] = useState<Popup[]>([]);
  const [collected, setCollected] = useState(0); // cents
  const [timeLeft, setTimeLeft] = useState(GAME_SECONDS);

  const nextId = useRef(1);
  const spawnAccum = useRef(0);
  const raf = useRef(0);
  const lastT = useRef(0);
  const endAt = useRef(0);

  const start = () => {
    setPhase("playing");
    setBills([]);
    setPopups([]);
    setCollected(0);
    setTimeLeft(GAME_SECONDS);
    endAt.current = performance.now() + GAME_SECONDS * 1000;
    lastT.current = performance.now();
  };

  const tick = useCallback((now: number) => {
    const dt = Math.min((now - lastT.current) / 1000, 0.1);
    lastT.current = now;
    const remaining = Math.max(0, (endAt.current - now) / 1000);
    setTimeLeft(remaining);

    if (remaining <= 0) {
      setPhase("done");
      return;
    }

    // spawn: ramps up slightly over the round
    spawnAccum.current += dt;
    const interval = 0.55 - 0.15 * (1 - remaining / GAME_SECONDS);
    const spawned: Bill[] = [];
    while (spawnAccum.current >= interval) {
      spawnAccum.current -= interval;
      const kind = pickKind(Math.random());
      spawned.push({
        id: nextId.current++,
        x: 36 + Math.random() * (W - 72),
        y: -30,
        speed: 120 + Math.random() * 90 + (kind.value >= 5000 ? 60 : 0),
        sway: Math.random() * Math.PI * 2,
        spin: (Math.random() - 0.5) * 120,
        rot: (Math.random() - 0.5) * 40,
        value: kind.value,
        collected: false,
      });
    }

    setBills((prev) => [
      ...prev
        .filter(
          (b) =>
            b.y < H + 40 && (!b.collected || now - (b.collectedAt ?? 0) < 300),
        )
        .map((b) =>
          b.collected
            ? b
            : {
                ...b,
                y: b.y + b.speed * dt,
                rot: b.rot + b.spin * dt,
                x: b.x + Math.sin(now / 400 + b.sway) * 28 * dt,
              },
        ),
      ...spawned,
    ]);

    raf.current = requestAnimationFrame(tick);
  }, []);

  useEffect(() => {
    if (phase === "playing") {
      raf.current = requestAnimationFrame(tick);
      return () => cancelAnimationFrame(raf.current);
    }
  }, [phase, tick]);

  const collect = (bill: Bill) => {
    if (bill.collected) return;
    setCollected((c) => c + bill.value);
    setBills((prev) =>
      prev.map((b) =>
        b.id === bill.id
          ? { ...b, collected: true, collectedAt: performance.now() }
          : b,
      ),
    );
    setPopups((prev) => [
      ...prev.slice(-8),
      { id: bill.id, x: bill.x, y: bill.y, value: bill.value },
    ]);
  };

  const total = BASE_PAYCHECK + collected;
  const ringR = 20;
  const ringC = 2 * Math.PI * ringR;

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#04070f]/95 backdrop-blur"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="relative h-full max-h-[820px] w-full max-w-[480px] p-4">
        {phase === "intro" && (
          <div className="flex h-full flex-col items-center justify-center gap-6 text-center">
            <motion.svg
              aria-hidden="true"
              viewBox="0 0 120 80"
              className="w-40"
              initial={{ y: -10 }}
              animate={{ y: 10 }}
              transition={{
                repeat: Infinity,
                repeatType: "reverse",
                duration: 1.6,
                ease: "easeInOut",
              }}
            >
              <rect
                x="10"
                y="20"
                width="100"
                height="46"
                rx="6"
                fill="#059669"
                stroke="#34d399"
                strokeWidth="2"
              />
              <circle
                cx="60"
                cy="43"
                r="14"
                fill="none"
                stroke="#a7f3d0"
                strokeWidth="2"
              />
              <text
                x="60"
                y="49"
                textAnchor="middle"
                fontSize="16"
                fontWeight="800"
                fill="#a7f3d0"
              >
                $
              </text>
            </motion.svg>
            <div>
              <h2 className="mb-2 text-3xl font-extrabold">
                It&apos;s payday! 💵
              </h2>
              <p className="mx-auto max-w-xs text-[color:var(--ink-secondary)]">
                Tap the falling bills for{" "}
                <strong className="text-[color:var(--ink)]">
                  {GAME_SECONDS} seconds
                </strong>{" "}
                to boost your{" "}
                <span className="mono font-semibold text-emerald-300">
                  {fmtMoney(BASE_PAYCHECK)}
                </span>{" "}
                base paycheck.
              </p>
            </div>
            <button
              type="button"
              onClick={start}
              className="rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 px-10 py-4 text-lg font-bold text-white shadow-lg shadow-emerald-500/25 transition-transform hover:scale-105 active:scale-95"
            >
              Start my shift →
            </button>
          </div>
        )}

        {phase === "playing" && (
          <div className="flex h-full flex-col">
            {/* HUD */}
            <div className="mb-2 flex items-center justify-between px-1">
              <div className="glass flex items-center gap-2 rounded-full px-4 py-2">
                <span className="text-xs uppercase tracking-wider text-[color:var(--ink-muted)]">
                  Earned
                </span>
                <span className="mono text-lg font-extrabold text-emerald-300">
                  {fmtMoney(total)}
                </span>
              </div>
              <svg
                viewBox="0 0 52 52"
                className="h-12 w-12 -rotate-90"
                role="img"
                aria-label={`${Math.ceil(timeLeft)} seconds left`}
              >
                <circle
                  cx="26"
                  cy="26"
                  r={ringR}
                  fill="none"
                  stroke="rgba(255,255,255,0.12)"
                  strokeWidth="5"
                />
                <circle
                  cx="26"
                  cy="26"
                  r={ringR}
                  fill="none"
                  stroke={timeLeft < 4 ? "#fb7185" : "#34d399"}
                  strokeWidth="5"
                  strokeLinecap="round"
                  strokeDasharray={ringC}
                  strokeDashoffset={ringC * (1 - timeLeft / GAME_SECONDS)}
                />
                <text
                  x="26"
                  y="31"
                  textAnchor="middle"
                  fontSize="15"
                  fontWeight="800"
                  fill="var(--ink)"
                  transform="rotate(90 26 26)"
                >
                  {Math.ceil(timeLeft)}
                </text>
              </svg>
            </div>

            {/* play field */}
            <svg
              viewBox={`0 0 ${W} ${H}`}
              className="glass min-h-0 flex-1 touch-none select-none rounded-3xl"
              role="img"
              aria-label="Falling bills — tap them to collect"
            >
              <defs>
                <linearGradient id="field" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#0b1424" />
                  <stop offset="100%" stopColor="#070b15" />
                </linearGradient>
              </defs>
              <rect width={W} height={H} rx="24" fill="url(#field)" />

              {bills.map((bill) => {
                const kind = kindFor(bill.value);
                return (
                  <g
                    key={bill.id}
                    transform={`translate(${bill.x} ${bill.y}) rotate(${bill.rot})`}
                    onPointerDown={() => collect(bill)}
                    style={{
                      cursor: "pointer",
                      opacity: bill.collected ? 0 : 1,
                      transition: bill.collected ? "opacity 0.25s" : undefined,
                    }}
                  >
                    {/* generous invisible hit target */}
                    <rect
                      x="-44"
                      y="-32"
                      width="88"
                      height="64"
                      fill="transparent"
                    />
                    <rect
                      x="-34"
                      y="-20"
                      width="68"
                      height="40"
                      rx="5"
                      fill={kind.color}
                      stroke={kind.edge}
                      strokeWidth="2"
                    />
                    <rect
                      x="-29"
                      y="-15"
                      width="58"
                      height="30"
                      rx="3"
                      fill="none"
                      stroke={kind.edge}
                      strokeWidth="1"
                      opacity="0.5"
                    />
                    <circle
                      r="11"
                      fill="none"
                      stroke={kind.edge}
                      strokeWidth="1.5"
                      opacity="0.8"
                    />
                    <text
                      y="5"
                      textAnchor="middle"
                      fontSize="13"
                      fontWeight="800"
                      fill="#ffffff"
                    >
                      ${bill.value / 100}
                    </text>
                  </g>
                );
              })}

              {popups.map((p) => (
                <g key={`pop-${p.id}`}>
                  <text
                    x={p.x}
                    y={p.y}
                    textAnchor="middle"
                    fontSize="20"
                    fontWeight="800"
                    fill="#34d399"
                  >
                    +${p.value / 100}
                    <animate
                      attributeName="y"
                      from={String(p.y)}
                      to={String(p.y - 60)}
                      dur="0.7s"
                      fill="freeze"
                    />
                    <animate
                      attributeName="opacity"
                      from="1"
                      to="0"
                      dur="0.7s"
                      fill="freeze"
                    />
                  </text>
                </g>
              ))}
            </svg>
          </div>
        )}

        <AnimatePresence>
          {phase === "done" && (
            <motion.div
              className="flex h-full flex-col items-center justify-center gap-6 text-center"
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <div className="glass w-full max-w-sm rounded-3xl p-8">
                <div className="mb-1 text-sm uppercase tracking-widest text-[color:var(--ink-muted)]">
                  Paycheck
                </div>
                <div className="mono mb-6 text-5xl font-extrabold text-emerald-300">
                  {fmtMoney(total)}
                </div>
                <div className="space-y-2 text-sm text-[color:var(--ink-secondary)]">
                  <div className="flex justify-between">
                    <span>Base salary</span>
                    <span className="mono">{fmtMoney(BASE_PAYCHECK)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Hustle bonus</span>
                    <span className="mono text-emerald-300">
                      +{fmtMoney(collected)}
                    </span>
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => onComplete(total)}
                className="rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 px-10 py-4 text-lg font-bold text-white shadow-lg shadow-emerald-500/25 transition-transform hover:scale-105 active:scale-95"
              >
                Deposit &amp; pay debts →
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};
