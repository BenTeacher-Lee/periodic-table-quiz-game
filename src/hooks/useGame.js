// src/hooks/useGame.js - 添加計時器和搶答冷卻
import { useState, useEffect, useRef } from 'react';
import { ref, onValue, update, get, set, off, remove, serverTimestamp } from 'firebase/database';
import { database } from '../firebase';

export const useGame = (roomId, playerName) => {
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [currentPlayer, setCurrentPlayer] = useState(null);
  const [gameStatus, setGameStatus] = useState('waiting');
  const [winner, setWinner] = useState(null);
  const [players, setPlayers] = useState([]);
  const [usedQuestions, setUsedQuestions] = useState([]);
  const [showingAnswer, setShowingAnswer] = useState(false);
  const [answerTime, setAnswerTime] = useState(15); // 答題倒計時 15 秒
  const [disabledPlayers, setDisabledPlayers] = useState([]); // 被禁用的玩家列表
  
  // 使用 ref 來追蹤關鍵數據，避免閉包問題
  const roomIdRef = useRef(roomId);
  const playerNameRef = useRef(playerName);
  const gameStatusRef = useRef('waiting');
  const timerRef = useRef(null);
  
  // 同步 ref 值
  useEffect(() => {
    roomIdRef.current = roomId;
    playerNameRef.current = playerName;
    gameStatusRef.current = gameStatus;
  }, [roomId, playerName, gameStatus]);

  // 清理計時器
  const clearGameTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  // 啟動答題計時器
  const startAnswerTimer = (initialTime = 15) => {
    // 先清除可能存在的計時器
    clearGameTimer();
    
    // 設置初始時間
    setAnswerTime(initialTime);
    
    // 啟動新計時器
    timerRef.current = setInterval(() => {
      setAnswerTime(prevTime => {
        // 時間到，自動設為答錯
        if (prevTime <= 1) {
          clearGameTimer();
          // 如果當前搶答者是本玩家，自動提交錯誤答案
          if (currentPlayer === playerNameRef.current) {
            handleTimeOut();
          }
          return 0;
        }
        return prevTime - 1;
      });
    }, 1000);
  };

  // 處理計時器超時
  const handleTimeOut = async () => {
    const currentRoomId = roomIdRef.current;
    const currentPlayerName = playerNameRef.current;
    
    if (!currentRoomId) return;
    
    console.log('計時器超時，自動設為答錯');
    
    try {
      // 獲取最新房間數據
      const roomRef = ref(database, `rooms/${currentRoomId}`);
      const snapshot = await get(roomRef);
      const roomData = snapshot.val();
      
      if (!roomData) return;
      
      // 將當前玩家添加到禁用列表
      const newDisabledPlayers = roomData.disabledPlayers || [];
      if (!newDisabledPlayers.includes(currentPlayerName)) {
        newDisabledPlayers.push(currentPlayerName);
      }
      
      // 更新房間狀態
      await set(roomRef, {
        ...roomData,
        currentPlayer: null,
        disabledPlayers: newDisabledPlayers,
        lastActivity: serverTimestamp()
      });
      
      // 更新本地禁用狀態
      setDisabledPlayers(newDisabledPlayers);
    } catch (error) {
      console.error('處理計時器超時錯誤:', error);
    }
  };

  // 監聽遊戲狀態
  useEffect(() => {
    if (!roomId) return;
    console.log('設置房間監聽:', roomId);
    
    const roomRef = ref(database, `rooms/${roomId}`);
    
    // 勝利條件強制檢查
    const checkVictoryCondition = async () => {
      try {
        const snapshot = await get(roomRef);
        const roomData = snapshot.val();
        if (!roomData || !roomData.players) return;
        
        // 查找得分最高的玩家
        let highestScorePlayer = null;
        let highestScore = 0;
        
        Object.entries(roomData.players).forEach(([name, data]) => {
          const score = data.score || 0;
          if (score >= 20 && score > highestScore) {
            highestScore = score;
            highestScorePlayer = name;
          }
        });
        
        // 如果有玩家達到勝利條件且遊戲未結束
        if (highestScorePlayer && roomData.status !== '遊戲結束') {
          console.log(`強制勝利檢查: ${highestScorePlayer} 達到 ${highestScore} 分`);
          
          // 同時更新本地狀態和 Firebase
          setGameStatus('遊戲結束');
          setWinner(highestScorePlayer);
          
          // 直接設置新數據而不是更新
          await set(roomRef, {
            ...roomData,
            status: '遊戲結束',
            winner: highestScorePlayer,
            lastActivity: serverTimestamp()
          });
          
          console.log('已強制設置遊戲結束狀態');
          
          // 清除計時器
          clearGameTimer();
        }
      } catch (error) {
        console.error('勝利條件檢查錯誤:', error);
      }
    };
    
    // 初始檢查
    checkVictoryCondition();
    
    // 設置定期檢查
    const victoryCheckInterval = setInterval(checkVictoryCondition, 5000);
    
    // 監聽數據變化
    const handleDataChange = (snapshot) => {
      const data = snapshot.val();
      if (!data) {
        console.log('房間數據不存在');
        return;
      }
      
      console.log('房間數據更新:', data);
      
      // 更新本地狀態
      setCurrentQuestion(data.currentQuestion || null);
      
      // 檢測到有人搶答，啟動計時器
      const prevCurrentPlayer = currentPlayer;
      const newCurrentPlayer = data.currentPlayer;
      setCurrentPlayer(newCurrentPlayer);
      
      // 如果有新的搶答者，啟動計時器
      if (newCurrentPlayer && newCurrentPlayer !== prevCurrentPlayer) {
        console.log(`${newCurrentPlayer} 搶答，啟動計時器`);
        startAnswerTimer(15);
      }
      
      // 如果沒有搶答者且不是在顯示答案，停止計時器
      if (!newCurrentPlayer && !data.showingAnswer) {
        clearGameTimer();
        setAnswerTime(15); // 重置計時器
      }
      
      setGameStatus(data.status || 'waiting');
      gameStatusRef.current = data.status || 'waiting';
      setWinner(data.winner || null);
      setShowingAnswer(data.showingAnswer || false);
      setUsedQuestions(data.usedQuestions || []);
      
      // 更新禁用玩家列表
      if (data.disabledPlayers) {
        setDisabledPlayers(data.disabledPlayers);
      } else {
        setDisabledPlayers([]);
      }
      
      // 格式化玩家數據
      if (data.players) {
        const playerList = Object.keys(data.players).map(name => ({
          name,
          score: data.players[name].score || 0
        }));
        setPlayers(playerList);
        
        // 實時檢查勝利條件
        const winningPlayer = playerList.find(player => player.score >= 20);
        if (winningPlayer && data.status !== '遊戲結束') {
          console.log(`發現玩家達到勝利條件: ${winningPlayer.name}, ${winningPlayer.score}分`);
          
          // 立即更新本地狀態
          setGameStatus('遊戲結束');
          setWinner(winningPlayer.name);
          
          // 同時更新Firebase
          // 使用 set 而不是 update 以確保完整更新
          set(roomRef, {
            ...data,
            status: '遊戲結束',
            winner: winningPlayer.name,
            lastActivity: serverTimestamp()
          }).catch(error => {
            console.error('更新遊戲結束狀態錯誤:', error);
          });
          
          // 清除計時器
          clearGameTimer();
        }
      }
    };
    
    // 監聽房間數據變化
    onValue(roomRef, handleDataChange);
    
    // 清理函數
    return () => {
      console.log('清理房間監聽');
      clearInterval(victoryCheckInterval);
      clearGameTimer();
      // 確保徹底移除監聽
      off(roomRef);
    };
  }, [roomId, currentPlayer]);

  // 搶答 - 帶冷卻機制
  const quickAnswer = () => {
    if (!roomIdRef.current || !playerNameRef.current) return;
    console.log('嘗試搶答:', playerNameRef.current);
    
    // 檢查是否在禁用列表中
    if (disabledPlayers.includes(playerNameRef.current)) {
      console.log('該玩家已被禁用搶答');
      return;
    }
    
    // 強制清除任何可能的障礙
    const roomRef = ref(database, `rooms/${roomIdRef.current}`);
    get(roomRef).then(snapshot => {
      const data = snapshot.val();
      if (!data) return;
      
      // 只有在沒有人搶答且沒有顯示答案時才能搶答
      if (!data.currentPlayer && !data.showingAnswer) {
        // 使用 set 而不是 update 確保數據完整更新
        set(roomRef, {
          ...data,
          currentPlayer: playerNameRef.current,
          lastActivity: serverTimestamp()
        }).catch(error => {
          console.error('搶答更新錯誤:', error);
        });
      }
    }).catch(error => {
      console.error('獲取房間數據錯誤:', error);
    });
  };

  // 檢查答案 - 帶冷卻機制
  const checkAnswer = async (selectedOption) => {
    const currentRoomId = roomIdRef.current;
    const currentPlayerName = playerNameRef.current;
    
    if (!currentRoomId || !currentPlayerName) {
      console.log('缺少房間ID或玩家名稱');
      return;
    }
    
    try {
      // 獲取最新房間數據
      const roomRef = ref(database, `rooms/${currentRoomId}`);
      const snapshot = await get(roomRef);
      const roomData = snapshot.val();
      
      if (!roomData || !roomData.currentQuestion) {
        console.log('房間數據或問題不存在');
        return;
      }
      
      // 檢查當前玩家是否是搶答者
      if (roomData.currentPlayer !== currentPlayerName) {
        console.log('非當前搶答者');
        return;
      }
      
      console.log('檢查答案:', selectedOption, roomData.currentQuestion.correctAnswer);
      
      // 停止計時器
      clearGameTimer();
      
      // 答對情況
      if (selectedOption === roomData.currentQuestion.correctAnswer) {
        // 獲取玩家當前分數
        const playerRef = ref(database, `rooms/${currentRoomId}/players/${currentPlayerName}`);
        const playerSnapshot = await get(playerRef);
        const currentScore = (playerSnapshot.val() && playerSnapshot.val().score) || 0;
        const newScore = currentScore + 1;
        
        console.log('答對了! 舊分數:', currentScore, '新分數:', newScore);
        
        // 清除所有禁用的玩家
        
        // 1. 先設置顯示答案狀態，同時更新分數
        await set(roomRef, {
          ...roomData,
          showingAnswer: true,
          players: {
            ...roomData.players,
            [currentPlayerName]: {
              ...roomData.players[currentPlayerName],
              score: newScore
            }
          },
          disabledPlayers: [], // 重置禁用列表
          lastActivity: serverTimestamp()
        });
        
        // 更新本地禁用狀態
        setDisabledPlayers([]);
        
        // 2. 檢查是否達到勝利條件
        if (newScore >= 20) {
          console.log('達到勝利條件, 設置遊戲結束狀態');
          
          // 立即更新本地狀態
          setGameStatus('遊戲結束');
          setWinner(currentPlayerName);
          
          // 同時更新Firebase
          await set(roomRef, {
            ...roomData,
            showingAnswer: true,
            players: {
              ...roomData.players,
              [currentPlayerName]: {
                ...roomData.players[currentPlayerName],
                score: newScore
              }
            },
            status: '遊戲結束',
            winner: currentPlayerName,
            disabledPlayers: [], // 重置禁用列表
            lastActivity: serverTimestamp()
          });
          
          console.log('已設置遊戲結束狀態');
        } else {
          // 3. 否則在延遲後獲取新題目
          setTimeout(async () => {
            // 再次檢查遊戲狀態
            const currentRoomSnapshot = await get(roomRef);
            const currentRoomData = currentRoomSnapshot.val();
            
            if (currentRoomData && currentRoomData.status === '遊戲中') {
              console.log('獲取下一題');
              await getRandomQuestion();
            }
          }, 2000);
        }
      } else {
        // 答錯情況
        console.log('答錯了，添加到禁用列表');
        
        // 將當前玩家添加到禁用列表
        const newDisabledPlayers = roomData.disabledPlayers || [];
        if (!newDisabledPlayers.includes(currentPlayerName)) {
          newDisabledPlayers.push(currentPlayerName);
        }
        
        // 更新房間狀態
        await set(roomRef, {
          ...roomData,
          currentPlayer: null,
          disabledPlayers: newDisabledPlayers,
          lastActivity: serverTimestamp()
        });
        
        // 更新本地禁用狀態
        setDisabledPlayers(newDisabledPlayers);
      }
    } catch (error) {
      console.error('檢查答案時出錯:', error);
    }
  };

  // 獲取隨機題目 - 優化版
  const getRandomQuestion = async () => {
    const currentRoomId = roomIdRef.current;
    if (!currentRoomId) return;
    
    console.log('獲取隨機題目');
    
    try {
      // 獲取所有題目
      const questionsRef = ref(database, 'questions');
      const questionsSnapshot = await get(questionsRef);
      const questionsData = questionsSnapshot.val();
      
      // 獲取當前房間數據
      const roomRef = ref(database, `rooms/${currentRoomId}`);
      const roomSnapshot = await get(roomRef);
      const roomData = roomSnapshot.val();
      
      if (!roomData) return;
      
      // 如果沒有題目，使用默認題目
      if (!questionsData) {
        console.log('找不到題目，使用默認題目');
        const defaultQuestion = {
          question: '氫元素在元素週期表中的原子序數為多少？',
          options: ['1', '2', '3', '4'],
          correctAnswer: 0
        };
        
        await set(roomRef, {
          ...roomData,
          currentQuestion: defaultQuestion,
          currentPlayer: null,
          showingAnswer: false,
          disabledPlayers: [], // 重置禁用列表
          lastActivity: serverTimestamp()
        });
        
        // 重置計時器和禁用玩家列表
        setAnswerTime(15);
        setDisabledPlayers([]);
        
        return;
      }
      
      // 將題目轉換為數組
      const questionsArray = Object.keys(questionsData).map(key => ({
        id: key,
        ...questionsData[key]
      }));
      
      // 獲取已使用過的題目
      const usedQuestionIds = roomData.usedQuestions || [];
      
      // 篩選未使用過的題目
      const unusedQuestions = questionsArray.filter(
        question => !usedQuestionIds.includes(question.id)
      );
      
      // 如果所有題目都已經使用過，重置列表
      if (unusedQuestions.length === 0) {
        console.log('所有題目都已使用過，重置列表');
        
        // 隨機選擇一個題目
        const randomIndex = Math.floor(Math.random() * questionsArray.length);
        const randomQuestion = questionsArray[randomIndex];
        
        // 更新房間數據
        await set(roomRef, {
          ...roomData,
          currentQuestion: {
            question: randomQuestion.question,
            options: randomQuestion.options,
            correctAnswer: randomQuestion.correctAnswer
          },
          usedQuestions: [randomQuestion.id],
          currentPlayer: null,
          showingAnswer: false,
          disabledPlayers: [], // 重置禁用列表
          lastActivity: serverTimestamp()
        });
        
        // 重置計時器和禁用玩家列表
        setAnswerTime(15);
        setDisabledPlayers([]);
      } else {
        // 從未使用過的題目中隨機選擇
        const randomIndex = Math.floor(Math.random() * unusedQuestions.length);
        const randomQuestion = unusedQuestions[randomIndex];
        
        // 更新房間數據
        await set(roomRef, {
          ...roomData,
          currentQuestion: {
            question: randomQuestion.question,
            options: randomQuestion.options,
            correctAnswer: randomQuestion.correctAnswer
          },
          usedQuestions: [...usedQuestionIds, randomQuestion.id],
          currentPlayer: null,
          showingAnswer: false,
          disabledPlayers: [], // 重置禁用列表
          lastActivity: serverTimestamp()
        });
        
        // 重置計時器和禁用玩家列表
        setAnswerTime(15);
        setDisabledPlayers([]);
      }
    } catch (error) {
      console.error('獲取隨機題目出錯:', error);
      
      // 出錯時使用默認題目
      try {
        const roomRef = ref(database, `rooms/${currentRoomId}`);
        const roomSnapshot = await get(roomRef);
        const roomData = roomSnapshot.val();
        
        if (roomData) {
          const defaultQuestion = {
            question: '氫元素在元素週期表中的原子序數為多少？',
            options: ['1', '2', '3', '4'],
            correctAnswer: 0
          };
          
          await set(roomRef, {
            ...roomData,
            currentQuestion: defaultQuestion,
            currentPlayer: null,
            showingAnswer: false,
            disabledPlayers: [], // 重置禁用列表
            lastActivity: serverTimestamp()
          });
          
          // 重置計時器和禁用玩家列表
          setAnswerTime(15);
          setDisabledPlayers([]);
        }
      } catch (innerError) {
        console.error('設置默認題目出錯:', innerError);
      }
    }
  };

  // 重新開始遊戲 - 優化版
  const restartGame = async () => {
    const currentRoomId = roomIdRef.current;
    if (!currentRoomId) return;
    
    console.log('重新開始遊戲');
    
    try {
      // 獲取當前房間數據
      const roomRef = ref(database, `rooms/${currentRoomId}`);
      const roomSnapshot = await get(roomRef);
      const roomData = roomSnapshot.val();
      
      if (!roomData) return;
      
      // 重置所有玩家分數
      const resetPlayers = {};
      if (roomData.players) {
        Object.keys(roomData.players).forEach(playerName => {
          resetPlayers[playerName] = {
            ...roomData.players[playerName],
            score: 0
          };
        });
      }
      
      // 更新房間狀態
      await set(roomRef, {
        ...roomData,
        status: '遊戲中',
        winner: null,
        currentPlayer: null,
        usedQuestions: [],
        showingAnswer: false,
        disabledPlayers: [], // 重置禁用列表
        players: resetPlayers,
        lastActivity: serverTimestamp()
      });
      
      // 重置計時器和禁用玩家列表
      setAnswerTime(15);
      setDisabledPlayers([]);
      
      // 獲取新題目
      await getRandomQuestion();
    } catch (error) {
      console.error('重新開始遊戲出錯:', error);
    }
  };

  // 結束遊戲 - 優化版
  const endGame = async () => {
    const currentRoomId = roomIdRef.current;
    if (!currentRoomId) return;
    
    console.log('結束遊戲');
    
    try {
      // 獲取當前房間數據
      const roomRef = ref(database, `rooms/${currentRoomId}`);
      const roomSnapshot = await get(roomRef);
      const roomData = roomSnapshot.val();
      
      if (!roomData) return;
      
      // 重置所有玩家分數
      const resetPlayers = {};
      if (roomData.players) {
        Object.keys(roomData.players).forEach(playerName => {
          resetPlayers[playerName] = {
            ...roomData.players[playerName],
            score: 0
          };
        });
      }
      
      // 更新房間狀態
      await set(roomRef, {
        ...roomData,
        status: '等待中',
        winner: null,
        currentPlayer: null,
        currentQuestion: null,
        usedQuestions: [],
        showingAnswer: false,
        disabledPlayers: [], // 重置禁用列表
        players: resetPlayers,
        lastActivity: serverTimestamp()
      });
      
      // 重置計時器和禁用玩家列表
      setAnswerTime(15);
      setDisabledPlayers([]);
    } catch (error) {
      console.error('結束遊戲出錯:', error);
    }
  };

  // 手動強制結束遊戲
  const forceEndGame = async () => {
    const currentRoomId = roomIdRef.current;
    if (!currentRoomId) return;
    
    console.log('強制結束遊戲');
    
    try {
      const roomRef = ref(database, `rooms/${currentRoomId}`);
      await remove(roomRef);
      console.log('已刪除房間');
      
      // 重置計時器和禁用玩家列表
      setAnswerTime(15);
      setDisabledPlayers([]);
    } catch (error) {
      console.error('強制結束遊戲出錯:', error);
    }
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
    showingAnswer,
    forceEndGame,
    answerTime,
    disabledPlayers
  };
};

export default useGame;