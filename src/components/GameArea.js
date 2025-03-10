// src/components/GameArea.js - 最終修復版
import React, { useState, useRef, useEffect } from 'react';
import { useGame } from '../hooks/useGame';
import GameVictory from './GameVictory';
import QuestionDisplay from './game/QuestionDisplay';
import AnswerOptions from './game/AnswerOptions';
import ScoreBoard from './game/ScoreBoard';
import Timer from './ui/Timer';
import Card from './ui/Card';
import '../styles/components.css';
import '../styles/animations.css';
import '../styles/mobile.css';

const GameArea = ({ roomId, playerName, onGameEnd, isMobile }) => {
  // 遊戲邏輯hook
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
    forceEndGame,
    answerTime,
    disabledPlayers
  } = useGame(roomId, playerName);

  // UI狀態
  const [showCorrectEffect, setShowCorrectEffect] = useState(false);
  const [scoreAnimations, setScoreAnimations] = useState([]);
  const [isGameOver, setIsGameOver] = useState(false);
  const animationIdRef = useRef(0);
  const buzzButtonRef = useRef(null);
  
  // 日誌輸出關鍵狀態變化 - 用於調試
  useEffect(() => {
    console.log("GameArea - 關鍵狀態:", {
      gameStatus,
      winner,
      isGameOver,
      playersCount: players.length,
      hasWinningPlayer: players.some(p => p.score >= 20)
    });
  }, [gameStatus, winner, isGameOver, players]);
  
  // 專注監聽勝利條件 - 更可靠的檢測邏輯
  useEffect(() => {
    // 檢查各種可能的勝利條件
    const victory = 
      gameStatus === '遊戲結束' || 
      winner !== null || 
      players.some(player => player.score >= 20);
    
    if (victory && !isGameOver) {
      console.log("檢測到遊戲結束條件，顯示勝利畫面");
      setIsGameOver(true);
    }
  }, [gameStatus, winner, players, isGameOver]);
  
  // 檢查當前玩家是否可以搶答
  const canPlayerBuzz = !currentPlayer && !showingAnswer && !disabledPlayers.includes(playerName);
  
  // 處理搶答按鈕點擊
  const handleBuzzClick = () => {
    if (!canPlayerBuzz) return;
    
    console.log("玩家點擊搶答按鈕");
    
    // 視覺反饋
    if (buzzButtonRef.current) {
      buzzButtonRef.current.style.transform = 'scale(0.95)';
      setTimeout(() => {
        if (buzzButtonRef.current) {
          buzzButtonRef.current.style.transform = 'scale(1)';
        }
      }, 100);
    }
    
    // 執行搶答
    quickAnswer();
  };

  // 處理答案選擇
  const handleCheckAnswer = (index) => {
    // 檢查是否為正確答案並顯示特效
    if (currentQuestion && index === currentQuestion.correctAnswer) {
      // 正確答案視覺效果
      setShowCorrectEffect(true);
      
      // 分數動畫
      const newAnimation = {
        id: animationIdRef.current++,
        x: Math.random() * 200
      };
      setScoreAnimations(prev => [...prev, newAnimation]);
      
      // 定時清除效果
      setTimeout(() => {
        setShowCorrectEffect(false);
      }, 1000);
      
      // 定時清除動畫
      setTimeout(() => {
        setScoreAnimations(prev => prev.filter(anim => anim.id !== newAnimation.id));
      }, 1000);
    }
    
    // 調用hook進行答案檢查
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

  // 遊戲結束 - 顯示勝利畫面
  if (isGameOver || gameStatus === '遊戲結束' || winner) {
    console.log("準備顯示勝利畫面");
    
    // 確定勝利者
    let actualWinner = winner;
    
    // 如果沒有明確的勝利者，選擇分數最高的玩家
    if (!actualWinner) {
      // 找出達到勝利分數的玩家
      const highScorePlayers = players.filter(p => p.score >= 20);
      
      if (highScorePlayers.length > 0) {
        // 如果有多個，選擇分數最高的
        highScorePlayers.sort((a, b) => b.score - a.score);
        actualWinner = highScorePlayers[0].name;
      } else if (players.length > 0) {
        // 否則選擇分數最高的玩家
        const sortedPlayers = [...players].sort((a, b) => b.score - a.score);
        actualWinner = sortedPlayers[0].name;
      } else {
        // 兜底使用當前玩家
        actualWinner = playerName;
      }
    }
    
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

  // 當前玩家是否被禁用
  const isPlayerDisabled = disabledPlayers.includes(playerName);

  // 移動端搶答按鈕
  const MobileBuzzButton = () => {
    if (!isMobile || !canPlayerBuzz) return null;
    
    // 根據禁用狀態設置不同的樣式
    const buttonStyle = {
      position: 'fixed',
      bottom: 'var(--space-md)',
      left: 'var(--space-md)',
      right: 'var(--space-md)',
      height: '70px',
      backgroundColor: isPlayerDisabled ? 'var(--text-light)' : 'var(--success)',
      color: 'white',
      border: 'none',
      borderRadius: 'var(--radius-lg)',
      fontSize: 'var(--text-2xl)',
      fontWeight: 'bold',
      zIndex: 1000,
      boxShadow: 'var(--shadow-lg)',
      transition: 'transform 0.1s ease, background-color 0.1s ease',
      WebkitTapHighlightColor: 'transparent',
      outline: 'none',
      WebkitAppearance: 'none',
      touchAction: 'manipulation',
      opacity: isPlayerDisabled ? 0.6 : 1,
      cursor: isPlayerDisabled ? 'not-allowed' : 'pointer'
    };
    
    return (
      <button 
        ref={buzzButtonRef}
        onClick={handleBuzzClick}
        className="buzz-button-mobile"
        style={buttonStyle}
        disabled={isPlayerDisabled}
      >
        {isPlayerDisabled ? '已禁用搶答' : '搶答!'}
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
            
            {/* 計時器 */}
            {currentPlayer ? (
              // 有人搶答時顯示答題計時器
              <Timer 
                seconds={answerTime} 
                variant={answerTime <= 5 ? 'warning' : 'normal'} 
              />
            ) : (
              // 沒人搶答時顯示靜態計時器
              <Timer 
                seconds={15} 
                variant="normal" 
              />
            )}
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
                fontSize: 'var(--text-xl)',
                fontWeight: 'bold',
                color: 'var(--success)',
                zIndex: 100
              }}
            >
              +1分!
            </div>
          ))}
          
          {/* 正確答案提示 */}
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
                textAlign: 'center', 
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
                <span style={{ 
                  display: 'block',
                  marginTop: 'var(--space-xs)',
                  fontSize: isMobile ? 'var(--text-sm)' : 'var(--text-base)',
                  color: 'var(--text-secondary)'
                }}>
                  剩餘時間: {answerTime} 秒
                </span>
              </div>
            )}
            
            {/* 禁用玩家列表 */}
            {disabledPlayers.length > 0 && (
              <div style={{ 
                marginTop: 'var(--space-md)',
                padding: 'var(--space-md)', 
                backgroundColor: 'var(--background-light)', 
                borderRadius: 'var(--radius-md)', 
                fontSize: isMobile ? 'var(--text-sm)' : 'var(--text-base)',
              }}>
                <p style={{ 
                  fontWeight: 'bold',
                  color: 'var(--text-secondary)',
                  marginBottom: 'var(--space-xs)'
                }}>
                  已禁用搶答的玩家:
                </p>
                <div style={{ 
                  display: 'flex', 
                  flexWrap: 'wrap', 
                  gap: 'var(--space-xs)'
                }}>
                  {disabledPlayers.map((player, index) => (
                    <span 
                      key={player} 
                      style={{
                        padding: '2px 8px',
                        backgroundColor: player === playerName ? 'var(--danger-light)' : 'var(--background)',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: isMobile ? 'var(--text-xs)' : 'var(--text-sm)',
                        color: player === playerName ? 'var(--danger)' : 'var(--text-secondary)'
                      }}
                    >
                      {player}
                    </span>
                  ))}
                </div>
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
          disabledPlayers={disabledPlayers}
          answerTime={answerTime}
        />
      </div>

      {/* 移動端搶答按鈕 */}
      <MobileBuzzButton />
    </div>
  );
};

export default GameArea;