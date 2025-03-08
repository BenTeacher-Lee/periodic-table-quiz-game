// src/components/GameArea.js - 移動端優化版
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
  const [timer, setTimer] = useState(15);
  const [isMobile, setIsMobile] = useState(false);

  // 檢測移動設備
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    // 初始檢查
    checkMobile();
    
    // 監聽視窗大小變化
    window.addEventListener('resize', checkMobile);
    
    return () => {
      window.removeEventListener('resize', checkMobile);
    };
  }, []);

  // 監聽遊戲狀態變化
  useEffect(() => {
    console.log("GameArea - 遊戲狀態更新:", { gameStatus, winner });
  }, [gameStatus, winner]);

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

  // 遊戲結束條件處理 - 修復結算畫面邏輯
  if (gameStatus === '遊戲結束' || winner) {
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

  // 移動端搶答按鈕 - 只在移動端且當前用戶可以搶答時顯示
  const MobileBuzzButton = () => {
    if (!isMobile || !currentUserCanAnswer || currentPlayer === playerName) return null;
    
    return (
      <Button 
        onClick={quickAnswer}
        disabled={!currentUserCanAnswer}
        variant="secondary"
        size="lg"
        className="buzz-button-mobile"
      >
        搶答!
      </Button>
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
          onQuickAnswer={quickAnswer}
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