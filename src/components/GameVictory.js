// src/components/GameVictory.js - 按鈕修復版
import React, { useEffect, useState } from 'react';
import Button from './ui/Button';
import '../styles/animations.css';
import '../styles/mobile.css';

// 煙花動畫效果
const Firework = ({ top, left, color1, color2 }) => {
  return (
    <div
      style={{
        position: 'absolute',
        top: `${top}%`,
        left: `${left}%`,
        width: '6px',
        height: '6px',
        borderRadius: '50%',
        boxShadow: `0 0 40px 10px ${color1}, 0 0 20px 5px ${color2}`,
        animation: 'firework 1s ease-out infinite',
        transformOrigin: 'center',
        opacity: 0
      }}
    />
  );
};

// 獎盃圖標
const TrophyIcon = ({ size = 80 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 17.27L18.18 21L16.54 13.97L22 9.24L14.81 8.63L12 2L9.19 8.63L2 9.24L7.46 13.97L5.82 21L12 17.27Z" fill="#FFD700" />
  </svg>
);

// 獎牌圖標 (銀、銅)
const MedalIcon = ({ color, size = 60 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="12" r="8" fill={color} />
    <path d="M12 16C14.2091 16 16 14.2091 16 12C16 9.79086 14.2091 8 12 8C9.79086 8 8 9.79086 8 12C8 14.2091 9.79086 16 12 16Z" fill="#FFF" fillOpacity="0.3" />
  </svg>
);

const GameVictory = ({ players, winner, onRestart, onEnd, isMobile = false }) => {
  const [showAnimation, setShowAnimation] = useState(false);
  const [fireworks, setFireworks] = useState([]);
  const [clickedRestart, setClickedRestart] = useState(false);
  const [clickedEnd, setClickedEnd] = useState(false);

  // 排序玩家並找出前三名
  const sortedPlayers = [...(players || [])].sort((a, b) => b.score - a.score);
  const topThreePlayers = sortedPlayers.slice(0, 3);
  
  // 確保玩家數據有效
  useEffect(() => {
    console.log("勝利畫面接收到玩家數據:", {
      playersCount: (players || []).length,
      winner,
      topPlayers: sortedPlayers.slice(0, 3).map(p => `${p.name}(${p.score})`)
    });
  }, [players, winner, sortedPlayers]);
  
  // 處理按鈕點擊 - 增加防抖動
  const handleRestart = () => {
    if (clickedRestart) return; // 防止重複點擊
    
    console.log("點擊重新開始按鈕");
    setClickedRestart(true);
    
    // 防止重複觸發
    setTimeout(() => {
      if (onRestart) {
        console.log("執行重新開始回調");
        onRestart();
      }
    }, 100);
  };
  
  const handleEnd = () => {
    if (clickedEnd) return; // 防止重複點擊
    
    console.log("點擊結束遊戲按鈕");
    setClickedEnd(true);
    
    // 防止重複觸發
    setTimeout(() => {
      if (onEnd) {
        console.log("執行結束遊戲回調");
        onEnd();
      }
    }, 100);
  };
  
  // 生成煙花效果 - 移動端減少煙花數量
  useEffect(() => {
    // 淡入效果
    const animationTimer = setTimeout(() => {
      setShowAnimation(true);
    }, 300);

    // 生成隨機煙花位置 - 移動端減少數量
    const createFireworks = () => {
      const newFireworks = [];
      // 移動端使用較少的煙花以提高性能
      const fireworkCount = isMobile ? 5 : 12;
      
      for (let i = 0; i < fireworkCount; i++) {
        const colors = [
          ['#ff0000', '#ffcccc'], // 紅色
          ['#00ff00', '#ccffcc'], // 綠色
          ['#0000ff', '#ccccff'], // 藍色
          ['#ffff00', '#ffffcc'], // 黃色
          ['#ff00ff', '#ffccff'], // 紫色
          ['#00ffff', '#ccffff']  // 青色
        ];
        const randomColor = colors[Math.floor(Math.random() * colors.length)];
        
        newFireworks.push({
          id: i,
          top: Math.random() * 80 + 10, // 10% - 90%
          left: Math.random() * 80 + 10, // 10% - 90%
          color1: randomColor[0],
          color2: randomColor[1]
        });
      }
      setFireworks(newFireworks);
    };

    createFireworks();
    // 移動端增加間隔時間以減少渲染負擔
    const fireworksInterval = setInterval(createFireworks, isMobile ? 3000 : 2000);

    return () => {
      clearTimeout(animationTimer);
      clearInterval(fireworksInterval);
    };
  }, [isMobile]);

  // 驗證是否有有效玩家數據
  const hasValidPlayers = Array.isArray(players) && players.length > 0;

  return (
    <div style={{ 
      position: 'fixed', 
      inset: 0, 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center',
      backgroundColor: 'rgba(0, 0, 0, 0.85)',
      zIndex: 50,
      perspective: '1000px'
    }}>
      {/* 煙花動畫效果 */}
      {fireworks.map(fw => (
        <Firework 
          key={fw.id} 
          top={fw.top} 
          left={fw.left} 
          color1={fw.color1} 
          color2={fw.color2} 
        />
      ))}

      {/* 游戲勝利動畫容器 */}
      <div 
        style={{ 
          backgroundColor: 'white', 
          borderRadius: 'var(--radius-xl)', 
          boxShadow: 'var(--shadow-xl)',
          width: '90%',
          maxWidth: isMobile ? '95%' : '800px',
          maxHeight: isMobile ? '90vh' : 'none',
          overflowY: isMobile ? 'auto' : 'visible',
          opacity: showAnimation ? 1 : 0,
          transform: showAnimation ? 'rotateX(0deg) scale(1)' : 'rotateX(20deg) scale(0.8)',
          transition: 'all 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
        }}
      >
        {/* 標題區域 */}
        <div style={{ 
          background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%)',
          padding: isMobile ? 'var(--space-md)' : 'var(--space-xl)',
          textAlign: 'center',
          color: 'white',
          position: 'relative'
        }}>
          <h1 style={{ 
            fontSize: isMobile ? 'var(--text-2xl)' : 'var(--text-4xl)', 
            fontWeight: 'bold',
            marginBottom: 'var(--space-sm)',
            textShadow: '0 2px 10px rgba(0,0,0,0.3)',
            animation: 'pulse 2s infinite'
          }}>
            🏆 遊戲結束 🏆
          </h1>
          <p style={{ 
            fontSize: isMobile ? 'var(--text-lg)' : 'var(--text-xl)',
            opacity: 0.9,
            fontWeight: 'bold'
          }}>
            恭喜 <span className="gold-glow" style={{ 
              color: '#FFD700', 
              fontWeight: 'bold',
              fontSize: isMobile ? 'var(--text-xl)' : 'var(--text-2xl)',
            }}>{winner || '勝利者'}</span> 獲得勝利！
          </p>
        </div>

        {/* 前三名計分榜 */}
        <div style={{
          padding: isMobile ? 'var(--space-md)' : 'var(--space-xl)',
          background: 'linear-gradient(to bottom, var(--background-light), #f3f4f6)'
        }}>
          <h2 style={{ 
            textAlign: 'center', 
            fontSize: isMobile ? 'var(--text-xl)' : 'var(--text-2xl)', 
            fontWeight: 'bold',
            marginBottom: isMobile ? 'var(--space-md)' : 'var(--space-xl)',
            color: 'var(--text-primary)'
          }}>
            優勝者排行榜
          </h2>

          <div className="victory-players" style={{ 
            display: 'flex',
            justifyContent: 'center',
            flexWrap: 'wrap',
            gap: isMobile ? 'var(--space-md)' : 'var(--space-xl)',
            marginBottom: isMobile ? 'var(--space-md)' : 'var(--space-xl)',
            flexDirection: isMobile ? 'column' : 'row',
            alignItems: isMobile ? 'center' : 'flex-start'
          }}>
            {/* 前三名玩家顯示 - 移動端橫向排列 */}
            {isMobile ? (
              // 移動端布局 - 橫向排列獎牌
              <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'flex-end',
                width: '100%',
                gap: 'var(--space-sm)'
              }}>
                {/* 第二名 */}
                {hasValidPlayers && topThreePlayers.length > 1 && (
                  <div style={{ 
                    order: 1, 
                    width: '30%',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center'
                  }}>
                    <MedalIcon color="#C0C0C0" size={50} />
                    <div style={{ 
                      backgroundColor: 'white',
                      padding: 'var(--space-sm)',
                      borderRadius: 'var(--radius-md)',
                      textAlign: 'center',
                      width: '100%',
                      marginTop: 'var(--space-xs)',
                      boxShadow: 'var(--shadow-md)'
                    }}>
                      <div style={{ fontWeight: 'bold', fontSize: 'var(--text-sm)' }}>
                        {topThreePlayers[1].name}
                      </div>
                      <div style={{ fontWeight: 'bold', color: 'var(--text-secondary)' }}>
                        {topThreePlayers[1].score}分
                      </div>
                    </div>
                  </div>
                )}
                
                {/* 第一名 */}
                {hasValidPlayers && topThreePlayers.length > 0 && (
                  <div style={{ 
                    order: 2, 
                    width: '40%',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    zIndex: 10
                  }}>
                    <TrophyIcon size={70} />
                    <div style={{ 
                      backgroundColor: 'var(--warning-light)',
                      padding: 'var(--space-md)',
                      borderRadius: 'var(--radius-md)',
                      textAlign: 'center',
                      width: '100%',
                      marginTop: 'var(--space-xs)',
                      border: '2px solid #FFD700',
                      boxShadow: 'var(--shadow-lg)'
                    }}>
                      <div style={{ 
                        fontWeight: 'bold', 
                        fontSize: 'var(--text-base)',
                        color: 'var(--warning-dark)'
                      }}>
                        {topThreePlayers[0].name}
                      </div>
                      <div style={{ 
                        fontWeight: 'bold',
                        fontSize: 'var(--text-lg)',
                        color: 'var(--warning-dark)'
                      }}>
                        {topThreePlayers[0].score}分
                      </div>
                    </div>
                  </div>
                )}
                
                {/* 第三名 */}
                {hasValidPlayers && topThreePlayers.length > 2 && (
                  <div style={{ 
                    order: 3, 
                    width: '30%',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center'
                  }}>
                    <MedalIcon color="#CD7F32" size={50} />
                    <div style={{ 
                      backgroundColor: 'white',
                      padding: 'var(--space-sm)',
                      borderRadius: 'var(--radius-md)',
                      textAlign: 'center',
                      width: '100%',
                      marginTop: 'var(--space-xs)',
                      boxShadow: 'var(--shadow-md)'
                    }}>
                      <div style={{ fontWeight: 'bold', fontSize: 'var(--text-sm)' }}>
                        {topThreePlayers[2].name}
                      </div>
                      <div style={{ fontWeight: 'bold', color: 'var(--text-secondary)' }}>
                        {topThreePlayers[2].score}分
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              // 桌面版佈局 - 原始設計
              hasValidPlayers && topThreePlayers.map((player, index) => {
                // 根據排名決定樣式
                const isWinner = index === 0;
                
                // 獎牌顏色
                const medalColor = isWinner ? '#FFD700' : index === 1 ? '#C0C0C0' : '#CD7F32';
                
                // 玩家卡片樣式
                const cardStyle = {
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  flex: '1',
                  minWidth: index === 0 ? '250px' : '200px',
                  maxWidth: index === 0 ? '350px' : '300px',
                  animation: isWinner ? 'float 3s ease-in-out infinite' : 'none',
                  position: 'relative',
                  order: index === 0 ? 2 : index === 1 ? 1 : 3, // 第一名在中間
                };

                return (
                  <div key={player.name} style={cardStyle}>
                    {/* 排名顯示 */}
                    <div style={{
                      position: 'absolute',
                      top: '-15px',
                      left: '50%',
                      transform: 'translateX(-50%)',
                      backgroundColor: medalColor,
                      color: 'white',
                      width: '30px',
                      height: '30px',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 'bold',
                      fontSize: 'var(--text-lg)',
                      zIndex: 10,
                      boxShadow: 'var(--shadow-md)'
                    }}>
                      {index + 1}
                    </div>
                    
                    {/* 獎牌/獎盃圖標 */}
                    <div style={{ marginBottom: 'var(--space-md)' }}>
                      {isWinner ? <TrophyIcon /> : <MedalIcon color={medalColor} />}
                    </div>
                    
                    {/* 玩家名稱 */}
                    <div style={{
                      backgroundColor: isWinner ? 'var(--warning-light)' : 'white',
                      padding: 'var(--space-lg)',
                      borderRadius: 'var(--radius-lg)',
                      boxShadow: 'var(--shadow-lg)',
                      textAlign: 'center',
                      width: '100%',
                      border: isWinner ? `2px solid #FFD700` : `1px solid var(--background-light)`,
                      transform: isWinner ? 'translateY(-10px)' : 'translateY(0px)',
                      zIndex: isWinner ? 10 : 5
                    }}>
                      <h3 style={{ 
                        fontSize: isWinner ? 'var(--text-xl)' : 'var(--text-lg)', 
                        fontWeight: 'bold',
                        color: isWinner ? 'var(--warning-dark)' : 'var(--text-primary)',
                        marginBottom: 'var(--space-sm)'
                      }}>
                        {player.name}
                      </h3>
                      <p style={{
                        fontSize: isWinner ? 'var(--text-2xl)' : 'var(--text-xl)',
                        fontWeight: 'bold',
                        color: isWinner ? 'var(--warning-dark)' : 'var(--text-secondary)',
                        fontFamily: 'monospace'
                      }}>
                        {player.score} 分
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
          
          {/* 其他玩家列表 */}
          {hasValidPlayers && sortedPlayers.length > 3 && (
            <div style={{
              backgroundColor: 'white',
              borderRadius: 'var(--radius-lg)',
              padding: 'var(--space-md)',
              marginBottom: isMobile ? 'var(--space-md)' : 'var(--space-xl)',
              boxShadow: 'var(--shadow-md)',
              maxHeight: isMobile ? '150px' : 'none',
              overflowY: isMobile ? 'auto' : 'visible'
            }}>
              <h3 style={{ 
                fontSize: isMobile ? 'var(--text-base)' : 'var(--text-lg)', 
                fontWeight: 'bold', 
                marginBottom: isMobile ? 'var(--space-sm)' : 'var(--space-md)',
                textAlign: 'center',
                color: 'var(--text-secondary)'
              }}>
                其他玩家
              </h3>
              
              <div style={{ 
                display: 'flex', 
                flexDirection: 'column', 
                gap: isMobile ? 'var(--space-xs)' : 'var(--space-sm)' 
              }}>
                {sortedPlayers.slice(3).map((player, index) => (
                  <div 
                    key={player.name} 
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      padding: isMobile ? 
                        'var(--space-sm) var(--space-sm)' : 
                        'var(--space-md) var(--space-md)',
                      backgroundColor: 'var(--background-light)',
                      borderRadius: 'var(--radius-md)',
                      fontSize: isMobile ? 'var(--text-sm)' : 'var(--text-base)'
                    }}
                  >
                    <span>#{index + 4} {player.name}</span>
                    <span style={{ fontWeight: 'bold' }}>{player.score} 分</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 按鈕組 - 修改為原生HTML按鈕，避免樣式問題 */}
          <div style={{ 
            display: 'flex', 
            justifyContent: 'center', 
            gap: isMobile ? 'var(--space-md)' : 'var(--space-xl)',
            flexWrap: 'wrap',
            flexDirection: isMobile ? 'column' : 'row',
            marginTop: 'var(--space-xl)'
          }}>
            <button 
              onClick={handleRestart}
              disabled={clickedRestart}
              style={{
                backgroundColor: 'var(--primary)',
                color: 'white',
                border: 'none',
                borderRadius: 'var(--radius-md)',
                padding: 'var(--space-md) var(--space-xl)',
                fontSize: 'var(--text-lg)',
                fontWeight: 'bold',
                cursor: 'pointer',
                flex: isMobile ? 'auto' : '1',
                minWidth: isMobile ? 'auto' : '180px',
                maxWidth: isMobile ? 'auto' : '250px',
                transition: 'all 0.2s ease',
                boxShadow: 'var(--shadow-md)',
                opacity: clickedRestart ? 0.7 : 1
              }}
            >
              再來一局
            </button>
            
            <button 
              onClick={handleEnd}
              disabled={clickedEnd}
              style={{
                backgroundColor: 'var(--danger)',
                color: 'white',
                border: 'none',
                borderRadius: 'var(--radius-md)',
                padding: 'var(--space-md) var(--space-xl)',
                fontSize: 'var(--text-lg)',
                fontWeight: 'bold',
                cursor: 'pointer',
                flex: isMobile ? 'auto' : '1',
                minWidth: isMobile ? 'auto' : '180px',
                maxWidth: isMobile ? 'auto' : '250px',
                transition: 'all 0.2s ease',
                boxShadow: 'var(--shadow-md)',
                opacity: clickedEnd ? 0.7 : 1
              }}
            >
              結束遊戲
            </button>
          </div>
        </div>
      </div>

      {/* CSS 動畫樣式 - 保留在頁面內以確保動畫正常工作 */}
      <style>
        {`
          @keyframes firework {
            0% { transform: scale(0); opacity: 1; }
            50% { opacity: 1; }
            100% { transform: scale(10); opacity: 0; }
          }
          
          @keyframes glow {
            from { text-shadow: 0 0 5px #fff, 0 0 10px #fff, 0 0 15px #FFD700, 0 0 20px #FFD700; }
            to { text-shadow: 0 0 10px #fff, 0 0 20px #FFD700, 0 0 30px #FFD700, 0 0 40px #FFD700; }
          }
          
          @keyframes pulse {
            0% { transform: scale(1); }
            50% { transform: scale(1.05); }
            100% { transform: scale(1); }
          }
          
          @keyframes bounce {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-10px); }
          }
          
          /* 移動端媒體查詢，減少動畫效果 */
          @media (max-width: 768px) {
            @keyframes pulse {
              0% { transform: scale(1); }
              50% { transform: scale(1.03); }
              100% { transform: scale(1); }
            }
          }
        `}
      </style>
    </div>
  );
};

export default GameVictory;