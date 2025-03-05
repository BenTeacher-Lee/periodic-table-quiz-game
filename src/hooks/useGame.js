// src/hooks/useGame.js
import { useState, useEffect } from 'react';
import { ref, onValue, update, get } from 'firebase/database';
import { database } from '../firebase';

export const useGame = (roomId, playerName) => {
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [currentPlayer, setCurrentPlayer] = useState(null);
  const [gameStatus, setGameStatus] = useState('waiting');
  const [winner, setWinner] = useState(null);
  const [players, setPlayers] = useState([]);

  // 監聽遊戲狀態
  useEffect(() => {
    if (!roomId) return;

    const roomRef = ref(database, `rooms/${roomId}`);
    const unsubscribe = onValue(roomRef, (snapshot) => {
      const data = snapshot.val();
      if (!data) return;
      
      setCurrentQuestion(data.currentQuestion || null);
      setCurrentPlayer(data.currentPlayer || null);
      setGameStatus(data.status || 'waiting');
      setWinner(data.winner || null);
      
      // 格式化玩家數據
      if (data.players) {
        const playerList = Object.keys(data.players).map(name => ({
          name,
          score: data.players[name].score
        }));
        setPlayers(playerList);
      }
    });

    return () => unsubscribe();
  }, [roomId]);

  // 搶答
  const quickAnswer = () => {
    if (!roomId || currentPlayer) return;
    
    const roomRef = ref(database, `rooms/${roomId}`);
    update(roomRef, { currentPlayer: playerName });
  };

  // 從Firebase數據庫獲取隨機題目
  const getRandomQuestion = async () => {
    const questionsRef = ref(database, 'questions');
    try {
      // 獲取所有題目
      const snapshot = await get(questionsRef);
      const data = snapshot.val();
      
      if (!data) {
        // 如果沒有找到題目，使用默認題目
        const defaultQuestion = {
          question: '氫元素在元素週期表中的原子序數為多少？',
          options: ['1', '2', '3', '4'],
          correctAnswer: 0
        };
        
        update(ref(database, `rooms/${roomId}`), {
          currentQuestion: defaultQuestion,
          currentPlayer: null
        });
        return;
      }
      
      // 將題目對象轉換為數組
      const questionsArray = Object.keys(data).map(key => ({
        id: key,
        ...data[key]
      }));
      
      // 隨機選擇一道題目
      const randomIndex = Math.floor(Math.random() * questionsArray.length);
      const randomQuestion = questionsArray[randomIndex];
      
      // 更新房間的當前題目
      update(ref(database, `rooms/${roomId}`), {
        currentQuestion: {
          question: randomQuestion.question,
          options: randomQuestion.options,
          correctAnswer: randomQuestion.correctAnswer
        },
        currentPlayer: null
      });
    } catch (error) {
      console.error("Error getting random question:", error);
      // 發生錯誤時使用默認題目
      const defaultQuestion = {
        question: '氫元素在元素週期表中的原子序數為多少？',
        options: ['1', '2', '3', '4'],
        correctAnswer: 0
      };
      
      update(ref(database, `rooms/${roomId}`), {
        currentQuestion: defaultQuestion,
        currentPlayer: null
      });
    }
  };

  // 檢查答案
  const checkAnswer = async (selectedOption) => {
    if (!roomId || currentPlayer !== playerName || !currentQuestion) return;
    
    if (selectedOption === currentQuestion.correctAnswer) {
      // 答對，加分
      const playerRef = ref(database, `rooms/${roomId}/players/${playerName}`);
      const snapshot = await get(playerRef);
      const currentScore = (snapshot.val() && snapshot.val().score) || 0;
      const newScore = currentScore + 1;
      
      update(playerRef, { score: newScore });
      
      // 檢查是否獲勝
      if (newScore >= 20) {
        update(ref(database, `rooms/${roomId}`), { 
          status: '遊戲結束',
          winner: playerName
        });
      } else {
        // 隨機選擇下一個題目
        await getRandomQuestion();  // 使用await確保題目加載完成
      }
    } else {
      // 答錯，重置搶答者
      update(ref(database, `rooms/${roomId}`), { currentPlayer: null });
    }
  };

  // 重新開始遊戲
  const restartGame = async () => {
    if (!roomId) return;
    
    update(ref(database, `rooms/${roomId}`), {
      status: '遊戲中',
      winner: null,
      currentPlayer: null
    });
    
    // 重置所有玩家分數
    players.forEach(player => {
      update(ref(database, `rooms/${roomId}/players/${player.name}`), {
        score: 0
      });
    });
    
    // 獲取新題目
    await getRandomQuestion();
  };

  // 結束遊戲
  const endGame = () => {
    if (!roomId) return;
    
    update(ref(database, `rooms/${roomId}`), {
      status: '等待中',
      winner: null,
      currentPlayer: null,
      currentQuestion: null
    });
    
    // 重置所有玩家分數
    players.forEach(player => {
      update(ref(database, `rooms/${roomId}/players/${player.name}`), {
        score: 0
      });
    });
  };

  return {
    currentQuestion,
    currentPlayer,
    gameStatus,
    winner,
    players,
    quickAnswer,
    checkAnswer,
    restartGame,
    endGame
  };
};