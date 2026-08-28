"use client";

import { motion } from "framer-motion";
import {
  type CardState,
  fmtApr,
  fmtMoney,
  minimumDueNow,
} from "../game/engine";

/** Network mark rendered in the card's bottom-right corner. */
const NetworkMark = ({ network }: { network: CardState["network"] }) => {
  switch (network) {
    case "visa":
      return (
        <text
          x="328"
          y="196"
          textAnchor="end"
          fontSize="24"
          fontStyle="italic"
          fontWeight="800"
          fill="#ffffff"
          opacity="0.92"
          letterSpacing="1"
        >
          VISA
        </text>
      );
    case "mastercard":
      return (
        <g opacity="0.92">
          <circle cx="298" cy="188" r="15" fill="#eb001b" />
          <circle cx="318" cy="188" r="15" fill="#f79e1b" />
          <path
            d="M 308 176.5 a 15 15 0 0 1 0 23 a 15 15 0 0 1 0 -23 Z"
            fill="#ff5f00"
          />
        </g>
      );
    case "discover":
      return (
        <g opacity="0.92">
          <text
            x="300"
            y="194"
            textAnchor="end"
            fontSize="15"
            fontWeight="700"
            fill="#ffffff"
            letterSpacing="0.5"
          >
            DISCOVER
          </text>
          <circle cx="314" cy="189" r="9" fill="#f97316" />
        </g>
      );
  }
};

const Chip = () => (
  <g transform="translate(28, 74)">
    <rect
      width="44"
      height="34"
      rx="6"
      fill="url(#chip-gold)"
      stroke="rgba(120,80,10,0.5)"
    />
    <path
      d="M0 12 H16 M0 22 H16 M28 12 H44 M28 22 H44 M16 12 V0 M16 22 V34 M28 12 V0 M28 22 V34 M16 12 H28 M16 22 H28"
      stroke="rgba(120,80,10,0.55)"
      strokeWidth="1.4"
      fill="none"
    />
  </g>
);

const Contactless = () => (
  <g
    transform="translate(86, 82)"
    stroke="rgba(255,255,255,0.75)"
    strokeWidth="2.2"
    fill="none"
    strokeLinecap="round"
  >
    <path
      d="M0 14 a 14 14 0 0 1 0 -8"
      transform="rotate(45 7 10)"
      opacity="0"
    />
    <path d="M2 4 a 9 9 0 0 1 0 12" />
    <path d="M7 0 a 15 15 0 0 1 0 20" />
    <path d="M12 -4 a 21 21 0 0 1 0 28" />
  </g>
);

interface CardArtProps {
  card: CardState;
  highestApr: boolean;
  minDueSoon: boolean;
  selected?: boolean;
  onClick?: () => void;
}

