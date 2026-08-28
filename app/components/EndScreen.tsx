"use client";

import { motion } from "framer-motion";
import { useMemo, useState } from "react";
import {
  computeScore,
  fmtMoney,
  type GameState,
  simulateMinimumOnly,
} from "../game/engine";

const GRADE_COLORS: Record<string, string> = {
  S: "#fbbf24",
  A: "#34d399",
  B: "#60a5fa",
  C: "#fb923c",
  D: "#fb7185",
};

/** Debt-over-time area chart in plain SVG, with a hover crosshair + tooltip. */
const DebtChart = ({ state }: { state: GameState }) => {
  const W = 560;
  const H = 200;
  const PAD = { l: 46, r: 16, t: 14, b: 26 };
  const [hover, setHover] = useState<number | null>(null);

  const points = state.snapshots;
  const maxDebt = Math.max(...points.map((p) => p.totalDebt), 1);
  const minDay = points[0]?.day ?? 1;
  const maxDay = Math.max(points[points.length - 1]?.day ?? 1, minDay + 1);

  const x = (day: number) =>
    PAD.l + ((day - minDay) / (maxDay - minDay)) * (W - PAD.l - PAD.r);
  const y = (debt: number) =>
    PAD.t + (1 - debt / maxDebt) * (H - PAD.t - PAD.b);

  const linePath = points
    .map(
      (p, i) =>
        `${i === 0 ? "M" : "L"}${x(p.day).toFixed(1)} ${y(p.totalDebt).toFixed(1)}`,
    )
    .join(" ");
  const areaPath = `${linePath} L${x(maxDay).toFixed(1)} ${H - PAD.b} L${PAD.l} ${H - PAD.b} Z`;

  const gridValues = [0.25, 0.5, 0.75, 1].map((f) => f * maxDebt);
  const hovered = hover !== null ? points[hover] : null;

  const onMove = (e: React.PointerEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const px = ((e.clientX - rect.left) / rect.width) * W;
    let best = 0;
    let bestDist = Infinity;
    points.forEach((p, i) => {
      const d = Math.abs(x(p.day) - px);
      if (d < bestDist) {
        bestDist = d;
        best = i;
      }
    });
    setHover(best);
  };

  return (
    <figure className="glass w-full rounded-2xl p-4">
      <figcaption className="mb-2 text-sm font-semibold text-[color:var(--ink-secondary)]">
        Your debt, day by day
      </figcaption>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full touch-none"
        onPointerMove={onMove}
        onPointerLeave={() => setHover(null)}
        role="img"
        aria-label={`Total debt fell from ${fmtMoney(points[0]?.totalDebt ?? 0)} to zero over ${maxDay - minDay} days`}
      >
        <defs>
          <linearGradient id="debt-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#f43f5e" stopOpacity="0.02" />
          </linearGradient>
        </defs>

        {/* recessive grid + axis labels */}
        {gridValues.map((v) => (
          <g key={v}>
            <line
              x1={PAD.l}
              y1={y(v)}
              x2={W - PAD.r}
              y2={y(v)}
              stroke="rgba(148,163,184,0.12)"
              strokeWidth="1"
            />
            <text
              x={PAD.l - 6}
              y={y(v) + 3.5}
              textAnchor="end"
              fontSize="10"
              fill="var(--ink-muted)"
            >
              ${Math.round(v / 100)}
            </text>
          </g>
        ))}
        <line
          x1={PAD.l}
          y1={H - PAD.b}
          x2={W - PAD.r}
          y2={H - PAD.b}
          stroke="rgba(148,163,184,0.25)"
          strokeWidth="1"
        />
        <text x={PAD.l} y={H - 8} fontSize="10" fill="var(--ink-muted)">
          Day {minDay}
        </text>
        <text
          x={W - PAD.r}
          y={H - 8}
          textAnchor="end"
          fontSize="10"
          fill="var(--ink-muted)"
        >
          Day {maxDay}
        </text>

        <path d={areaPath} fill="url(#debt-fill)" />
        <path
          d={linePath}
          fill="none"
          stroke="#f43f5e"
          strokeWidth="2"
          strokeLinejoin="round"
        />

        {/* end-of-line direct label */}
        <circle
          cx={x(maxDay)}
          cy={y(points[points.length - 1]?.totalDebt ?? 0)}
          r="4"
          fill="#f43f5e"
          stroke="#0d1220"
          strokeWidth="2"
        />
        <text
          x={x(maxDay) - 8}
          y={y(0) - 8}
          textAnchor="end"
          fontSize="12"
          fontWeight="700"
          fill="var(--ink)"
        >
          Debt-free 🎉
        </text>

        {/* hover crosshair + tooltip */}
        {hovered && (
          <g pointerEvents="none">
            <line
              x1={x(hovered.day)}
              y1={PAD.t}
              x2={x(hovered.day)}
              y2={H - PAD.b}
              stroke="rgba(230,234,242,0.35)"
              strokeWidth="1"
            />
            <circle
              cx={x(hovered.day)}
              cy={y(hovered.totalDebt)}
              r="4.5"
              fill="#f43f5e"
              stroke="#e6eaf2"
              strokeWidth="2"
            />
            <g
              transform={`translate(${Math.min(Math.max(x(hovered.day) - 55, PAD.l), W - PAD.r - 110)} ${PAD.t})`}
            >
              <rect
                width="110"
                height="38"
                rx="8"
                fill="#0d1220"
                stroke="rgba(148,163,184,0.3)"
              />
              <text x="8" y="15" fontSize="10" fill="var(--ink-muted)">
                Day {hovered.day}
              </text>
              <text
                x="8"
                y="30"
                fontSize="12"
                fontWeight="700"
                fill="var(--ink)"
                fontFamily="var(--font-geist-mono), monospace"
              >
                {fmtMoney(hovered.totalDebt)}
              </text>
            </g>
          </g>
        )}
      </svg>
    </figure>
  );
};

