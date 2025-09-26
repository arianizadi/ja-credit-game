'use client';

import { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Text, RoundedBox } from '@react-three/drei';
import { motion } from 'framer-motion';
import { CreditCard } from '../types';
import * as THREE from 'three';

interface Simple3DCardProps {
  card: CreditCard;
  isSelected: boolean;
  onClick: () => void;
  getCurrentBalance?: (card: CreditCard) => number;
}

function Card3D({ card, isSelected, getCurrentBalance }: { card: CreditCard; isSelected: boolean; getCurrentBalance?: (card: CreditCard) => number }) {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.5) * 0.1;
      meshRef.current.position.y = Math.sin(state.clock.elapsedTime * 0.8) * 0.1;
    }
  });

  const priority = card.interestRate >= 20 ? '🔥 HIGH' : card.interestRate >= 15 ? '⚠️ MEDIUM' : '✅ LOW';
  const cardColor = new THREE.Color(card.color);

  return (
    <group>
      <RoundedBox
        ref={meshRef}
        args={[4, 2.5, 0.1]}
        radius={0.1}
        smoothness={4}
        scale={isSelected ? 1.1 : 1}
      >
        <meshStandardMaterial
          color={cardColor}
          metalness={0.1}
          roughness={0.2}
        />
      </RoundedBox>

      <Text
        position={[0, 0.8, 0.06]}
        fontSize={0.3}
        color="white"
        anchorX="center"
        anchorY="middle"
      >
        {card.name}
      </Text>

      <Text
        position={[0, 0.3, 0.06]}
        fontSize={0.5}
        color="white"
        anchorX="center"
        anchorY="middle"
      >
        ${getCurrentBalance ? getCurrentBalance(card) : Math.round(card.balance)}
      </Text>

      <Text
        position={[0, -0.2, 0.06]}
        fontSize={0.25}
        color="white"
        anchorX="center"
        anchorY="middle"
      >
        {card.interestRate}% Interest
      </Text>

      <Text
        position={[0, -0.6, 0.06]}
        fontSize={0.2}
        color="white"
        anchorX="center"
        anchorY="middle"
      >
        {priority}
      </Text>
    </group>
  );
}

export const Simple3DCard = ({ card, isSelected, onClick, getCurrentBalance }: Simple3DCardProps) => {
  const priority = card.interestRate >= 20 ? '🔥 HIGH' : card.interestRate >= 15 ? '⚠️ MEDIUM' : '✅ LOW';

  return (
    <motion.div
      className={`w-full max-w-sm sm:w-80 h-56 sm:h-64 cursor-pointer rounded-xl text-white shadow-lg relative overflow-hidden ${isSelected ? 'ring-4 ring-blue-400' : ''
        }`}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onClick();
      }}
    >
      {/* Full Background Color */}
      <div
        className="absolute inset-0 w-full h-full"
        style={{
          background: `linear-gradient(135deg, ${card.color} 0%, ${card.color}dd 100%)`,
        }}
      />

      {/* Card Content */}
      <div className="relative z-10 p-4 sm:p-6 h-full flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg sm:text-xl font-bold">{card.name}</h3>
            <div className="px-2 py-1 rounded-full bg-white/20 text-xs font-bold">
              {priority}
            </div>
          </div>
          <p className="text-xs sm:text-sm opacity-90">Click to make a payment</p>
        </div>

        <div className="space-y-2 sm:space-y-3">
          {/* Main Balance */}
          <div className="bg-white/10 rounded-lg p-2 sm:p-3 text-center">
            <div className="text-xs sm:text-sm opacity-90">You Owe</div>
            <div className="text-xl sm:text-2xl font-bold">${getCurrentBalance ? getCurrentBalance(card) : Math.round(card.balance)}</div>
          </div>

          {/* Interest and Min Payment */}
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="bg-white/10 rounded-lg p-2 text-center">
              <div className="opacity-90 text-xs">Interest Rate</div>
              <div className="font-bold text-sm sm:text-base">{card.interestRate}%</div>
            </div>
            <div className="bg-white/10 rounded-lg p-2 text-center">
              <div className="opacity-90 text-xs">Min Payment</div>
              <div className="font-bold text-sm sm:text-base">${card.minimumPayment}</div>
            </div>
          </div>
        </div>
      </div>

      {isSelected && (
        <div className="absolute -top-2 -right-2 bg-green-500 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold z-20">
          ✓
        </div>
      )}
    </motion.div>
  );
};