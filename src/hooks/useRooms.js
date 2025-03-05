// src/hooks/useRooms.js
import { useState, useEffect } from 'react';
import { ref, push, set, onValue, update, remove } from 'firebase/database';
import { database } from '../firebase';

export const useRooms = (playerName) => {
  const [rooms, setRooms] = useState([]);
  const [currentRoom, setCurrentRoom] = useState(null);
  const [loading, setLoading] = useState(true);

  // 監聽房間變化
  useEffect(() => {
    const roomsRef = ref(database, 'rooms');
    
    const unsubscribe = onValue(roomsRef, (snapshot) => {
      const data = snapshot.val();
      const roomList = [];
      
      if (data) {
        Object.keys(data).forEach((key) => {
          roomList.push({ 
            id: key, 
            ...data[key],
            // 將players物件轉換為數組以便渲染
            playerArray: data[key].players ? Object.keys(data[key].players).map(playerKey => ({
              name: playerKey,
              score: data[key].players[playerKey].score
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
        }
      }
    });

    return () => unsubscribe();
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
      createdAt: Date.now(),
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
      return selectedRoom;
    }
    
    const playerRef = ref(database, `rooms/${roomId}/players/${playerName}`);
    set(playerRef, { score: 0 });
    
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
    
    if (currentRoom.playerArray.length < 2) {
      alert('至少需要2名玩家才能開始遊戲');
      return;
    }
    
    if (currentRoom.host !== playerName) {
      alert('只有房主可以開始遊戲');
      return;
    }
    
    const roomRef = ref(database, `rooms/${currentRoom.id}`);
    update(roomRef, { status: '遊戲中' });
    
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
    startGame
  };
};