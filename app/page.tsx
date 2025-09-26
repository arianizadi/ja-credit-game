'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useGameState } from './hooks/useGameState';
import { Simple3DCard } from './components/Simple3DCard';
import { PaymentPanel } from './components/PaymentPanel';
import { PaymentEffects } from './components/PaymentEffects';
import { MoneyMakingGame } from './components/MoneyMakingGame';
import { Cool3DLoadingScreen } from './components/Cool3DLoadingScreen';
import { TutorialModal } from './components/TutorialModal';
import { EndGameScreen } from './components/EndGameScreen';

export default function Home() {
  const { gameState, makePayment, payAllDebts, getCurrentBalance, completeMoneyMaking, advanceToNextPayday, advanceToNextDueDate, resetGame } = useGameState();
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [showPaymentEffects, setShowPaymentEffects] = useState(false);
  const [lastPayment, setLastPayment] = useState({ amount: 0, cardName: '' });
  const [isLoading, setIsLoading] = useState(true);
  const [showTutorial, setShowTutorial] = useState(false);
  const [showMoneyGame, setShowMoneyGame] = useState(false);
  const [showEndGame, setShowEndGame] = useState(false);

  const selectedCard = gameState.cards.find(card => card.id === selectedCardId) || null;

  // Show end game screen when game is complete
  useEffect(() => {
    if (gameState.gameComplete && !showEndGame) {
      setShowEndGame(true);
    }
  }, [gameState.gameComplete, showEndGame]);

  const handleLoadingComplete = () => {
    setIsLoading(false);
    setShowTutorial(true);
  };

  const handleTutorialClose = () => {
    setShowTutorial(false);
  };

  const handleMoneyGameComplete = (earnedAmount: number) => {
    completeMoneyMaking(earnedAmount);
    setShowMoneyGame(false);
  };

  const handlePayment = (amount: number) => {
    if (selectedCardId) {
      const card = gameState.cards.find(c => c.id === selectedCardId);
      if (card) {
        makePayment(selectedCardId, amount);
        setLastPayment({ amount, cardName: card.name });
        setShowPaymentEffects(true);
      }
    }
  };

  const handleClosePaymentPanel = () => {
    setSelectedCardId(null);
  };

  const handleEndGamePlayAgain = () => {
    resetGame();
    setShowEndGame(false);
  };

  const handleEndGameClose = () => {
    setShowEndGame(false);
  };

  const handleFinishGameClick = () => {
    const totalDebt = Math.round(gameState.cards.reduce((sum, card) => sum + card.balance, 0));
    if (totalDebt > 0) {
      // Show alert that they need to finish paying off debt
      alert("💳 Hold on! You still owe $" + totalDebt + " in debt.\n\n🏢 Go back to work and finish paying off all your credit cards before you can finish the game!");
      return;
    }
    setShowEndGame(true);
  };

  // Show loading screen first
  if (isLoading) {
    return <Cool3DLoadingScreen onComplete={handleLoadingComplete} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      {/* Tutorial Modal */}
      <TutorialModal isOpen={showTutorial} onClose={handleTutorialClose} />

      <div className="container mx-auto px-4 py-4 sm:py-8">
        {/* Simple Header */}
        <motion.div
          className="text-center mb-6 sm:mb-12"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-800 mb-2">
            💳 Debt Avalanche Game
          </h1>
          <p className="text-lg sm:text-xl text-gray-600">
            Pay high interest cards first!
          </p>
        </motion.div>

        {/* Simple Stats Bar */}
        <motion.div
          className="flex flex-col sm:flex-row justify-center items-center gap-4 sm:gap-8 mb-6 sm:mb-12 bg-white rounded-2xl p-4 sm:p-6 shadow-lg max-w-4xl mx-auto"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <div className="text-center">
            <div className="text-2xl sm:text-3xl font-bold text-green-600">${Math.round(gameState.totalMoney)}</div>
            <div className="text-xs sm:text-sm text-gray-500">Your Money</div>
          </div>

          <div className="text-center">
            <div className="text-2xl sm:text-3xl font-bold text-red-600">
              ${Math.round(gameState.cards.reduce((sum, card) => sum + card.balance, 0))}
            </div>
            <div className="text-xs sm:text-sm text-gray-500">Total Debt</div>
          </div>

          <div className="text-center">
            <div className="text-2xl sm:text-3xl font-bold text-blue-600">{gameState.currentDay}</div>
            <div className="text-xs sm:text-sm text-gray-500">Days</div>
          </div>

          <div className="flex gap-2 sm:gap-3">
            <motion.button
              className="px-3 sm:px-4 py-2 sm:py-3 bg-purple-600 text-white rounded-xl font-bold hover:bg-purple-700 transition-colors text-sm sm:text-base"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowTutorial(true)}
            >
              📚 Learn
            </motion.button>

            <motion.button
              className="px-3 sm:px-4 py-2 sm:py-3 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition-colors text-sm sm:text-base"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                if (confirm('Are you sure you want to reset the game? This will clear all progress and cannot be undone.')) {
                  resetGame();
                }
              }}
            >
              🔄 Reset
            </motion.button>
          </div>
        </motion.div>

        {/* Main Game Area */}
        {gameState.stage === 'debt-paying' && (
          <motion.div
            className="text-center mb-6 sm:mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-4">
              Which card will you pay? 🤔
            </h2>
            <div className="bg-yellow-100 border-l-4 border-yellow-500 p-3 sm:p-4 mb-6 sm:mb-8 max-w-2xl mx-auto">
              <p className="text-base sm:text-lg font-semibold text-yellow-800">
                🏔️ Debt Avalanche Strategy: Pay the highest interest rate first!
              </p>
            </div>

            {/* Simple 3D Cards */}
            <div className="flex flex-col sm:flex-row sm:flex-wrap justify-center gap-4 sm:gap-8">
              {gameState.cards.map((card, index) => (
                <motion.div
                  key={card.id}
                  initial={{ opacity: 0, y: 50 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.2 }}
                  className="w-full sm:w-auto flex justify-center"
                >
                  <Simple3DCard
                    card={card}
                    isSelected={selectedCardId === card.id}
                    onClick={() => setSelectedCardId(card.id)}
                  />
                </motion.div>
              ))}
            </div>

            {/* Simple Action Buttons */}
            <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4 mt-6 sm:mt-8">
              <motion.button
                className="px-6 sm:px-8 py-3 sm:py-4 bg-green-600 text-white rounded-xl font-bold text-base sm:text-lg hover:bg-green-700 transition-colors"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={advanceToNextPayday}
                disabled={gameState.gameComplete}
              >
                💰 Next Payday
              </motion.button>

              {/* Pay All Debts button - only show if player has enough money */}
              {(() => {
                const totalDebt = Math.round(gameState.cards.reduce((sum, card) => sum + card.balance, 0));
                const canPayAll = totalDebt > 0 && gameState.totalMoney >= totalDebt;

                if (canPayAll) {
                  return (
                    <motion.button
                      className="px-6 sm:px-8 py-3 sm:py-4 bg-blue-600 text-white rounded-xl font-bold text-base sm:text-lg hover:bg-blue-700 transition-colors"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={payAllDebts}
                    >
                      💳 Pay All Debts (${totalDebt})
                    </motion.button>
                  );
                }
                return null;
              })()}

              <motion.button
                className="px-6 sm:px-8 py-3 sm:py-4 bg-purple-600 text-white rounded-xl font-bold text-base sm:text-lg hover:bg-purple-700 transition-colors"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleFinishGameClick}
              >
                🏁 Finish Game
              </motion.button>
            </div>
          </motion.div>
        )}

        {/* Money Game Instructions */}
        {gameState.stage === 'money-making' && (
          <motion.div
            className="text-center px-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="text-6xl sm:text-8xl mb-4 sm:mb-6">💰</div>
            <h2 className="text-3xl sm:text-4xl font-bold mb-3 sm:mb-4 text-gray-800">
              Payday Time!
            </h2>
            <p className="text-lg sm:text-xl mb-6 sm:mb-8 text-gray-600">
              Click the falling money to earn your paycheck
            </p>
            <motion.button
              className="px-8 sm:px-12 py-4 sm:py-6 bg-green-600 text-white rounded-2xl font-bold text-lg sm:text-2xl hover:bg-green-700 transition-colors shadow-lg"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowMoneyGame(true)}
            >
              Start Earning! 💵
            </motion.button>
          </motion.div>
        )}

        {/* Game Complete - Simple message when end game screen is closed */}
        {gameState.gameComplete && !showEndGame && (
          <motion.div
            className="text-center px-4"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <div className="text-6xl sm:text-8xl mb-4 sm:mb-6">🎉</div>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-800 mb-3 sm:mb-4">
              Congratulations!
            </h2>
            <p className="text-lg sm:text-xl text-gray-600 mb-6 sm:mb-8">
              You mastered the Debt Avalanche Method!
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4">
              <motion.button
                className="px-6 sm:px-8 py-3 sm:py-4 bg-purple-600 text-white rounded-xl font-bold text-base sm:text-lg hover:bg-purple-700 transition-colors"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleFinishGameClick}
              >
                📊 View Results
              </motion.button>
              <motion.button
                className="px-6 sm:px-8 py-3 sm:py-4 bg-blue-600 text-white rounded-xl font-bold text-base sm:text-lg hover:bg-blue-700 transition-colors"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={resetGame}
              >
                🚀 Play Again
              </motion.button>
            </div>
          </motion.div>
        )}
      </div>

      {/* Money Making Game */}
      {showMoneyGame && (
        <MoneyMakingGame
          onComplete={handleMoneyGameComplete}
          timeLimit={15}
        />
      )}

      {/* Payment Panel */}
      <PaymentPanel
        selectedCard={selectedCard}
        availableMoney={gameState.totalMoney}
        onPayment={handlePayment}
        onPayAllDebts={payAllDebts}
        allCards={gameState.cards}
        getCurrentBalance={getCurrentBalance}
        onClose={handleClosePaymentPanel}
      />

      {/* Payment Effects */}
      <PaymentEffects
        isVisible={showPaymentEffects}
        amount={lastPayment.amount}
        cardName={lastPayment.cardName}
        onComplete={() => setShowPaymentEffects(false)}
      />

      {/* End Game Screen */}
      {showEndGame && (
        <EndGameScreen
          gameState={gameState}
          onPlayAgain={handleEndGamePlayAgain}
          onClose={handleEndGameClose}
        />
      )}
    </div>
  );
}