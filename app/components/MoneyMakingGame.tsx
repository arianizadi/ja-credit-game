'use client';

import { useState, useEffect, useRef, useCallback, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Text, Environment } from '@react-three/drei';
import * as THREE from 'three';

interface FallingMoney3D {
  id: string;
  position: THREE.Vector3;
  rotation: THREE.Euler;
  velocity: THREE.Vector3;
  value: number;
  collected: boolean;
}

interface MoneyMakingGameProps {
  onComplete: (earnedAmount: number) => void;
  timeLimit: number; // seconds
}

// 3D Money Bill Component
function MoneyBill({
  money,
  onCollect
}: {
  money: FallingMoney3D;
  onCollect: (id: string) => void;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);

  useFrame((state, delta) => {
    if (!meshRef.current || money.collected) return;

    // Update position based on velocity
    money.position.add(money.velocity.clone().multiplyScalar(delta));

    // Add some rotation for realistic falling
    money.rotation.x += delta * 2;
    money.rotation.z += delta * 1;

    // Apply physics
    meshRef.current.position.copy(money.position);
    meshRef.current.rotation.copy(money.rotation);

    // Slight wobble effect
    meshRef.current.position.x += Math.sin(state.clock.elapsedTime * 3 + money.id.length) * 0.1;
  });

  const getMoneyColor = (value: number) => {
    switch (value) {
      case 10: return '#16a34a'; // Green - $10
      case 25: return '#2563eb'; // Blue - $25
      case 50: return '#eab308'; // Yellow/Gold - $50
      case 100: return '#dc2626'; // Red - $100
      default: return '#16a34a';
    }
  };

  if (money.collected) return null;

  return (
    <mesh
      ref={meshRef}
      position={money.position}
      rotation={money.rotation}
      onPointerEnter={() => setHovered(true)}
      onPointerLeave={() => setHovered(false)}
      onClick={(e) => {
        e.stopPropagation();
        onCollect(money.id);
      }}
      scale={hovered ? [1.3, 1.3, 1.3] : [1, 1, 1]}
    >
      {/* Money bill geometry - more realistic proportions */}
      <boxGeometry args={[3, 1.4, 0.05]} />
      <meshStandardMaterial
        color={getMoneyColor(money.value)}
        metalness={0.1}
        roughness={0.6}
        emissive={hovered ? getMoneyColor(money.value) : '#000000'}
        emissiveIntensity={hovered ? 0.15 : 0}
      />

      {/* Front side text */}
      <Text
        position={[0, 0, 0.026]}
        fontSize={0.35}
        color="white"
        anchorX="center"
        anchorY="middle"
        fontWeight="bold"
      >
        ${money.value}
      </Text>

      {/* Back side text (flipped) */}
      <Text
        position={[0, 0, -0.026]}
        fontSize={0.35}
        color="white"
        anchorX="center"
        anchorY="middle"
        fontWeight="bold"
        rotation={[0, Math.PI, 0]}
      >
        ${money.value}
      </Text>

      {/* Corner decorations to look more like real money */}
      <Text
        position={[-1.2, 0.5, 0.026]}
        fontSize={0.15}
        color="white"
        anchorX="center"
        anchorY="middle"
      >
        ${money.value}
      </Text>
      <Text
        position={[1.2, 0.5, 0.026]}
        fontSize={0.15}
        color="white"
        anchorX="center"
        anchorY="middle"
      >
        ${money.value}
      </Text>
      <Text
        position={[-1.2, -0.5, 0.026]}
        fontSize={0.15}
        color="white"
        anchorX="center"
        anchorY="middle"
      >
        ${money.value}
      </Text>
      <Text
        position={[1.2, -0.5, 0.026]}
        fontSize={0.15}
        color="white"
        anchorX="center"
        anchorY="middle"
      >
        ${money.value}
      </Text>
    </mesh>
  );
}

// Particle explosion effect when money is collected
function CollectionEffect({ position, onComplete }: { position: THREE.Vector3; onComplete: () => void }) {
  const groupRef = useRef<THREE.Group>(null);
  const particles = useRef<THREE.Mesh[]>([]);

  useEffect(() => {
    if (!groupRef.current) return;

    // Create particle explosion
    const particleCount = 25;
    for (let i = 0; i < particleCount; i++) {
      const particle = new THREE.Mesh(
        new THREE.SphereGeometry(0.08),
        new THREE.MeshBasicMaterial({ color: '#fbbf24' })
      );

      particle.position.copy(position);
      particle.userData = {
        velocity: new THREE.Vector3(
          (Math.random() - 0.5) * 12,
          Math.random() * 10 + 3,
          (Math.random() - 0.5) * 12
        )
      };

      groupRef.current.add(particle);
      particles.current.push(particle);
    }

    // Auto cleanup after animation
    setTimeout(onComplete, 2000);
  }, [position, onComplete]);

  useFrame((state, delta) => {
    particles.current.forEach(particle => {
      const velocity = particle.userData.velocity as THREE.Vector3;

      // Apply gravity
      velocity.y -= 25 * delta;

      // Update position
      particle.position.add(velocity.clone().multiplyScalar(delta));

      // Fade out and shrink
      const material = particle.material as THREE.MeshBasicMaterial;
      material.opacity = Math.max(0, material.opacity - delta * 0.6);
      material.transparent = true;

      particle.scale.multiplyScalar(0.98);
    });
  });

  return <group ref={groupRef} />;
}

