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
        // 隨機選擇下一個問題
        getRandomQuestion();
      }
    } else {
      // 答錯，重置搶答者
      update(ref(database, `rooms/${roomId}`), { currentPlayer: null });
    }
  };

  // 從預定義題庫中獲取隨機題目
  const getRandomQuestion = () => {
    // 這裡使用預設題目，實際應用中應該從數據庫獲取
    const questions = [
      {
        question: '氫元素在元素週期表中的原子序數為多少？',
        options: ['1', '2', '3', '4'],
        correctAnswer: 0
      },
      {
        question: '元素週期表中哪個元素的符號是O？',
        options: ['鋰', '金', '氧', '鐵'],
        correctAnswer: 2
      },
      {
        question: '元素週期表中，鈉(Na)的原子序數是多少？',
        options: ['7', '11', '19', '23'],
        correctAnswer: 1
      }
    ];
    
    const randomIndex = Math.floor(Math.random() * questions.length);
    const randomQuestion = questions[randomIndex];
    
    update(ref(database, `rooms/${roomId}`), {
      currentQuestion: randomQuestion,
      currentPlayer: null
    });
  };

  // 重新開始遊戲
  const restartGame = () => {
    if (!roomId) return;
    
    update(ref(database, `rooms/${roomId}`), {
      status: '遊戲中',
      winner: null,
      currentPlayer: null,
      currentQuestion: {
        question: '氫元素在元素週期表中的原子序數為多少？',
        options: ['1', '2', '3', '4'],
        correctAnswer: 0
      }
    });
    
    // 重置所有玩家分數
    players.forEach(player => {
      update(ref(database, `rooms/${roomId}/players/${player.name}`), {
        score: 0
      });
    });
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