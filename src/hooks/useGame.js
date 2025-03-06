// src/hooks/useGame.js
import { useState, useEffect, useCallback } from 'react';
import { initializeApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  doc, 
  onSnapshot, 
  updateDoc, 
  getDoc, 
  getDocs, 
  writeBatch,
  setDoc
} from 'firebase/firestore';

// 使用已經初始化的 Firebase 應用
let db;
try {
  // 從全局獲取
  const app = initializeApp();
  db = getFirestore(app);
  console.log("Firebase 初始化成功");
} catch (error) {
  console.error("Firebase 已經初始化或初始化失敗:", error);
  // 嘗試獲取已初始化的實例
  db = getFirestore();
}

export const useGame = (roomId, playerName) => {
  console.log("useGame 被調用, roomId:", roomId, "playerName:", playerName);
  
  // 遊戲狀態
  const [gameStatus, setGameStatus] = useState('等待中');
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [currentPlayer, setCurrentPlayer] = useState(null);
  const [players, setPlayers] = useState([]);
  const [winner, setWinner] = useState(null);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [questions, setQuestions] = useState([]);
  const [error, setError] = useState(null);
  
  // 調試用 - 手動啟動遊戲
  const startGame = useCallback(async () => {
    if (!roomId) {
      console.error("沒有 roomId，無法啟動遊戲");
      return;
    }
    
    try {
      console.log("嘗試手動啟動遊戲...");
      const roomRef = doc(db, 'rooms', roomId);
      
      // 獲取或創建房間
      const roomSnapshot = await getDoc(roomRef);
      
      if (!roomSnapshot.exists()) {
        console.log("房間不存在，創建新房間");
        
        // 創建默認問題
        const defaultQuestions = [
          {
            question: '元素符號 "H" 代表哪種元素?',
            options: ['氦', '氫', '汞', '鉿'],
            correctAnswer: 1
          },
          {
            question: '元素符號 "He" 代表哪種元素?',
            options: ['鋰', '氦', '氫', '釕'],
            correctAnswer: 1
          },
          {
            question: '元素符號 "Li" 代表哪種元素?',
            options: ['鐳', '鋰', '鉛', '鑭'],
            correctAnswer: 1
          },
          {
            question: '元素符號 "Be" 代表哪種元素?',
            options: ['硼', '鈹', '鋇', '釙'],
            correctAnswer: 1
          },
          {
            question: '元素符號 "B" 代表哪種元素?',
            options: ['硼', '鋇', '溴', '鉍'],
            correctAnswer: 0
          }
        ];
        
        // 創建房間文檔
        await setDoc(roomRef, {
          status: '遊戲中',
          currentPlayer: null,
          winner: null,
          questionIndex: 0,
          questions: defaultQuestions,
          createdBy: playerName,
          createdAt: new Date().toISOString()
        });
        
        // 創建玩家文檔
        const playerRef = doc(db, 'rooms', roomId, 'players', playerName);
        await setDoc(playerRef, {
          name: playerName,
          score: 0,
          joinedAt: new Date().toISOString()
        });
        
        console.log("已創建房間和玩家");
      } else {
        // 房間已存在，更新狀態
        console.log("房間已存在，更新狀態為遊戲中");
        await updateDoc(roomRef, {
          status: '遊戲中',
          winner: null
        });
        
        // 確保玩家存在
        const playerRef = doc(db, 'rooms', roomId, 'players', playerName);
        const playerSnapshot = await getDoc(playerRef);
        
        if (!playerSnapshot.exists()) {
          console.log("新增玩家:", playerName);
          await setDoc(playerRef, {
            name: playerName,
            score: 0,
            joinedAt: new Date().toISOString()
          });
        }
      }
    } catch (error) {
      console.error("啟動遊戲時發生錯誤:", error);
      setError(`啟動遊戲錯誤: ${error.message}`);
    }
  }, [roomId, playerName]);
  
  // 監聽房間狀態
  useEffect(() => {
    if (!roomId) {
      console.log("沒有 roomId，不監聽房間");
      return;
    }
    
    console.log("開始監聽房間:", roomId);
    const roomRef = doc(db, 'rooms', roomId);
    
    const unsubscribe = onSnapshot(roomRef, (snapshot) => {
      if (snapshot.exists()) {
        const roomData = snapshot.data();
        console.log("收到房間數據:", roomData);
        
        setGameStatus(roomData.status || '等待中');
        setCurrentPlayer(roomData.currentPlayer || null);
        setWinner(roomData.winner || null);
        setQuestionIndex(roomData.questionIndex || 0);
        
        // 如果有問題資料，設置當前問題
        if (roomData.questions && roomData.questions.length > 0) {
          console.log(`收到 ${roomData.questions.length} 個問題`);
          setQuestions(roomData.questions);
          if (roomData.questionIndex !== undefined && roomData.questionIndex < roomData.questions.length) {
            console.log(`設置當前問題 #${roomData.questionIndex}`);
            setCurrentQuestion(roomData.questions[roomData.questionIndex]);
          } else {
            console.warn(`問題索引無效: ${roomData.questionIndex}`);
          }
        } else {
          console.warn("房間中沒有問題數據");
        }
      } else {
        console.log("房間不存在，可能需要創建");
      }
    }, (err) => {
      console.error("監聽房間時發生錯誤:", err);
      setError(`監聽房間錯誤: ${err.message}`);
    });
    
    return () => {
      console.log("停止監聽房間");
      unsubscribe();
    };
  }, [roomId]);
  
  // 監聽玩家狀態
  useEffect(() => {
    if (!roomId) {
      console.log("沒有 roomId，不監聽玩家");
      return;
    }
    
    console.log("開始監聽玩家集合");
    const playersRef = collection(db, 'rooms', roomId, 'players');
    
    const unsubscribe = onSnapshot(playersRef, (snapshot) => {
      const playersData = [];
      snapshot.forEach((doc) => {
        playersData.push({ id: doc.id, ...doc.data() });
      });
      
      console.log(`收到 ${playersData.length} 個玩家數據:`, playersData);
      setPlayers(playersData);
      
      // 檢查是否有玩家達到勝利條件 (20分)
      const winningPlayer = playersData.find(player => player.score >= 20);
      if (winningPlayer && gameStatus !== '遊戲結束') {
        console.log(`玩家 ${winningPlayer.name} 達到勝利條件，得分: ${winningPlayer.score}`);
        // 確保設置獲勝者並更新遊戲狀態
        const roomRef = doc(db, 'rooms', roomId);
        updateDoc(roomRef, {
          status: '遊戲結束',
          winner: winningPlayer.name
        }).catch(error => console.error('更新遊戲狀態錯誤:', error));
      }
    }, (err) => {
      console.error("監聽玩家集合時發生錯誤:", err);
      setError(`監聽玩家錯誤: ${err.message}`);
    });
    
    return () => {
      console.log("停止監聽玩家集合");
      unsubscribe();
    };
  }, [roomId, gameStatus]);
  
  // 搶答功能
  const quickAnswer = useCallback(async () => {
    if (!roomId || !playerName || currentPlayer) {
      console.log("搶答條件不滿足:", { roomId, playerName, currentPlayer });
      return;
    }
    
    try {
      console.log(`玩家 ${playerName} 嘗試搶答`);
      const roomRef = doc(db, 'rooms', roomId);
      await updateDoc(roomRef, {
        currentPlayer: playerName
      });
      console.log("搶答成功");
    } catch (error) {
      console.error('搶答時發生錯誤:', error);
      setError(`搶答錯誤: ${error.message}`);
    }
  }, [roomId, playerName, currentPlayer]);
  
  // 檢查答案
  const checkAnswer = useCallback(async (selectedIndex) => {
    if (!roomId || !playerName || currentPlayer !== playerName || !currentQuestion) {
      console.log("檢查答案條件不滿足:", { 
        roomId, 
        playerName, 
        currentPlayer, 
        hasCurrentQuestion: !!currentQuestion 
      });
      return;
    }
    
    try {
      console.log(`玩家 ${playerName} 選擇答案索引 ${selectedIndex}`);
      const roomRef = doc(db, 'rooms', roomId);
      const playerRef = doc(db, 'rooms', roomId, 'players', playerName);
      
      // 檢查答案是否正確
      const isCorrect = selectedIndex === currentQuestion.correctAnswer;
      console.log(`答案${isCorrect ? '正確' : '錯誤'}`);
      
      if (isCorrect) {
        // 增加分數
        const playerSnapshot = await getDoc(playerRef);
        const currentScore = playerSnapshot.exists() ? (playerSnapshot.data().score || 0) : 0;
        const newScore = currentScore + 1;
        
        console.log(`增加得分，從 ${currentScore} 到 ${newScore}`);
        await updateDoc(playerRef, { score: newScore });
        
        // 檢查是否達到勝利條件
        if (newScore >= 20) {
          console.log(`玩家 ${playerName} 達到勝利分數閾值`);
          // 確保設置遊戲狀態為結束，並設置獲勝者
          await updateDoc(roomRef, {
            status: '遊戲結束',
            winner: playerName,
            currentPlayer: null
          });
        } else {
          // 進入下一題
          const nextQuestionIndex = questionIndex + 1;
          if (nextQuestionIndex < questions.length) {
            console.log(`進入下一題 #${nextQuestionIndex}`);
            await updateDoc(roomRef, {
              questionIndex: nextQuestionIndex,
              currentPlayer: null
            });
          } else {
            // 問題用完，遊戲結束
            console.log("問題用完，遊戲結束");
            await updateDoc(roomRef, {
              status: '遊戲結束',
              currentPlayer: null
            });
          }
        }
      } else {
        // 答錯，清空當前玩家
        console.log("答錯，清空當前玩家");
        await updateDoc(roomRef, {
          currentPlayer: null
        });
      }
    } catch (error) {
      console.error('檢查答案時發生錯誤:', error);
      setError(`檢查答案錯誤: ${error.message}`);
    }
  }, [roomId, playerName, currentPlayer, currentQuestion, questionIndex, questions]);
  
  // 重新開始遊戲
  const restartGame = useCallback(async () => {
    if (!roomId) {
      console.log("沒有 roomId，無法重新開始遊戲");
      return;
    }
    
    try {
      console.log("嘗試重新開始遊戲");
      const playersSnapshot = await getDocs(collection(db, 'rooms', roomId, 'players'));
      const batch = writeBatch(db);
      
      // 重置所有玩家分數
      playersSnapshot.forEach(doc => {
        console.log(`重置玩家 ${doc.id} 的分數`);
        const playerRef = doc.ref;
        batch.update(playerRef, { score: 0 });
      });
      
      // 更新房間狀態
      const roomRef = doc(db, 'rooms', roomId);
      batch.update(roomRef, {
        status: '遊戲中',
        currentPlayer: null,
        winner: null,
        questionIndex: 0
      });
      
      await batch.commit();
      console.log("遊戲已重新開始");
    } catch (error) {
      console.error('重新開始遊戲時發生錯誤:', error);
      setError(`重新開始遊戲錯誤: ${error.message}`);
    }
  }, [roomId]);
  
  // 結束遊戲
  const endGame = useCallback(async () => {
    if (!roomId) {
      console.log("沒有 roomId，無法結束遊戲");
      return;
    }
    
    try {
      console.log("嘗試結束遊戲");
      const roomRef = doc(db, 'rooms', roomId);
      await updateDoc(roomRef, {
        status: '等待中',
        currentPlayer: null,
        winner: null
      });
      console.log("遊戲已結束，狀態設為等待中");
    } catch (error) {
      console.error('結束遊戲時發生錯誤:', error);
      setError(`結束遊戲錯誤: ${error.message}`);
    }
  }, [roomId]);
  
  // 檢查當前狀態
  useEffect(() => {
    console.log("遊戲狀態更新:", {
      gameStatus,
      hasCurrentQuestion: !!currentQuestion,
      currentPlayer,
      winner,
      questionIndex,
      questionsCount: questions.length,
      playersCount: players.length
    });
  }, [gameStatus, currentQuestion, currentPlayer, winner, questionIndex, questions, players]);
  
  return {
    gameStatus,
    currentQuestion,
    currentPlayer,
    winner,
    players,
    questions, // 確保返回問題數組
    quickAnswer,
    checkAnswer,
    restartGame,
    endGame,
    startGame, // 新增：手動啟動遊戲功能
    error      // 新增：錯誤信息
  };
};