// Main 3D Scene Component
function MoneyScene({
  gameStarted,
  timeLeft,
  onMoneyCollect,
  fallingMoney,
  collectionEffects
}: {
  gameStarted: boolean;
  timeLeft: number;
  onMoneyCollect: (id: string) => void;
  fallingMoney: FallingMoney3D[];
  collectionEffects: { id: string; position: THREE.Vector3 }[];
}) {
  const { camera } = useThree();

  useEffect(() => {
    // Set up camera position for better view
    camera.position.set(0, 8, 20);
    camera.lookAt(0, 0, 0);
  }, [camera]);

  // Clean up money that fell too far
  useEffect(() => {
    const cleanup = setInterval(() => {
      fallingMoney.forEach(money => {
        if (money.position.y < -15) {
          money.collected = true;
        }
      });
    }, 1000);

    return () => clearInterval(cleanup);
  }, [fallingMoney]);

  return (
    <>
      {/* Lighting setup for better visibility */}
      <ambientLight intensity={0.7} />
      <directionalLight
        position={[15, 15, 10]}
        intensity={1.2}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
      />
      <pointLight position={[-10, 10, -10]} intensity={0.6} color="#fbbf24" />
      <pointLight position={[10, 10, 10]} intensity={0.4} color="#10b981" />

      {/* Environment for reflections */}
      <Environment preset="city" />

      {/* Falling money */}
      {fallingMoney.map((money) => (
        <MoneyBill key={money.id} money={money} onCollect={onMoneyCollect} />
      ))}

      {/* Collection effects */}
      {collectionEffects.map((effect) => (
        <CollectionEffect
          key={effect.id}
          position={effect.position}
          onComplete={() => {
            // Effects are cleaned up automatically in the parent component
          }}
        />
      ))}

      {/* Background gradient plane */}
      <mesh position={[0, -12, -8]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[60, 60]} />
        <meshStandardMaterial
          color="#1e293b"
          opacity={0.9}
          transparent
        />
      </mesh>

      {/* Side walls for depth */}
      <mesh position={[-25, 0, -5]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[40, 30]} />
        <meshStandardMaterial color="#334155" opacity={0.3} transparent />
      </mesh>
      <mesh position={[25, 0, -5]} rotation={[0, -Math.PI / 2, 0]}>
        <planeGeometry args={[40, 30]} />
        <meshStandardMaterial color="#334155" opacity={0.3} transparent />
      </mesh>
    </>
  );
}

