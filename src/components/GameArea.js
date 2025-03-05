// src/components/GameArea.js
import React from 'react';
import { useGame } from '../hooks/useGame';

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

  // 遊戲未開始或無題目
  if (!currentQuestion || gameStatus !== '遊戲中' && gameStatus !== '遊戲結束') {
    return <div className="text-center p-8">等待遊戲開始...</div>;
  }

  // 遊戲結束
  if (gameStatus === '遊戲結束' && winner) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md text-center">
        <h2 className="text-3xl font-bold mb-4 text-green-600">🎉 恭喜獲勝 🎉</h2>
        <p className="text-xl mb-6">
          {winner} 成功達到20分！
        </p>
        
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-2">最終排名</h3>
          {players.sort((a, b) => b.score - a.score).map((player, index) => (
            <div 
              key={index} 
              className={`flex justify-between items-center p-2 border-b ${
                player.name === winner ? 'bg-yellow-100' : ''
              }`}
            >
              <span>#{index + 1} {player.name}</span>
              <span>分數：{player.score}</span>
            </div>
          ))}
        </div>

        <div className="flex space-x-4 justify-center">
          <button 
            onClick={restartGame}
            className="bg-blue-500 text-white p-2 rounded hover:bg-blue-600"
          >
            重新開始遊戲
          </button>
          <button 
            onClick={() => {
              endGame();
              if (onGameEnd) onGameEnd();
            }}
            className="bg-red-500 text-white p-2 rounded hover:bg-red-600"
          >
            結束遊戲
          </button>
        </div>
      </div>
    );
  }

  // 遊戲中
  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-4 text-center">元素週期表搶答遊戲</h2>
      
      <div className="mb-6">
        <h3 className="text-xl mb-2">{currentQuestion.question}</h3>
        <div className="grid grid-cols-2 gap-4">
          {currentQuestion.options.map((option, index) => (
            <button 
              key={index}
              onClick={() => checkAnswer(index)}
              disabled={currentPlayer !== playerName}
              className={`p-4 rounded ${
                currentPlayer !== playerName 
                  ? 'bg-gray-300 cursor-not-allowed' 
                  : 'bg-blue-500 text-white hover:bg-blue-600'
              }`}
            >
              {option}
            </button>
          ))}
        </div>
      </div>
      
      <div>
        <h3 className="text-lg font-semibold mb-2">玩家</h3>
        {players.map((player, index) => (
          <div 
            key={index} 
            className="flex justify-between items-center p-2 border-b"
          >
            <div>
              <span>{player.name}</span>
              <span className="ml-4">分數：{player.score}</span>
            </div>
            <button 
              onClick={() => quickAnswer()}
              disabled={currentPlayer !== null || player.name !== playerName}
              className={`p-2 rounded ${
                currentPlayer !== null || player.name !== playerName
                  ? 'bg-gray-300 cursor-not-allowed' 
                  : 'bg-green-500 text-white hover:bg-green-600'
              }`}
            >
              搶答
            </button>
          </div>
        ))}
      </div>
      
      {currentPlayer && (
        <div className="mt-4 p-2 bg-yellow-100 rounded text-center">
          目前搶答者：{currentPlayer}
        </div>
      )}
    </div>
  );
};

export default GameArea;