// src/components/GameArea.js - 優化後的代碼
import React, { useState, useRef } from 'react';
import { useGame } from '../hooks/useGame';

// 內聯 CSS 動畫樣式
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
`;

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

  // 遊戲未開始或無題目
  if (!currentQuestion || (gameStatus !== '遊戲中' && gameStatus !== '遊戲結束')) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#4B5563' }}>等待遊戲開始...</div>
      </div>
    );
  }

  // 遊戲結束
  if (gameStatus === '遊戲結束' && winner) {
    return (
      <div style={{ 
        position: 'fixed', 
        inset: 0, 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        zIndex: 50
      }}>
        <div style={{ 
          backgroundColor: 'white', 
          padding: '3rem', 
          borderRadius: '0.5rem', 
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          textAlign: 'center',
          maxWidth: '90%',
          width: '600px'
        }}>
          <h2 style={{ fontSize: '2.5rem', fontWeight: 'bold', marginBottom: '2rem', color: '#D97706' }}>
            🏆 恭喜獲勝 🏆
          </h2>
          <p style={{ fontSize: '1.875rem', marginBottom: '2rem', color: '#7C3AED' }}>
            {winner} 成功達到20分！
          </p>
          
          <div style={{ marginBottom: '2rem' }}>
            <h3 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem' }}>最終排名</h3>
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
                  backgroundColor: player.name === winner ? '#FEF3C7' : '#F3F4F6'
                }}
              >
                <span style={{ fontSize: '1.25rem' }}>#{index + 1} {player.name}</span>
                <span style={{ 
                  fontSize: '1.25rem', 
                  fontWeight: 'bold',
                  color: player.name === winner ? '#D97706' : 'inherit'
                }}>
                  分數：{player.score}
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
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
              }}
            >
              再來一局
            </button>
            <button 
              onClick={() => {
                endGame();
                if (onGameEnd) onGameEnd();
              }}
              style={{ 
                backgroundColor: '#EF4444', 
                color: 'white', 
                padding: '1rem 2rem', 
                borderRadius: '0.5rem',
                fontSize: '1.25rem',
                fontWeight: 'bold',
                cursor: 'pointer',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
              }}
            >
              結束遊戲
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 排序玩家並按分數從高到低顯示
  const sortedPlayers = [...players].sort((a, b) => b.score - a.score);

  // 遊戲中
  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '1rem', display: 'flex', flexWrap: 'wrap' }}>
      {/* 注入 CSS 動畫 */}
      <style>{animationStyles}</style>
      
      {/* 左側計分榜 */}
      <div style={{ 
        width: '280px', 
        marginRight: '2rem',
        marginBottom: '1rem',
        alignSelf: 'flex-start',
        backgroundColor: '#F9FAFB',
        borderRadius: '0.75rem',
        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        border: '2px solid #E5E7EB',
        overflow: 'hidden'
      }}>
        <div style={{ 
          backgroundColor: '#4B5563', 
          color: 'white', 
          padding: '0.75rem', 
          textAlign: 'center',
          fontWeight: 'bold',
          fontSize: '1.25rem',
        }}>
          計分榜
        </div>
        
        <div style={{ padding: '1rem' }}>
          {sortedPlayers.map((player, index) => (
            <div 
              key={index} 
              style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center', 
                padding: '0.75rem', 
                marginBottom: '0.5rem',
                backgroundColor: index === 0 ? '#FEF9C3' : 
                               index === 1 ? '#F1F5F9' : 
                               index === 2 ? '#FCE7F3' : 'white',
                borderRadius: '0.5rem',
                border: '1px solid #E5E7EB'
              }}
            >
              <span style={{ 
                fontSize: '1.125rem', 
                fontWeight: 'bold',
                animation: player.score >= 15 ? 'glowing 1.5s infinite' : 'none',
                padding: '2px 6px',
                borderRadius: '4px',
                backgroundColor: player.score >= 15 ? 'rgba(255, 215, 0, 0.15)' : 'transparent'
              }}>
                {index + 1}. {player.name}
              </span>
              <span style={{ 
                fontSize: '1.125rem', 
                fontWeight: 'bold',
                backgroundColor: '#3B82F6',
                color: 'white',
                padding: '0.25rem 0.5rem',
                borderRadius: '9999px',
                minWidth: '40px',
                textAlign: 'center'
              }}>
                {player.score}
              </span>
            </div>
          ))}
        </div>

        {/* 玩家搶答按鈕 - 僅顯示給當前玩家 */}
        {sortedPlayers.find(p => p.name === playerName) && (
          <div style={{ padding: '1rem', borderTop: '1px solid #E5E7EB', textAlign: 'center' }}>
            <button 
              onClick={() => quickAnswer()}
              disabled={currentPlayer !== null}
              style={{ 
                width: '100%',
                padding: '0.75rem',
                backgroundColor: currentPlayer !== null ? '#E5E7EB' : '#10B981',
                color: currentPlayer !== null ? '#6B7280' : 'white',
                border: 'none',
                borderRadius: '0.5rem',
                fontSize: '1.25rem',
                fontWeight: 'bold',
                cursor: currentPlayer !== null ? 'not-allowed' : 'pointer',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                transition: 'all 0.2s ease'
              }}
            >
              搶答
            </button>
          </div>
        )}
      </div>

      {/* 右側主遊戲區 */}
      <div style={{ 
        flex: '1 1 680px',
        backgroundColor: 'white', 
        padding: '2rem', 
        borderRadius: '0.5rem', 
        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        position: 'relative'
      }}>
        <h2 style={{ 
          fontSize: '2rem', 
          fontWeight: 'bold', 
          marginBottom: '2rem', 
          textAlign: 'center'
        }}>
          元素週期表搶答遊戲
        </h2>
        
        {/* 分數動畫 - 置於最上層 */}
        {scoreAnimations.map(anim => (
          <div 
            key={anim.id}
            style={{
              position: 'absolute',
              top: '50%',
              left: `calc(50% + ${anim.x - 100}px)`,
              color: '#10B981',
              fontWeight: 'bold',
              fontSize: '1.5rem',
              animation: 'moveUp 1s forwards',
              zIndex: 100  // 確保顯示在最上層
            }}
          >
            +1分!
          </div>
        ))}
        
        {/* 正確答案提示區塊 - 置於最上層 */}
        {showCorrectEffect && (
          <div style={{
            position: 'absolute',
            top: '20%',
            left: '50%',
            transform: 'translateX(-50%)',
            backgroundColor: 'rgba(16, 185, 129, 0.9)',
            color: 'white',
            padding: '1rem 2rem',
            borderRadius: '0.5rem',
            fontWeight: 'bold',
            fontSize: '1.5rem',
            zIndex: 100,  // 確保顯示在最上層
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
          }}>
            答對了！
          </div>
        )}
        
        <div style={{ 
          marginBottom: '3rem',
          backgroundColor: showCorrectEffect ? 'rgba(16, 185, 129, 0.1)' : 'transparent',
          padding: '1rem',
          borderRadius: '0.5rem',
          transition: 'background-color 0.5s ease'
        }}>
          <p style={{ 
            fontSize: '1.5rem', 
            marginBottom: '1.5rem', 
            fontFamily: 'Arial, sans-serif' // 使用預設字體
          }}>
            <span style={{ fontWeight: 'bold' }}>Question: </span>
            {currentQuestion.question}
          </p>
          
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', 
            gap: '1rem',
            marginBottom: '1.5rem'
          }}>
            {currentQuestion.options.map((option, index) => (
              <button 
                key={index}
                onClick={() => handleCheckAnswer(index)}
                disabled={currentPlayer !== playerName}
                style={{ 
                  padding: '1.25rem', 
                  backgroundColor: currentPlayer !== playerName ? '#E5E7EB' : '#3B82F6',
                  color: currentPlayer !== playerName ? '#6B7280' : 'white',
                  border: 'none',
                  borderRadius: '0.75rem',
                  fontSize: '1.25rem',
                  fontWeight: 'bold',
                  cursor: currentPlayer !== playerName ? 'not-allowed' : 'pointer',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                  fontFamily: 'Arial, sans-serif', // 使用預設字體
                  transition: 'transform 0.1s ease',
                  transform: 'scale(1)'
                }}
              >
                {option}
              </button>
            ))}
          </div>
          
          {currentPlayer && (
            <div style={{ 
              textAlign: 'right', 
              padding: '0.75rem', 
              backgroundColor: '#FEF3C7', 
              borderRadius: '0.5rem', 
              fontSize: '1.25rem',
              fontFamily: 'Arial, sans-serif' // 使用預設字體
            }}>
              目前搶答者：<span style={{ fontWeight: 'bold', color: '#D97706' }}>{currentPlayer}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GameArea;