// src/components/GameVictory.js 優化版
import React, { useEffect, useState } from 'react';
import Button from './ui/Button';
import '../styles/animations.css';

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
          borderRadius: 'var(--radius-xl)', 
          boxShadow: 'var(--shadow-xl)',
          width: '90%',
          maxWidth: '800px',
          opacity: showAnimation ? 1 : 0,
          transform: showAnimation ? 'rotateX(0deg) scale(1)' : 'rotateX(20deg) scale(0.8)',
          transition: 'all 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
          overflow: 'hidden'
        }}
      >
        {/* 標題區域 */}
        <div style={{ 
          background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%)',
          padding: 'var(--space-xl)',
          textAlign: 'center',
          color: 'white',
          position: 'relative'
        }}>
          <h1 style={{ 
            fontSize: 'var(--text-4xl)', 
            fontWeight: 'bold',
            marginBottom: 'var(--space-sm)',
            textShadow: '0 2px 10px rgba(0,0,0,0.3)',
            animation: 'pulse 2s infinite'
          }}>
            🏆 遊戲結束 🏆
          </h1>
          <p style={{ 
            fontSize: 'var(--text-xl)',
            opacity: 0.9,
            fontWeight: 'bold'
          }}>
            恭喜 <span className="gold-glow" style={{ 
              color: '#FFD700', 
              fontWeight: 'bold',
              fontSize: 'var(--text-2xl)',
            }}>{winner}</span> 獲得勝利！
          </p>
        </div>

        {/* 前三名計分榜 */}
        <div style={{
          padding: 'var(--space-xl)',
          background: 'linear-gradient(to bottom, var(--background-light), #f3f4f6)'
        }}>
          <h2 style={{ 
            textAlign: 'center', 
            fontSize: 'var(--text-2xl)', 
            fontWeight: 'bold',
            marginBottom: 'var(--space-xl)',
            color: 'var(--text-primary)'
          }}>
            優勝者排行榜
          </h2>

          <div style={{ 
            display: 'flex',
            justifyContent: 'center',
            flexWrap: 'wrap',
            gap: 'var(--space-xl)',
            marginBottom: 'var(--space-xl)'
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
                  
                  {/* 基座 */}
                  <div style={{
                    backgroundColor: isWinner ? 'var(--warning)' : index === 1 ? 'var(--background-light)' : '#D6BCFA',
                    height: baseHeight,
                    width: '80%',
                    borderRadius: 'var(--radius-md) var(--radius-md) 0 0',
                    marginTop: 'var(--space-xs)'
                  }} />
                </div>
              );
            })}
          </div>
          
          {/* 其他玩家列表 */}
          {sortedPlayers.length > 3 && (
            <div style={{
              backgroundColor: 'white',
              borderRadius: 'var(--radius-lg)',
              padding: 'var(--space-md)',
              marginBottom: 'var(--space-xl)',
              boxShadow: 'var(--shadow-md)'
            }}>
              <h3 style={{ 
                fontSize: 'var(--text-lg)', 
                fontWeight: 'bold', 
                marginBottom: 'var(--space-md)',
                textAlign: 'center',
                color: 'var(--text-secondary)'
              }}>
                其他玩家
              </h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
                {sortedPlayers.slice(3).map((player, index) => (
                  <div 
                    key={player.name} 
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      padding: 'var(--space-md) var(--space-md)',
                      backgroundColor: 'var(--background-light)',
                      borderRadius: 'var(--radius-md)',
                      fontSize: 'var(--text-base)'
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
            gap: 'var(--space-md)',
            flexWrap: 'wrap'
          }}>
            <Button 
              onClick={onRestart}
              variant="primary"
              size="lg"
              style={{ minWidth: '180px' }}
            >
              再來一局
            </Button>
            
            <Button 
              onClick={onEnd}
              variant="danger"
              size="lg"
              style={{ minWidth: '180px' }}
            >
              結束遊戲
            </Button>
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
        `}
      </style>
    </div>
  );
};

export default GameVictory;