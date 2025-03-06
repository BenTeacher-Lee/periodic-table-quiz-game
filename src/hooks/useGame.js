// src/hooks/useGame.js 中需要修改的部分
// 確保遊戲狀態更新和勝利判斷正確
// 找到 useGame hook 中控制遊戲結束的部分，確保正確設置 winner 和 gameStatus

// 在現有的 useGame.js 中找到類似這樣的代碼並進行修改
// 這是一個示例，您需要根據實際代碼進行調整

const useGame = (roomId, playerName) => {
  // 現有的狀態和函數...
  const [gameStatus, setGameStatus] = useState('等待中');
  const [winner, setWinner] = useState(null);
  const [players, setPlayers] = useState([]);
  
  // 處理得分的函數，在這裡加入勝利檢查
  const handleScore = (playerName) => {
    setPlayers(prevPlayers => {
      const updatedPlayers = prevPlayers.map(player => {
        if (player.name === playerName) {
          const newScore = player.score + 1;
          
          // 檢查是否達到勝利條件（20分）
          if (newScore >= 20) {
            // 關鍵改動：確保設置遊戲狀態為結束，並記錄獲勝者
            setGameStatus('遊戲結束');
            setWinner(playerName);
          }
          
          return { ...player, score: newScore };
        }
        return player;
      });
      
      return updatedPlayers;
    });
  };
  
  // 確保遊戲結束時不會立即跳轉回大廳
  const endGame = () => {
    // 只有在確認用戶關閉獲勝畫面後才真正結束遊戲
    // 重置遊戲狀態
    setGameStatus('等待中');
    setWinner(null);
    // 其他重置邏輯...
  };
  
  // 返回所有需要的狀態和函數
  return {
    // 其他狀態和函數...
    gameStatus,
    winner,
    players,
    endGame,
    // 其他返回值...
  };
};