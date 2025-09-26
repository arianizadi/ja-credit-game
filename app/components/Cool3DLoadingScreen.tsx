'use client';

import { useRef, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Text, Sphere, Box, Torus } from '@react-three/drei';
import { motion } from 'framer-motion';
import * as THREE from 'three';

interface Cool3DLoadingScreenProps {
  onComplete: () => void;
}

function FloatingCard({ position, color, delay }: { position: [number, number, number]; color: string; delay: number }) {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.5 + delay) * 0.3;
      meshRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.3 + delay) * 0.2;
      meshRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 0.8 + delay) * 0.5;
    }
  });

  return (
    <Box ref={meshRef} args={[1.5, 1, 0.1]} position={position}>
      <meshStandardMaterial color={color} metalness={0.3} roughness={0.2} />
    </Box>
  );
}

function LoadingProgress({ progress }: { progress: number }) {
  const ringRef = useRef<THREE.Mesh>(null);

  useFrame(() => {
    if (ringRef.current) {
      ringRef.current.rotation.z += 0.02;
    }
  });

  return (
    <group>
      <Torus ref={ringRef} args={[3, 0.2, 16, 100]} position={[0, 0, 0]}>
        <meshStandardMaterial color="#3b82f6" metalness={0.5} roughness={0.1} />
      </Torus>

      <Text
        position={[0, 0, 0.5]}
        fontSize={0.8}
        color="#1f2937"
        anchorX="center"
        anchorY="middle"
        font="/fonts/bold.woff"
      >
        {Math.round(progress)}%
      </Text>

      <Text
        position={[0, -1.5, 0.5]}
        fontSize={0.4}
        color="#6b7280"
        anchorX="center"
        anchorY="middle"
      >
        Loading Debt Avalanche Game...
      </Text>
    </group>
  );
}

function MoneySymbols() {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = state.clock.elapsedTime * 0.1;
    }
  });

  const symbols = ['💰', '💳', '💵', '📊'];

  return (
    <group ref={groupRef}>
      {symbols.map((symbol, index) => {
        const angle = (index / symbols.length) * Math.PI * 2;
        const radius = 5;
        const x = Math.cos(angle) * radius;
        const z = Math.sin(angle) * radius;

        return (
          <Text
            key={index}
            position={[x, 0, z]}
            fontSize={1}
            color="#10b981"
            anchorX="center"
            anchorY="middle"
          >
            {symbol}
          </Text>
        );
      })}
    </group>
  );
}

export const Cool3DLoadingScreen = ({ onComplete }: Cool3DLoadingScreenProps) => {
  const progressRef = useRef(0);

  useEffect(() => {
    const interval = setInterval(() => {
      progressRef.current += 2;
      if (progressRef.current >= 100) {
        clearInterval(interval);
        setTimeout(onComplete, 500);
      }
    }, 60); // Complete in ~3 seconds

    return () => clearInterval(interval);
  }, [onComplete]);

  return (
    <motion.div
      className="fixed inset-0 bg-gradient-to-br from-purple-600 via-blue-600 to-green-500 flex items-center justify-center z-50"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* 3D Scene */}
      <div className="w-full h-full relative">
        <Canvas camera={{ position: [0, 0, 10], fov: 60 }}>
          <ambientLight intensity={0.4} />
          <pointLight position={[10, 10, 10]} intensity={1} />
          <pointLight position={[-10, -10, -10]} intensity={0.5} />

          {/* Floating Credit Cards */}
          <FloatingCard position={[-4, 2, -2]} color="#e53e3e" delay={0} />
          <FloatingCard position={[4, -1, -1]} color="#3182ce" delay={1} />
          <FloatingCard position={[0, 3, -3]} color="#38a169" delay={2} />

          {/* Loading Progress */}
          <LoadingProgress progress={progressRef.current} />

          {/* Money Symbols */}
          <MoneySymbols />
        </Canvas>

        {/* 2D Overlay */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <motion.div
            className="text-center mb-8"
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.8 }}
          >
            <h1 className="text-6xl font-bold text-white mb-4 drop-shadow-lg">
              💳 Debt Avalanche
            </h1>
            <p className="text-xl text-white/90 drop-shadow-md">
              Master the art of smart debt payment
            </p>
          </motion.div>

          <motion.div
            className="absolute bottom-20 left-1/2 transform -translate-x-1/2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1, duration: 0.5 }}
          >
            <div className="flex items-center space-x-4 text-white">
              <div className="w-8 h-8 border-2 border-white rounded-full animate-spin border-t-transparent"></div>
              <span className="text-lg">Preparing your financial adventure...</span>
            </div>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
};