/** A full SVG credit card: gradient body, sheen, chip, payoff progress. */
export const CardArt = ({
  card,
  highestApr,
  minDueSoon,
  selected,
  onClick,
}: CardArtProps) => {
  const paidOff = card.balance === 0;
  const progress =
    card.startingBalance > 0
      ? 1 - card.balance / Math.max(card.startingBalance, card.balance)
      : 1;
  const minDue = minimumDueNow(card);
  const uid = card.id;

  return (
    <motion.button
      type="button"
      onClick={onClick}
      disabled={paidOff}
      aria-label={`${card.name}, balance ${fmtMoney(card.balance)}, ${fmtApr(card.apr)} APR`}
      className="group relative block w-full max-w-[352px] text-left focus:outline-none"
      whileHover={paidOff ? undefined : { y: -6, scale: 1.02 }}
      whileTap={paidOff ? undefined : { scale: 0.98 }}
      transition={{ type: "spring", stiffness: 300, damping: 22 }}
    >
      {highestApr && !paidOff && (
        <div className="absolute -top-3 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded-full border border-rose-400/40 bg-rose-500/20 px-3 py-0.5 text-[11px] font-bold tracking-wide text-rose-300 backdrop-blur">
          HIGHEST APR — PAY ME FIRST
        </div>
      )}
      <svg
        aria-hidden="true"
        viewBox="0 0 352 222"
        className="w-full drop-shadow-2xl"
        style={{
          filter: selected
            ? `drop-shadow(0 0 24px ${card.theme.glow}88)`
            : undefined,
        }}
      >
        <defs>
          <linearGradient
            id={`body-${uid}`}
            x1="0%"
            y1="0%"
            x2="100%"
            y2="100%"
          >
            <stop offset="0%" stopColor={card.theme.from} />
            <stop offset="100%" stopColor={card.theme.to} />
          </linearGradient>
          <linearGradient
            id={`sheen-${uid}`}
            x1="0%"
            y1="0%"
            x2="100%"
            y2="100%"
          >
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.22" />
            <stop offset="45%" stopColor="#ffffff" stopOpacity="0.04" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="chip-gold" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fde68a" />
            <stop offset="100%" stopColor="#d97706" />
          </linearGradient>
          <clipPath id={`clip-${uid}`}>
            <rect width="352" height="222" rx="18" />
          </clipPath>
        </defs>

        <g clipPath={`url(#clip-${uid})`} opacity={paidOff ? 0.45 : 1}>
          <rect width="352" height="222" rx="18" fill={`url(#body-${uid})`} />
          {/* decorative arcs */}
          <circle cx="300" cy="-30" r="130" fill="#ffffff" opacity="0.06" />
          <circle cx="340" cy="250" r="150" fill="#000000" opacity="0.12" />
          <rect width="352" height="222" fill={`url(#sheen-${uid})`} />

          {/* header row */}
          <text
            x="28"
            y="40"
            fontSize="16"
            fontWeight="700"
            fill="#ffffff"
            opacity="0.95"
            letterSpacing="0.3"
          >
            {card.name}
          </text>
          <g>
            <rect
              x="252"
              y="24"
              width="76"
              height="22"
              rx="11"
              fill="rgba(0,0,0,0.28)"
            />
            <text
              x="290"
              y="39"
              textAnchor="middle"
              fontSize="12"
              fontWeight="700"
              fill="#ffffff"
              opacity="0.95"
            >
              {fmtApr(card.apr)} APR
            </text>
          </g>

          <Chip />
          <Contactless />

          {/* card number */}
          <text
            x="28"
            y="140"
            fontSize="17"
            fill="#ffffff"
            opacity="0.85"
            letterSpacing="3"
            fontFamily="var(--font-geist-mono), monospace"
          >
            •••• •••• •••• {card.last4}
          </text>

          {/* balance */}
          <text
            x="28"
            y="168"
            fontSize="11"
            fill="#ffffff"
            opacity="0.6"
            letterSpacing="1.2"
          >
            {paidOff ? "PAID OFF" : "BALANCE"}
          </text>
          {!paidOff && (
            <text
              x="28"
              y="196"
              fontSize="26"
              fontWeight="800"
              fill="#ffffff"
              fontFamily="var(--font-geist-mono), monospace"
            >
              {fmtMoney(card.balance, { alwaysCents: true })}
            </text>
          )}

          <NetworkMark network={card.network} />

          {/* payoff progress track */}
          <rect x="0" y="216" width="352" height="6" fill="rgba(0,0,0,0.35)" />
          <motion.rect
            x="0"
            y="216"
            height="6"
            fill="#ffffff"
            opacity="0.9"
            initial={false}
            animate={{ width: 352 * progress }}
            transition={{ type: "spring", stiffness: 90, damping: 20 }}
          />
        </g>

        {/* paid-off stamp */}
        {paidOff && (
          <g transform="rotate(-12 176 111)">
            <rect
              x="96"
              y="86"
              width="160"
              height="50"
              rx="10"
              fill="none"
              stroke="#34d399"
              strokeWidth="3"
            />
            <text
              x="176"
              y="119"
              textAnchor="middle"
              fontSize="26"
              fontWeight="900"
              fill="#34d399"
              letterSpacing="3"
            >
              PAID ✓
            </text>
          </g>
        )}

        <rect
          width="352"
          height="222"
          rx="18"
          fill="none"
          stroke={selected ? card.theme.glow : "rgba(255,255,255,0.14)"}
          strokeWidth={selected ? 2.5 : 1}
        />
      </svg>

      {/* footer info under the card */}
      <div className="mt-2 flex items-center justify-between px-1 text-xs">
        <span className="text-[color:var(--ink-secondary)]">
          Due the{" "}
          <span className="font-semibold text-[color:var(--ink)]">
            {card.dueDay}th
          </span>
          {minDueSoon && !paidOff && minDue > 0 && (
            <span className="ml-2 rounded-full border border-amber-400/40 bg-amber-400/10 px-2 py-0.5 font-semibold text-amber-300">
              min {fmtMoney(minDue)} due soon
            </span>
          )}
        </span>
        {!paidOff && minDue === 0 && (
          <span className="rounded-full border border-emerald-400/30 bg-emerald-400/10 px-2 py-0.5 font-semibold text-emerald-300">
            min paid ✓
          </span>
        )}
      </div>
    </motion.button>
  );
};
