'use client';

import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { motion, AnimatePresence } from 'framer-motion';

interface PaymentEffectsProps {
  isVisible: boolean;
  amount: number;
  cardName: string;
  onComplete: () => void;
}

export const PaymentEffects = ({
  isVisible,
  amount,
  cardName,
  onComplete
}: PaymentEffectsProps) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isVisible || !containerRef.current) return;

    const container = containerRef.current;

    // Create floating money particles
    const particles: HTMLDivElement[] = [];
    for (let i = 0; i < 15; i++) {
      const particle = document.createElement('div');
      particle.textContent = '$';
      particle.className = 'absolute text-green-500 font-bold text-xl pointer-events-none';
      particle.style.left = '50%';
      particle.style.top = '50%';
      container.appendChild(particle);
      particles.push(particle);

      // Animate particle explosion
      gsap.fromTo(particle, {
        scale: 0,
        opacity: 1,
        x: 0,
        y: 0,
      }, {
        scale: Math.random() * 0.5 + 0.5,
        opacity: 0,
        x: (Math.random() - 0.5) * 400,
        y: (Math.random() - 0.5) * 400,
        duration: 1.5,
        ease: "power2.out",
        delay: i * 0.05,
        onComplete: () => {
          particle.remove();
        }
      });
    }

    // Create success pulse
    const pulse = document.createElement('div');
    pulse.className = 'absolute inset-0 rounded-full border-4 border-green-400 pointer-events-none';
    container.appendChild(pulse);

    gsap.fromTo(pulse, {
      scale: 0,
      opacity: 1,
    }, {
      scale: 3,
      opacity: 0,
      duration: 1,
      ease: "power2.out",
      onComplete: () => {
        pulse.remove();
        onComplete();
      }
    });

    return () => {
      particles.forEach(particle => particle.remove());
    };
  }, [isVisible, onComplete]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className="fixed inset-0 flex items-center justify-center pointer-events-none z-50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div ref={containerRef} className="relative w-32 h-32">
            {/* Success message */}
            <motion.div
              className="absolute inset-0 flex flex-col items-center justify-center bg-white rounded-full shadow-lg border-4 border-green-400"
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              exit={{ scale: 0, rotate: 180 }}
              transition={{ duration: 0.5, ease: "backOut" }}
            >
              <div className="text-3xl">✓</div>
              <div className="text-xs font-bold text-green-600">${amount.toFixed(0)}</div>
            </motion.div>
          </div>

          {/* Floating success message */}
          <motion.div
            className="absolute top-1/3 left-1/2 transform -translate-x-1/2 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg"
            initial={{ y: 50, opacity: 0, scale: 0.8 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: -50, opacity: 0, scale: 0.8 }}
            transition={{ delay: 0.2, duration: 0.4 }}
          >
            <div className="text-sm font-bold">Payment Successful!</div>
            <div className="text-xs opacity-90">${amount.toFixed(2)} paid to {cardName}</div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};