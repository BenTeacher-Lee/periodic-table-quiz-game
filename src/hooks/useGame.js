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