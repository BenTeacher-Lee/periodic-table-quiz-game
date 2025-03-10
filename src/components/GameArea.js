// src/components/GameArea.js - 完全優化版
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
  // 使用優化後的hook
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
  const animationIdRef = useRef(0);
  const buzzButtonRef = useRef(null);
  const [gameOverTriggered, setGameOverTriggered] = useState(false);

  // 監控遊戲狀態 - 增強版
  useEffect(() => {
    console.log("GameArea - 狀態變更:", {
      gameStatus,
      winner,
      playersCount: players.length,
      currentQuestion: !!currentQuestion,
      hasWinningPlayer: players.some(p => p.score >= 20)
    });
    
    // 特殊處理遊戲結束狀態
    if ((gameStatus === '遊戲結束' || winner) && !gameOverTriggered) {
      console.log("檢測到遊戲結束狀態，觸發GameVictory顯示");
      setGameOverTriggered(true);
    }
  }, [gameStatus, winner, players, currentQuestion, gameOverTriggered]);
  
  // 檢查當前玩家是否可以搶答
  const canPlayerBuzz = !currentPlayer && !showingAnswer && !disabledPlayers.includes(playerName);
  
  // 處理搶答按鈕點擊 - 增強版
  const handleBuzzClick = () => {
    if (!canPlayerBuzz) {
      console.log("無法搶答:", { currentPlayer, showingAnswer, isDisabled: disabledPlayers.includes(playerName) });
      return;
    }
    
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

  // 處理答案檢查和視覺效果
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

  // 檢查勝利條件 - 更寬鬆更穩健的判斷 
  const isGameOver = gameOverTriggered || 
                     gameStatus === '遊戲結束' || 
                     !!winner || 
                     (players.length > 0 && players.some(player => player.score >= 20));
  
  console.log("最終勝利判斷:", {
    isGameOver,
    gameOverTriggered,
    gameStatus,
    winner,
    hasHighScorePlayer: players.some(player => player.score >= 20)
  });

  // 遊戲結束顯示勝利畫面
  if (isGameOver) {
    console.log("顯示勝利畫面:", { gameStatus, winner, players });
    
    // 確保有勝利者，如果沒有明確勝利者，使用分數最高的玩家
    const highScorePlayers = players.filter(p => p.score >= 20);
    const highestScorePlayer = players.length > 0 ? 
                              [...players].sort((a, b) => b.score - a.score)[0] : 
                              null;
    
    // 優先順序: 1.指定的winner 2.達到閾值的玩家 3.分數最高的玩家 4.當前玩家
    const actualWinner = winner || 
                         (highScorePlayers.length > 0 ? highScorePlayers[0].name : 
                          (highestScorePlayer ? highestScorePlayer.name : playerName));
    
    console.log("最終勝利者計算:", {
      specifiedWinner: winner,
      highScorePlayers: highScorePlayers.map(p => `${p.name}(${p.score})`),
      highestPlayer: highestScorePlayer ? `${highestScorePlayer.name}(${highestScorePlayer.score})` : null,
      actualWinner
    });
    
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

  // 移動端搶答按鈕 - 增強版
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
      WebkitTapHighlightColor: 'transparent', // 移除iOS點擊高亮
      outline: 'none', // 移除點擊輪廓
      WebkitAppearance: 'none', // 移除默認按鈕樣式
      touchAction: 'manipulation', // 優化觸控
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
            
            {/* 根據遊戲狀態顯示不同的計時器 */}
            {currentPlayer ? (
              // 有人搶答時顯示答題倒計時
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
            
            {/* 禁用玩家列表顯示 */}
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
            
            {/* 開發工具: 顯示調試信息按鈕 */}
            <button 
              onClick={() => console.log({
                gameStatus,
                winner,
                currentPlayer,
                answerTime,
                showingAnswer,
                players: players.map(p => `${p.name}(${p.score})`),
                disabledPlayers,
                canPlayerBuzz,
                isPlayerDisabled,
                isGameOver,
                gameOverTriggered
              })}
              style={{
                position: 'fixed',
                bottom: '5px',
                left: '5px',
                fontSize: '10px',
                opacity: 0.3,
                padding: '3px',
                zIndex: 9999
              }}
            >
              Debug
            </button>
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

      {/* 移動端獨有的浮動搶答按鈕 */}
      <MobileBuzzButton />
    </div>
  );
};

export default GameArea;