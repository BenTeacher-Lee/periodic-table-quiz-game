// src/components/RoomManager.js - 添加重置工具按鈕
import React, { useState, useEffect } from 'react';
import { useRooms } from '../hooks/useRooms';
import GameArea from './GameArea';
import Button from './ui/Button';
import Card, { CardHeader, CardBody, CardFooter } from './ui/Card';
import Badge from './ui/Badge';
import '../styles/components.css';
import '../styles/mobile.css';

const RoomManager = ({ onManageQuestions, onTestVictory, onFirebaseReset, isMobile }) => {
  const [playerName, setPlayerName] = useState('');
  const [roomName, setRoomName] = useState('');
  const [isNameSet, setIsNameSet] = useState(false);
  
  // 在組件初始化時，從localStorage檢查是否有保存的暱稱
  useEffect(() => {
    const savedName = localStorage.getItem('playerName');
    if (savedName) {
      setPlayerName(savedName);
      setIsNameSet(true);
    }
  }, []);

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

  // 遊戲結束回调
  const handleGameEnd = () => {};

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
    return <GameArea roomId={currentRoom.id} playerName={playerName} onGameEnd={handleGameEnd} isMobile={isMobile} />;
  }

  // 如果尚未設置名稱
  if (!isNameSet) {
    return (
      <div className="login-container">
        <div className="login-form">
          <h2 className="login-title">設定暱稱</h2>
          <input 
            type="text" 
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            placeholder="請輸入暱稱" 
            className="input"
            style={{ marginBottom: 'var(--space-lg)' }}
          />
          <Button 
            onClick={validatePlayerName}
            variant="secondary"
            isFullWidth
          >
            確認暱稱
          </Button>
        </div>
      </div>
    );
  }

  // 正在加載房間
  if (loading) {
    return (
      <div className="waiting-container">
        <div className="waiting-message">載入中...</div>
      </div>
    );
  }

  // 在房間中但未開始遊戲
  if (currentRoom) {
    return (
      <div className="room-container">
        {/* 移動端按鈕調整 - 改為底部固定樣式 */}
        {isMobile ? (
          <div className="action-buttons">
            <Button 
              onClick={onManageQuestions}
              variant="primary"
              size="sm"
            >
              題目管理
            </Button>
            <Button 
              onClick={onTestVictory}
              variant="primary"
              size="sm"
            >
              測試勝利
            </Button>
            <Button 
              onClick={onFirebaseReset}
              variant="warning"
              size="sm"
            >
              重置工具
            </Button>
            <Button 
              onClick={handleLogout}
              variant="danger"
              size="sm"
            >
              登出
            </Button>
          </div>
        ) : (
          // 桌面版頂部按鈕佈局
          <div style={{ position: 'absolute', top: '6rem', right: '2rem' }}>
            <Button 
              onClick={onManageQuestions}
              variant="primary"
              style={{ marginRight: 'var(--space-md)' }}
            >
              題目管理
            </Button>
            <Button 
              onClick={onTestVictory}
              variant="primary"
              style={{ marginRight: 'var(--space-md)' }}
            >
              測試勝利畫面
            </Button>
            <Button 
              onClick={onFirebaseReset}
              variant="warning"
              style={{ marginRight: 'var(--space-md)' }}
            >
              房間重置工具
            </Button>
            <Button 
              onClick={handleLogout}
              variant="danger"
            >
              登出
            </Button>
          </div>
        )}
        
        <Card style={{ marginTop: isMobile ? '1rem' : 'var(--space-lg)' }}>
          <CardHeader>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontSize: isMobile ? 'var(--text-lg)' : 'var(--text-2xl)', fontWeight: 'bold' }}>
                房間：{currentRoom.name}
              </h2>
            </div>
          </CardHeader>
          
          <CardBody>
            <h3 style={{ 
              fontSize: isMobile ? 'var(--text-base)' : 'var(--text-xl)', 
              fontWeight: 'bold', 
              marginBottom: isMobile ? 'var(--space-sm)' : 'var(--space-md)'
            }}>
              玩家列表
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
              {currentRoom.playerArray && currentRoom.playerArray.map((player, index) => (
                <div 
                  key={index} 
                  className="scoreboard-item"
                >
                  <span style={{ 
                    fontSize: isMobile ? 'var(--text-base)' : 'var(--text-lg)'
                  }}>
                    {player.name} 
                    {player.name === currentRoom.host && (
                      <Badge 
                        variant="primary" 
                        style={{ marginLeft: 'var(--space-sm)' }}
                      >
                        房主
                      </Badge>
                    )}
                  </span>
                  <span style={{ 
                    fontSize: isMobile ? 'var(--text-base)' : 'var(--text-lg)', 
                    fontWeight: 'bold' 
                  }}>
                    分數：{player.score}
                  </span>
                </div>
              ))}
            </div>
          </CardBody>

          <CardFooter style={{ display: 'flex', gap: 'var(--space-md)' }}>
            <Button 
              onClick={handleLeaveRoom}
              variant="danger"
              style={{ flex: 1 }}
            >
              離開房間
            </Button>
            {currentRoom.host === playerName && (
              <Button 
                onClick={handleStartGame}
                variant="secondary"
                style={{ flex: 1 }}
              >
                開始遊戲
              </Button>
            )}
          </CardFooter>
        </Card>
      </div>
    );
  }

  // 房間列表
  return (
    <div className="room-container">
      {/* 移動端按鈕調整 - 改為底部固定樣式 */}
      {isMobile ? (
        <div className="action-buttons">
          <Button 
            onClick={onManageQuestions}
            variant="primary"
            size="sm"
          >
            題目管理
          </Button>
          <Button 
            onClick={onTestVictory}
            variant="primary"
            size="sm"
          >
            測試勝利
          </Button>
          <Button 
            onClick={onFirebaseReset}
            variant="warning"
            size="sm"
          >
            重置工具
          </Button>
          <Button 
            onClick={handleLogout}
            variant="danger"
            size="sm"
          >
            登出
          </Button>
        </div>
      ) : (
        // 桌面版頂部按鈕佈局
        <div style={{ position: 'absolute', top: '6rem', right: '2rem' }}>
          <Button 
            onClick={onManageQuestions}
            variant="primary"
            style={{ marginRight: 'var(--space-md)' }}
          >
            題目管理
          </Button>
          <Button 
            onClick={onTestVictory}
            variant="primary"
            style={{ marginRight: 'var(--space-md)' }}
          >
            測試勝利畫面
          </Button>
          <Button 
            onClick={onFirebaseReset}
            variant="warning"
            style={{ marginRight: 'var(--space-md)' }}
          >
            房間重置工具
          </Button>
          <Button 
            onClick={handleLogout}
            variant="danger"
          >
            登出
          </Button>
        </div>
      )}
      
      {/* 歡迎信息區域 */}
      <div className="room-welcome">
        <h2>歡迎, {playerName}!</h2>
        <p>您可以創建新房間或加入現有房間</p>
      </div>
      
      {/* 創建新房間區域 */}
      <div className="room-creator">
        <h3>創建新房間</h3>
        <div className="input-group" style={{ maxWidth: '500px' }}>
          <input 
            type="text" 
            value={roomName}
            onChange={(e) => setRoomName(e.target.value)}
            placeholder="輸入房間名稱" 
            className="input"
          />
          <Button 
            onClick={handleCreateRoom}
            variant="primary"
          >
            創建
          </Button>
        </div>
      </div>

      {/* 房間列表 */}
      <div className="room-list">
        <h3>房間列表</h3>
        <div className="room-grid">
          {/* 等待中房間 */}
          <div className="room-column">
            <h4 style={{ color: 'var(--primary)' }}>等待中房間</h4>
            
            {waitingRooms.length === 0 ? (
              <p className="room-empty">目前沒有等待中的房間</p>
            ) : (
              <div className="room-items">
                {waitingRooms.map(room => (
                  <div key={room.id} className="room-item">
                    <div className="room-item-header">
                      <h5 className="room-item-title">{room.name}</h5>
                      <Badge 
                        variant="primary"
                      >
                        {room.playerArray ? room.playerArray.length : 0}/4 人
                      </Badge>
                    </div>
                    <div className="room-item-info">
                      <p>房主：{room.host}</p>
                    </div>
                    <Button 
                      onClick={() => handleJoinRoom(room.id)}
                      disabled={!room.playerArray || room.playerArray.length >= 4}
                      variant="secondary"
                      isFullWidth
                    >
                      {!room.playerArray || room.playerArray.length >= 4 ? '房間已滿' : '加入'}
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 遊戲進行中房間 */}
          <div className="room-column">
            <h4 style={{ color: 'var(--success)' }}>遊戲進行中房間</h4>
            
            {playingRooms.length === 0 ? (
              <p className="room-empty">目前沒有進行中的房間</p>
            ) : (
              <div className="room-items">
                {playingRooms.map(room => (
                  <div key={room.id} className="room-item" style={{ backgroundColor: 'var(--background-light)' }}>
                    <div className="room-item-header">
                      <h5 className="room-item-title">{room.name}</h5>
                      <Badge variant="success">
                        {room.playerArray ? room.playerArray.length : 0}/4 人
                      </Badge>
                    </div>
                    <div className="room-item-info">
                      <p>房主：{room.host}</p>
                    </div>
                    <Button 
                      disabled
                      variant="secondary"
                      isFullWidth
                      style={{ opacity: 0.6, cursor: 'not-allowed' }}
                    >
                      遊戲進行中
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RoomManager;