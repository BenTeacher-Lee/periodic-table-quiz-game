// src/components/GameVictory.js - 新建組件
import React, { useEffect, useState } from 'react';

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
const TrophyIcon = () => (
  <svg width="80" height="80" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 17.27L18.18 21L16.54 13.97L22 9.24L14.81 8.63L12 2L9.19 8.63L2 9.24L7.46 13.97L5.82 21L12 17.27Z" fill="#FFD700" />
  </svg>
);

// 獎牌圖標 (銀、銅)
const MedalIcon = ({ color }) => (
  <svg width="60" height="60" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="12" r="8" fill={color} />
    <path d="M12 16C14.2091 16 16 14.2091 16 12C16 9.79086 14.2091 8 12 8C9.79086 8 8 9.79086 8 12C8 14.2091 9.79086 16 12 16Z" fill="#FFF" fillOpacity="0.3" />
  </svg>
);

const GameVictory = ({ players, winner, onRestart, onEnd }) => {
  const [showAnimation, setShowAnimation] = useState(false);
  const [fireworks, setFireworks] = useState([]);

  // 排序玩家並找出前三名
  const sortedPlayers = [...players].sort((a, b) => b.score - a.score);
  const topThreePlayers = sortedPlayers.slice(0, 3);
  
  // 生成煙花效果
  useEffect(() => {
    // 淡入效果
    const animationTimer = setTimeout(() => {
      setShowAnimation(true);
    }, 300);

    // 生成隨機煙花位置
    const createFireworks = () => {
      const newFireworks = [];
      for (let i = 0; i < 12; i++) {
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
    const fireworksInterval = setInterval(createFireworks, 2000);

    return () => {
      clearTimeout(animationTimer);
      clearInterval(fireworksInterval);
    };
  }, []);

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
          borderRadius: '1rem', 
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
          width: '90%',
          maxWidth: '800px',
          opacity: showAnimation ? 1 : 0,
          transform: `rotateX(${showAnimation ? '0deg' : '20deg'}) scale(${showAnimation ? 1 : 0.8})`,
          transition: 'all 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
          overflow: 'hidden'
        }}
      >
        {/* 標題區域 */}
        <div style={{ 
          background: 'linear-gradient(135deg, #6366F1 0%, #7C3AED 100%)',
          padding: '2rem',
          textAlign: 'center',
          color: 'white',
          position: 'relative'
        }}>
          <h1 style={{ 
            fontSize: '2.5rem', 
            fontWeight: 'bold',
            marginBottom: '0.5rem',
            textShadow: '0 2px 10px rgba(0,0,0,0.3)',
            animation: 'pulse 2s infinite'
          }}>
            🏆 遊戲結束 🏆
          </h1>
          <p style={{ 
            fontSize: '1.5rem',
            opacity: 0.9,
            fontWeight: 'bold'
          }}>
            恭喜 <span style={{ 
              color: '#FFD700', 
              fontWeight: 'bold',
              textShadow: '0 0 10px rgba(255,215,0,0.7)',
              fontSize: '1.8rem',
              animation: 'glow 1.5s ease-in-out infinite alternate'
            }}>{winner}</span> 獲得勝利！
          </p>
        </div>

        {/* 前三名計分榜 */}
        <div style={{
          padding: '2rem',
          background: 'linear-gradient(to bottom, #f9fafb, #f3f4f6)'
        }}>
          <h2 style={{ 
            textAlign: 'center', 
            fontSize: '1.8rem', 
            fontWeight: 'bold',
            marginBottom: '2rem',
            color: '#1F2937'
          }}>
            優勝者排行榜
          </h2>

          <div style={{ 
            display: 'flex',
            justifyContent: 'center',
            flexWrap: 'wrap',
            gap: '2rem',
            marginBottom: '2rem'
          }}>
            {/* 前三名玩家顯示 */}
            {topThreePlayers.map((player, index) => {
              // 根據排名決定樣式
              const isWinner = index === 0;
              
              // 根據排名決定底座高度
              const baseHeight = isWinner ? '70px' : index === 1 ? '50px' : '30px';
              
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
                animation: `${isWinner ? 'bounce 1s ease infinite' : 'none'}`,
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
                    fontSize: '1.2rem',
                    zIndex: 10,
                    boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                  }}>
                    {index + 1}
                  </div>
                  
                  {/* 獎牌/獎盃圖標 */}
                  <div style={{ marginBottom: '1rem' }}>
                    {isWinner ? <TrophyIcon /> : <MedalIcon color={medalColor} />}
                  </div>
                  
                  {/* 玩家名稱 */}
                  <div style={{
                    backgroundColor: isWinner ? '#FEF3C7' : 'white',
                    padding: '1.5rem',
                    borderRadius: '0.75rem',
                    boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
                    textAlign: 'center',
                    width: '100%',
                    border: isWinner ? '2px solid #FFD700' : '1px solid #E5E7EB',
                    transform: `translateY(-${isWinner ? 10 : 0}px)`,
                    zIndex: isWinner ? 10 : 5
                  }}>
                    <h3 style={{ 
                      fontSize: isWinner ? '1.5rem' : '1.25rem', 
                      fontWeight: 'bold',
                      color: isWinner ? '#D97706' : '#1F2937',
                      marginBottom: '0.5rem'
                    }}>
                      {player.name}
                    </h3>
                    <p style={{
                      fontSize: isWinner ? '2rem' : '1.75rem',
                      fontWeight: 'bold',
                      color: isWinner ? '#B45309' : '#4B5563',
                      fontFamily: 'monospace'
                    }}>
                      {player.score} 分
                    </p>
                  </div>
                  
                  {/* 基座 */}
                  <div style={{
                    backgroundColor: isWinner ? '#FCD34D' : index === 1 ? '#E5E7EB' : '#D6BCFA',
                    height: baseHeight,
                    width: '80%',
                    borderRadius: '0.5rem 0.5rem 0 0',
                    marginTop: '-0.5rem'
                  }} />
                </div>
              );
            })}
          </div>
          
          {/* 其他玩家列表 */}
          {sortedPlayers.length > 3 && (
            <div style={{
              backgroundColor: 'white',
              borderRadius: '0.75rem',
              padding: '1rem',
              marginBottom: '2rem',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
            }}>
              <h3 style={{ 
                fontSize: '1.25rem', 
                fontWeight: 'bold', 
                marginBottom: '1rem',
                textAlign: 'center',
                color: '#4B5563'
              }}>
                其他玩家
              </h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {sortedPlayers.slice(3).map((player, index) => (
                  <div 
                    key={player.name} 
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      padding: '0.75rem 1rem',
                      backgroundColor: '#F9FAFB',
                      borderRadius: '0.5rem',
                      fontSize: '1.1rem'
                    }}
                  >
                    <span>#{index + 4} {player.name}</span>
                    <span style={{ fontWeight: 'bold' }}>{player.score} 分</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 按鈕組 */}
          <div style={{ 
            display: 'flex', 
            justifyContent: 'center', 
            gap: '1rem',
            flexWrap: 'wrap'
          }}>
            <button 
              onClick={onRestart}
              style={{ 
                backgroundColor: '#3B82F6', 
                color: 'white', 
                padding: '1rem 2rem', 
                borderRadius: '0.5rem',
                fontSize: '1.25rem',
                fontWeight: 'bold',
                cursor: 'pointer',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                border: 'none',
                transition: 'all 0.2s',
                minWidth: '180px'
              }}
              onMouseOver={(e) => e.target.style.backgroundColor = '#2563EB'}
              onMouseOut={(e) => e.target.style.backgroundColor = '#3B82F6'}
            >
              再來一局
            </button>
            
            <button 
              onClick={onEnd}
              style={{ 
                backgroundColor: '#EF4444', 
                color: 'white', 
                padding: '1rem 2rem', 
                borderRadius: '0.5rem',
                fontSize: '1.25rem',
                fontWeight: 'bold',
                cursor: 'pointer',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                border: 'none',
                transition: 'all 0.2s',
                minWidth: '180px'
              }}
              onMouseOver={(e) => e.target.style.backgroundColor = '#DC2626'}
              onMouseOut={(e) => e.target.style.backgroundColor = '#EF4444'}
            >
              結束遊戲
            </button>
          </div>
        </div>
      </div>

      {/* CSS 動畫樣式 */}
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
        `}
      </style>
    </div>
  );
};

export default GameVictory;