const Confetti = () => {
  const pieces = useMemo(
    () =>
      Array.from({ length: 48 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        delay: Math.random() * 2.5,
        duration: 3 + Math.random() * 2.5,
        color: ["#fbbf24", "#34d399", "#60a5fa", "#f472b6", "#a78bfa"][i % 5],
        size: 6 + Math.random() * 6,
        rot: Math.random() * 360,
      })),
    [],
  );
  return (
    <div
      className="pointer-events-none fixed inset-0 z-40 overflow-hidden"
      aria-hidden
    >
      {pieces.map((p) => (
        <motion.div
          key={p.id}
          className="absolute rounded-sm"
          style={{
            left: `${p.x}%`,
            width: p.size,
            height: p.size * 0.55,
            background: p.color,
          }}
          initial={{ y: -30, rotate: p.rot, opacity: 1 }}
          animate={{ y: "105vh", rotate: p.rot + 540, opacity: [1, 1, 0.7] }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            repeat: Infinity,
            ease: "linear",
          }}
        />
      ))}
    </div>
  );
};

interface EndScreenProps {
  state: GameState;
  onPlayAgain: () => void;
}

export const EndScreen = ({ state, onPlayAgain }: EndScreenProps) => {
  const { score, grade, avalancheFollowed } = computeScore(state);
  const baseline = useMemo(() => simulateMinimumOnly(), []);
  const gradeColor = GRADE_COLORS[grade];
  const interestSaved = Math.max(
    0,
    baseline.totalInterest - state.totalInterest,
  );
  const monthsFaster = Math.max(
    0,
    Math.round((baseline.days - state.day) / 30),
  );

  const ringR = 54;
  const ringC = 2 * Math.PI * ringR;
  const scoreFrac = Math.min(score / 1000, 1);

  const stats = [
    {
      label: "Days to debt-free",
      value: String(state.day),
      tone: "var(--ink)",
    },
    {
      label: "Interest paid",
      value: fmtMoney(state.totalInterest, { alwaysCents: true }),
      tone: "#fb7185",
    },
    {
      label: "Late fees",
      value: fmtMoney(state.totalLateFees),
      tone: state.totalLateFees > 0 ? "#fbbf24" : "#34d399",
    },
    {
      label: "Total paid",
      value: fmtMoney(state.totalPaid, { alwaysCents: true }),
      tone: "var(--ink)",
    },
  ];

  return (
    <motion.div
      className="fixed inset-0 z-50 overflow-y-auto bg-[#04070f]/95 backdrop-blur"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <Confetti />
      <div className="mx-auto flex min-h-full max-w-2xl flex-col items-center gap-6 px-4 py-10">
        <motion.div
          className="text-center"
          initial={{ y: -16, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
        >
          <h1 className="text-4xl font-black sm:text-5xl">Debt-free! 🎉</h1>
          <p className="mt-2 text-[color:var(--ink-secondary)]">
            You paid off all three cards in{" "}
            <strong className="text-[color:var(--ink)]">
              {state.day} days
            </strong>
            .
          </p>
        </motion.div>

        {/* grade ring */}
        <motion.div
          initial={{ scale: 0.6, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{
            type: "spring",
            stiffness: 200,
            damping: 16,
            delay: 0.15,
          }}
        >
          <svg
            viewBox="0 0 140 140"
            className="h-40 w-40"
            role="img"
            aria-label={`Grade ${grade}, ${score} points`}
          >
            <circle
              cx="70"
              cy="70"
              r={ringR}
              fill="none"
              stroke="rgba(255,255,255,0.08)"
              strokeWidth="10"
            />
            <motion.circle
              cx="70"
              cy="70"
              r={ringR}
              fill="none"
              stroke={gradeColor}
              strokeWidth="10"
              strokeLinecap="round"
              strokeDasharray={ringC}
              transform="rotate(-90 70 70)"
              initial={{ strokeDashoffset: ringC }}
              animate={{ strokeDashoffset: ringC * (1 - scoreFrac) }}
              transition={{ duration: 1.2, delay: 0.4, ease: "easeOut" }}
            />
            <text
              x="70"
              y="76"
              textAnchor="middle"
              fontSize="44"
              fontWeight="900"
              fill={gradeColor}
            >
              {grade}
            </text>
            <text
              x="70"
              y="98"
              textAnchor="middle"
              fontSize="12"
              fontWeight="600"
              fill="var(--ink-secondary)"
            >
              {score} pts
            </text>
          </svg>
        </motion.div>

        {avalancheFollowed && (
          <div className="rounded-full border border-emerald-400/30 bg-emerald-400/10 px-4 py-1.5 text-sm font-semibold text-emerald-300">
            🏔️ Perfect avalanche — highest APR first, every time
          </div>
        )}

        {/* stats */}
        <div className="grid w-full grid-cols-2 gap-3 sm:grid-cols-4">
          {stats.map((s) => (
            <div key={s.label} className="glass rounded-2xl p-4 text-center">
              <div
                className="mono text-xl font-extrabold"
                style={{ color: s.tone }}
              >
                {s.value}
              </div>
              <div className="mt-1 text-[11px] uppercase tracking-wider text-[color:var(--ink-muted)]">
                {s.label}
              </div>
            </div>
          ))}
        </div>

        <DebtChart state={state} />

        {/* baseline comparison */}
        <div className="glass w-full rounded-2xl p-5">
          <h3 className="mb-2 font-bold">
            What if you&apos;d only paid minimums?
          </h3>
          <p className="text-sm leading-relaxed text-[color:var(--ink-secondary)]">
            Making only minimum payments, these cards would have taken{" "}
            <strong className="text-[color:var(--ink)]">
              {Math.round(baseline.days / 30)} months
            </strong>{" "}
            to clear and cost{" "}
            <strong className="text-rose-300">
              {fmtMoney(baseline.totalInterest)}
            </strong>{" "}
            in interest. Your strategy saved{" "}
            <strong className="text-emerald-300">
              {fmtMoney(interestSaved)}
            </strong>
            {monthsFaster > 0 && (
              <>
                {" "}
                and finished{" "}
                <strong className="text-emerald-300">
                  {monthsFaster} months
                </strong>{" "}
                sooner
              </>
            )}
            . That&apos;s the avalanche method at work. 🏔️
          </p>
        </div>

        <button
          type="button"
          onClick={onPlayAgain}
          className="rounded-2xl bg-gradient-to-r from-blue-500 to-indigo-500 px-10 py-4 text-lg font-bold text-white shadow-lg shadow-blue-500/25 transition-transform hover:scale-105 active:scale-95"
        >
          Play again 🚀
        </button>
      </div>
    </motion.div>
  );
};
