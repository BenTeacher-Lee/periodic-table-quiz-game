// src/components/GameArea.js - 調試版本
import React, { useState, useRef, useEffect } from 'react';
import { useGame } from '../hooks/useGame';

// 動畫樣式
const animationStyles = `
  @keyframes moveUp {
    0% { transform: translateY(0); opacity: 1; }
    100% { transform: translateY(-50px); opacity: 0; }
  }
  
  @keyframes glowing {
    0% { text-shadow: 0 0 5px gold, 0 0 10px gold; color: #FFD700; }
    50% { text-shadow: 0 0 10px gold, 0 0 20px gold, 0 0 30px gold; color: #FFC125; }
    100% { text-shadow: 0 0 5px gold, 0 0 10px gold; color: #FFD700; }
  }
  
  @keyframes fadeIn {
    0% { opacity: 0; transform: scale(0.9); }
    100% { opacity: 1; transform: scale(1); }
  }
  
  @keyframes confetti {
    0% { transform: translateY(0) rotate(0deg); opacity: 1; }
    100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
  }
`;

// 彩色紙屑元素
const Confetti = ({ count = 50 }) => {
  const confetti = Array.from({ length: count }).map((_, i) => ({
    id: i,
    left: `${Math.random() * 100}%`,
    size: `${Math.random() * 10 + 5}px`,
    duration: `${Math.random() * 3 + 2}s`,
    delay: `${Math.random() * 2}s`,
    color: `hsl(${Math.random() * 360}, 80%, 60%)`,
  }));

  return confetti.map((conf) => (
    <div
      key={conf.id}
      style={{
        position: 'absolute',
        left: conf.left,
        top: '-20px',
        width: conf.size,
        height: conf.size,
        backgroundColor: conf.color,
        borderRadius: '2px',
        zIndex: 50,
        animation: `confetti ${conf.duration} ease-in ${conf.delay} forwards`,
      }}
    />
  ));
};

