// src/hooks/useGame.js - 修正版本
import { useState, useEffect } from 'react';
import { ref, onValue, update, get, serverTimestamp } from 'firebase/database';
import { database } from '../firebase';

export const useGame = (roomId, playerName) => {
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [currentPlayer, setCurrentPlayer] = useState(null);
  const [gameStatus, setGameStatus] = useState('waiting');
  const [winner, setWinner] = useState(null);
  const [players, setPlayers] = useState([]);
  const [usedQuestions, setUsedQuestions] = useState([]);
  const [showingAnswer, setShowingAnswer] = useState(false); // 是否正在展示答案

  // 監聽遊戲狀態
  useEffect(() => {
    if (!roomId) return;

    const roomRef = ref(database, `rooms/${roomId}`);
    const unsubscribe = onValue(roomRef, (snapshot) => {
      const data = snapshot.val();
      if (!data) return;
      
      // 更新界面狀態
      setCurrentQuestion(data.currentQuestion || null);
      setCurrentPlayer(data.currentPlayer || null);
      setGameStatus(data.status || 'waiting');
      setWinner(data.winner || null);
      setShowingAnswer(data.showingAnswer || false);
      
      // 同步已使用過的題目
      setUsedQuestions(data.usedQuestions || []);
      
      // 格式化玩家數據
      if (data.players) {
        const playerList = Object.keys(data.players).map(name => ({
          name,
          score: data.players[name].score
        }));
        setPlayers(playerList);
      }
      
      // 檢查是否有玩家達到勝利條件（20分）
      if (data.players) {
        const playerScores = Object.entries(data.players).map(([name, data]) => ({
          name,
          score: data.score
        }));
        
        const winningPlayer = playerScores.find(player => player.score >= 20);
        if (winningPlayer && data.status !== '遊戲結束') {
          console.log("檢測到勝利條件，更新遊戲狀態");
          // 如果有玩家達到20分但遊戲狀態不是"遊戲結束"，則更新遊戲狀態
          update(roomRef, {
            status: '遊戲結束',
            winner: winningPlayer.name,
            lastActivity: serverTimestamp()
          });
        }
      }
    });

    return () => unsubscribe();
  }, [roomId]);

  // 搶答
  const quickAnswer = () => {
    if (!roomId || currentPlayer || showingAnswer) return; // 防止在展示答案時搶答
    
    const roomRef = ref(database, `rooms/${roomId}`);
    update(roomRef, { 
      currentPlayer: playerName,
      lastActivity: serverTimestamp()
    });
  };

  // 從Firebase數據庫獲取不重複的隨機題目
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
          currentPlayer: null,
          showingAnswer: false,
          lastActivity: serverTimestamp()
        });
        return;
      }
      
      // 將題目對象轉換為數組
      const questionsArray = Object.keys(data).map(key => ({
        id: key,
        ...data[key]
      }));
      
      // 獲取當前房間已使用的題目
      const roomRef = ref(database, `rooms/${roomId}`);
      const roomSnapshot = await get(roomRef);
      const roomData = roomSnapshot.val() || {};
      const currentUsedQuestions = roomData.usedQuestions || [];
      
      // 篩選掉已用過的題目
      const unusedQuestions = questionsArray.filter(
        question => !currentUsedQuestions.includes(question.id)
      );
      
      // 如果所有題目都已使用過，重置已使用題目列表
      if (unusedQuestions.length === 0) {
        update(ref(database, `rooms/${roomId}`), { usedQuestions: [] });
        
        // 隨機選擇一個題目（因為已重置列表）
        const randomIndex = Math.floor(Math.random() * questionsArray.length);
        const randomQuestion = questionsArray[randomIndex];
        
        // 更新房間的當前題目和已使用題目列表
        update(ref(database, `rooms/${roomId}`), {
          currentQuestion: {
            question: randomQuestion.question,
            options: randomQuestion.options,
            correctAnswer: randomQuestion.correctAnswer
          },
          usedQuestions: [randomQuestion.id],
          currentPlayer: null,
          showingAnswer: false,
          lastActivity: serverTimestamp()
        });
      } else {
        // 從未使用的題目中隨機選擇
        const randomIndex = Math.floor(Math.random() * unusedQuestions.length);
        const randomQuestion = unusedQuestions[randomIndex];
        
        // 更新房間的當前題目和已使用題目列表
        update(ref(database, `rooms/${roomId}`), {
          currentQuestion: {
            question: randomQuestion.question,
            options: randomQuestion.options,
            correctAnswer: randomQuestion.correctAnswer
          },
          usedQuestions: [...currentUsedQuestions, randomQuestion.id],
          currentPlayer: null,
          showingAnswer: false,
          lastActivity: serverTimestamp()
        });
      }
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
        currentPlayer: null,
        showingAnswer: false,
        lastActivity: serverTimestamp()
      });
    }
  };

  // 檢查答案
  const checkAnswer = async (selectedOption) => {
    if (!roomId || currentPlayer !== playerName || !currentQuestion) return;
    
    // 更新活動時間
    update(ref(database, `rooms/${roomId}`), { 
      lastActivity: serverTimestamp() 
    });
    
    if (selectedOption === currentQuestion.correctAnswer) {
      // 答對，加分
      const playerRef = ref(database, `rooms/${roomId}/players/${playerName}`);
      const snapshot = await get(playerRef);
      const currentScore = (snapshot.val() && snapshot.val().score) || 0;
      const newScore = currentScore + 1;
      
      // 先更新分數
      update(playerRef, { score: newScore });
      
      // 設置顯示答案狀態
      update(ref(database, `rooms/${roomId}`), {
        showingAnswer: true,
        lastActivity: serverTimestamp()
      });
      
      // 檢查是否獲勝
      if (newScore >= 20) {
        console.log("玩家達到20分，設置遊戲結束狀態");
        // 立即設置遊戲結束狀態
        update(ref(database, `rooms/${roomId}`), { 
          status: '遊戲結束',
          winner: playerName,
          lastActivity: serverTimestamp()
        });
      } else {
        // 延遲2秒後獲取新題目
        setTimeout(async () => {
          // 再次檢查房間狀態，確保遊戲仍在進行中
          const currentRoomRef = ref(database, `rooms/${roomId}`);
          const currentRoomSnapshot = await get(currentRoomRef);
          const currentRoomData = currentRoomSnapshot.val();
          
          if (currentRoomData && currentRoomData.status === '遊戲中') {
            await getRandomQuestion();
          }
        }, 2000);
      }
    } else {
      // 答錯，重置搶答者
      update(ref(database, `rooms/${roomId}`), { 
        currentPlayer: null,
        lastActivity: serverTimestamp()
      });
    }
  };

  // 重新開始遊戲
  const restartGame = async () => {
    if (!roomId) return;
    
    update(ref(database, `rooms/${roomId}`), {
      status: '遊戲中',
      winner: null,
      currentPlayer: null,
      usedQuestions: [], // 重置已使用的題目
      showingAnswer: false,
      lastActivity: serverTimestamp()
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
      currentQuestion: null,
      usedQuestions: [], // 重置已使用的題目
      showingAnswer: false,
      lastActivity: serverTimestamp()
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
    endGame,
    showingAnswer
  };
};

export default useGame;