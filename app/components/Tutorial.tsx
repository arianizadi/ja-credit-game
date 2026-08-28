"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";

/** Small SVG illustration per slide. */
const Illustrations = [
  // 1: the loop — earn, then pay
  () => (
    <svg aria-hidden="true" viewBox="0 0 240 120" className="w-full">
      <defs>
        <marker
          id="tut-arrow"
          viewBox="0 0 10 10"
          refX="8"
          refY="5"
          markerWidth="7"
          markerHeight="7"
          orient="auto"
        >
          <path d="M0 0 L10 5 L0 10 Z" fill="#9aa5b8" />
        </marker>
      </defs>
      <rect
        x="18"
        y="34"
        width="84"
        height="52"
        rx="10"
        fill="#065f46"
        stroke="#34d399"
        strokeWidth="2"
      />
      <text x="60" y="56" textAnchor="middle" fontSize="20">
        💵
      </text>
      <text
        x="60"
        y="76"
        textAnchor="middle"
        fontSize="11"
        fontWeight="700"
        fill="#a7f3d0"
      >
        EARN
      </text>
      <path
        d="M108 50 C 128 34, 152 34, 172 50"
        fill="none"
        stroke="#9aa5b8"
        strokeWidth="2"
        markerEnd="url(#tut-arrow)"
      />
      <path
        d="M172 72 C 152 88, 128 88, 108 72"
        fill="none"
        stroke="#9aa5b8"
        strokeWidth="2"
        markerEnd="url(#tut-arrow)"
      />
      <rect
        x="138"
        y="34"
        width="84"
        height="52"
        rx="10"
        fill="#1e3a8a"
        stroke="#60a5fa"
        strokeWidth="2"
      />
      <text x="180" y="56" textAnchor="middle" fontSize="20">
        💳
      </text>
      <text
        x="180"
        y="76"
        textAnchor="middle"
        fontSize="11"
        fontWeight="700"
        fill="#bfdbfe"
      >
        PAY
      </text>
    </svg>
  ),
  // 2: the avalanche — highest APR first
  () => (
    <svg aria-hidden="true" viewBox="0 0 240 120" className="w-full">
      <g>
        <rect
          x="30"
          y="30"
          width="44"
          height="70"
          rx="6"
          fill="#ea580c"
          opacity="0.9"
        />
        <text
          x="52"
          y="24"
          textAnchor="middle"
          fontSize="12"
          fontWeight="800"
          fill="#fdba74"
        >
          24%
        </text>
        <rect
          x="98"
          y="50"
          width="44"
          height="50"
          rx="6"
          fill="#3b82f6"
          opacity="0.85"
        />
        <text
          x="120"
          y="44"
          textAnchor="middle"
          fontSize="12"
          fontWeight="700"
          fill="#93c5fd"
        >
          20%
        </text>
        <rect
          x="166"
          y="64"
          width="44"
          height="36"
          rx="6"
          fill="#059669"
          opacity="0.85"
        />
        <text
          x="188"
          y="58"
          textAnchor="middle"
          fontSize="12"
          fontWeight="700"
          fill="#6ee7b7"
        >
          17%
        </text>
      </g>
      <g transform="translate(52 108)">
        <path
          d="M-14 0 L0 12 L14 0"
          fill="none"
          stroke="#fbbf24"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>
      <text x="52" y="118" textAnchor="middle" fontSize="0" />
    </svg>
  ),
  // 3: due dates & late fees
  () => (
    <svg aria-hidden="true" viewBox="0 0 240 120" className="w-full">
      <rect
        x="60"
        y="18"
        width="120"
        height="90"
        rx="10"
        fill="#0d1220"
        stroke="#9aa5b8"
        strokeWidth="1.5"
      />
      <rect x="60" y="18" width="120" height="24" rx="10" fill="#334155" />
      <text
        x="120"
        y="35"
        textAnchor="middle"
        fontSize="12"
        fontWeight="700"
        fill="#e6eaf2"
      >
        DUE DATE
      </text>
      {[0, 1, 2, 3, 4].map((i) => (
        <circle
          key={i}
          cx={78 + i * 21}
          cy={58}
          r="4"
          fill="rgba(154,165,184,0.4)"
        />
      ))}
      {[0, 1, 2, 3, 4].map((i) => (
        <circle
          key={i}
          cx={78 + i * 21}
          cy={78}
          r="4"
          fill={i === 2 ? "#fb7185" : "rgba(154,165,184,0.4)"}
        />
      ))}
      <circle
        cx={120}
        cy={78}
        r="9"
        fill="none"
        stroke="#fb7185"
        strokeWidth="2.5"
      />
      <text
        x="120"
        y="103"
        textAnchor="middle"
        fontSize="10"
        fontWeight="700"
        fill="#fb7185"
      >
        MISS IT = $35 FEE
      </text>
    </svg>
  ),
];

