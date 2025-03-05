import React, { useState } from 'react';

const GameArea = ({ players, onGameEnd }) => {
  const [currentQuestion, setCurrentQuestion] = useState({
    question: '氫元素在元素週期表中的原子序數為多少？',
    options: ['1', '2', '3', '4'],
    correctAnswer: 0
  });
  const [currentPlayer, setCurrentPlayer] = useState(null);
  const [gameStatus, setGameStatus] = useState('playing');
  const [winner, setWinner] = useState(null);

  // 搶答功能
  const handleQuickAnswer = (player) => {
    if (!currentPlayer) {
      setCurrentPlayer(player);
    }
  };

  // 檢查答案
  const checkAnswer = (selectedOption) => {
    if (currentPlayer && currentQuestion) {
      if (selectedOption === currentQuestion.correctAnswer) {
        // 答對，加分
        const updatedPlayer = {
          ...currentPlayer,
          score: currentPlayer.score + 1
        };
        
        // 更新玩家分數
        const updatedPlayers = players.map(p => 
          p.name === currentPlayer.name ? updatedPlayer : p
        );
        
        // 檢查是否有玩家達到20分
        if (updatedPlayer.score >= 20) {
          setWinner(updatedPlayer);
          setGameStatus('finished');
        } else {
          // 產生新題目 (實際使用中應從題庫中抽取)
          setCurrentQuestion({
            question: '元素週期表中的哪個元素是惰性氣體？',
            options: ['氧', '氮', '氦', '碳'],
            correctAnswer: 2
          });
        }
        
        setCurrentPlayer(null);
      } else {
        // 答錯，清除當前搶答者
        setCurrentPlayer(null);
      }
    }
  };

  // 重新開始遊戲
  const restartGame = () => {
    setCurrentQuestion({
      question: '氫元素在元素週期表中的原子序數為多少？',
      options: ['1', '2', '3', '4'],
      correctAnswer: 0
    });
    setCurrentPlayer(null);
    setGameStatus('playing');
    setWinner(null);
  };

  // 結束遊戲，回到房間
  const endGame = () => {
    if (onGameEnd) {
      onGameEnd();
    }
  };

  // 遊戲中
  if (gameStatus === 'playing') {
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
                disabled={!currentPlayer}
                className={`p-4 rounded ${
                  !currentPlayer ? 'bg-gray-300 cursor-not-allowed' : 'bg-blue-500 text-white hover:bg-blue-600'
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
                onClick={() => handleQuickAnswer(player)}
                disabled={currentPlayer !== null}
                className={`p-2 rounded ${
                  currentPlayer !== null ? 'bg-gray-300 cursor-not-allowed' : 'bg-green-500 text-white hover:bg-green-600'
                }`}
              >
                搶答
              </button>
            </div>
          ))}
        </div>
        
        {currentPlayer && (
          <div className="mt-4 p-2 bg-yellow-100 rounded text-center">
            目前搶答者：{currentPlayer.name}
          </div>
        )}
      </div>
    );
  }

  // 遊戲結束
  return (
    <div className="bg-white p-6 rounded-lg shadow-md text-center">
      <h2 className="text-3xl font-bold mb-4 text-green-600">🎉 恭喜獲勝 🎉</h2>
      <p className="text-xl mb-6">
        {winner.name} 成功達到20分！
      </p>
      <div className="flex space-x-4 justify-center">
        <button 
          onClick={restartGame}
          className="bg-blue-500 text-white p-2 rounded hover:bg-blue-600"
        >
          重新開始遊戲
        </button>
        <button 
          onClick={endGame}
          className="bg-red-500 text-white p-2 rounded hover:bg-red-600"
        >
          結束遊戲
        </button>
      </div>
    </div>
  );
};

export default GameArea;