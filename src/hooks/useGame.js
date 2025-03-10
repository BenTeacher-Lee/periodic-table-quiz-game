// src/hooks/useGame.js - 最終修復版
import { useState, useEffect, useRef } from 'react';
import { ref, onValue, get, set, off, remove, serverTimestamp } from 'firebase/database';
import { database } from '../firebase';

// 勝利分數閾值 - 明確定義常量
const VICTORY_SCORE = 20;

export const useGame = (roomId, playerName) => {
  // 基本遊戲狀態
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [currentPlayer, setCurrentPlayer] = useState(null);
  const [gameStatus, setGameStatus] = useState('waiting');
  const [winner, setWinner] = useState(null);
  const [players, setPlayers] = useState([]);
  const [usedQuestions, setUsedQuestions] = useState([]);
  const [showingAnswer, setShowingAnswer] = useState(false);
  const [answerTime, setAnswerTime] = useState(15);
  const [disabledPlayers, setDisabledPlayers] = useState([]);
  
  // 使用一個全局ref存儲重要參數和計時器
  const gameRef = useRef({
    roomId,
    playerName,
    answerTimerId: null,
    checkVictoryTimerId: null,
    nextQuestionTimerId: null
  });
  
  // 清理所有計時器函數
  const clearAllTimers = () => {
    if (gameRef.current.answerTimerId) {
      console.log("🔄 清理答題計時器");
      clearInterval(gameRef.current.answerTimerId);
      gameRef.current.answerTimerId = null;
    }
    
    if (gameRef.current.checkVictoryTimerId) {
      console.log("🔄 清理勝利檢查計時器");
      clearInterval(gameRef.current.checkVictoryTimerId);
      gameRef.current.checkVictoryTimerId = null;
    }
    
    if (gameRef.current.nextQuestionTimerId) {
      console.log("🔄 清理下一題計時器");
      clearTimeout(gameRef.current.nextQuestionTimerId);
      gameRef.current.nextQuestionTimerId = null;
    }
  };
  
  // 啟動答題倒計時
  const startAnswerTimer = () => {
    console.log("⏱️ 啟動答題計時器");
    
    // 首先清理已有計時器
    if (gameRef.current.answerTimerId) {
      clearInterval(gameRef.current.answerTimerId);
      gameRef.current.answerTimerId = null;
    }
    
    // 設置初始時間
    setAnswerTime(15);
    
    // 啟動新計時器
    gameRef.current.answerTimerId = setInterval(() => {
      setAnswerTime(prevTime => {
        const newTime = prevTime - 1;
        
        // 時間到，處理超時
        if (newTime <= 0) {
          clearInterval(gameRef.current.answerTimerId);
          gameRef.current.answerTimerId = null;
          
          // 如果當前玩家是搶答者，處理超時
          const { playerName } = gameRef.current;
          if (currentPlayer === playerName) {
            handleTimeOut();
          }
          
          return 0;
        }
        
        return newTime;
      });
    }, 1000);
  };
  
  // 處理答題超時
  const handleTimeOut = async () => {
    const { roomId, playerName } = gameRef.current;
    
    console.log("⏱️ 答題時間到，標記為答錯");
    
    try {
      // 獲取最新房間數據
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
      console.error("❌ 處理超時錯誤:", error);
    }
  };
  
  // 搶答功能
  const quickAnswer = async () => {
    const { roomId, playerName } = gameRef.current;
    
    if (!roomId || !playerName) {
      console.log("❌ 缺少房間ID或玩家名稱");
      return;
    }
    
    console.log("🎮 玩家嘗試搶答:", playerName);
    
    // 檢查是否被禁用
    if (disabledPlayers.includes(playerName)) {
      console.log("❌ 玩家已被禁用，無法搶答");
      return;
    }
    
    try {
      // 獲取最新房間數據
      const roomRef = ref(database, `rooms/${roomId}`);
      const snapshot = await get(roomRef);
      
      if (!snapshot.exists()) {
        console.log("❌ 房間不存在");
        return;
      }
      
      const roomData = snapshot.val();
      
      // 檢查是否已有人搶答或正在顯示答案
      if (roomData.currentPlayer || roomData.showingAnswer) {
        console.log("❌ 已有人搶答或正在顯示答案");
        return;
      }
      
      // 更新房間數據
      await set(roomRef, {
        ...roomData,
        currentPlayer: playerName,
        lastActivity: serverTimestamp()
      });
      
      console.log("✅ 搶答成功");
    } catch (error) {
      console.error("❌ 搶答錯誤:", error);
    }
  };
  
  // 檢查答案
  const checkAnswer = async (selectedOption) => {
    const { roomId, playerName } = gameRef.current;
    
    if (!roomId || !playerName) {
      console.log("❌ 缺少房間ID或玩家名稱");
      return;
    }
    
    console.log("🔍 檢查答案, 選擇:", selectedOption);
    
    try {
      // 獲取最新房間數據
      const roomRef = ref(database, `rooms/${roomId}`);
      const snapshot = await get(roomRef);
      
      if (!snapshot.exists()) {
        console.log("❌ 房間不存在");
        return;
      }
      
      const roomData = snapshot.val();
      
      // 檢查是否是當前搶答者
      if (roomData.currentPlayer !== playerName) {
        console.log("❌ 非當前搶答者");
        return;
      }
      
      // 檢查問題是否存在
      if (!roomData.currentQuestion) {
        console.log("❌ 當前沒有問題");
        return;
      }
      
      const correctAnswer = roomData.currentQuestion.correctAnswer;
      console.log(`🔍 答案檢查: 選擇=${selectedOption}, 正確=${correctAnswer}`);
      
      // 清除答題計時器
      if (gameRef.current.answerTimerId) {
        clearInterval(gameRef.current.answerTimerId);
        gameRef.current.answerTimerId = null;
      }
      
      // 檢查答案是否正確
      const isCorrect = selectedOption === correctAnswer;
      
      if (isCorrect) {
        // 答案正確，更新分數
        console.log("✅ 回答正確!");
        
        // 計算新分數
        const currentScore = Number((roomData.players[playerName] && roomData.players[playerName].score) || 0);
        const newScore = currentScore + 1;
        
        console.log(`📊 分數更新: ${currentScore} -> ${newScore}`);
        
        // 更新玩家數據
        const updatedPlayers = { ...roomData.players };
        updatedPlayers[playerName] = {
          ...updatedPlayers[playerName],
          score: newScore
        };
        
        // 檢查是否達到勝利分數
        const reachedVictory = newScore >= VICTORY_SCORE;
        
        if (reachedVictory) {
          console.log(`🏆 玩家 ${playerName} 達到勝利分數: ${newScore}`);
          
          // 更新房間狀態為遊戲結束
          await set(roomRef, {
            ...roomData,
            status: '遊戲結束',
            winner: playerName,
            showingAnswer: true,
            players: updatedPlayers,
            disabledPlayers: [],
            lastActivity: serverTimestamp()
          });
          
          // 清理所有計時器
          clearAllTimers();
        } else {
          // 未達到勝利分數，顯示答案並準備下一題
          await set(roomRef, {
            ...roomData,
            showingAnswer: true,
            players: updatedPlayers,
            disabledPlayers: [],
            lastActivity: serverTimestamp()
          });
          
          // 延遲後換下一題
          gameRef.current.nextQuestionTimerId = setTimeout(async () => {
            try {
              // 重新檢查房間狀態
              const latestSnapshot = await get(roomRef);
              
              if (latestSnapshot.exists()) {
                const latestRoomData = latestSnapshot.val();
                
                // 確保遊戲仍在進行中
                if (latestRoomData.status === '遊戲中' && !latestRoomData.winner) {
                  console.log("🔄 切換到下一題");
                  await getRandomQuestion();
                }
              }
            } catch (error) {
              console.error("❌ 獲取下一題錯誤:", error);
            }
          }, 2000);
        }
      } else {
        // 答案錯誤，更新禁用列表
        console.log("❌ 回答錯誤!");
        
        // 將當前玩家添加到禁用列表
        const newDisabledPlayers = [...(roomData.disabledPlayers || [])];
        if (!newDisabledPlayers.includes(playerName)) {
          newDisabledPlayers.push(playerName);
        }
        
        // 更新房間狀態
        await set(roomRef, {
          ...roomData,
          currentPlayer: null,
          disabledPlayers: newDisabledPlayers,
          lastActivity: serverTimestamp()
        });
      }
    } catch (error) {
      console.error("❌ 檢查答案錯誤:", error);
    }
  };
  
  // 獲取隨機題目
  const getRandomQuestion = async () => {
    const { roomId } = gameRef.current;
    
    if (!roomId) {
      console.log("❌ 缺少房間ID");
      return;
    }
    
    console.log("🔄 獲取隨機題目");
    
    try {
      // 獲取所有題目
      const questionsRef = ref(database, 'questions');
      const questionsSnapshot = await get(questionsRef);
      
      // 獲取當前房間數據
      const roomRef = ref(database, `rooms/${roomId}`);
      const roomSnapshot = await get(roomRef);
      
      if (!roomSnapshot.exists()) {
        console.log("❌ 房間不存在");
        return;
      }
      
      const roomData = roomSnapshot.val();
      
      // 如果沒有題目，使用默認題目
      if (!questionsSnapshot.exists() || !questionsSnapshot.val()) {
        console.log("ℹ️ 找不到題目，使用默認題目");
        
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
        
        return;
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
        console.log("ℹ️ 所有題目已使用過，重置題目列表");
        
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
      
      console.log("✅ 成功更新隨機題目");
    } catch (error) {
      console.error("❌ 獲取隨機題目錯誤:", error);
    }
  };
  
  // 重啟遊戲
  const restartGame = async () => {
    const { roomId } = gameRef.current;
    
    if (!roomId) {
      console.log("❌ 缺少房間ID");
      return;
    }
    
    console.log("🔄 重新開始遊戲");
    
    try {
      // 清理所有計時器
      clearAllTimers();
      
      // 獲取當前房間數據
      const roomRef = ref(database, `rooms/${roomId}`);
      const snapshot = await get(roomRef);
      
      if (!snapshot.exists()) {
        console.log("❌ 房間不存在");
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
      
      console.log("✅ 遊戲重啟成功");
    } catch (error) {
      console.error("❌ 重啟遊戲錯誤:", error);
    }
  };
  
  // 結束遊戲
  const endGame = async () => {
    const { roomId } = gameRef.current;
    
    if (!roomId) {
      console.log("❌ 缺少房間ID");
      return;
    }
    
    console.log("🔄 結束遊戲");
    
    try {
      // 清理所有計時器
      clearAllTimers();
      
      // 獲取當前房間數據
      const roomRef = ref(database, `rooms/${roomId}`);
      const snapshot = await get(roomRef);
      
      if (!snapshot.exists()) {
        console.log("❌ 房間不存在");
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
      
      console.log("✅ 遊戲結束成功");
    } catch (error) {
      console.error("❌ 結束遊戲錯誤:", error);
    }
  };
  
  // 強制結束遊戲
  const forceEndGame = async () => {
    const { roomId } = gameRef.current;
    
    if (!roomId) {
      console.log("❌ 缺少房間ID");
      return;
    }
    
    console.log("🔄 強制結束遊戲");
    
    try {
      // 清理所有計時器
      clearAllTimers();
      
      // 刪除房間
      const roomRef = ref(database, `rooms/${roomId}`);
      await remove(roomRef);
      
      console.log("✅ 強制結束遊戲成功");
    } catch (error) {
      console.error("❌ 強制結束遊戲錯誤:", error);
    }
  };
  
  // 檢查玩家是否達到勝利分數
  const checkWinner = (playerList) => {
    if (!playerList || playerList.length === 0) return null;
    
    // 找到分數達到或超過勝利閾值的玩家
    const winners = playerList.filter(player => {
      const score = Number(player.score);
      return !isNaN(score) && score >= VICTORY_SCORE;
    });
    
    if (winners.length === 0) return null;
    
    // 如果有多個達標玩家，選擇分數最高的
    winners.sort((a, b) => Number(b.score) - Number(a.score));
    return winners[0];
  };
  
  // 監聽房間數據變化
  useEffect(() => {
    if (!roomId) return;
    
    console.log("🔄 設置房間監聽:", roomId);
    gameRef.current.roomId = roomId;
    gameRef.current.playerName = playerName;
    
    const roomRef = ref(database, `rooms/${roomId}`);
    
    // 設置房間監聽
    const handleRoomChange = (snapshot) => {
      if (!snapshot.exists()) {
        console.log("❌ 房間不存在或已被刪除");
        return;
      }
      
      const roomData = snapshot.val();
      console.log("📊 房間數據更新:", {
        status: roomData.status,
        winner: roomData.winner,
        currentPlayer: roomData.currentPlayer,
        showingAnswer: roomData.showingAnswer
      });
      
      // 更新當前問題
      setCurrentQuestion(roomData.currentQuestion || null);
      
      // 更新搶答者和計時器狀態
      const newCurrentPlayer = roomData.currentPlayer;
      const prevCurrentPlayer = currentPlayer;
      
      if (newCurrentPlayer !== prevCurrentPlayer) {
        console.log(`🔄 搶答者變更: ${prevCurrentPlayer || '無'} -> ${newCurrentPlayer || '無'}`);
        
        // 更新當前搶答者
        setCurrentPlayer(newCurrentPlayer);
        
        // 如果有新搶答者，啟動計時器
        if (newCurrentPlayer) {
          console.log(`⏱️ 玩家 ${newCurrentPlayer} 開始搶答，啟動計時器`);
          startAnswerTimer();
        } else if (!roomData.showingAnswer) {
          // 無搶答者且不在顯示答案狀態，確保計時器重置
          if (gameRef.current.answerTimerId) {
            clearInterval(gameRef.current.answerTimerId);
            gameRef.current.answerTimerId = null;
          }
          setAnswerTime(15);
        }
      }
      
      // 更新遊戲狀態
      setGameStatus(roomData.status || 'waiting');
      
      // 更新勝利者
      const newWinner = roomData.winner;
      if (newWinner !== winner) {
        console.log(`🏆 勝利者更新: ${winner || '無'} -> ${newWinner || '無'}`);
        setWinner(newWinner);
        
        // 如果有勝利者，清理所有計時器
        if (newWinner) {
          clearAllTimers();
        }
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
        
        // 檢查是否有達到勝利分數的玩家
        if (roomData.status !== '遊戲結束' && !roomData.winner) {
          const winningPlayer = checkWinner(playerList);
          
          if (winningPlayer) {
            console.log(`🏆 發現勝利玩家: ${winningPlayer.name} (${winningPlayer.score}分)`);
            
            // 更新房間狀態
            set(roomRef, {
              ...roomData,
              status: '遊戲結束',
              winner: winningPlayer.name,
              lastActivity: serverTimestamp()
            }).catch(error => {
              console.error("❌ 更新勝利狀態錯誤:", error);
            });
          }
        }
      }
    };
    
    // 設置監聽器
    onValue(roomRef, handleRoomChange);
    
    // 設置定期勝利檢查 - 雙保險
    gameRef.current.checkVictoryTimerId = setInterval(async () => {
      try {
        // 獲取最新房間數據
        const snapshot = await get(roomRef);
        
        if (snapshot.exists()) {
          const roomData = snapshot.val();
          
          // 只在遊戲進行中且無勝利者時檢查
          if (roomData.status === '遊戲中' && !roomData.winner && roomData.players) {
            const playerList = Object.keys(roomData.players).map(name => ({
              name,
              score: Number(roomData.players[name].score || 0)
            }));
            
            const winningPlayer = checkWinner(playerList);
            
            if (winningPlayer) {
              console.log(`🏆 計時器檢查發現勝利玩家: ${winningPlayer.name} (${winningPlayer.score}分)`);
              
              // 更新房間狀態
              await set(roomRef, {
                ...roomData,
                status: '遊戲結束',
                winner: winningPlayer.name,
                lastActivity: serverTimestamp()
              });
            }
          }
        }
      } catch (error) {
        console.error("❌ 勝利檢查錯誤:", error);
      }
    }, 3000);
    
    // 初始一次檢查
    get(roomRef).then(snapshot => {
      if (snapshot.exists()) {
        const roomData = snapshot.val();
        
        // 如果已經有勝利者，確保本地狀態同步
        if (roomData.winner && roomData.status === '遊戲結束') {
          console.log(`🏆 初始檢查發現勝利者: ${roomData.winner}`);
          setWinner(roomData.winner);
          setGameStatus('遊戲結束');
        }
      }
    }).catch(error => {
      console.error("❌ 初始檢查錯誤:", error);
    });
    
    // 清理函數
    return () => {
      console.log("🔄 清理房間監聽和計時器");
      clearAllTimers();
      off(roomRef);
    };
  }, [roomId, playerName, currentPlayer, winner]);
  
  // 返回需要的狀態和函數
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