// src/hooks/useGame.js
import { useState, useEffect, useCallback } from 'react';
import firebase from 'firebase/app';
import 'firebase/firestore';

export const useGame = (roomId, playerName) => {
  // Firebase 實例
  const db = firebase.firestore();
  const firestore = firebase.firestore;
  
  // 遊戲狀態
  const [gameStatus, setGameStatus] = useState('等待中');
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [currentPlayer, setCurrentPlayer] = useState(null);
  const [players, setPlayers] = useState([]);
  const [winner, setWinner] = useState(null);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [questions, setQuestions] = useState([]);
  
  // 監聽房間狀態
  useEffect(() => {
    if (!roomId) return;
    
    const roomRef = db.collection('rooms').doc(roomId);
    
    const unsubscribe = roomRef.onSnapshot((doc) => {
      if (doc.exists) {
        const roomData = doc.data();
        setGameStatus(roomData.status || '等待中');
        setCurrentPlayer(roomData.currentPlayer || null);
        setWinner(roomData.winner || null);
        setQuestionIndex(roomData.questionIndex || 0);
        
        // 如果有問題資料，設置當前問題
        if (roomData.questions && roomData.questions.length > 0) {
          setQuestions(roomData.questions);
          if (roomData.questionIndex !== undefined && roomData.questionIndex < roomData.questions.length) {
            setCurrentQuestion(roomData.questions[roomData.questionIndex]);
          }
        }
      }
    });
    
    return () => unsubscribe();
  }, [roomId, db]);
  
  // 監聽玩家狀態
  useEffect(() => {
    if (!roomId) return;
    
    const playersRef = db.collection('rooms').doc(roomId).collection('players');
    
    const unsubscribe = playersRef.onSnapshot((snapshot) => {
      const playersData = [];
      snapshot.forEach((doc) => {
        playersData.push({ id: doc.id, ...doc.data() });
      });
      setPlayers(playersData);
      
      // 檢查是否有玩家達到勝利條件 (20分)
      const winningPlayer = playersData.find(player => player.score >= 20);
      if (winningPlayer && gameStatus !== '遊戲結束') {
        // 關鍵改進：確保設置獲勝者並更新遊戲狀態
        const roomRef = db.collection('rooms').doc(roomId);
        roomRef.update({
          status: '遊戲結束',
          winner: winningPlayer.name
        });
      }
    });
    
    return () => unsubscribe();
  }, [roomId, db, gameStatus]);
  
  // 搶答功能
  const quickAnswer = useCallback(async () => {
    if (!roomId || !playerName || currentPlayer) return;
    
    try {
      const roomRef = db.collection('rooms').doc(roomId);
      await roomRef.update({
        currentPlayer: playerName
      });
    } catch (error) {
      console.error('搶答時發生錯誤:', error);
    }
  }, [roomId, playerName, currentPlayer, db]);
  
  // 檢查答案
  const checkAnswer = useCallback(async (selectedIndex) => {
    if (!roomId || !playerName || currentPlayer !== playerName || !currentQuestion) return;
    
    try {
      const batch = firestore.batch();
      const roomRef = db.collection('rooms').doc(roomId);
      const playerRef = db.collection('rooms').doc(roomId).collection('players').doc(playerName);
      
      // 檢查答案是否正確
      const isCorrect = selectedIndex === currentQuestion.correctAnswer;
      
      if (isCorrect) {
        // 增加分數
        const playerDoc = await playerRef.get();
        const currentScore = playerDoc.exists ? (playerDoc.data().score || 0) : 0;
        const newScore = currentScore + 1;
        
        batch.update(playerRef, { score: newScore });
        
        // 改進：檢查是否達到勝利條件
        if (newScore >= 20) {
          // 關鍵：確保設置遊戲狀態為結束，並設置獲勝者
          batch.update(roomRef, {
            status: '遊戲結束',
            winner: playerName,
            currentPlayer: null
          });
        } else {
          // 進入下一題
          const nextQuestionIndex = questionIndex + 1;
          if (nextQuestionIndex < questions.length) {
            batch.update(roomRef, {
              questionIndex: nextQuestionIndex,
              currentPlayer: null
            });
          } else {
            // 問題用完，遊戲結束
            batch.update(roomRef, {
              status: '遊戲結束',
              currentPlayer: null
            });
          }
        }
      } else {
        // 答錯，清空當前玩家
        batch.update(roomRef, {
          currentPlayer: null
        });
      }
      
      await batch.commit();
    } catch (error) {
      console.error('檢查答案時發生錯誤:', error);
    }
  }, [roomId, playerName, currentPlayer, currentQuestion, questionIndex, questions, db, firestore]);
  
  // 重新開始遊戲
  const restartGame = useCallback(async () => {
    if (!roomId) return;
    
    try {
      const batch = firestore.batch();
      const roomRef = db.collection('rooms').doc(roomId);
      
      // 重置所有玩家分數
      const playersSnapshot = await db.collection('rooms').doc(roomId).collection('players').get();
      playersSnapshot.forEach(doc => {
        batch.update(doc.ref, { score: 0 });
      });
      
      // 更新房間狀態
      batch.update(roomRef, {
        status: '遊戲中',
        currentPlayer: null,
        winner: null,
        questionIndex: 0
      });
      
      await batch.commit();
    } catch (error) {
      console.error('重新開始遊戲時發生錯誤:', error);
    }
  }, [roomId, db, firestore]);
  
  // 結束遊戲
  const endGame = useCallback(async () => {
    if (!roomId) return;
    
    try {
      const roomRef = db.collection('rooms').doc(roomId);
      await roomRef.update({
        status: '等待中',
        currentPlayer: null,
        winner: null
      });
    } catch (error) {
      console.error('結束遊戲時發生錯誤:', error);
    }
  }, [roomId, db]);
  
  return {
    gameStatus,
    currentQuestion,
    currentPlayer,
    winner,
    players,
    quickAnswer,
    checkAnswer,
    restartGame,
    endGame
  };
};