export const MoneyMakingGame = ({ onComplete, timeLimit = 30 }: MoneyMakingGameProps) => {
  const [timeLeft, setTimeLeft] = useState(timeLimit);
  const [moneyEarned, setMoneyEarned] = useState(0);
  const [fallingMoney, setFallingMoney] = useState<FallingMoney3D[]>([]);
  const [gameStarted, setGameStarted] = useState(false);
  const [showInstructions, setShowInstructions] = useState(true);
  const [collectionEffects, setCollectionEffects] = useState<{ id: string; position: THREE.Vector3 }[]>([]);

  const moneyValues = [10, 25, 50, 100]; // Higher values for better gameplay

  const createFallingMoney = useCallback(() => {
    const value = moneyValues[Math.floor(Math.random() * moneyValues.length)];

    const newMoney: FallingMoney3D = {
      id: Math.random().toString(36).substr(2, 9),
      position: new THREE.Vector3(
        (Math.random() - 0.5) * 24, // X position from -12 to 12
        15, // Start above the screen
        (Math.random() - 0.5) * 8   // Z position for depth
      ),
      rotation: new THREE.Euler(
        Math.random() * Math.PI,
        Math.random() * Math.PI,
        Math.random() * Math.PI
      ),
      velocity: new THREE.Vector3(
        (Math.random() - 0.5) * 1.5, // Small horizontal drift
        -(Math.random() * 2 + 3),    // Falling speed (3-5 units/sec)
        (Math.random() - 0.5) * 0.5  // Small depth movement
      ),
      value: value,
      collected: false,
    };

    setFallingMoney(prev => [...prev, newMoney]);
  }, [moneyValues]);

  const collectMoney = useCallback((moneyId: string) => {
    const collectedMoney = fallingMoney.find(m => m.id === moneyId);
    if (!collectedMoney || collectedMoney.collected) return;

    // Update earnings first
    setMoneyEarned(current => current + collectedMoney.value);

    // Create particle effect at collection point
    setCollectionEffects(effects => [
      ...effects,
      { id: moneyId, position: collectedMoney.position.clone() }
    ]);

    // Remove effect after animation
    setTimeout(() => {
      setCollectionEffects(effects => effects.filter(effect => effect.id !== moneyId));
    }, 2000);

    // Mark money as collected
    setFallingMoney(prev => prev.map(money =>
      money.id === moneyId
        ? { ...money, collected: true }
        : money
    ));
  }, [fallingMoney]);

  const startGame = () => {
    setShowInstructions(false);
    setGameStarted(true);
  };

  // Game timer
  useEffect(() => {
    if (!gameStarted || timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [gameStarted, timeLeft]);

  // Handle game completion when time runs out
  useEffect(() => {
    if (timeLeft === 0 && gameStarted) {
      // Give a base income of $500 if they didn't earn much
      const finalAmount = Math.max(moneyEarned, 500);
      onComplete(finalAmount);
    }
  }, [timeLeft, gameStarted, moneyEarned, onComplete]);

  // Spawn money more frequently for better gameplay
  useEffect(() => {
    if (!gameStarted || timeLeft <= 0) return;

    const spawnInterval = setInterval(() => {
      createFallingMoney();
    }, 800); // Spawn every 0.8 seconds

    return () => clearInterval(spawnInterval);
  }, [gameStarted, timeLeft, createFallingMoney]);

  // Clean up collected money periodically
  useEffect(() => {
    if (!gameStarted) return;

    const cleanup = setInterval(() => {
      setFallingMoney(prev =>
        prev.filter(money => !money.collected && money.position.y > -15)
      );
    }, 2000);

    return () => clearInterval(cleanup);
  }, [gameStarted]);

  if (showInstructions) {
    return (
      <motion.div
        className="fixed inset-0 bg-black/60 flex items-center justify-center z-50"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <motion.div
          className="bg-gradient-to-br from-emerald-500 to-blue-600 rounded-2xl p-8 max-w-md mx-4 text-center shadow-2xl text-white"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
        >
          <div className="text-7xl mb-6">💰</div>
          <h2 className="text-4xl font-bold mb-4">
            3D Money Rain!
          </h2>
          <p className="text-lg mb-4 opacity-90">
            Click the falling 3D money bills to earn your paycheck! You have {timeLimit} seconds to collect as much as possible.
          </p>
          <p className="text-sm opacity-80 mb-6">
            💡 Hover over money bills to see them glow!
          </p>
          <p className="text-sm mb-6 bg-white/20 rounded-lg p-3">
            Don't worry - you'll earn at least $500 guaranteed!
          </p>
          <motion.button
            className="px-8 py-4 bg-white text-emerald-600 rounded-xl font-bold text-xl hover:bg-gray-100 transition-colors shadow-lg"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={startGame}
          >
            Start 3D Money Hunt! 🚀
          </motion.button>
        </motion.div>
      </motion.div>
    );
  }

  return (
    <motion.div
      className="fixed inset-0 bg-gradient-to-b from-slate-900 via-blue-900 to-purple-900 z-50"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      {/* Game UI */}
      <div className="absolute top-4 left-4 right-4 flex justify-between items-center text-white z-10">
        <div className="bg-black/30 backdrop-blur-sm rounded-xl px-6 py-3 border border-white/20">
          <div className="text-sm opacity-80">Time Left</div>
          <div className="text-3xl font-bold">{timeLeft}s</div>
        </div>

        <div className="bg-black/30 backdrop-blur-sm rounded-xl px-6 py-3 border border-white/20">
          <div className="text-sm opacity-80">Earned</div>
          <div className="text-3xl font-bold text-green-400">
            ${Math.round(moneyEarned)}
          </div>
          {moneyEarned < 500 && (
            <div className="text-xs opacity-70">($500 minimum guaranteed)</div>
          )}
        </div>
      </div>

      {/* 3D Canvas */}
      <Canvas
        shadows
        camera={{ position: [0, 8, 20], fov: 60 }}
        style={{ background: 'transparent' }}
      >
        <Suspense fallback={null}>
          <MoneyScene
            gameStarted={gameStarted}
            timeLeft={timeLeft}
            onMoneyCollect={collectMoney}
            fallingMoney={fallingMoney}
            collectionEffects={collectionEffects}
          />
        </Suspense>
      </Canvas>

      {/* Instructions overlay */}
      <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 text-white text-center z-10">
        <div className="bg-black/30 backdrop-blur-sm rounded-xl px-6 py-3 border border-white/20">
          <div className="text-lg font-semibold mb-2">Click the 3D Money Bills!</div>
          <div className="text-sm opacity-80">
            💵 $10 | 💎 $25 | 🌟 $50 | 🔥 $100
          </div>
        </div>
      </div>

      {/* Time running out warning */}
      {timeLeft <= 10 && timeLeft > 0 && (
        <motion.div
          className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-red-400 text-5xl font-bold z-20 bg-black/50 backdrop-blur-sm rounded-2xl px-8 py-4 pointer-events-none"
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 0.5, repeat: Infinity }}
        >
          HURRY! {timeLeft}s LEFT!
        </motion.div>
      )}
    </motion.div>
  );
};