// src/components/game/ScoreBoard.js - 移動端優化版
import React from 'react';
import Card from '../ui/Card';
import Button from '../ui/Button';
import '../../styles/components.css';
import '../../styles/mobile.css';

const ScoreBoard = ({ 
  players, 
  currentPlayer, 
  onQuickAnswer, 
  showingAnswer,
  playerName,
  isMobile
}) => {
  if (!players || players.length === 0) return null;
  
  // 排序玩家
  const sortedPlayers = [...players].sort((a, b) => b.score - a.score);
  const currentUserCanAnswer = !currentPlayer && !showingAnswer;
  
  // 移動端計分板樣式調整
  const cardStyle = isMobile ? {
    boxShadow: 'var(--shadow-sm)',
    marginBottom: 'var(--space-md)'
  } : {};
  
  // 移動端玩家計分樣式
  const playerItemStyle = isMobile ? {
    fontSize: 'var(--text-base)',
    padding: 'var(--space-xs) var(--space-sm)'
  } : {};
  
  // 移動端顯示全部玩家或最多顯示前3名
  const displayPlayers = isMobile ? sortedPlayers.slice(0, 5) : sortedPlayers;
  
  return (
    <Card className="scoreboard" style={cardStyle}>
      <div style={{ 
        backgroundColor: 'var(--text-primary)', 
        color: 'white', 
        padding: isMobile ? 'var(--space-sm)' : 'var(--space-md)', 
        textAlign: 'center',
        fontWeight: 'bold',
        fontSize: isMobile ? 'var(--text-lg)' : 'var(--text-xl)'
      }}>
        計分榜 {isMobile && sortedPlayers.length > 5 && `(前5名)`}
      </div>
      
      <div style={{ 
        padding: isMobile ? 'var(--space-sm)' : 'var(--space-md)',
        maxHeight: isMobile ? '200px' : 'auto',
        overflowY: isMobile ? 'auto' : 'visible'
      }}>
        {displayPlayers.map((player, index) => (
          <div 
            key={player.name} 
            className={`scoreboard-item ${
              index === 0 ? 'scoreboard-item-1st' : 
              index === 1 ? 'scoreboard-item-2nd' : 
              index === 2 ? 'scoreboard-item-3rd' : ''
            }`}
            style={playerItemStyle}
          >
            <span style={{ 
              fontSize: isMobile ? 'var(--text-base)' : 'var(--text-lg)', 
              fontWeight: 'bold',
              animation: player.score >= 15 ? 'goldGlow 1.5s infinite' : 'none',
              display: 'flex',
              alignItems: 'center'
            }}>
              {index === 0 && <span style={{ marginRight: 'var(--space-xs)' }}>👑</span>}
              {player.name === playerName ? <b>{player.name}</b> : player.name}
            </span>
            <span style={{ 
              fontSize: isMobile ? 'var(--text-base)' : 'var(--text-lg)', 
              fontWeight: 'bold',
              backgroundColor: 'var(--primary)',
              color: 'white',
              padding: isMobile ? '0.15rem 0.4rem' : '0.25rem 0.5rem',
              borderRadius: 'var(--radius-full)',
              minWidth: isMobile ? '35px' : '40px',
              textAlign: 'center'
            }}>
              {player.score}
            </span>
          </div>
        ))}
      </div>

      {/* 玩家搶答按鈕 - 僅在非移動端且為當前玩家時顯示 */}
      {!isMobile && sortedPlayers.find(p => p.name === playerName) && (
        <div style={{ 
          padding: 'var(--space-md)', 
          borderTop: '1px solid var(--background-light)', 
          textAlign: 'center' 
        }}>
          <Button 
            onClick={onQuickAnswer}
            disabled={!currentUserCanAnswer}
            variant="secondary"
            size="lg"
            isFullWidth
            className={currentUserCanAnswer ? 'pulse' : ''}
          >
            {showingAnswer ? '顯示答案中...' : '搶答'}
          </Button>
        </div>
      )}
    </Card>
  );
};

export default ScoreBoard;