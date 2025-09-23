'use client';

import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { gsap } from 'gsap';

interface LoadingScreenProps {
  onComplete: () => void;
}

export const LoadingScreen = ({ onComplete }: LoadingScreenProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;

    // Create floating money symbols
    const moneySymbols = ['💵', '💴', '💶', '💷', '💰', '🪙', '💎', '🌟'];
    const floatingElements: HTMLDivElement[] = [];

    for (let i = 0; i < 20; i++) {
      const element = document.createElement('div');
      element.textContent = moneySymbols[Math.floor(Math.random() * moneySymbols.length)];
      element.className = 'absolute text-4xl pointer-events-none';
      element.style.left = `${Math.random() * 100}%`;
      element.style.top = `${Math.random() * 100}%`;
      element.style.opacity = '0.3';
      container.appendChild(element);
      floatingElements.push(element);

      // Animate floating motion
      gsap.to(element, {
        y: `${Math.random() * 100 - 50}px`,
        x: `${Math.random() * 100 - 50}px`,
        rotation: Math.random() * 360,
        duration: Math.random() * 4 + 3,
        repeat: -1,
        yoyo: true,
        ease: "power1.inOut",
        delay: Math.random() * 2,
      });

      // Fade in/out animation
      gsap.to(element, {
        opacity: Math.random() * 0.6 + 0.2,
        duration: Math.random() * 2 + 1,
        repeat: -1,
        yoyo: true,
        ease: "power2.inOut",
        delay: Math.random() * 3,
      });
    }

    // Animate progress bar
    if (progressRef.current) {
      gsap.to(progressRef.current, {
        width: '100%',
        duration: 3,
        ease: "power2.out",
        onComplete: () => {
          setTimeout(onComplete, 500);
        }
      });
    }

    // Create money rain effect
    const createMoneyRain = () => {
      for (let i = 0; i < 5; i++) {
        setTimeout(() => {
          const rainElement = document.createElement('div');
          rainElement.textContent = moneySymbols[Math.floor(Math.random() * moneySymbols.length)];
          rainElement.className = 'absolute text-2xl pointer-events-none';
          rainElement.style.left = `${Math.random() * 100}%`;
          rainElement.style.top = '-50px';
          rainElement.style.color = '#10B981';
          container.appendChild(rainElement);

          gsap.to(rainElement, {
            y: window.innerHeight + 100,
            rotation: 360,
            duration: Math.random() * 2 + 2,
            ease: "power1.in",
            onComplete: () => {
              rainElement.remove();
            }
          });
        }, i * 200);
      }
    };

    const rainInterval = setInterval(createMoneyRain, 800);

    return () => {
      clearInterval(rainInterval);
      floatingElements.forEach(el => el.remove());
    };
  }, [onComplete]);

  return (
    <motion.div
      className="fixed inset-0 bg-gradient-to-br from-emerald-600 via-blue-600 to-purple-700 flex items-center justify-center z-50"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div ref={containerRef} className="absolute inset-0 overflow-hidden" />

      <div className="relative z-10 text-center text-white">
        {/* Main Logo */}
        <motion.div
          className="mb-8"
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ duration: 1, ease: "backOut" }}
        >
          <div className="text-8xl mb-4">💳</div>
          <h1 className="text-4xl md:text-6xl font-bold mb-2 drop-shadow-lg">
            Credit Master
          </h1>
          <p className="text-xl opacity-90 drop-shadow-md">
            Learn Smart Debt Strategies
          </p>
        </motion.div>

        {/* Animated features list */}
        <motion.div
          className="mb-8 space-y-2"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1, duration: 0.8 }}
        >
          <motion.div
            className="flex items-center justify-center space-x-2"
            initial={{ x: -50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 1.2, duration: 0.6 }}
          >
            <span className="text-2xl">🎯</span>
            <span className="text-lg">Master the Debt Avalanche Method</span>
          </motion.div>

          <motion.div
            className="flex items-center justify-center space-x-2"
            initial={{ x: 50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 1.4, duration: 0.6 }}
          >
            <span className="text-2xl">💰</span>
            <span className="text-lg">Earn Money Through Fun Games</span>
          </motion.div>

          <motion.div
            className="flex items-center justify-center space-x-2"
            initial={{ x: -50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 1.6, duration: 0.6 }}
          >
            <span className="text-2xl">📈</span>
            <span className="text-lg">Build Your Financial Skills</span>
          </motion.div>
        </motion.div>

        {/* Loading Progress */}
        <motion.div
          className="w-80 mx-auto"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 2, duration: 0.5 }}
        >
          <div className="text-sm mb-3 opacity-90">Loading Game...</div>
          <div className="w-full bg-white/20 rounded-full h-3 overflow-hidden">
            <div
              ref={progressRef}
              className="h-full bg-gradient-to-r from-yellow-400 to-green-400 rounded-full w-0"
            />
          </div>
        </motion.div>

        {/* Pulsing money icon */}
        <motion.div
          className="absolute bottom-10 left-1/2 transform -translate-x-1/2"
          animate={{
            scale: [1, 1.2, 1],
            rotate: [0, 10, -10, 0],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        >
          <div className="text-6xl opacity-80">💸</div>
        </motion.div>
      </div>
    </motion.div>
  );
};