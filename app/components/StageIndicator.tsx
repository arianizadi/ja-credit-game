'use client';

import { motion } from 'framer-motion';
import { GameStage } from '../types';

interface StageIndicatorProps {
  currentStage: GameStage;
  currentDay: number;
  nextPayDay: number;
  nextDueDate: number;
}

export const StageIndicator = ({
  currentStage,
  currentDay,
  nextPayDay,
  nextDueDate
}: StageIndicatorProps) => {
  const getCurrentMonth = (day: number) => Math.floor(day / 30) + 1;
  const getDayOfMonth = (day: number) => (day % 30) || 30;

  const stages = [
    { id: 'money-making', label: 'Earn Money', icon: '💰', color: 'bg-green-700' },
    { id: 'debt-paying', label: 'Pay Debts', icon: '💳', color: 'bg-blue-700' },
    { id: 'complete', label: 'Complete', icon: '🎉', color: 'bg-purple-700' }
  ];

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-gray-800">Game Progress</h2>
        <div className="text-sm text-gray-600">
          Month {getCurrentMonth(currentDay)}, Day {getDayOfMonth(currentDay)}
        </div>
      </div>

      {/* Stage Progress Bar */}
      <div className="flex items-center space-x-4 mb-6">
        {stages.map((stage, index) => {
          const isActive = stage.id === currentStage;
          const isCompleted = stages.findIndex(s => s.id === currentStage) > index;

          return (
            <div key={stage.id} className="flex items-center">
              <motion.div
                className={`
                  w-12 h-12 rounded-full flex items-center justify-center text-white font-bold
                  ${isActive ? stage.color : isCompleted ? 'bg-gray-600' : 'bg-gray-300'}
                `}
                initial={{ scale: 0.8 }}
                animate={{
                  scale: isActive ? 1.1 : 1,
                  backgroundColor: isActive ? undefined : isCompleted ? '#6B7280' : '#D1D5DB'
                }}
                transition={{ duration: 0.3 }}
              >
                <span className="text-lg">{stage.icon}</span>
              </motion.div>

              <div className="ml-2">
                <div className={`text-sm font-semibold ${isActive ? 'text-gray-800' : 'text-gray-500'}`}>
                  {stage.label}
                </div>
              </div>

              {index < stages.length - 1 && (
                <div className={`
                  w-8 h-1 mx-4 rounded
                  ${isCompleted ? 'bg-gray-600' : 'bg-gray-300'}
                `} />
              )}
            </div>
          );
        })}
      </div>

      {/* Current Stage Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {currentStage === 'money-making' && (
          <>
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="text-sm text-green-600 font-semibold">Current Stage</div>
              <div className="text-green-800 font-bold">💰 Payday Time!</div>
              <div className="text-xs text-green-600 mt-1">
                Click falling money to earn your paycheck
              </div>
            </div>
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="text-sm text-blue-600 font-semibold">Next Due Date</div>
              <div className="text-blue-800 font-bold">
                Month {getCurrentMonth(nextDueDate)}, Day {getDayOfMonth(nextDueDate)}
              </div>
              <div className="text-xs text-blue-600 mt-1">
                {nextDueDate - currentDay} days away
              </div>
            </div>
          </>
        )}

        {currentStage === 'debt-paying' && (
          <>
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="text-sm text-blue-600 font-semibold">Current Stage</div>
              <div className="text-blue-800 font-bold">💳 Make Payments</div>
              <div className="text-xs text-blue-600 mt-1">
                Choose which cards to pay strategically
              </div>
            </div>
            <div className="bg-yellow-50 p-4 rounded-lg">
              <div className="text-sm text-yellow-600 font-semibold">Next Payday</div>
              <div className="text-yellow-800 font-bold">
                Month {getCurrentMonth(nextPayDay)}, Day {getDayOfMonth(nextPayDay)}
              </div>
              <div className="text-xs text-yellow-600 mt-1">
                {nextPayDay - currentDay} days away
              </div>
            </div>
          </>
        )}

        {currentStage === 'complete' && (
          <div className="col-span-full bg-purple-50 p-4 rounded-lg text-center">
            <div className="text-sm text-purple-600 font-semibold">Game Complete!</div>
            <div className="text-purple-800 font-bold">🎉 All Debts Paid Off!</div>
            <div className="text-xs text-purple-600 mt-1">
              Congratulations on your financial success!
            </div>
          </div>
        )}
      </div>
    </div>
  );
};