const SLIDES = [
  {
    title: "Escape the debt!",
    body: "You owe $1,050 across three credit cards, and every day they charge interest. Work each payday (the 1st and 15th) to earn cash, then use it to pay your cards down to zero.",
  },
  {
    title: "The Avalanche Method 🏔️",
    body: "Interest is the price of debt — and the highest APR card charges you the most per dollar. Pay minimums on every card, then throw every spare dollar at the highest APR card. That saves the most money, guaranteed.",
  },
  {
    title: "Never miss a minimum",
    body: "Each card has a monthly due date. If you haven't paid its minimum by then, you get hit with a $35 late fee — which then earns interest too. The timeline at the top shows what's coming.",
  },
];

interface TutorialProps {
  open: boolean;
  onClose: () => void;
}

export const Tutorial = ({ open, onClose }: TutorialProps) => {
  const [slide, setSlide] = useState(0);
  const last = slide === SLIDES.length - 1;
  const Illustration = Illustrations[slide];

  const close = () => {
    onClose();
    setSlide(0);
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="glass w-full max-w-md rounded-3xl p-8 text-center"
            style={{ background: "rgba(13,18,32,0.94)" }}
            initial={{ scale: 0.92, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.92, y: 20 }}
            transition={{ type: "spring", stiffness: 300, damping: 26 }}
          >
            <div className="mx-auto mb-6 max-w-[260px]">
              <AnimatePresence mode="wait">
                <motion.div
                  key={slide}
                  initial={{ opacity: 0, x: 24 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -24 }}
                  transition={{ duration: 0.2 }}
                >
                  <Illustration />
                </motion.div>
              </AnimatePresence>
            </div>

            <h2 className="mb-3 text-2xl font-extrabold">
              {SLIDES[slide].title}
            </h2>
            <p className="mb-8 text-sm leading-relaxed text-[color:var(--ink-secondary)]">
              {SLIDES[slide].body}
            </p>

            <div className="mb-6 flex justify-center gap-2">
              {SLIDES.map((s, i) => (
                <button
                  key={s.title}
                  type="button"
                  aria-label={`Go to step ${i + 1}`}
                  onClick={() => setSlide(i)}
                  className={`h-2 rounded-full transition-all ${i === slide ? "w-6 bg-blue-400" : "w-2 bg-white/20"}`}
                />
              ))}
            </div>

            <div className="flex gap-3">
              {slide > 0 && (
                <button
                  type="button"
                  onClick={() => setSlide((s) => s - 1)}
                  className="flex-1 rounded-2xl border border-white/15 bg-white/5 py-3 font-semibold text-[color:var(--ink-secondary)] hover:bg-white/10"
                >
                  Back
                </button>
              )}
              <button
                type="button"
                onClick={() => (last ? close() : setSlide((s) => s + 1))}
                className="flex-1 rounded-2xl bg-gradient-to-r from-blue-500 to-indigo-500 py-3 font-bold text-white shadow-lg shadow-blue-500/25"
              >
                {last ? "Let's play →" : "Next"}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