const GameArea = ({ roomId, playerName, onGameEnd }) => {
  console.log("GameArea 渲染, roomId:", roomId, "playerName:", playerName);
  
  const {
    gameStatus,
    currentQuestion,
    currentPlayer,
    winner,
    players,
    quickAnswer,
    checkAnswer,
    restartGame,
    endGame,
    startGame, // 新增：手動啟動遊戲功能
    error      // 新增：錯誤信息
  } = useGame(roomId, playerName);

  const [showCorrectEffect, setShowCorrectEffect] = useState(false);
  const [scoreAnimations, setScoreAnimations] = useState([]);
  const animationIdRef = useRef(0);
  
  // 確保顯示勝利畫面
  const [showVictoryScreen, setShowVictoryScreen] = useState(false);
  
  // 監聽遊戲狀態和獲勝者變化
  useEffect(() => {
    console.log("遊戲狀態變化:", gameStatus, "獲勝者:", winner);
    // 當遊戲狀態為結束且有獲勝者時，顯示勝利畫面
    if (gameStatus === '遊戲結束' && winner) {
      setShowVictoryScreen(true);
    } else {
      setShowVictoryScreen(false);
    }
  }, [gameStatus, winner]);

  // 處理答案檢查
  const handleCheckAnswer = (index) => {
    if (currentQuestion && index === currentQuestion.correctAnswer) {
      setShowCorrectEffect(true);
      const newAnimation = {
        id: animationIdRef.current++,
        x: Math.random() * 200
      };
      setScoreAnimations(prev => [...prev, newAnimation]);
      setTimeout(() => {
        setShowCorrectEffect(false);
      }, 1000);
      setTimeout(() => {
        setScoreAnimations(prev => prev.filter(anim => anim.id !== newAnimation.id));
      }, 1000);
    }
    checkAnswer(index);
  };

  // 處理回到大廳
  const handleReturnToLobby = () => {
    setShowVictoryScreen(false);
    endGame();
    if (onGameEnd) {
      setTimeout(() => {
        onGameEnd();
      }, 100);
    }
  };

  // 處理手動啟動遊戲
  const handleStartGame = () => {
    console.log("手動啟動遊戲按鈕被點擊");
    startGame();
  };

  // 顯示錯誤信息
  if (error) {
    return (
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column',
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '100vh',
        padding: '2rem'
      }}>
        <div style={{ 
          fontSize: '1.5rem', 
          fontWeight: 'bold', 
          color: '#EF4444',
          marginBottom: '1rem'
        }}>
          遊戲發生錯誤:
        </div>
        <div style={{
          backgroundColor: '#FEE2E2',
          padding: '1rem',
          borderRadius: '0.5rem',
          maxWidth: '600px',
          whiteSpace: 'pre-wrap',
          fontFamily: 'monospace'
        }}>
          {error}
        </div>
        <button 
          onClick={handleStartGame}
          style={{ 
            marginTop: '2rem',
            backgroundColor: '#3B82F6', 
            color: 'white', 
            padding: '1rem 2rem', 
            borderRadius: '0.5rem',
            fontSize: '1.25rem',
            fontWeight: 'bold',
            cursor: 'pointer',
            border: 'none'
          }}
        >
          嘗試啟動遊戲
        </button>
      </div>
    );
  }

  // 遊戲未開始或無題目
  if (!currentQuestion || (gameStatus !== '遊戲中' && gameStatus !== '遊戲結束')) {
    return (
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column',
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '100vh'
      }}>
        <div style={{ 
          fontSize: '1.5rem', 
          fontWeight: 'bold', 
          color: '#4B5563',
          marginBottom: '2rem'
        }}>
          等待遊戲開始...
        </div>
        <div style={{
          backgroundColor: '#F3F4F6',
          padding: '1rem',
          borderRadius: '0.5rem',
          marginBottom: '2rem',
          maxWidth: '600px'
        }}>
          <div>遊戲狀態: <strong>{gameStatus}</strong></div>
          <div>房間ID: <strong>{roomId || "未指定"}</strong></div>
          <div>玩家名稱: <strong>{playerName || "未指定"}</strong></div>
          <div>玩家數量: <strong>{players.length}</strong></div>
          <div>問題數量: <strong>{questions ? questions.length : 0}</strong></div>
        </div>
        <button 
          onClick={handleStartGame}
          style={{ 
            backgroundColor: '#10B981', 
            color: 'white', 
            padding: '1rem 2rem', 
            borderRadius: '0.5rem',
            fontSize: '1.25rem',
            fontWeight: 'bold',
            cursor: 'pointer',
            border: 'none'
          }}
        >
          手動啟動遊戲
        </button>
      </div>
    );
  }

  // 勝利畫面
  if (showVictoryScreen && winner) {
    return (
      <div style={{ 
        position: 'fixed', 
        inset: 0, 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        zIndex: 50,
        overflow: 'hidden'
      }}>
        <style>{animationStyles}</style>
        
        {/* 彩色紙屑效果 */}
        <Confetti count={100} />
        
        <div style={{ 
          backgroundColor: 'white', 
          padding: '3rem', 
          borderRadius: '1rem', 
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          textAlign: 'center',
          maxWidth: '90%',
          width: '600px',
          animation: 'fadeIn 0.5s ease-out',
          border: '3px solid #FFD700'
        }}>
          <h2 style={{ 
            fontSize: '2.5rem', 
            fontWeight: 'bold', 
            marginBottom: '1.5rem', 
            color: '#D97706',
            textShadow: '0 0 10px rgba(217, 119, 6, 0.3)'
          }}>
            🏆 恭喜獲勝 🏆
          </h2>
          
          <p style={{ 
            fontSize: '1.875rem', 
            marginBottom: '2rem', 
            color: '#7C3AED',
            background: 'linear-gradient(45deg, #7C3AED, #EC4899)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            padding: '0.5rem',
            fontWeight: 'bold'
          }}>
            {winner} 成功達到20分！
          </p>
          
          <div style={{ 
            marginBottom: '2rem',
            backgroundColor: '#F9FAFB',
            borderRadius: '0.75rem',
            padding: '1rem',
            boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.05)'
          }}>
            <h3 style={{ 
              fontSize: '1.5rem', 
              fontWeight: 'bold', 
              marginBottom: '1rem',
              color: '#4B5563'
            }}>
              最終排名
            </h3>
            
            {players.sort((a, b) => b.score - a.score).map((player, index) => (
              <div 
                key={index} 
                style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center', 
                  padding: '1rem', 
                  marginBottom: '0.5rem', 
                  borderRadius: '0.5rem',
                  backgroundColor: player.name === winner ? '#FEF3C7' : '#F3F4F6',
                  border: player.name === winner ? '2px solid #F59E0B' : '1px solid #E5E7EB',
                  transform: player.name === winner ? 'scale(1.05)' : 'scale(1)',
                  transition: 'all 0.2s ease',
                  boxShadow: player.name === winner ? '0 4px 6px -1px rgba(245, 158, 11, 0.1), 0 2px 4px -1px rgba(245, 158, 11, 0.06)' : 'none'
                }}
              >
                <span style={{ 
                  fontSize: '1.25rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}>
                  {index === 0 && <span style={{ fontSize: '1.5rem' }}>🥇</span>}
                  {index === 1 && <span style={{ fontSize: '1.5rem' }}>🥈</span>}
                  {index === 2 && <span style={{ fontSize: '1.5rem' }}>🥉</span>}
                  {index > 2 && <span style={{ fontSize: '1.25rem', width: '1.5rem', textAlign: 'center' }}>{index + 1}</span>}
                  {player.name}
                </span>
                <span style={{ 
                  fontSize: '1.25rem', 
                  fontWeight: 'bold',
                  color: player.name === winner ? '#D97706' : '#4B5563',
                  backgroundColor: player.name === winner ? '#FEF3C7' : '#F3F4F6',
                  padding: '0.25rem 0.75rem',
                  borderRadius: '9999px',
                  border: player.name === winner ? '1px solid #F59E0B' : '1px solid #E5E7EB'
                }}>
                  {player.score} 分
                </span>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', gap: '1.5rem' }}>
            <button 
              onClick={restartGame}
              style={{ 
                backgroundColor: '#3B82F6', 
                color: 'white', 
                padding: '1rem 2rem', 
                borderRadius: '0.5rem',
                fontSize: '1.25rem',
                fontWeight: 'bold',
                cursor: 'pointer',
                boxShadow: '0 4px 6px -1px rgba(59, 130, 246, 0.5)',