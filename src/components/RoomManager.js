import React, { useState, useEffect } from 'react';

// 房間管理組件
const RoomManager = () => {
  const [playerName, setPlayerName] = useState('');
  const [rooms, setRooms] = useState([]);
  const [currentRoom, setCurrentRoom] = useState(null);
  const [isNameSet, setIsNameSet] = useState(false);

  // 生成唯一房間ID
  const generateRoomId = () => {
    return Math.random().toString(36).substr(2, 9);
  };

  // 驗證玩家名稱
  const validatePlayerName = () => {
    const nameRegex = /^[a-zA-Z\u4e00-\u9fa5]{1,16}$/;
    if (nameRegex.test(playerName)) {
      setIsNameSet(true);
    } else {
      alert('暱稱只能包含中文或英文，且長度不超過16字元');
    }
  };

  // 創建房間
  const createRoom = (roomName) => {
    if (!roomName.trim()) {
      alert('請輸入房間名稱');
      return;
    }

    const newRoom = {
      id: generateRoomId(),
      name: roomName,
      host: playerName,
      players: [{ name: playerName, score: 0 }],
      status: '等待中'
    };

    setRooms([...rooms, newRoom]);
    setCurrentRoom(newRoom);
  };

  // 加入房間
  const joinRoom = (room) => {
    if (room.players.length >= 4) {
      alert('該房間已滿');
      return;
    }

    const updatedRoom = {
      ...room,
      players: [...room.players, { name: playerName, score: 0 }]
    };

    const updatedRooms = rooms.map(r => 
      r.id === room.id ? updatedRoom : r
    );

    setRooms(updatedRooms);
    setCurrentRoom(updatedRoom);
  };

  // 離開房間
  const leaveRoom = () => {
    if (!currentRoom) return;

    const updatedRooms = rooms.map(room => {
      if (room.id === currentRoom.id) {
        return {
          ...room,
          players: room.players.filter(p => p.name !== playerName)
        };
      }
      return room;
    }).filter(room => room.players.length > 0);

    setRooms(updatedRooms);
    setCurrentRoom(null);
  };

  // 如果還未設定名稱
  if (!isNameSet) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-blue-50">
        <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
          <h2 className="text-2xl mb-4 text-center">設定暱稱</h2>
          <input 
            type="text" 
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            placeholder="請輸入暱稱" 
            className="w-full p-2 mb-4 border rounded"
          />
          <button 
            onClick={validatePlayerName}
            className="w-full bg-green-500 text-white p-2 rounded hover:bg-green-600"
          >
            確認暱稱
          </button>
        </div>
      </div>
    );
  }

  // 當前未在房間中
  if (!currentRoom) {
    return (
      <div className="container mx-auto p-4">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-2xl font-bold mb-4">歡迎, {playerName}!</h2>
          
          {/* 創建房間 */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-2">創建新房間</h3>
            <div className="flex">
              <input 
                type="text" 
                id="newRoomName"
                placeholder="輸入房間名稱" 
                className="flex-grow p-2 border rounded-l"
              />
              <button 
                onClick={() => {
                  const roomNameInput = document.getElementById('newRoomName');
                  createRoom(roomNameInput.value);
                }}
                className="bg-blue-500 text-white p-2 rounded-r hover:bg-blue-600"
              >
                創建
              </button>
            </div>
          </div>

          {/* 房間列表 */}
          <div>
            <h3 className="text-lg font-semibold mb-2">可用房間</h3>
            {rooms.length === 0 ? (
              <p className="text-gray-500">目前沒有可用的房間</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {rooms.map(room => (
                  <div 
                    key={room.id} 
                    className="border rounded p-4 bg-gray-50 hover:bg-gray-100 transition"
                  >
                    <div className="flex justify-between items-center mb-2">
                      <h4 className="font-bold">{room.name}</h4>
                      <span className="text-sm text-gray-600">
                        {room.players.length}/4 人
                      </span>
                    </div>
                    <div className="text-sm mb-2">
                      房主：{room.host}
                    </div>
                    <button 
                      onClick={() => joinRoom(room)}
                      disabled={room.players.length >= 4}
                      className={`w-full p-2 rounded ${
                        room.players.length >= 4 
                          ? 'bg-gray-300 cursor-not-allowed' 
                          : 'bg-green-500 text-white hover:bg-green-600'
                      }`}
                    >
                      {room.players.length >= 4 ? '房間已滿' : '加入'}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // 在房間中
  return (
    <div className="container mx-auto p-4">
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-2xl font-bold mb-4">房間：{currentRoom.name}</h2>
        
        <div className="mb-4">
          <h3 className="text-lg font-semibold">玩家列表</h3>
          {currentRoom.players.map((player, index) => (
            <div 
              key={index} 
              className="flex justify-between items-center p-2 border-b"
            >
              <span>{player.name}</span>
              <span>分數：{player.score}</span>
            </div>
          ))}
        </div>

        <div className="flex space-x-4">
          <button 
            onClick={leaveRoom}
            className="flex-1 bg-red-500 text-white p-2 rounded hover:bg-red-600"
          >
            離開房間
          </button>
          {currentRoom.players.length >= 2 && (
            <button 
              className="flex-1 bg-green-500 text-white p-2 rounded hover:bg-green-600"
            >
              開始遊戲
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default RoomManager;