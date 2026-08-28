"use client";

import { Fragment } from "react";
import {
  type CardState,
  dayOfMonth,
  nextDueDateAfter,
  nextPaydayAfter,
} from "../game/engine";

interface TimelineProps {
  day: number;
  cards: CardState[];
}

const SPAN = 16; // days shown, starting today

/**
 * SVG strip of the next two weeks: today, the next payday, and each card's
 * due date (identity dot + label, so identity is never color-alone).
 */
export const Timeline = ({ day, cards }: TimelineProps) => {
  const width = 720;
  const pad = 28;
  const step = (width - pad * 2) / (SPAN - 1);
  const x = (d: number) => pad + (d - day) * step;

  const payday = nextPaydayAfter(day);
  const dueMarks = cards
    .filter((c) => c.balance > 0)
    .map((c) => ({ card: c, dueOn: nextDueDateAfter(day, c.dueDay) }))
    .filter((m) => m.dueOn < day + SPAN);

  return (
    <div className="glass overflow-x-auto rounded-2xl px-4 py-3">
      <svg
        viewBox={`0 0 ${width} 92`}
        className="min-w-[560px] w-full"
        role="img"
        aria-label="Timeline of the next two weeks: today, payday, and card due dates"
      >
        {/* baseline */}
        <line
          x1={pad}
          y1="58"
          x2={width - pad}
          y2="58"
          stroke="rgba(148,163,184,0.25)"
          strokeWidth="1.5"
        />

        {/* day ticks */}
        {Array.from({ length: SPAN }, (_, i) => day + i).map((d) => (
          <Fragment key={d}>
            <line
              x1={x(d)}
              y1="54"
              x2={x(d)}
              y2="62"
              stroke="rgba(148,163,184,0.35)"
              strokeWidth="1"
            />
            <text
              x={x(d)}
              y="80"
              textAnchor="middle"
              fontSize="10"
              fill="var(--ink-muted)"
            >
              {dayOfMonth(d)}
            </text>
          </Fragment>
        ))}

        {/* today marker */}
        <circle cx={x(day)} cy="58" r="7" fill="#e6eaf2" />
        <circle
          cx={x(day)}
          cy="58"
          r="11"
          fill="none"
          stroke="#e6eaf2"
          strokeOpacity="0.35"
          strokeWidth="2"
        >
          <animate
            attributeName="r"
            values="9;13;9"
            dur="2.4s"
            repeatCount="indefinite"
          />
          <animate
            attributeName="stroke-opacity"
            values="0.4;0.08;0.4"
            dur="2.4s"
            repeatCount="indefinite"
          />
        </circle>
        <text
          x={x(day)}
          y="38"
          textAnchor="middle"
          fontSize="11"
          fontWeight="700"
          fill="var(--ink)"
        >
          Today
        </text>

        {/* payday marker */}
        {payday < day + SPAN && (
          <>
            <rect
              x={x(payday) - 8}
              y="50"
              width="16"
              height="16"
              rx="4"
              fill="#34d399"
              opacity="0.9"
            />
            <text
              x={x(payday)}
              y="62"
              textAnchor="middle"
              fontSize="10"
              fontWeight="800"
              fill="#052e1f"
            >
              $
            </text>
            <text
              x={x(payday)}
              y="38"
              textAnchor="middle"
              fontSize="11"
              fontWeight="700"
              fill="#34d399"
            >
              Payday
            </text>
          </>
        )}

        {/* due-date markers */}
        {dueMarks.map(({ card, dueOn }, i) => (
          <Fragment key={card.id}>
            <circle
              cx={x(dueOn)}
              cy="58"
              r="6"
              fill={card.theme.mark}
              stroke="#0d1220"
              strokeWidth="2"
            />
            <text
              x={x(dueOn)}
              y={i % 2 === 0 ? 22 : 38}
              textAnchor="middle"
              fontSize="10"
              fontWeight="600"
              fill="var(--ink-secondary)"
            >
              {card.name.split(" ")[0]} due
            </text>
          </Fragment>
        ))}
      </svg>
    </div>
  );
};
