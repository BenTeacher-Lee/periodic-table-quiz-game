// src/components/TestVictory.js
import React, { useState, useEffect } from 'react';
import { ref, get, update, serverTimestamp } from 'firebase/database';
import { database } from '../firebase';
import Button from './ui/Button';
import Card, { CardHeader, CardBody, CardFooter } from './ui/Card';
import GameVictory from './GameVictory';
import '../styles/components.css';

const TestVictory = ({ onBack }) => {
  const [password, setPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [rooms, setRooms] = useState([]);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [selectedWinner, setSelectedWinner] = useState('');
  const [customScores, setCustomScores] = useState([]);
  const [testMode, setTestMode] = useState(false);

  // 從 Firebase 加載已有的房間
  useEffect(() => {
    if (!isAuthenticated) return;

    const fetchRooms = async () => {
      const roomsRef = ref(database, 'rooms');
      try {
        const snapshot = await get(roomsRef);
        const data = snapshot.val();
        if (!data) {
          setRooms([]);
          return;
        }

        const roomList = Object.keys(data).map(key => ({
          id: key,
          name: data[key].name,
          host: data[key].host,
          status: data[key].status,
          players: data[key].players || {}
        }));
        
        setRooms(roomList);
      } catch (error) {
        console.error("Error fetching rooms:", error);
      }
    };

    fetchRooms();
  }, [isAuthenticated]);

  // 處理密碼驗證
  const handlePasswordSubmit = () => {
    if (password === '850227') {
      setIsAuthenticated(true);
    } else {
      alert('密碼錯誤，請重新輸入');
      setPassword('');
    }
  };

  // 選擇房間
  const handleSelectRoom = (room) => {
    setSelectedRoom(room);
    
    // 初始化玩家分數輸入
    if (room && room.players) {
      const initialScores = Object.keys(room.players).map(playerName => ({
        name: playerName,
        score: room.players[playerName].score || 0
      }));
      setCustomScores(initialScores);
      if (initialScores.length > 0) {
        setSelectedWinner(initialScores[0].name);
      }
    }
  };

  // 更新玩家分數
  const handleScoreChange = (playerName, newScore) => {
    const updatedScores = customScores.map(player => 
      player.name === playerName 
        ? { ...player, score: parseInt(newScore, 10) || 0 } 
        : player
    );
    setCustomScores(updatedScores);
  };

  // 應用分數更改到 Firebase
  const applyScoreChanges = async () => {
    if (!selectedRoom) return;
    
    const roomRef = ref(database, `rooms/${selectedRoom.id}`);
    
    // 更新所有玩家分數
    const playerUpdates = {};
    customScores.forEach(player => {
      playerUpdates[`players/${player.name}/score`] = player.score;
    });
    
    // 更新最後活動時間
    playerUpdates.lastActivity = serverTimestamp();
    
    try {
      await update(roomRef, playerUpdates);
      alert('分數已更新');
    } catch (error) {
      console.error("Error updating scores:", error);
      alert('分數更新失敗');
    }
  };

  // 測試勝利畫面
  const testVictoryScreen = () => {
    setTestMode(true);
  };

  // 回到測試面板
  const handleBackToTest = () => {
    setTestMode(false);
  };

  // 如果在測試模式中，顯示勝利畫面
  if (testMode) {
    return (
      <GameVictory 
        players={customScores}
        winner={selectedWinner}
        onRestart={handleBackToTest}
        onEnd={handleBackToTest}
      />
    );
  }

  // 密碼輸入畫面
  if (!isAuthenticated) {
    return (
      <div className="login-container">
        <div style={{ 
          position: 'absolute', 
          top: 'var(--space-md)', 
          left: 'var(--space-md)'
        }}>
          <Button onClick={onBack} variant="primary" size="lg">
            返回遊戲大廳
          </Button>
        </div>
        
        <Card className="login-form">
          <CardHeader>
            <h2 className="login-title">勝利畫面測試 - 管理員登入</h2>
          </CardHeader>
          <CardBody>
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              width: '100%'
            }}>
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="請輸入管理員密碼" 
                className="input"
                style={{ 
                  marginBottom: 'var(--space-lg)', 
                  textAlign: 'center',
                  fontSize: 'var(--text-lg)'
                }}
              />
              <Button 
                onClick={handlePasswordSubmit}
                variant="primary"
                size="lg"
                isFullWidth
              >
                確認
              </Button>
            </div>
          </CardBody>
        </Card>
      </div>
    );
  }

  return (
    <div className="room-container">
      <div style={{ 
        position: 'absolute', 
        top: 'var(--space-md)', 
        left: 'var(--space-md)',
        zIndex: 10
      }}>
        <Button onClick={onBack} variant="primary" size="lg">
          返回遊戲大廳
        </Button>
      </div>
      
      <Card style={{ 
        maxWidth: '800px',
        margin: '5rem auto 0'
      }}>
        <CardHeader>
          <h2 style={{ 
            fontSize: 'var(--text-2xl)', 
            fontWeight: 'bold',
            textAlign: 'center' 
          }}>
            勝利畫面測試工具
          </h2>
        </CardHeader>
        
        <CardBody>
          <div style={{ marginBottom: 'var(--space-xl)' }}>
            <h3 style={{ 
              fontSize: 'var(--text-xl)', 
              fontWeight: 'bold',
              marginBottom: 'var(--space-md)'
            }}>
              選擇房間
            </h3>
            
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
              gap: 'var(--space-md)',
              marginBottom: 'var(--space-lg)'
            }}>
              {rooms.map(room => (
                <div 
                  key={room.id}
                  onClick={() => handleSelectRoom(room)}
                  style={{ 
                    padding: 'var(--space-md)',
                    border: `2px solid ${selectedRoom?.id === room.id ? 'var(--primary)' : 'var(--background-light)'}`,
                    borderRadius: 'var(--radius-md)',
                    cursor: 'pointer',
                    backgroundColor: selectedRoom?.id === room.id ? 'var(--primary-light)' : 'white'
                  }}
                >
                  <div style={{ fontWeight: 'bold', marginBottom: 'var(--space-xs)' }}>
                    {room.name}
                  </div>
                  <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
                    狀態: {room.status}
                  </div>
                  <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
                    房主: {room.host}
                  </div>
                  <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
                    玩家數: {room.players ? Object.keys(room.players).length : 0}
                  </div>
                </div>
              ))}
              
              {rooms.length === 0 && (
                <div style={{ gridColumn: '1 / -1', textAlign: 'center', color: 'var(--text-secondary)' }}>
                  沒有可用的房間
                </div>
              )}
            </div>
          </div>
          
          {selectedRoom && (
            <>
              <div style={{ marginBottom: 'var(--space-xl)' }}>
                <h3 style={{ 
                  fontSize: 'var(--text-xl)', 
                  fontWeight: 'bold',
                  marginBottom: 'var(--space-md)'
                }}>
                  修改玩家分數
                </h3>
                
                {customScores.length > 0 ? (
                  <div style={{ 
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 'var(--space-md)',
                    marginBottom: 'var(--space-lg)'
                  }}>
                    {customScores.map(player => (
                      <div key={player.name} style={{ 
                        display: 'flex',
                        alignItems: 'center',
                        gap: 'var(--space-md)'
                      }}>
                        <label style={{ flex: 2 }}>
                          {player.name}:
                        </label>
                        <input 
                          type="number" 
                          value={player.score}
                          onChange={(e) => handleScoreChange(player.name, e.target.value)}
                          min="0"
                          max="100"
                          className="input"
                          style={{ flex: 1 }}
                        />
                        <label style={{ 
                          display: 'flex', 
                          alignItems: 'center',
                          gap: 'var(--space-xs)',
                          flex: 1
                        }}>
                          <input 
                            type="radio" 
                            name="winner"
                            checked={selectedWinner === player.name}
                            onChange={() => setSelectedWinner(player.name)}
                          />
                          勝利者
                        </label>
                      </div>
                    ))}
                    
                    <Button 
                      onClick={applyScoreChanges}
                      variant="primary"
                      style={{ alignSelf: 'flex-end', marginTop: 'var(--space-sm)' }}
                    >
                      更新真實分數
                    </Button>
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>
                    此房間沒有玩家
                  </div>
                )}
              </div>
              
              <Button 
                onClick={testVictoryScreen}
                variant="secondary"
                size="lg"
                isFullWidth
                disabled={customScores.length === 0}
              >
                測試勝利畫面
              </Button>
            </>
          )}
        </CardBody>
      </Card>
    </div>
  );
};

export default TestVictory;