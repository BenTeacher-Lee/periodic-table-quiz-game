// src/hooks/useRooms.js
import { useState, useEffect, useRef } from 'react';
import { ref, push, set, onValue, update, remove, serverTimestamp, get } from 'firebase/database';
import { database } from '../firebase';

export const useRooms = (playerName) => {
  const [rooms, setRooms] = useState([]);
  const [currentRoom, setCurrentRoom] = useState(null);
  const [loading, setLoading] = useState(true);
  const activityTimerRef = useRef(null);
  const INACTIVE_TIMEOUT = 180000; // 3分鐘 = 180000毫秒

  // 更新房間的最後活動時間
  const updateLastActivity = (roomId) => {
    if (!roomId) return;
    
    const roomRef = ref(database, `rooms/${roomId}`);
    update(roomRef, { 
      lastActivity: serverTimestamp() 
    });
  };

  // 監聽房間變化
  useEffect(() => {
    const roomsRef = ref(database, 'rooms');
    
    const unsubscribe = onValue(roomsRef, (snapshot) => {
      const data = snapshot.val();
      const roomList = [];
      
      if (data) {
        // 檢查並清理閒置房間
        Object.keys(data).forEach((key) => {
          const room = data[key];
          
          // 檢查房間最後活動時間
          if (room.lastActivity) {
            const lastActivity = new Date(room.lastActivity);
            const now = new Date();
            const timeDiff = now - lastActivity;
            
            // 如果房間超過3分鐘沒有活動，自動清理
            if (timeDiff > INACTIVE_TIMEOUT) {
              // 刪除此房間
              const inactiveRoomRef = ref(database, `rooms/${key}`);
              remove(inactiveRoomRef);
              return;
            }
          }
          
          roomList.push({ 
            id: key, 
            ...room,
            // 將players物件轉換為數組以便渲染
            playerArray: room.players ? Object.keys(room.players).map(playerKey => ({
              name: playerKey,
              score: room.players[playerKey].score
            })) : []
          });
        });
      }
      
      setRooms(roomList);
      setLoading(false);
      
      // 如果在房間列表中找到用戶當前所在的房間，更新currentRoom
      if (currentRoom) {
        const updatedCurrentRoom = roomList.find(room => room.id === currentRoom.id);
        if (updatedCurrentRoom) {
          setCurrentRoom(updatedCurrentRoom);
        } else {
          // 如果找不到當前房間，表示房間可能已被刪除
          setCurrentRoom(null);
        }
      }
    });

    return () => unsubscribe();
  }, [currentRoom]);

  // 設置活動檢測計時器
  useEffect(() => {
    if (currentRoom) {
      // 清除舊的計時器
      if (activityTimerRef.current) {
        clearInterval(activityTimerRef.current);
      }
      
      // 初始更新活動時間
      updateLastActivity(currentRoom.id);
      
      // 設置定時更新活動時間的計時器
      activityTimerRef.current = setInterval(() => {
        updateLastActivity(currentRoom.id);
      }, 60000); // 每分鐘更新一次
    } else {
      // 如果不在房間中，清除計時器
      if (activityTimerRef.current) {
        clearInterval(activityTimerRef.current);
        activityTimerRef.current = null;
      }
    }
    
    // 組件卸載時清除計時器
    return () => {
      if (activityTimerRef.current) {
        clearInterval(activityTimerRef.current);
      }
    };
  }, [currentRoom]);

  // 創建新房間
  const createRoom = (roomName) => {
    if (!roomName.trim() || !playerName.trim()) {
      return null;
    }

    const roomsRef = ref(database, 'rooms');
    const newRoomRef = push(roomsRef);
    
    const roomData = {
      name: roomName,
      host: playerName,
      status: '等待中',
      createdAt: serverTimestamp(),
      lastActivity: serverTimestamp(),
      players: {
        [playerName]: { 
          score: 0 
        }
      }
    };

    set(newRoomRef, roomData);
    
    const newRoom = { 
      id: newRoomRef.key, 
      ...roomData,
      playerArray: [{ name: playerName, score: 0 }]
    };
    
    setCurrentRoom(newRoom);
    return newRoom;
  };

  // 加入房間
  const joinRoom = (roomId) => {
    const selectedRoom = rooms.find(room => room.id === roomId);
    
    if (!selectedRoom) return null;
    
    // 檢查房間是否已滿
    if (selectedRoom.playerArray && selectedRoom.playerArray.length >= 4) {
      alert('該房間已滿');
      return null;
    }
    
    // 檢查玩家是否已在房間中
    if (selectedRoom.players && selectedRoom.players[playerName]) {
      setCurrentRoom(selectedRoom);
      updateLastActivity(roomId);
      return selectedRoom;
    }
    
    // 新玩家加入房間
    const playerRef = ref(database, `rooms/${roomId}/players/${playerName}`);
    set(playerRef, { score: 0 });
    
    // 更新最後活動時間
    updateLastActivity(roomId);
    
    setCurrentRoom(selectedRoom);
    return selectedRoom;
  };

  // 離開房間
  const leaveRoom = () => {
    if (!currentRoom) return;
    
    const playerRef = ref(database, `rooms/${currentRoom.id}/players/${playerName}`);
    remove(playerRef);
    
    // 檢查是否是最後一名玩家
    const remainingPlayers = currentRoom.playerArray.filter(p => p.name !== playerName);
    if (remainingPlayers.length === 0) {
      // 如果是最後一名玩家，刪除整個房間
      const roomRef = ref(database, `rooms/${currentRoom.id}`);
      remove(roomRef);
    } else if (currentRoom.host === playerName) {
      // 如果是房主離開，設置新房主
      const roomRef = ref(database, `rooms/${currentRoom.id}`);
      update(roomRef, { 
        host: remainingPlayers[0].name 
      });
    }
    
    setCurrentRoom(null);
  };

  // 開始遊戲
  const startGame = () => {
    if (!currentRoom) return;
    
    // 修改此處，允許1人開始遊戲
    if (currentRoom.playerArray.length < 1) {
      alert('至少需要1名玩家才能開始遊戲');
      return;
    }
    
    if (currentRoom.host !== playerName) {
      alert('只有房主可以開始遊戲');
      return;
    }
    
    const roomRef = ref(database, `rooms/${currentRoom.id}`);
    update(roomRef, { 
      status: '遊戲中',
      lastActivity: serverTimestamp()
    });
    
    // 添加一個默認問題開始遊戲
    update(roomRef, {
      currentQuestion: {
        question: '氫元素在元素週期表中的原子序數為多少？',
        options: ['1', '2', '3', '4'],
        correctAnswer: 0
      },
      currentPlayer: null
    });
  };

  return {
    rooms,
    currentRoom,
    loading,
    createRoom,
    joinRoom,
    leaveRoom,
    startGame,
    updateLastActivity
  };
};