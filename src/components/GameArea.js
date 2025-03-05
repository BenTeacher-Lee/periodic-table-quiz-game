// src/components/GameArea.js
import React, { useState, useEffect, useRef } from 'react';
import { useGame } from '../hooks/useGame';

const GameArea = ({ roomId, playerName, onGameEnd }) => {
  const {
    currentQuestion,
    currentPlayer,
    gameStatus,
    winner,
    players,
    quickAnswer,
    checkAnswer,
    restartGame,
    endGame
  } = useGame(roomId, playerName);

  const [showCorrectEffect, setShowCorrectEffect] = useState(false);
  const [scoreAnimations, setScoreAnimations] = useState([]);
  const animationIdRef = useRef(0);

  // 處理答案檢查
  const handleCheckAnswer = (index) => {
    const isCorrect = index === currentQuestion.correctAnswer;
    
    if (isCorrect) {
      setShowCorrectEffect(true);
      
      // 添加分數動畫
      const newAnimation = {
        id: animationIdRef.current++,
        x: Math.random() * 200,
        y: Math.random() * 100
      };
      
      setScoreAnimations(prev => [...prev, newAnimation]);
      
      // 1秒後移除正確效果
      setTimeout(() => {
        setShowCorrectEffect(false);
      }, 1000);
      
      // 1秒後移除分數動畫
      setTimeout(() => {
        setScoreAnimations(prev => prev.filter(anim => anim.id !== newAnimation.id));
      }, 1000);
    }
    
    checkAnswer(index);
  };

  // 生成五彩紙屑
  const generateConfetti = () => {
    const colors = ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff'];
    const confetti = [];
    
    for (let i = 0; i < 100; i++) {
      const left = Math.random() * 100;
      const top = Math.random() * 100;
      const color = colors[Math.floor(Math.random() * colors.length)];
      const delay = Math.random() * 5;
      
      confetti.push(
        <div 
          key={i}
          className="confetti"
          style={{
            left: `${left}%`,
            top: `${top}%`,
            backgroundColor: color,
            animationDelay: `${delay}s`
          }}
        />
      );
    }
    
    return confetti;
  };

  // 遊戲未開始或無題目
  if (!currentQuestion || (gameStatus !== '遊戲中' && gameStatus !== '遊戲結束')) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-2xl font-bold text-gray-700">等待遊戲開始...</div>
      </div>
    );
  }

  // 遊戲結束
  if (gameStatus === '遊戲結束' && winner) {
    return (
      <div className="victory-container">
        {generateConfetti()}
        <div className="victory-message">
          <h2 className="text-4xl font-bold mb-8 text-yellow-600">🏆 恭喜獲勝 🏆</h2>
          <p className="text-3xl mb-8 text-purple-600">
            {winner} 成功達到20分！
          </p>
          
          <div className="mb-8">
            <h3 className="text-2xl font-semibold mb-4">最終排名</h3>
            {players.sort((a, b) => b.score - a.score).map((player, index) => (
              <div 
                key={index} 
                className={`flex justify-between items-center p-4 mb-2 rounded-lg ${
                  player.name === winner ? 'bg-yellow-100' : 'bg-gray-100'
                }`}
              >
                <span className="text-xl">#{index + 1} {player.name}</span>
                <span className={`text-xl font-bold ${player.name === winner ? 'text-yellow-600' : ''}`}>
                  分數：{player.score}
                </span>
              </div>
            ))}
          </div>

          <div className="flex space-x-6 justify-center">
            <button 
              onClick={restartGame}
              className="btn btn-primary"
            >
              再來一局
            </button>
            <button 
              onClick={() => {
                endGame();
                if (onGameEnd) onGameEnd();
              }}
              className="btn btn-danger"
            >
              結束遊戲
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 遊戲中
  return (
    <div className="container">
      <div className={`card ${showCorrectEffect ? 'correct-answer' : ''}`}>
        <h2 className="section-title">元素週期表搶答遊戲</h2>
        
        {/* 分數動畫 */}
        {scoreAnimations.map(anim => (
          <div 
            key={anim.id}
            className="score-animation"
            style={{
              top: '50%',
              left: `calc(50% + ${anim.x - 100}px)`,
            }}
          >
            +1分!
          </div>
        ))}
        
        <div className="mb-8">
          <h3 className="text-2xl mb-6 text-center">{currentQuestion.question}</h3>
          <div className="grid grid-cols-2 gap-6">
            {currentQuestion.options.map((option, index) => (
              <button 
                key={index}
                onClick={() => handleCheckAnswer(index)}
                disabled={currentPlayer !== playerName}
                className={`p-6 rounded-lg text-xl font-semibold ${
                  currentPlayer !== playerName 
                    ? 'bg-gray-300 cursor-not-allowed' 
                    : 'btn-primary'
                }`}
              >
                {option}
              </button>
            ))}
          </div>
        </div>
        
        <div>
          <h3 className="text-xl font-semibold mb-4">玩家</h3>
          <div className="space-y-4">
            {players.map((player, index) => (
              <div 
                key={index} 
                className="flex justify-between items-center p-4 bg-gray-50 rounded-lg"
              >
                <div className="text-xl">
                  <span>{player.name}</span>
                  <span className="ml-6 font-bold">分數：{player.score}</span>
                </div>
                <button 
                  onClick={() => quickAnswer()}
                  disabled={currentPlayer !== null || player.name !== playerName}
                  className={`btn ${
                    currentPlayer !== null || player.name !== playerName
                      ? 'bg-gray-300 cursor-not-allowed' 
                      : 'btn-success'
                  }`}
                >
                  搶答
                </button>
              </div>
            ))}
          </div>
        </div>
        
        {currentPlayer && (
          <div className="mt-6 p-4 bg-yellow-100 rounded-lg text-center text-xl">
            目前搶答者：<span className="font-bold text-yellow-600">{currentPlayer}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default GameArea;