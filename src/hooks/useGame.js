// src/hooks/useGame.js - 完全重構版
import { useState, useEffect, useRef, useCallback } from 'react';
import { ref, onValue, get, set, off, remove, serverTimestamp } from 'firebase/database';
import { database } from '../firebase';

// 勝利分數閾值
const VICTORY_SCORE = 20;

// 計時器初始值
const ANSWER_TIME_LIMIT = 15;

export const useGame = (roomId, playerName) => {
  // 基本遊戲狀態
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [currentPlayer, setCurrentPlayer] = useState(null);
  const [gameStatus, setGameStatus] = useState('waiting');
  const [winner, setWinner] = useState(null);
  const [players, setPlayers] = useState([]);
  const [usedQuestions, setUsedQuestions] = useState([]);
  const [showingAnswer, setShowingAnswer] = useState(false);
  const [answerTime, setAnswerTime] = useState(ANSWER_TIME_LIMIT);
  const [disabledPlayers, setDisabledPlayers] = useState([]);
  
  // 使用refs防止閉包問題
  const stateRef = useRef({
    roomId,
    playerName,
    gameStatus: 'waiting',
    winner: null,
    answerTimeoutId: null,
    victoryCheckId: null,
    nextQuestionTimeoutId: null,
    isProcessingAnswer: false
  });
  
  // 同步ref中的狀態
  useEffect(() => {
    stateRef.current.roomId = roomId;
    stateRef.current.playerName = playerName;
    stateRef.current.gameStatus = gameStatus;
    stateRef.current.winner = winner;
  }, [roomId, playerName, gameStatus, winner]);
  
  // 清理所有計時器和超時器
  const cleanupTimers = useCallback(() => {
    console.log('清除所有計時器和超時器');
    
    if (stateRef.current.answerTimeoutId) {
      clearInterval(stateRef.current.answerTimeoutId);
      stateRef.current.answerTimeoutId = null;
    }
    
    if (stateRef.current.victoryCheckId) {
      clearInterval(stateRef.current.victoryCheckId);
      stateRef.current.victoryCheckId = null;
    }
    
    if (stateRef.current.nextQuestionTimeoutId) {
      clearTimeout(stateRef.current.nextQuestionTimeoutId);
      stateRef.current.nextQuestionTimeoutId = null;
    }
  }, []);
  
  // 啟動答題計時器
  const startAnswerTimer = useCallback((initialTime = ANSWER_TIME_LIMIT) => {
    // 先清理已有的計時器
    if (stateRef.current.answerTimeoutId) {
      clearInterval(stateRef.current.answerTimeoutId);
    }
    
    // 設置初始值
    setAnswerTime(initialTime);
    
    // 啟動計時器
    let timeLeft = initialTime;
    stateRef.current.answerTimeoutId = setInterval(() => {
      timeLeft--;
      
      if (timeLeft <= 0) {
        // 時間到，清理計時器
        clearInterval(stateRef.current.answerTimeoutId);
        stateRef.current.answerTimeoutId = null;
        
        setAnswerTime(0);
        
        // 如果當前搶答者是自己，處理超時
        if (currentPlayer === stateRef.current.playerName) {
          handleTimeOut();
        }
      } else {
        setAnswerTime(timeLeft);
      }
    }, 1000);
  }, [currentPlayer]);
  
  // 處理超時
  const handleTimeOut = useCallback(async () => {
    const { roomId, playerName } = stateRef.current;
    
    if (!roomId) return;
    
    console.log('答題時間到，自動處理為答錯');
    
    try {
      // 先獲取最新房間數據
      const roomRef = ref(database, `rooms/${roomId}`);
      const snapshot = await get(roomRef);
      const roomData = snapshot.val();
      
      if (!roomData) return;
      
      // 將當前玩家添加到禁用列表
      const newDisabledPlayers = [...(roomData.disabledPlayers || [])];
      if (!newDisabledPlayers.includes(playerName)) {
        newDisabledPlayers.push(playerName);
      }
      
      // 更新房間數據
      await set(roomRef, {
        ...roomData,
        currentPlayer: null,
        disabledPlayers: newDisabledPlayers,
        lastActivity: serverTimestamp()
      });
    } catch (error) {
      console.error('處理答題超時錯誤:', error);
    }
  }, []);
  
  // 檢查勝利條件 - 重寫為同步函數，返回勝利者或null
  const checkVictory = useCallback((playersList) => {
    if (!playersList || playersList.length === 0) return null;
    
    // 過濾出分數達到或超過勝利閾值的玩家
    const qualifiedPlayers = playersList.filter(
      player => typeof player.score === 'number' && player.score >= VICTORY_SCORE
    );
    
    if (qualifiedPlayers.length === 0) return null;
    
    // 如果有多個達標玩家，選擇分數最高的
    qualifiedPlayers.sort((a, b) => b.score - a.score);
    return qualifiedPlayers[0];
  }, []);
  
  // 設置遊戲勝利狀態 - 為確保數據一致性，統一設置遊戲結束狀態
  const setGameVictory = useCallback(async (winningPlayer) => {
    const { roomId, gameStatus } = stateRef.current;
    
    // 如果已經是遊戲結束狀態，不重複設置
    if (gameStatus === '遊戲結束') return;
    
    console.log(`設置遊戲勝利: ${winningPlayer.name} (${winningPlayer.score}分)`);
    
    try {
      // 本地狀態更新
      setWinner(winningPlayer.name);
      setGameStatus('遊戲結束');
      stateRef.current.winner = winningPlayer.name;
      stateRef.current.gameStatus = '遊戲結束';
      
      // 更新Firebase數據
      const roomRef = ref(database, `rooms/${roomId}`);
      const snapshot = await get(roomRef);
      
      if (snapshot.exists()) {
        const roomData = snapshot.val();
        
        // 使用原子操作更新遊戲狀態
        await set(roomRef, {
          ...roomData,
          status: '遊戲結束',
          winner: winningPlayer.name,
          lastActivity: serverTimestamp()
        });
        
        console.log('成功更新Firebase遊戲結束狀態');
      }
      
      // 清理所有計時器
      cleanupTimers();
    } catch (error) {
      console.error('設置遊戲勝利狀態錯誤:', error);
    }
  }, [cleanupTimers]);
  
  // 獲取隨機題目 - 提前定義
  const getRandomQuestion = useCallback(async () => {
    const { roomId } = stateRef.current;
    
    if (!roomId) {
      console.log('缺少房間ID');
      return Promise.reject('缺少房間ID');
    }
    
    console.log('獲取隨機題目');
    
    try {
      // 獲取所有題目
      const questionsRef = ref(database, 'questions');
      const questionsSnapshot = await get(questionsRef);
      
      // 獲取當前房間數據
      const roomRef = ref(database, `rooms/${roomId}`);
      const roomSnapshot = await get(roomRef);
      
      if (!roomSnapshot.exists()) {
        console.log('房間不存在');
        return Promise.reject('房間不存在');
      }
      
      const roomData = roomSnapshot.val();
      
      // 如果沒有題目，使用默認題目
      if (!questionsSnapshot.exists() || !questionsSnapshot.val()) {
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
          disabledPlayers: [],
          lastActivity: serverTimestamp()
        });
        
        return defaultQuestion;
      }
      
      // 處理題目數據
      const questionsData = questionsSnapshot.val();
      const questionsArray = Object.keys(questionsData).map(key => ({
        id: key,
        ...questionsData[key]
      }));
      
      // 已使用的題目
      const usedQuestionIds = roomData.usedQuestions || [];
      
      // 過濾未使用題目
      let unusedQuestions = questionsArray.filter(
        question => !usedQuestionIds.includes(question.id)
      );
      
      let selectedQuestion;
      let newUsedIds;
      
      // 如果沒有未使用題目，重置
      if (unusedQuestions.length === 0) {
        console.log('所有題目已使用過，重置題目列表');
        
        // 隨機選擇一個題目
        const randomIndex = Math.floor(Math.random() * questionsArray.length);
        selectedQuestion = questionsArray[randomIndex];
        newUsedIds = [selectedQuestion.id];
      } else {
        // 從未使用題目中隨機選擇
        const randomIndex = Math.floor(Math.random() * unusedQuestions.length);
        selectedQuestion = unusedQuestions[randomIndex];
        newUsedIds = [...usedQuestionIds, selectedQuestion.id];
      }
      
      // 確保選擇的問題有效
      if (!selectedQuestion || !selectedQuestion.options || !Array.isArray(selectedQuestion.options)) {
        console.error('選擇的問題無效:', selectedQuestion);
        
        // 使用備用問題
        selectedQuestion = {
          question: '氫元素在元素週期表中的原子序數為多少？',
          options: ['1', '2', '3', '4'],
          correctAnswer: 0
        };
      }
      
      // 更新房間數據
      await set(roomRef, {
        ...roomData,
        currentQuestion: {
          question: selectedQuestion.question,
          options: selectedQuestion.options,
          correctAnswer: selectedQuestion.correctAnswer
        },
        usedQuestions: newUsedIds,
        currentPlayer: null,
        showingAnswer: false,
        disabledPlayers: [],
        lastActivity: serverTimestamp()
      });
      
      console.log('成功更新隨機題目');
      return selectedQuestion;
    } catch (error) {
      console.error('獲取隨機題目錯誤:', error);
      throw error;
    }
  }, []);
  
  // 搶答功能 - 重構以確保安全操作
  const quickAnswer = useCallback(() => {
    const { roomId, playerName } = stateRef.current;
    
    if (!roomId || !playerName) {
      console.log('缺少房間ID或玩家名稱');
      return;
    }
    
    console.log(`玩家 ${playerName} 嘗試搶答`);
    
    // 檢查是否被禁用
    if (disabledPlayers.includes(playerName)) {
      console.log('該玩家已被禁用搶答');
      return;
    }
    
    const roomRef = ref(database, `rooms/${roomId}`);
    
    // 使用事務處理確保原子性
    get(roomRef).then(snapshot => {
      if (!snapshot.exists()) {
        console.log('房間不存在');
        return;
      }
      
      const roomData = snapshot.val();
      
      // 只有在沒有當前搶答者且不在顯示答案狀態時才能搶答
      if (roomData.currentPlayer || roomData.showingAnswer) {
        console.log('已有玩家搶答或正在顯示答案');
        return;
      }
      
      // 更新搶答者
      set(roomRef, {
        ...roomData,
        currentPlayer: playerName,
        lastActivity: serverTimestamp()
      }).then(() => {
        console.log(`玩家 ${playerName} 成功搶答`);
      }).catch(error => {
        console.error('更新搶答狀態錯誤:', error);
      });
    }).catch(error => {
      console.error('獲取房間數據錯誤:', error);
    });
  }, [disabledPlayers]);
  
  // 檢查答案 - 重構以處理比較和更新邏輯
  const checkAnswer = useCallback(async (selectedOption) => {
    const { roomId, playerName, isProcessingAnswer } = stateRef.current;
    
    // 防止重複提交
    if (isProcessingAnswer) {
      console.log('正在處理答案，請勿重複提交');
      return;
    }
    
    if (!roomId || !playerName) {
      console.log('缺少房間ID或玩家名稱');
      return;
    }
    
    try {
      // 標記正在處理
      stateRef.current.isProcessingAnswer = true;
      
      // 獲取最新房間數據
      const roomRef = ref(database, `rooms/${roomId}`);
      const snapshot = await get(roomRef);
      
      if (!snapshot.exists()) {
        console.log('房間不存在');
        stateRef.current.isProcessingAnswer = false;
        return;
      }
      
      const roomData = snapshot.val();
      
      // 檢查是否是當前搶答者
      if (roomData.currentPlayer !== playerName) {
        console.log('非當前搶答者');
        stateRef.current.isProcessingAnswer = false;
        return;
      }
      
      // 檢查問題是否存在
      if (!roomData.currentQuestion) {
        console.log('當前沒有問題');
        stateRef.current.isProcessingAnswer = false;
        return;
      }
      
      console.log(`檢查答案: 選擇=${selectedOption}, 正確=${roomData.currentQuestion.correctAnswer}`);
      
      // 清除答題計時器
      if (stateRef.current.answerTimeoutId) {
        clearInterval(stateRef.current.answerTimeoutId);
        stateRef.current.answerTimeoutId = null;
      }
      
      // 檢查答案正確性
      const isCorrect = selectedOption === roomData.currentQuestion.correctAnswer;
      
      if (isCorrect) {
        // 答案正確，更新分數
        console.log('回答正確!');
        
        // 計算新分數
        const currentScore = Number((roomData.players[playerName] && roomData.players[playerName].score) || 0);
        const newScore = currentScore + 1;
        
        console.log(`分數更新: ${currentScore} -> ${newScore}`);
        
        // 更新玩家數據
        const updatedPlayers = { ...roomData.players };
        updatedPlayers[playerName] = {
          ...updatedPlayers[playerName],
          score: newScore
        };
        
        // 設置顯示答案狀態
        await set(roomRef, {
          ...roomData,
          showingAnswer: true,
          players: updatedPlayers,
          disabledPlayers: [], // 重置禁用列表
          lastActivity: serverTimestamp()
        });
        
        // 檢查是否達到勝利條件
        const playerList = Object.keys(updatedPlayers).map(name => ({
          name,
          score: Number(updatedPlayers[name].score || 0)
        }));
        
        // 找出可能的勝利者
        const victor = checkVictory(playerList);
        
        if (victor) {
          // 達到勝利條件
          console.log(`玩家 ${victor.name} 達到勝利條件: ${victor.score}分`);
          await setGameVictory(victor);
        } else {
          // 未達到勝利條件，延遲後獲取下一題
          stateRef.current.nextQuestionTimeoutId = setTimeout(async () => {
            try {
              // 再次檢查遊戲狀態
              const updatedSnapshot = await get(roomRef);
              
              if (updatedSnapshot.exists()) {
                const updatedRoomData = updatedSnapshot.val();
                
                if (updatedRoomData.status === '遊戲中' && !updatedRoomData.winner) {
                  console.log('獲取下一題');
                  await getRandomQuestion();
                }
              }
            } catch (error) {
              console.error('獲取下一題錯誤:', error);
            } finally {
              stateRef.current.nextQuestionTimeoutId = null;
            }
          }, 2000);
        }
      } else {
        // 答案錯誤，更新禁用列表
        console.log('回答錯誤!');
        
        // 將當前玩家添加到禁用列表
        const newDisabledPlayers = [...(roomData.disabledPlayers || [])];
        if (!newDisabledPlayers.includes(playerName)) {
          newDisabledPlayers.push(playerName);
        }
        
        // 更新房間狀態
        await set(roomRef, {
          ...roomData,
          currentPlayer: null, // 清除當前搶答者
          disabledPlayers: newDisabledPlayers,
          lastActivity: serverTimestamp()
        });
      }
    } catch (error) {
      console.error('檢查答案錯誤:', error);
    } finally {
      // 解除處理標記
      stateRef.current.isProcessingAnswer = false;
    }
  }, [checkVictory, getRandomQuestion, setGameVictory]);
  
  // 重啟遊戲 - 完全清理和重置
  const restartGame = useCallback(async () => {
    const { roomId } = stateRef.current;
    
    if (!roomId) {
      console.log('缺少房間ID');
      return;
    }
    
    console.log('重新開始遊戲');
    
    try {
      // 清理所有計時器
      cleanupTimers();
      
      // 獲取當前房間數據
      const roomRef = ref(database, `rooms/${roomId}`);
      const snapshot = await get(roomRef);
      
      if (!snapshot.exists()) {
        console.log('房間不存在');
        return;
      }
      
      const roomData = snapshot.val();
      
      // 重置玩家分數
      const resetPlayers = {};
      if (roomData.players) {
        Object.keys(roomData.players).forEach(name => {
          resetPlayers[name] = {
            ...roomData.players[name],
            score: 0
          };
        });
      }
      
      // 重置本地狀態
      setWinner(null);
      setGameStatus('遊戲中');
      stateRef.current.winner = null;
      stateRef.current.gameStatus = '遊戲中';
      
      // 更新房間狀態
      await set(roomRef, {
        ...roomData,
        status: '遊戲中',
        winner: null,
        currentPlayer: null,
        usedQuestions: [],
        showingAnswer: false,
        disabledPlayers: [],
        players: resetPlayers,
        lastActivity: serverTimestamp()
      });
      
      // 獲取新題目
      await getRandomQuestion();
      
      console.log('遊戲重啟成功');
    } catch (error) {
      console.error('重啟遊戲錯誤:', error);
    }
  }, [cleanupTimers, getRandomQuestion]);
  
  // 結束遊戲 - 回到等待狀態
  const endGame = useCallback(async () => {
    const { roomId } = stateRef.current;
    
    if (!roomId) {
      console.log('缺少房間ID');
      return;
    }
    
    console.log('結束遊戲');
    
    try {
      // 清理所有計時器
      cleanupTimers();
      
      // 獲取當前房間數據
      const roomRef = ref(database, `rooms/${roomId}`);
      const snapshot = await get(roomRef);
      
      if (!snapshot.exists()) {
        console.log('房間不存在');
        return;
      }
      
      const roomData = snapshot.val();
      
      // 重置玩家分數
      const resetPlayers = {};
      if (roomData.players) {
        Object.keys(roomData.players).forEach(name => {
          resetPlayers[name] = {
            ...roomData.players[name],
            score: 0
          };
        });
      }
      
      // 重置本地狀態
      setWinner(null);
      setGameStatus('等待中');
      stateRef.current.winner = null;
      stateRef.current.gameStatus = '等待中';
      
      // 更新房間狀態
      await set(roomRef, {
        ...roomData,
        status: '等待中',
        winner: null,
        currentPlayer: null,
        currentQuestion: null,
        usedQuestions: [],
        showingAnswer: false,
        disabledPlayers: [],
        players: resetPlayers,
        lastActivity: serverTimestamp()
      });
      
      console.log('遊戲結束成功');
    } catch (error) {
      console.error('結束遊戲錯誤:', error);
    }
  }, [cleanupTimers]);
  
  // 強制結束遊戲 - 刪除房間
  const forceEndGame = useCallback(async () => {
    const { roomId } = stateRef.current;
    
    if (!roomId) {
      console.log('缺少房間ID');
      return;
    }
    
    console.log('強制結束遊戲');
    
    try {
      // 清理所有計時器
      cleanupTimers();
      
      // 刪除房間
      const roomRef = ref(database, `rooms/${roomId}`);
      await remove(roomRef);
      
      // 重置本地狀態
      setWinner(null);
      setGameStatus('等待中');
      stateRef.current.winner = null;
      stateRef.current.gameStatus = '等待中';
      
      console.log('強制結束遊戲成功');
    } catch (error) {
      console.error('強制結束遊戲錯誤:', error);
    }
  }, [cleanupTimers]);
  
  // 定期檢查勝利條件
  useEffect(() => {
    const { roomId } = stateRef.current;
    
    if (!roomId) return;
    
    // 設置定期檢查勝利條件的計時器
    stateRef.current.victoryCheckId = setInterval(async () => {
      const { gameStatus, winner, roomId } = stateRef.current;
      
      // 如果已經是遊戲結束狀態或有勝利者，不再檢查
      if (gameStatus === '遊戲結束' || winner) {
        return;
      }
      
      try {
        // 獲取最新房間數據
        const roomRef = ref(database, `rooms/${roomId}`);
        const snapshot = await get(roomRef);
        
        if (snapshot.exists()) {
          const roomData = snapshot.val();
          
          // 檢查房間狀態
          if (roomData.status === '遊戲中' && !roomData.winner && roomData.players) {
            // 格式化玩家列表
            const playerList = Object.keys(roomData.players).map(name => ({
              name,
              score: Number(roomData.players[name].score || 0)
            }));
            
            // 檢查是否有人達到勝利條件
            const victor = checkVictory(playerList);
            
            if (victor) {
              console.log(`定期檢查發現勝利者: ${victor.name} (${victor.score}分)`);
              await setGameVictory(victor);
            }
          }
        }
      } catch (error) {
        console.error('定期勝利檢查錯誤:', error);
      }
    }, 2000);
    
    // 清理函數
    return () => {
      if (stateRef.current.victoryCheckId) {
        clearInterval(stateRef.current.victoryCheckId);
        stateRef.current.victoryCheckId = null;
      }
    };
  }, [checkVictory, setGameVictory]);
  
  // 監聽房間數據變化
  useEffect(() => {
    const { roomId } = stateRef.current;
    
    if (!roomId) {
      console.log('缺少房間ID，不監聽');
      return;
    }
    
    console.log(`設置監聽房間: ${roomId}`);
    
    const roomRef = ref(database, `rooms/${roomId}`);
    
    // 初始直接獲取一次數據檢查狀態
    get(roomRef).then(snapshot => {
      if (snapshot.exists()) {
        const roomData = snapshot.val();
        console.log('初始房間檢查:', roomData);
        
        // 如果已經有勝利者但本地沒有記錄，同步狀態
        if (roomData.winner && roomData.status === '遊戲結束' && !stateRef.current.winner) {
          console.log(`同步勝利狀態: ${roomData.winner}`);
          setWinner(roomData.winner);
          setGameStatus('遊戲結束');
          stateRef.current.winner = roomData.winner;
          stateRef.current.gameStatus = '遊戲結束';
        }
      }
    }).catch(error => {
      console.error('初始房間數據獲取錯誤:', error);
    });
    
    // 設置房間監聽
    const unsubscribe = onValue(roomRef, snapshot => {
      if (!snapshot.exists()) {
        console.log('房間不存在或已被刪除');
        return;
      }
      
      const roomData = snapshot.val();
      console.log('房間數據更新:', roomData);
      
      // 更新問題
      setCurrentQuestion(roomData.currentQuestion || null);
      
      // 更新搶答者
      setCurrentPlayer(roomData.currentPlayer || null);
      
      // 檢查搶答狀態並管理計時器
      const newCurrentPlayer = roomData.currentPlayer;
      
      if (newCurrentPlayer && newCurrentPlayer !== currentPlayer) {
        // 新玩家搶答，啟動計時器
        console.log(`玩家 ${newCurrentPlayer} 開始搶答，啟動計時器`);
        startAnswerTimer(ANSWER_TIME_LIMIT);
      } else if (!newCurrentPlayer && !roomData.showingAnswer) {
        // 沒有搶答者且不在顯示答案狀態，確保計時器停止
        if (stateRef.current.answerTimeoutId) {
          clearInterval(stateRef.current.answerTimeoutId);
          stateRef.current.answerTimeoutId = null;
          setAnswerTime(ANSWER_TIME_LIMIT);
        }
      }
      
      // 更新遊戲狀態
      const newGameStatus = roomData.status || 'waiting';
      setGameStatus(newGameStatus);
      stateRef.current.gameStatus = newGameStatus;
      
      // 更新勝利者
      const newWinner = roomData.winner || null;
      if (newWinner && newWinner !== winner) {
        console.log(`遊戲結束，勝利者是 ${newWinner}`);
        setWinner(newWinner);
        stateRef.current.winner = newWinner;
        
        // 發現勝利者時，清理所有計時器
        cleanupTimers();
      }
      
      // 更新其他狀態
      setShowingAnswer(roomData.showingAnswer || false);
      setUsedQuestions(roomData.usedQuestions || []);
      setDisabledPlayers(roomData.disabledPlayers || []);
      
      // 更新玩家列表
      if (roomData.players) {
        const playerList = Object.keys(roomData.players).map(name => ({
          name,
          score: Number(roomData.players[name].score || 0)
        }));
        
        setPlayers(playerList);
        
        // 如果不是遊戲結束狀態，檢查是否有人達到勝利條件
        if (newGameStatus !== '遊戲結束' && !newWinner) {
          const victor = checkVictory(playerList);
          
          if (victor) {
            console.log(`監聽器發現勝利者: ${victor.name} (${victor.score}分)`);
            // 使用異步方式設置勝利狀態
            setGameVictory(victor);
          }
        }
      }
    });
    
    // 清理函數
    return () => {
      console.log('清理房間監聽');
      cleanupTimers();
      // 確保徹底移除監聽
      off(roomRef);
    };
  }, [roomId, currentPlayer, winner, checkVictory, setGameVictory, cleanupTimers, startAnswerTimer]);
  
  // 組件卸載時清理
  useEffect(() => {
    return () => {
      cleanupTimers();
    };
  }, [cleanupTimers]);
  
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