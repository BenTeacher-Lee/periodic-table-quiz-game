// src/components/GameArea.js - 移動端搶答優化
import React, { useState, useRef, useEffect } from 'react';
import { useGame } from '../hooks/useGame';
import GameVictory from './GameVictory';
import QuestionDisplay from './game/QuestionDisplay';
import AnswerOptions from './game/AnswerOptions';
import ScoreBoard from './game/ScoreBoard';
import Timer from './ui/Timer';
import Card from './ui/Card';
import Button from './ui/Button';
import '../styles/components.css';
import '../styles/animations.css';
import '../styles/mobile.css';

const GameArea = ({ roomId, playerName, onGameEnd, isMobile }) => {
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
    showingAnswer,
    forceEndGame
  } = useGame(roomId, playerName);

  const [showCorrectEffect, setShowCorrectEffect] = useState(false);
  const [scoreAnimations, setScoreAnimations] = useState([]);
  const animationIdRef = useRef(0);
  const [timer, setTimer] = useState(15);
  const buzzButtonRef = useRef(null);

  // 監控遊戲狀態
  useEffect(() => {
    console.log("GameArea - 遊戲狀態:", gameStatus, "勝利者:", winner);
  }, [gameStatus, winner]);

  // 處理搶答按鈕點擊 - 增強版
  const handleBuzzClick = () => {
    console.log("點擊搶答按鈕");
    // 立即顯示視覺反饋
    if (buzzButtonRef.current) {
      buzzButtonRef.current.style.transform = 'scale(0.95)';
      setTimeout(() => {
        if (buzzButtonRef.current) {
          buzzButtonRef.current.style.transform = 'scale(1)';
        }
      }, 100);
    }
    quickAnswer();
  };

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
  if (!currentQuestion) {
    return (
      <div className="waiting-container">
        <div className="waiting-message">等待遊戲開始...</div>
      </div>
    );
  }

  // 檢查勝利條件 - 更加寬鬆的判斷
  const isGameOver = gameStatus === '遊戲結束' || !!winner;
  console.log("勝利檢查:", {isGameOver, gameStatus, winner});

  if (isGameOver) {
    console.log("顯示勝利畫面:", { gameStatus, winner, players });
    
    // 確保有勝利者，如果 winner 為空，則使用分數最高的玩家
    const actualWinner = winner || 
      (players.length > 0 ? [...players].sort((a, b) => b.score - a.score)[0].name : playerName);
    
    return (
      <GameVictory 
        players={players} 
        winner={actualWinner} 
        onRestart={restartGame} 
        onEnd={() => {
          endGame();
          if (onGameEnd) onGameEnd();
        }}
        isMobile={isMobile}
      />
    );
  }

  // 當前玩家是否可以搶答
  const currentUserCanAnswer = !currentPlayer && !showingAnswer;

  // 移動端搶答按鈕 - 增強版
  const MobileBuzzButton = () => {
    if (!isMobile || !currentUserCanAnswer || currentPlayer === playerName) return null;
    
    return (
      <button 
        ref={buzzButtonRef}
        onClick={handleBuzzClick}
        className="buzz-button-mobile"
        style={{
          position: 'fixed',
          bottom: 'var(--space-md)',
          left: 'var(--space-md)',
          right: 'var(--space-md)',
          height: '70px',
          backgroundColor: 'var(--success)',
          color: 'white',
          border: 'none',
          borderRadius: 'var(--radius-lg)',
          fontSize: 'var(--text-2xl)',
          fontWeight: 'bold',
          zIndex: 1000,
          boxShadow: 'var(--shadow-lg)',
          transition: 'transform 0.1s ease',
          WebkitTapHighlightColor: 'transparent', // 移除iOS點擊高亮
          outline: 'none', // 移除點擊輪廓
          WebkitAppearance: 'none', // 移除默認按鈕樣式
          touchAction: 'manipulation', // 優化觸控
        }}
      >
        搶答!
      </button>
    );
  };

  // 遊戲進行中
  return (
    <div className="game-container">
      {/* 主遊戲區 */}
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
              fontSize: isMobile ? 'var(--text-lg)' : 'var(--text-xl)',
              zIndex: 100,
              boxShadow: 'var(--shadow-md)'
            }}>
              {showingAnswer ? '正確答案！' : '答對了！'}
            </div>
          )}
          
          <div style={{ 
            marginBottom: 'var(--space-lg)',
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
            <div style={{ marginTop: 'var(--space-md)' }}>
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
                fontSize: isMobile ? 'var(--text-base)' : 'var(--text-lg)',
                marginTop: 'var(--space-md)'
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
                fontSize: isMobile ? 'var(--text-base)' : 'var(--text-lg)',
                color: 'var(--success-dark)',
                fontWeight: 'bold'
              }}>
                正在切換到下一題...
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* 計分榜 */}
      <div className="game-sidebar">
        <ScoreBoard 
          players={players}
          currentPlayer={currentPlayer}
          onQuickAnswer={handleBuzzClick}
          showingAnswer={showingAnswer}
          playerName={playerName}
          isMobile={isMobile}
        />
      </div>

      {/* 移動端獨有的浮動搶答按鈕 */}
      <MobileBuzzButton />
    </div>
  );
};

export default GameArea;