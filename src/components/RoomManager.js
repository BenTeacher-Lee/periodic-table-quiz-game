// src/components/RoomManager.js
import React, { useState, useEffect, useRef } from 'react';
import { useRooms } from '../hooks/useRooms';
import GameArea from './GameArea';

const RoomManager = ({ onManageQuestions }) => {
  const [playerName, setPlayerName] = useState('');
  const [roomName, setRoomName] = useState('');
  const [isNameSet, setIsNameSet] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const scoreAnimationRef = useRef(null);

  // 在組件初始化時，從localStorage檢查是否有保存的暱稱
  useEffect(() => {
    const savedName = localStorage.getItem('playerName');
    if (savedName) {
      setPlayerName(savedName);
      setIsNameSet(true);
    }
  }, []);

  // 使用空字串作為預設值，而不是在條件語句中使用 Hook
  const { 
    rooms, 
    currentRoom, 
    loading, 
    createRoom, 
    joinRoom, 
    leaveRoom, 
    startGame 
  } = useRooms(playerName || '');

  // 分類房間
  const waitingRooms = rooms.filter(room => room.status === '等待中');
  const playingRooms = rooms.filter(room => room.status === '遊戲中');

  // 驗證玩家名稱
  const validatePlayerName = () => {
    const nameRegex = /^[a-zA-Z\u4e00-\u9fa5]{1,16}$/;
    if (nameRegex.test(playerName)) {
      localStorage.setItem('playerName', playerName);
      setIsNameSet(true);
    } else {
      alert('暱稱只能包含中文或英文，且長度不超過16字元');
    }
  };

  // 創建新房間
  const handleCreateRoom = () => {
    if (!isNameSet) return;
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

  // 加入房間
  const handleJoinRoom = (roomId) => {
    if (!isNameSet) return;
    joinRoom(roomId);
  };

  // 離開房間
  const handleLeaveRoom = () => {
    if (!isNameSet) return;
    leaveRoom();
  };

  // 開始遊戲
  const handleStartGame = () => {
    if (!isNameSet) return;
    startGame();
  };
  
  // 登出功能
  const handleLogout = () => {
    localStorage.removeItem('playerName');
    setPlayerName('');
    setIsNameSet(false);
    if (currentRoom) {
      leaveRoom();
    }
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
          <h2 className="text-2xl font-bold mb-4 text-center">設定暱稱</h2>
          <input 
            type="text" 
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            placeholder="請輸入暱稱" 
            className="w-full p-3 mb-6 border rounded-lg text-lg"
          />
          <button 
            onClick={validatePlayerName}
            className="w-full bg-green-500 text-white p-3 rounded-lg text-lg font-bold hover:bg-green-600 transition shadow-md"
          >
            確認暱稱
          </button>
        </div>
      </div>
    );
  }

  // 正在加載房間
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-2xl font-bold text-gray-700">載入中...</div>
      </div>
    );
  }

  // 在房間中但未開始遊戲
  if (currentRoom) {
    return (
      <div className="container mx-auto p-4">
        <div className="flex justify-end mb-4">
          <button 
            onClick={onManageQuestions}
            className="bg-blue-500 text-white px-4 py-2 rounded-lg font-bold mr-2 shadow-md hover:bg-blue-600 transition"
          >
            題目管理
          </button>
          <button 
            onClick={handleLogout}
            className="bg-red-500 text-white px-4 py-2 rounded-lg font-bold shadow-md hover:bg-red-600 transition"
          >
            登出
          </button>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-lg">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-3xl font-bold">房間：{currentRoom.name}</h2>
          </div>
          
          <div className="mb-6">
            <h3 className="text-xl font-bold mb-4">玩家列表</h3>
            <div className="space-y-3">
              {currentRoom.playerArray && currentRoom.playerArray.map((player, index) => (
                <div 
                  key={index} 
                  className="flex justify-between items-center p-4 border-b border-gray-200"
                >
                  <span className="text-xl">
                    {player.name} 
                    {player.name === currentRoom.host && <span className="ml-2 text-blue-500 font-bold">(房主)</span>}
                  </span>
                  <span className="text-xl font-bold">分數：{player.score}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex space-x-4">
            <button 
              onClick={handleLeaveRoom}
              className="flex-1 bg-red-500 text-white p-3 rounded-lg text-lg font-bold hover:bg-red-600 transition shadow-md"
            >
              離開房間
            </button>
            {currentRoom.playerArray && currentRoom.playerArray.length >= 2 && currentRoom.host === playerName && (
              <button 
                onClick={handleStartGame}
                className="flex-1 bg-green-500 text-white p-3 rounded-lg text-lg font-bold hover:bg-green-600 transition shadow-md"
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
      <div className="flex justify-end mb-4">
        <button 
          onClick={onManageQuestions}
          className="bg-blue-500 text-white px-4 py-2 rounded-lg font-bold mr-2 shadow-md hover:bg-blue-600 transition"
        >
          題目管理
        </button>
        <button 
          onClick={handleLogout}
          className="bg-red-500 text-white px-4 py-2 rounded-lg font-bold shadow-md hover:bg-red-600 transition"
        >
          登出
        </button>
      </div>
      
      <div className="bg-white p-6 rounded-lg shadow-lg">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold">歡迎, {playerName}!</h2>
          <p className="text-gray-600 mt-2">您可以創建新房間或加入現有房間</p>
        </div>
        
        {/* 創建房間 */}
        <div className="mb-10">
          <h3 className="text-2xl font-bold mb-4 text-center">創建新房間</h3>
          <div className="flex">
            <input 
              type="text" 
              value={roomName}
              onChange={(e) => setRoomName(e.target.value)}
              placeholder="輸入房間名稱" 
              className="flex-grow p-3 border rounded-l-lg text-lg"
            />
            <button 
              onClick={handleCreateRoom}
              className="bg-blue-500 text-white px-6 py-3 rounded-r-lg text-lg font-bold hover:bg-blue-600 transition"
            >
              創建
            </button>
          </div>
        </div>

        {/* 等待中房間列表 */}
        <div className="mb-8">
          <h3 className="text-2xl font-bold mb-4 text-center">等待中房間</h3>
          {waitingRooms.length === 0 ? (
            <p className="text-center text-gray-500 text-lg">目前沒有等待中的房間</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {waitingRooms.map(room => (
                <div 
                  key={room.id} 
                  className="border rounded-lg p-6 bg-white shadow-md hover:shadow-lg transition"
                >
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="text-xl font-bold">{room.name}</h4>
                    <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-semibold">
                      {room.playerArray ? room.playerArray.length : 0}/4 人
                    </span>
                  </div>
                  <div className="text-gray-600 mb-4">
                    <p>房主：{room.host}</p>
                    <p>狀態：等待中</p>
                  </div>
                  <button 
                    onClick={() => handleJoinRoom(room.id)}
                    disabled={!room.playerArray || room.playerArray.length >= 4}
                    className={`w-full p-3 rounded-lg text-lg font-bold ${
                      !room.playerArray || room.playerArray.length >= 4
                        ? 'bg-gray-300 cursor-not-allowed' 
                        : 'bg-green-500 text-white hover:bg-green-600 transition shadow-md'
                    }`}
                  >
                    {!room.playerArray || room.playerArray.length >= 4 ? '房間已滿' : '加入'}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 遊戲中房間列表 */}
        <div>
          <h3 className="text-2xl font-bold mb-4 text-center">遊戲進行中房間</h3>
          {playingRooms.length === 0 ? (
            <p className="text-center text-gray-500 text-lg">目前沒有進行中的房間</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {playingRooms.map(room => (
                <div 
                  key={room.id} 
                  className="border rounded-lg p-6 bg-gray-50 shadow-md"
                >
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="text-xl font-bold">{room.name}</h4>
                    <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-semibold">
                      {room.playerArray ? room.playerArray.length : 0}/4 人
                    </span>
                  </div>
                  <div className="text-gray-600 mb-4">
                    <p>房主：{room.host}</p>
                    <p>狀態：遊戲進行中</p>
                  </div>
                  <button 
                    disabled
                    className="w-full p-3 rounded-lg text-lg font-bold bg-gray-300 cursor-not-allowed"
                  >
                    遊戲進行中
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