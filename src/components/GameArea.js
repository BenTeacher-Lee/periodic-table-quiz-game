// src/components/GameArea.js - 優化版
import React, { useState, useRef } from 'react';
import { useGame } from '../hooks/useGame';
import GameVictory from './GameVictory';
import QuestionDisplay from './game/QuestionDisplay';
import AnswerOptions from './game/AnswerOptions';
import ScoreBoard from './game/ScoreBoard';
import Timer from './ui/Timer';
import Card from './ui/Card';
import '../styles/components.css';
import '../styles/animations.css';

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
    endGame,
    showingAnswer
  } = useGame(roomId, playerName);

  const [showCorrectEffect, setShowCorrectEffect] = useState(false);
  const [scoreAnimations, setScoreAnimations] = useState([]);
  const animationIdRef = useRef(0);
  const [timer, setTimer] = useState(15); // 假設初始化計時器

  // 處理答案檢查
  const handleCheckAnswer = (index) => {
    if (currentQuestion && index === currentQuestion.correctAnswer) {
      // 正確答案效果
      setShowCorrectEffect(true);
      
      // 生成加分動畫
      const newAnimation = {
        id: animationIdRef.current++,
        x: Math.random() * 200
      };
      setScoreAnimations(prev => [...prev, newAnimation]);
      
      // 重置效果
      setTimeout(() => {
        setShowCorrectEffect(false);
      }, 1000);
      
      // 移除動畫
      setTimeout(() => {
        setScoreAnimations(prev => prev.filter(anim => anim.id !== newAnimation.id));
      }, 1000);
    }
    
    // 調用 hook 中的 checkAnswer
    checkAnswer(index);
  };

  // 遊戲未開始或無題目
  if (!currentQuestion || (gameStatus !== '遊戲中' && gameStatus !== '遊戲結束')) {
    return (
      <div className="waiting-container">
        <div className="waiting-message">等待遊戲開始...</div>
      </div>
    );
  }

  // 遊戲結束
  if (gameStatus === '遊戲結束' && winner) {
    return (
      <GameVictory 
        players={players} 
        winner={winner} 
        onRestart={restartGame} 
        onEnd={() => {
          endGame();
          if (onGameEnd) onGameEnd();
        }} 
      />
    );
  }

  // 遊戲進行中
  return (
    <div className="game-container">
      {/* 左側計分榜 */}
      <div className="game-sidebar">
        <ScoreBoard 
          players={players}
          currentPlayer={currentPlayer}
          onQuickAnswer={quickAnswer}
          showingAnswer={showingAnswer}
          playerName={playerName}
        />
      </div>

      {/* 右側主遊戲區 */}
      <div className="game-content">
        <Card>
          <div className="game-header">
            <h2 className="game-title">元素週期表搶答遊戲</h2>
            <Timer seconds={timer} variant="auto" />
          </div>
          
          {/* 分數動畫 */}
          {scoreAnimations.map(anim => (
            <div 
              key={anim.id}
              className="score-animation"
              style={{
                position: 'absolute',
                top: '50%',
                left: `calc(50% + ${anim.x - 100}px)`,
              }}
            >
              +1分!
            </div>
          ))}
          
          {/* 正確答案提示區塊 */}
          {(showCorrectEffect || showingAnswer) && (
            <div style={{
              position: 'absolute',
              top: '20%',
              left: '50%',
              transform: 'translateX(-50%)',
              backgroundColor: 'var(--success)',
              color: 'white',
              padding: 'var(--space-md) var(--space-lg)',
              borderRadius: 'var(--radius-md)',
              fontWeight: 'bold',
              fontSize: 'var(--text-xl)',
              zIndex: 100,
              boxShadow: 'var(--shadow-md)'
            }}>
              {showingAnswer ? '正確答案！' : '答對了！'}
            </div>
          )}
          
          <div style={{ 
            marginBottom: 'var(--space-xl)',
            padding: 'var(--space-md)',
            borderRadius: 'var(--radius-md)',
            transition: 'background-color var(--transition-normal) ease'
          }}>
            {/* 問題顯示 */}
            <QuestionDisplay 
              question={currentQuestion}
              showingAnswer={showCorrectEffect || showingAnswer}
            />
            
            {/* 選項顯示 */}
            <div style={{ marginTop: 'var(--space-lg)' }}>
              <AnswerOptions 
                options={currentQuestion.options}
                onSelect={handleCheckAnswer}
                correctAnswer={currentQuestion.correctAnswer}
                showCorrect={showingAnswer}
                disabled={currentPlayer !== playerName || showingAnswer}
              />
            </div>
            
            {/* 當前搶答者顯示 */}
            {currentPlayer && (
              <div style={{ 
                textAlign: 'right', 
                padding: 'var(--space-md)', 
                backgroundColor: 'var(--warning-light)', 
                borderRadius: 'var(--radius-md)', 
                fontSize: 'var(--text-lg)',
                marginTop: 'var(--space-lg)'
              }}>
                目前搶答者：
                <span style={{ 
                  fontWeight: 'bold', 
                  color: 'var(--warning-dark)',
                  marginLeft: 'var(--space-sm)'
                }}>
                  {currentPlayer}
                </span>
              </div>
            )}
            
            {/* 顯示答案期間的提示 */}
            {showingAnswer && (
              <div style={{ 
                marginTop: 'var(--space-md)',
                textAlign: 'center', 
                padding: 'var(--space-md)', 
                backgroundColor: 'rgba(16, 185, 129, 0.2)', 
                borderRadius: 'var(--radius-md)', 
                fontSize: 'var(--text-lg)',
                color: 'var(--success-dark)',
                fontWeight: 'bold'
              }}>
                正在切換到下一題...
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default GameArea;