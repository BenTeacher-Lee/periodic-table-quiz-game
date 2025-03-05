// src/components/RoomManager.js
import React, { useState, useEffect } from 'react';
import { useRooms } from '../hooks/useRooms';
import GameArea from './GameArea';

const RoomManager = ({ onManageQuestions }) => {
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

  // 遊戲結束回調
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
    return <GameArea roomId={currentRoom.id} playerName={playerName} onGameEnd={handleGameEnd} />;
  }

  // 如果尚未設置名稱
  if (!isNameSet) {
    return (
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        minHeight: '100vh', 
        backgroundColor: '#EFF6FF' 
      }}>
        <div style={{ 
          backgroundColor: 'white', 
          padding: '2rem', 
          borderRadius: '0.5rem', 
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
          width: '100%',
          maxWidth: '28rem'
        }}>
          <h2 style={{ 
            fontSize: '1.5rem', 
            fontWeight: 'bold', 
            marginBottom: '1rem', 
            textAlign: 'center' 
          }}>設定暱稱</h2>
          <input 
            type="text" 
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            placeholder="請輸入暱稱" 
            style={{ 
              width: '100%', 
              padding: '0.75rem', 
              marginBottom: '1.5rem', 
              border: '1px solid #D1D5DB', 
              borderRadius: '0.5rem',
              fontSize: '1.125rem'
            }}
          />
          <button 
            onClick={validatePlayerName}
            style={{ 
              width: '100%', 
              backgroundColor: '#10B981', 
              color: 'white', 
              padding: '0.75rem', 
              borderRadius: '0.5rem',
              fontSize: '1.125rem',
              fontWeight: 'bold',
              cursor: 'pointer',
              boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)'
            }}
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
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#4B5563' }}>載入中...</div>
      </div>
    );
  }

  // 在房間中但未開始遊戲
  if (currentRoom) {
    return (
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '1rem' }}>
        <div style={{ position: 'absolute', top: '6rem', right: '2rem' }}>
          <button 
            onClick={onManageQuestions}
            style={{ 
              backgroundColor: '#3B82F6', 
              color: 'white',
              padding: '0.75rem 1.5rem',
              borderRadius: '0.5rem',
              fontSize: '1.25rem',
              fontWeight: 'bold',
              marginRight: '0.5rem',
              cursor: 'pointer',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
            }}
          >
            題目管理
          </button>
          <button 
            onClick={handleLogout}
            style={{ 
              backgroundColor: '#EF4444', 
              color: 'white',
              padding: '0.75rem 1.5rem',
              borderRadius: '0.5rem',
              fontSize: '1.25rem',
              fontWeight: 'bold',
              cursor: 'pointer',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
            }}
          >
            登出
          </button>
        </div>
        
        <div style={{ 
          backgroundColor: 'white', 
          padding: '2rem', 
          borderRadius: '0.5rem', 
          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
          marginTop: '2rem'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h2 style={{ fontSize: '1.875rem', fontWeight: 'bold' }}>房間：{currentRoom.name}</h2>
          </div>
          
          <div style={{ marginBottom: '1.5rem' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1rem' }}>玩家列表</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {currentRoom.playerArray && currentRoom.playerArray.map((player, index) => (
                <div 
                  key={index} 
                  style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center', 
                    padding: '1rem', 
                    borderBottom: '1px solid #E5E7EB' 
                  }}
                >
                  <span style={{ fontSize: '1.25rem' }}>
                    {player.name} 
                    {player.name === currentRoom.host && (
                      <span style={{ marginLeft: '0.5rem', color: '#3B82F6', fontWeight: 'bold' }}>(房主)</span>
                    )}
                  </span>
                  <span style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>分數：{player.score}</span>
                </div>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', gap: '1rem' }}>
            <button 
              onClick={handleLeaveRoom}
              style={{ 
                flex: 1, 
                backgroundColor: '#EF4444', 
                color: 'white',
                padding: '1rem',
                borderRadius: '0.5rem',
                fontSize: '1.25rem',
                fontWeight: 'bold',
                cursor: 'pointer',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
              }}
            >
              離開房間
            </button>
            {currentRoom.playerArray && currentRoom.playerArray.length >= 2 && currentRoom.host === playerName && (
              <button 
                onClick={handleStartGame}
                style={{ 
                  flex: 1, 
                  backgroundColor: '#10B981', 
                  color: 'white',
                  padding: '1rem',
                  borderRadius: '0.5rem',
                  fontSize: '1.25rem',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                }}
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
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '1rem' }}>
      {/* 頂部按鈕 */}
      <div style={{ position: 'absolute', top: '6rem', right: '2rem' }}>
        <button 
          onClick={onManageQuestions}
          style={{ 
            backgroundColor: '#3B82F6', 
            color: 'white',
            padding: '0.75rem 1.5rem',
            borderRadius: '0.5rem',
            fontSize: '1.25rem',
            fontWeight: 'bold',
            marginRight: '0.5rem',
            cursor: 'pointer',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
          }}
        >
          題目管理
        </button>
        <button 
          onClick={handleLogout}
          style={{ 
            backgroundColor: '#EF4444', 
            color: 'white',
            padding: '0.75rem 1.5rem',
            borderRadius: '0.5rem',
            fontSize: '1.25rem',
            fontWeight: 'bold',
            cursor: 'pointer',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
          }}
        >
          登出
        </button>
      </div>
      
      {/* 歡迎信息區域 - 左對齊 */}
      <div style={{ 
        marginBottom: '1.5rem',
        textAlign: 'left'
      }}>
        <h2 style={{ 
          fontSize: '1.875rem', 
          fontWeight: 'bold',
          textAlign: 'left'
        }}>
          歡迎, {playerName}!
        </h2>
        <p style={{ 
          color: '#6B7280',
          textAlign: 'left'
        }}>
          您可以創建新房間或加入現有房間
        </p>
      </div>
      
      {/* 創建新房間區域 - 左對齊 */}
      <div style={{ 
        textAlign: 'left',
        marginBottom: '2rem' 
      }}>
        <h3 style={{ 
          fontSize: '1.5rem', 
          fontWeight: 'bold', 
          marginBottom: '0.5rem',
          textAlign: 'left'
        }}>
          創建新房間
        </h3>
        <div style={{ 
          display: 'flex',
          maxWidth: '500px', 
          width: '100%' 
        }}>
          <input 
            type="text" 
            value={roomName}
            onChange={(e) => setRoomName(e.target.value)}
            placeholder="輸入房間名稱" 
            style={{ 
              flexGrow: 1, 
              padding: '1rem', 
              borderTopLeftRadius: '0.5rem', 
              borderBottomLeftRadius: '0.5rem',
              fontSize: '1.25rem',
              border: '1px solid #ccc'
            }}
          />
          <button 
            onClick={handleCreateRoom}
            style={{ 
              backgroundColor: '#3B82F6', 
              color: 'white', 
              padding: '1rem 2rem', 
              borderTopRightRadius: '0.5rem', 
              borderBottomRightRadius: '0.5rem',
              fontSize: '1.25rem',
              fontWeight: 'bold',
              cursor: 'pointer'
            }}
          >
            創建
          </button>
        </div>
      </div>

      {/* 房間列表 */}
      <div style={{ marginBottom: '2rem' }}>
        <h3 style={{ 
          fontSize: '1.5rem', 
          fontWeight: 'bold', 
          marginBottom: '1rem', 
          textAlign: 'right' 
        }}>
          房間列表
        </h3>
        <div style={{ 
          border: '2px solid #E5E7EB', 
          borderRadius: '0.5rem', 
          overflow: 'hidden',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
        }}>
          <div style={{ display: 'flex' }}>
            {/* 等待中房間 */}
            <div style={{ 
              width: '50%', 
              padding: '1.5rem', 
              backgroundColor: 'white',
              borderRight: '2px solid #E5E7EB'
            }}>
              <h4 style={{ 
                fontSize: '1.25rem', 
                fontWeight: 'bold', 
                marginBottom: '1rem', 
                color: '#2563EB',
                textAlign: 'center'
              }}>
                等待中房間
              </h4>
              
              {waitingRooms.length === 0 ? (
                <p style={{ color: '#6B7280', fontSize: '1.125rem', textAlign: 'center' }}>目前沒有等待中的房間</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {waitingRooms.map(room => (
                    <div 
                      key={room.id} 
                      style={{ 
                        border: '1px solid #E5E7EB', 
                        borderRadius: '0.5rem', 
                        padding: '1rem',
                        backgroundColor: 'white'
                      }}
                    >
                      <div style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center', 
                        marginBottom: '0.5rem' 
                      }}>
                        <h5 style={{ fontSize: '1.125rem', fontWeight: 'bold' }}>{room.name}</h5>
                        <span style={{ 
                          backgroundColor: '#DBEAFE', 
                          color: '#1E40AF', 
                          padding: '0.25rem 0.75rem',
                          borderRadius: '9999px',
                          fontSize: '0.875rem',
                          fontWeight: '600'
                        }}>
                          {room.playerArray ? room.playerArray.length : 0}/4 人
                        </span>
                      </div>
                      <div style={{ color: '#6B7280', marginBottom: '0.5rem' }}>
                        <p>房主：{room.host}</p>
                      </div>
                      <button 
                        onClick={() => handleJoinRoom(room.id)}
                        disabled={!room.playerArray || room.playerArray.length >= 4}
                        style={{ 
                          width: '100%', 
                          padding: '0.75rem',
                          borderRadius: '0.5rem',
                          fontSize: '1.125rem',
                          fontWeight: 'bold',
                          cursor: (!room.playerArray || room.playerArray.length >= 4) ? 'not-allowed' : 'pointer',
                          backgroundColor: (!room.playerArray || room.playerArray.length >= 4) ? '#D1D5DB' : '#10B981',
                          color: (!room.playerArray || room.playerArray.length >= 4) ? '#6B7280' : 'white'
                        }}
                      >
                        {!room.playerArray || room.playerArray.length >= 4 ? '房間已滿' : '加入'}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 遊戲進行中房間 */}
            <div style={{ 
              width: '50%', 
              padding: '1.5rem', 
              backgroundColor: 'white' 
            }}>
              <h4 style={{ 
                fontSize: '1.25rem', 
                fontWeight: 'bold', 
                marginBottom: '1rem', 
                color: '#059669',
                textAlign: 'center'
              }}>
                遊戲進行中房間
              </h4>
              
              {playingRooms.length === 0 ? (
                <p style={{ color: '#6B7280', fontSize: '1.125rem', textAlign: 'center' }}>目前沒有進行中的房間</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {playingRooms.map(room => (
                    <div 
                      key={room.id} 
                      style={{ 
                        border: '1px solid #E5E7EB', 
                        borderRadius: '0.5rem', 
                        padding: '1rem',
                        backgroundColor: '#F9FAFB'
                      }}
                    >
                      <div style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center', 
                        marginBottom: '0.5rem' 
                      }}>
                        <h5 style={{ fontSize: '1.125rem', fontWeight: 'bold' }}>{room.name}</h5>
                        <span style={{ 
                          backgroundColor: '#D1FAE5', 
                          color: '#065F46', 
                          padding: '0.25rem 0.75rem',
                          borderRadius: '9999px',
                          fontSize: '0.875rem',
                          fontWeight: '600'
                        }}>
                          {room.playerArray ? room.playerArray.length : 0}/4 人
                        </span>
                      </div>
                      <div style={{ color: '#6B7280', marginBottom: '0.5rem' }}>
                        <p>房主：{room.host}</p>
                      </div>
                      <button 
                        disabled
                        style={{ 
                          width: '100%', 
                          padding: '0.75rem',
                          borderRadius: '0.5rem',
                          fontSize: '1.125rem',
                          fontWeight: 'bold',
                          backgroundColor: '#D1D5DB',
                          color: '#6B7280',
                          cursor: 'not-allowed'
                        }}
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
      </div>
    </div>
  );
};

export default RoomManager;