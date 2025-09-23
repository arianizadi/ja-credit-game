'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface TutorialModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ExampleCard {
  name: string;
  balance: number;
  interestRate: number;
  color: string;
}

const EXAMPLE_CARDS: ExampleCard[] = [
  { name: 'High Interest Card', balance: 1000, interestRate: 25, color: '#dc2626' },
  { name: 'Medium Interest Card', balance: 1500, interestRate: 18.99, color: '#ea580c' },
  { name: 'Low Interest Card', balance: 2000, interestRate: 12.99, color: '#16a34a' },
];

export const TutorialModal = ({ isOpen, onClose }: TutorialModalProps) => {
  const [currentStep, setCurrentStep] = useState(0);

  const steps = [
    {
      title: "Welcome to Debt Avalanche! 🏔️",
      content: "Learn the most mathematically optimal way to pay off credit card debt and save money on interest!"
    },
    {
      title: "Why Interest Rates Matter 📊",
      content: "High interest rates cost you more money over time. Let's see how much difference it makes!"
    },
    {
      title: "The 3-Step Avalanche Method 🎯",
      content: "Here's the simple strategy that will save you the most money on interest payments."
    },
    {
      title: "Apply It to Your Cards! 💳",
      content: "Now let's see how the avalanche method works with real credit card examples."
    }
  ];

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onClose();
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              onClose();
            }
          }}
        >
          <motion.div
            className="bg-gradient-to-br from-slate-900 via-blue-900 to-purple-900 rounded-3xl max-w-6xl w-full max-h-[90vh] overflow-hidden shadow-2xl border border-white/20 backdrop-blur-sm"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600/80 to-purple-600/80 text-white p-6 backdrop-blur-sm border-b border-white/20">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-3xl font-bold">{steps[currentStep].title}</h2>
                  <p className="text-blue-100 mt-2 text-lg">{steps[currentStep].content}</p>
                </div>
                <div className="text-right">
                  <div className="text-sm opacity-80">Step {currentStep + 1} of {steps.length}</div>
                  <div className="w-32 bg-white/20 rounded-full h-3 mt-2">
                    <motion.div
                      className="bg-gradient-to-r from-yellow-400 to-orange-400 h-3 rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
                      transition={{ duration: 0.5 }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Content Area */}
            <div className="p-6 min-h-[400px]">
              {/* Step 0: Welcome */}
              {currentStep === 0 && (
                <motion.div
                  className="text-center text-white"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <div className="text-6xl mb-6">🏔️</div>
                  <div className="max-w-4xl mx-auto space-y-4 text-lg">
                    <p className="text-blue-100">
                      Pay minimum on all cards, then put ALL extra money
                    </p>
                    <p className="text-yellow-400 font-bold text-xl">
                      toward the HIGHEST interest rate card first!
                    </p>
                    <p className="text-green-400 text-base">
                      ✅ Mathematically proven to save the most money
                    </p>
                  </div>

                  <motion.div
                    className="mt-6 bg-black/30 backdrop-blur-sm rounded-2xl p-4 border border-white/20 max-w-4xl mx-auto"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1 }}
                  >
                    <p className="text-lg font-bold mb-3">
                      Why is it called <span className="text-blue-400">"Debt Avalanche"</span>? 🏔️
                    </p>
                    <p className="text-base leading-relaxed">
                      Like an avalanche that starts small but gains massive momentum,
                      this method starts by eliminating your <span className="text-red-400 font-bold">highest interest rate debt first</span>,
                      then <span className="text-yellow-400 font-semibold">snowballs that momentum</span> to crush all your remaining debt faster!
                    </p>
                  </motion.div>
                </motion.div>
              )}

              {/* Step 1: Interest Rates */}
              {currentStep === 1 && (
                <motion.div
                  className="text-white"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >

                  <div className="grid grid-cols-3 gap-4 mb-6">
                    <div className="bg-red-500/20 rounded-xl p-4 text-center border border-red-500/30">
                      <div className="text-4xl mb-3">💸</div>
                      <div className="text-2xl font-bold text-red-400 mb-1">$250/year</div>
                      <div className="text-sm">wasted on 25% interest</div>
                    </div>
                    <div className="bg-orange-500/20 rounded-xl p-4 text-center border border-orange-500/30">
                      <div className="text-4xl mb-3">💰</div>
                      <div className="text-2xl font-bold text-orange-400 mb-1">$190/year</div>
                      <div className="text-sm">on 19% interest</div>
                    </div>
                    <div className="bg-green-500/20 rounded-xl p-4 text-center border border-green-500/30">
                      <div className="text-4xl mb-3">✅</div>
                      <div className="text-2xl font-bold text-green-400 mb-1">$130/year</div>
                      <div className="text-sm">on 13% interest</div>
                    </div>
                  </div>

                  <div className="text-center">
                    <p className="text-yellow-400 font-bold text-xl mb-3">
                      🎯 Attack the 25% interest rate first to save the most money!
                    </p>
                    <p className="text-lg text-blue-100">
                      High interest rates are like a leak in your wallet - fix the biggest leak first!
                    </p>
                  </div>
                </motion.div>
              )}

              {/* Step 2: The Method */}
              {currentStep === 2 && (
                <motion.div
                  className="text-white"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >

                  <div className="grid grid-cols-3 gap-8 mb-8">
                    <motion.div
                      className="bg-blue-500/20 rounded-xl p-8 text-center border border-blue-500/30"
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ delay: 0.5 }}
                    >
                      <div className="text-6xl mb-4">1️⃣</div>
                      <div className="text-2xl font-bold text-blue-400 mb-4">COVER THE BASICS</div>
                      <div className="text-lg">Pay minimum payment on every single card to avoid late fees</div>
                    </motion.div>

                    <motion.div
                      className="bg-red-500/20 rounded-xl p-8 text-center border border-red-500/30"
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ delay: 0.7 }}
                    >
                      <div className="text-6xl mb-4">2️⃣</div>
                      <div className="text-2xl font-bold text-red-400 mb-4">TARGET THE WORST</div>
                      <div className="text-lg">Put ALL extra money toward the card with the highest interest rate</div>
                    </motion.div>

                    <motion.div
                      className="bg-green-500/20 rounded-xl p-8 text-center border border-green-500/30"
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ delay: 0.9 }}
                    >
                      <div className="text-6xl mb-4">3️⃣</div>
                      <div className="text-2xl font-bold text-green-400 mb-4">AVALANCHE EFFECT</div>
                      <div className="text-lg">When paid off, target the next highest interest rate card</div>
                    </motion.div>
                  </div>

                  <div className="text-center">
                    <p className="text-yellow-400 font-bold text-2xl mb-4">
                      💡 This saves you the most money mathematically!
                    </p>
                    <div className="bg-black/30 backdrop-blur-sm rounded-xl p-6 border border-white/20 max-w-4xl mx-auto">
                      <p className="text-lg">
                        <span className="text-green-400 font-bold">Pro Tip:</span> Always pay the card with the highest interest rate first,
                        regardless of the balance amount. The interest rate is what costs you money!
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Step 3: Example Cards */}
              {currentStep === 3 && (
                <motion.div
                  className="text-white"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >

                  <div className="grid grid-cols-3 gap-4 mb-6">
                    {EXAMPLE_CARDS.map((card, index) => (
                      <motion.div
                        key={card.name}
                        className="rounded-xl p-4 border-2"
                        style={{
                          backgroundColor: `${card.color}20`,
                          borderColor: card.color,
                        }}
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: 0.5 + index * 0.2 }}
                      >
                        <div className="text-center">
                          <div className="text-3xl mb-2">💳</div>
                          <h4 className="text-lg font-bold mb-1">{card.name}</h4>
                          <div className="text-xl font-bold mb-1">${card.balance.toLocaleString()}</div>
                          <div className="text-2xl font-bold mb-2" style={{ color: card.color }}>
                            {card.interestRate}% APR
                          </div>
                          <div className="text-xs font-bold">
                            {card.interestRate >= 20 ? "🔥 HIGH PRIORITY" :
                              card.interestRate >= 15 ? "⚠️ MEDIUM" : "✅ LOW"}
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>

                  <div className="text-center">
                    <div className="bg-black/30 backdrop-blur-sm rounded-xl p-4 border border-white/20 max-w-4xl mx-auto">
                      <h4 className="text-xl font-bold mb-3 text-yellow-400">
                        🏔️ Your Avalanche Strategy:
                      </h4>
                      <div className="text-base space-y-1">
                        <p>1️⃣ Pay minimums on ALL cards</p>
                        <p>2️⃣ Put extra money toward the <span className="text-red-400 font-bold">25% interest rate card first</span></p>
                        <p>3️⃣ When that's paid off, target the 18.99% interest rate card</p>
                        <p>4️⃣ Finally, pay off the 12.99% interest rate card</p>
                      </div>
                      <p className="text-green-400 font-bold text-lg mt-3">
                        This strategy saves you the most money! 💰
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}
            </div>

            {/* Footer */}
            <div className="border-t border-white/20 bg-black/20 backdrop-blur-sm px-6 py-4 flex justify-between items-center">
              <motion.button
                className="px-6 py-3 text-white/80 hover:text-white transition-colors disabled:opacity-50 hover:bg-white/10 rounded-xl border border-white/20 backdrop-blur-sm"
                onClick={prevStep}
                disabled={currentStep === 0}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                ← Previous
              </motion.button>

              <motion.button
                className="px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-purple-700 transition-colors shadow-lg border border-white/20"
                onClick={nextStep}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {currentStep === steps.length - 1 ? "Let's Play! 🚀" : "Next →"}
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};