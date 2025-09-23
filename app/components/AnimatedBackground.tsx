'use client';

import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';

export const AnimatedBackground = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;

    // Create floating particles
    const particles: HTMLDivElement[] = [];
    for (let i = 0; i < 20; i++) {
      const particle = document.createElement('div');
      particle.className = 'absolute rounded-full opacity-20';
      particle.style.background = `hsl(${Math.random() * 60 + 200}, 50%, 60%)`;
      particle.style.width = `${Math.random() * 10 + 5}px`;
      particle.style.height = particle.style.width;
      particle.style.left = `${Math.random() * 100}%`;
      particle.style.top = `${Math.random() * 100}%`;
      container.appendChild(particle);
      particles.push(particle);
    }

    // Animate particles
    particles.forEach((particle, index) => {
      gsap.to(particle, {
        y: `${Math.random() * 200 - 100}px`,
        x: `${Math.random() * 200 - 100}px`,
        duration: Math.random() * 20 + 10,
        repeat: -1,
        yoyo: true,
        ease: "power1.inOut",
        delay: index * 0.1,
      });
    });

    // Create pulsing money symbols
    const symbols = ['$', '€', '¥', '£'];
    symbols.forEach((symbol, index) => {
      const element = document.createElement('div');
      element.textContent = symbol;
      element.className = 'absolute text-4xl font-bold opacity-5 text-green-500';
      element.style.left = `${20 + index * 20}%`;
      element.style.top = `${20 + index * 15}%`;
      container.appendChild(element);

      gsap.to(element, {
        scale: 1.2,
        opacity: 0.1,
        duration: 3,
        repeat: -1,
        yoyo: true,
        ease: "power2.inOut",
        delay: index * 0.5,
      });
    });

    return () => {
      // Cleanup
      particles.forEach(particle => particle.remove());
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 pointer-events-none overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        zIndex: -1,
      }}
    />
  );
};