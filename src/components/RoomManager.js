// src/components/RoomManager.js
import React, { useState } from 'react';
import { useRooms } from '../hooks/useRooms';
import GameArea from './GameArea';

const RoomManager = () => {
  const [playerName, setPlayerName] = useState('');
  const [roomName, setRoomName] = useState('');
  const [isNameSet, setIsNameSet] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  // 只有在用戶設置名稱後才初始化useRooms
  const { 
    rooms, 
    currentRoom, 
    loading, 
    createRoom, 
    joinRoom, 
    leaveRoom, 
    startGame 
  } = isNameSet ? useRooms(playerName) : {};

  // 驗證玩家名稱
  const validatePlayerName = () => {
    const nameRegex = /^[a-zA-Z\u4e00-\u9fa5]{1,16}$/;
    if (nameRegex.test(playerName)) {
      setIsNameSet(true);
    } else {
      alert('暱稱只能包含中文或英文，且長度不超過16字元');
    }
  };

  // 創建新房間
  const handleCreateRoom = () => {
    if (!roomName.trim()) {
      alert('請輸入房間名稱');
      return;
    }
    createRoom(roomName);
    setRoomName('');
  };

  // 遊戲結束回調
  const handleGameEnd = () => {
    setIsPlaying(false);
  };

  // 顯示遊戲區域
  if (isNameSet && currentRoom && currentRoom.status === '遊戲中') {
    return <GameArea roomId={currentRoom.id} playerName={playerName} onGameEnd={handleGameEnd} />;
  }

  // 如果尚未設置名稱
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

  // 正在加載房間
  if (loading) {
    return <div className="text-center p-8">載入中...</div>;
  }

  // 在房間中但未開始遊戲
  if (currentRoom) {
    return (
      <div className="container mx-auto p-4">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-2xl font-bold mb-4">房間：{currentRoom.name}</h2>
          
          <div className="mb-4">
            <h3 className="text-lg font-semibold">玩家列表</h3>
            {currentRoom.playerArray.map((player, index) => (
              <div 
                key={index} 
                className="flex justify-between items-center p-2 border-b"
              >
                <span>
                  {player.name} 
                  {player.name === currentRoom.host && <span className="ml-2 text-blue-500">(房主)</span>}
                </span>
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
            {currentRoom.playerArray.length >= 2 && currentRoom.host === playerName && (
              <button 
                onClick={startGame}
                className="flex-1 bg-green-500 text-white p-2 rounded hover:bg-green-600"
              >
                開始遊戲
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // 房間列表
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
              value={roomName}
              onChange={(e) => setRoomName(e.target.value)}
              placeholder="輸入房間名稱" 
              className="flex-grow p-2 border rounded-l"
            />
            <button 
              onClick={handleCreateRoom}
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
                      {room.playerArray.length}/4 人
                    </span>
                  </div>
                  <div className="text-sm mb-2">
                    房主：{room.host}
                  </div>
                  <div className="text-sm mb-2">
                    狀態：{room.status}
                  </div>
                  <button 
                    onClick={() => joinRoom(room.id)}
                    disabled={room.playerArray.length >= 4 || room.status !== '等待中'}
                    className={`w-full p-2 rounded ${
                      room.playerArray.length >= 4 || room.status !== '等待中'
                        ? 'bg-gray-300 cursor-not-allowed' 
                        : 'bg-green-500 text-white hover:bg-green-600'
                    }`}
                  >
                    {room.playerArray.length >= 4 
                      ? '房間已滿' 
                      : room.status !== '等待中'
                        ? '遊戲進行中'
                        : '加入'}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RoomManager;