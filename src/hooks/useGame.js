// src/hooks/useGame.js - 徹底修復勝利畫面問題
import { useState, useEffect } from 'react';
import { ref, onValue, update, get, serverTimestamp, set } from 'firebase/database';
import { database } from '../firebase';

export const useGame = (roomId, playerName) => {
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [currentPlayer, setCurrentPlayer] = useState(null);
  const [gameStatus, setGameStatus] = useState('waiting');
  const [winner, setWinner] = useState(null);
  const [players, setPlayers] = useState([]);
  const [usedQuestions, setUsedQuestions] = useState([]);
  const [showingAnswer, setShowingAnswer] = useState(false);

  // 監聽遊戲狀態 - 強化勝利檢測邏輯
  useEffect(() => {
    if (!roomId) return;

    console.log('設置房間監聽：', roomId);
    
    const roomRef = ref(database, `rooms/${roomId}`);
    const unsubscribe = onValue(roomRef, (snapshot) => {
      const data = snapshot.val();
      if (!data) {
        console.log('找不到房間數據');
        return;
      }
      
      console.log('房間數據更新:', data);
      
      // 更新界面狀態
      setCurrentQuestion(data.currentQuestion || null);
      setCurrentPlayer(data.currentPlayer || null);
      setGameStatus(data.status || 'waiting');
      setWinner(data.winner || null);
      setShowingAnswer(data.showingAnswer || false);
      
      console.log('遊戲狀態:', data.status, '勝利者:', data.winner);
      
      // 同步已使用過的題目
      setUsedQuestions(data.usedQuestions || []);
      
      // 格式化玩家數據
      if (data.players) {
        const playerList = Object.keys(data.players).map(name => ({
          name,
          score: data.players[name].score || 0 // 確保分數不為空
        }));
        setPlayers(playerList);
        
        // 檢查是否有玩家達到勝利條件（20分）- 添加更詳細的日誌
        const winningPlayer = playerList.find(player => player.score >= 20);
        if (winningPlayer) {
          console.log(`發現分數達到20分的玩家: ${winningPlayer.name}, 分數: ${winningPlayer.score}`);
          console.log(`目前遊戲狀態: ${data.status}, 勝利者: ${data.winner || '無'}`);
          
          if (data.status !== '遊戲結束') {
            console.log("設置遊戲結束狀態和勝利者");
            
            // 立即設置遊戲結束狀態到本地狀態
            setGameStatus('遊戲結束');
            setWinner(winningPlayer.name);
            
            // 同時更新到Firebase
            const updates = {
              status: '遊戲結束',
              winner: winningPlayer.name,
              lastActivity: serverTimestamp()
            };
            
            update(roomRef, updates)
              .then(() => console.log("成功更新遊戲狀態到Firebase"))
              .catch(error => console.error("更新遊戲狀態錯誤:", error));
          }
        }
      }
    });

    return () => {
      console.log('移除房間監聽');
      unsubscribe();
    };
  }, [roomId]);

  // 搶答
  const quickAnswer = () => {
    if (!roomId || currentPlayer || showingAnswer) return; 
    
    console.log('玩家嘗試搶答:', playerName);
    
    const roomRef = ref(database, `rooms/${roomId}`);
    update(roomRef, { 
      currentPlayer: playerName,
      lastActivity: serverTimestamp()
    });
  };

  // 檢查答案 - 徹底優化勝利判定邏輯
  const checkAnswer = async (selectedOption) => {
    if (!roomId || currentPlayer !== playerName || !currentQuestion) {
      console.log('無法檢查答案:', 
                  !roomId ? '無房間ID' : 
                  currentPlayer !== playerName ? '非當前玩家' : 
                  '無當前問題');
      return;
    }
    
    console.log('檢查答案, 選擇選項:', selectedOption, '正確答案:', currentQuestion.correctAnswer);
    
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
      
      console.log('答對了! 當前分數:', currentScore, '新分數:', newScore);
      
      try {
        // 1. 先更新分數
        await update(playerRef, { score: newScore });
        console.log('分數已更新');
        
        // 2. 設置顯示答案狀態
        await update(ref(database, `rooms/${roomId}`), {
          showingAnswer: true,
          lastActivity: serverTimestamp()
        });
        console.log('設置顯示答案狀態');
        
        // 3. 立即檢查勝利條件
        if (newScore >= 20) {
          console.log("玩家達到20分，設置遊戲結束狀態");
          
          // 先更新本地狀態，以快速反應
          setGameStatus('遊戲結束');
          setWinner(playerName);
          
          // 同時寫入Firebase，確保數據一致性
          const gameEndUpdate = {
            status: '遊戲結束',
            winner: playerName,
            lastActivity: serverTimestamp()
          };
          
          // 使用set而不是update以確保完整更新
          const roomRef = ref(database, `rooms/${roomId}`);
          await set(roomRef, {
            ...(await get(roomRef)).val(),
            ...gameEndUpdate
          });
          
          console.log("遊戲結束狀態已寫入Firebase");
        } else {
          // 4. 延遲2秒後獲取新題目
          setTimeout(async () => {
            const currentRoomRef = ref(database, `rooms/${roomId}`);
            const currentRoomSnapshot = await get(currentRoomRef);
            const currentRoomData = currentRoomSnapshot.val();
            
            if (currentRoomData && currentRoomData.status === '遊戲中') {
              console.log('獲取下一個問題');
              await getRandomQuestion();
            }
          }, 2000);
        }
      } catch (error) {
        console.error("處理答案時出錯:", error);
      }
    } else {
      // 答錯，重置搶答者
      console.log('答錯，重置當前玩家');
      update(ref(database, `rooms/${roomId}`), { 
        currentPlayer: null,
        lastActivity: serverTimestamp()
      });
    }
  };

  // 從Firebase數據庫獲取不重複的隨機題目
  const getRandomQuestion = async () => {
    console.log('獲取隨機問題');
    
    const questionsRef = ref(database, 'questions');
    try {
      // 獲取所有題目
      const snapshot = await get(questionsRef);
      const data = snapshot.val();
      
      if (!data) {
        console.log('找不到題目，使用默認題目');
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
      
      console.log('總題目數:', questionsArray.length);
      
      // 獲取當前房間已使用的題目
      const roomRef = ref(database, `rooms/${roomId}`);
      const roomSnapshot = await get(roomRef);
      const roomData = roomSnapshot.val() || {};
      const currentUsedQuestions = roomData.usedQuestions || [];
      
      console.log('已使用題目數:', currentUsedQuestions.length);
      
      // 篩選掉已用過的題目
      const unusedQuestions = questionsArray.filter(
        question => !currentUsedQuestions.includes(question.id)
      );
      
      console.log('未使用題目數:', unusedQuestions.length);
      
      // 如果所有題目都已使用過，重置已使用題目列表
      if (unusedQuestions.length === 0) {
        console.log('所有題目都已使用，重置已使用題目列表');
        
        update(ref(database, `rooms/${roomId}`), { usedQuestions: [] });
        
        // 隨機選擇一個題目（因為已重置列表）
        const randomIndex = Math.floor(Math.random() * questionsArray.length);
        const randomQuestion = questionsArray[randomIndex];
        
        console.log('選擇的題目:', randomQuestion.question);
        
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
        
        console.log('選擇的題目:', randomQuestion.question);
        
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
      console.error("獲取隨機題目時出錯:", error);
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

  // 重新開始遊戲
  const restartGame = async () => {
    if (!roomId) return;
    
    console.log('重新開始遊戲');
    
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
    
    console.log('結束遊戲');
    
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