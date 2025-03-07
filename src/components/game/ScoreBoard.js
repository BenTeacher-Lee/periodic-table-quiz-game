// src/components/game/ScoreBoard.js
import React from 'react';
import Card from '../ui/Card';
import Button from '../ui/Button';
import '../../styles/components.css';

const ScoreBoard = ({ 
  players, 
  currentPlayer, 
  onQuickAnswer, 
  showingAnswer,
  playerName 
}) => {
  if (!players || players.length === 0) return null;
  
  // 排序玩家
  const sortedPlayers = [...players].sort((a, b) => b.score - a.score);
  const currentUserCanAnswer = !currentPlayer && !showingAnswer;
  
  return (
    <Card className="scoreboard">
      <div style={{ 
        backgroundColor: 'var(--text-primary)', 
        color: 'white', 
        padding: 'var(--space-md)', 
        textAlign: 'center',
        fontWeight: 'bold',
        fontSize: 'var(--text-xl)'
      }}>
        計分榜
      </div>
      
      <div style={{ padding: 'var(--space-md)' }}>
        {sortedPlayers.map((player, index) => (
          <div 
            key={player.name} 
            className={`scoreboard-item ${
              index === 0 ? 'scoreboard-item-1st' : 
              index === 1 ? 'scoreboard-item-2nd' : 
              index === 2 ? 'scoreboard-item-3rd' : ''
            }`}
          >
            <span style={{ 
              fontSize: 'var(--text-lg)', 
              fontWeight: 'bold',
              animation: player.score >= 15 ? 'goldGlow 1.5s infinite' : 'none'
            }}>
              {index === 0 && <span style={{ marginRight: 'var(--space-sm)' }}>👑</span>}
              {player.name}
            </span>
            <span style={{ 
              fontSize: 'var(--text-lg)', 
              fontWeight: 'bold',
              backgroundColor: 'var(--primary)',
              color: 'white',
              padding: '0.25rem 0.5rem',
              borderRadius: 'var(--radius-full)',
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
        <div style={{ padding: 'var(--space-md)', borderTop: '1px solid var(--background-light)', textAlign: 'center' }}>
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