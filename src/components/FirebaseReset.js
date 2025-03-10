// src/components/FirebaseReset.js
// 這是一個臨時工具，用於徹底清理和重置 Firebase 房間數據
// 在問題修復後可以移除此文件

import React, { useState, useEffect } from 'react';
import { ref, get, set, remove, serverTimestamp } from 'firebase/database';
import { database } from '../firebase';
import Button from './ui/Button';
import Card, { CardHeader, CardBody, CardFooter } from './ui/Card';

const FirebaseReset = ({ onBack }) => {
  const [password, setPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState('');

  // 載入房間列表
  useEffect(() => {
    if (!isAuthenticated) return;
    
    const fetchRooms = async () => {
      setLoading(true);
      try {
        const roomsRef = ref(database, 'rooms');
        const snapshot = await get(roomsRef);
        
        if (snapshot.exists()) {
          const roomsData = snapshot.val();
          const roomsList = Object.keys(roomsData).map(key => ({
            id: key,
            ...roomsData[key]
          }));
          setRooms(roomsList);
        } else {
          setRooms([]);
        }
      } catch (error) {
        console.error("獲取房間列表錯誤:", error);
        setResult(`錯誤: ${error.message}`);
      } finally {
        setLoading(false);
      }
    };
    
    fetchRooms();
  }, [isAuthenticated]);

  // 密碼驗證
  const handlePasswordSubmit = () => {
    if (password === '850227') {
      setIsAuthenticated(true);
    } else {
      alert('密碼錯誤，請重新輸入');
      setPassword('');
    }
  };

  // 重置單個房間
  const resetRoom = async (roomId) => {
    if (!roomId) return;
    
    setLoading(true);
    try {
      // 獲取當前房間數據
      const roomRef = ref(database, `rooms/${roomId}`);
      const snapshot = await get(roomRef);
      
      if (!snapshot.exists()) {
        setResult(`房間 ${roomId} 不存在`);
        return;
      }
      
      const roomData = snapshot.val();
      
      // 顯示原始房間數據
      console.log("原始房間數據:", roomData);
      
      // 重置玩家分數
      const resetPlayers = {};
      if (roomData.players) {
        Object.keys(roomData.players).forEach(name => {
          resetPlayers[name] = {
            ...roomData.players[name],
            score: 0
          };
        });
      }
      
      // 完全重置房間狀態
      await set(roomRef, {
        ...roomData,
        status: '等待中',
        winner: null,
        currentPlayer: null,
        currentQuestion: null,
        usedQuestions: [],
        showingAnswer: false,
        disabledPlayers: [],
        players: resetPlayers,
        lastActivity: serverTimestamp()
      });
      
      setResult(`房間 ${roomId} 已成功重置!`);
      
      // 重新獲取房間列表
      const roomsRef = ref(database, 'rooms');
      const roomsSnapshot = await get(roomsRef);
      
      if (roomsSnapshot.exists()) {
        const roomsData = roomsSnapshot.val();
        const roomsList = Object.keys(roomsData).map(key => ({
          id: key,
          ...roomsData[key]
        }));
        setRooms(roomsList);
      }
    } catch (error) {
      console.error("重置房間錯誤:", error);
      setResult(`重置房間錯誤: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // 完全刪除房間
  const deleteRoom = async (roomId) => {
    if (!roomId) return;
    
    if (!window.confirm(`確定要刪除房間 ${roomId} 嗎? 此操作不可撤銷!`)) {
      return;
    }
    
    setLoading(true);
    try {
      const roomRef = ref(database, `rooms/${roomId}`);
      await remove(roomRef);
      setResult(`房間 ${roomId} 已成功刪除!`);
      
      // 更新房間列表
      setRooms(rooms.filter(room => room.id !== roomId));
    } catch (error) {
      console.error("刪除房間錯誤:", error);
      setResult(`刪除房間錯誤: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // 顯示房間狀態
  const getRoomStatusBadge = (room) => {
    if (room.status === '遊戲結束') {
      return <span style={{ color: 'red', fontWeight: 'bold' }}>遊戲結束</span>;
    } else if (room.status === '遊戲中') {
      return <span style={{ color: 'green', fontWeight: 'bold' }}>遊戲中</span>;
    } else {
      return <span style={{ color: 'blue' }}>等待中</span>;
    }
  };

  // 檢測並顯示問題
  const getRoomIssues = (room) => {
    const issues = [];
    
    if (room.winner) {
      issues.push(<div key="winner" style={{ color: 'red' }}>有勝利者: {room.winner}</div>);
    }
    
    if (room.status === '遊戲結束') {
      issues.push(<div key="status" style={{ color: 'red' }}>狀態為遊戲結束</div>);
    }
    
    if (room.players) {
      const highScorePlayers = Object.keys(room.players).filter(
        player => room.players[player].score >= 20
      );
      
      if (highScorePlayers.length > 0) {
        issues.push(
          <div key="score" style={{ color: 'red' }}>
            玩家分數過高: {highScorePlayers.map(p => `${p}(${room.players[p].score}分)`).join(', ')}
          </div>
        );
      }
    }
    
    return issues.length > 0 ? (
      <div style={{ marginTop: '8px', padding: '5px', backgroundColor: '#fff0f0', borderRadius: '4px' }}>
        {issues}
      </div>
    ) : null;
  };

  // 密碼驗證界面
  if (!isAuthenticated) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <div style={{ position: 'absolute', top: '20px', left: '20px' }}>
          <Button onClick={onBack}>返回</Button>
        </div>
        
        <Card style={{ width: '400px' }}>
          <CardHeader>
            <h2 style={{ textAlign: 'center' }}>Firebase 房間重置工具</h2>
          </CardHeader>
          <CardBody>
            <p style={{ marginBottom: '15px', textAlign: 'center' }}>
              此工具用於修復一開始就顯示勝利畫面的問題。
              請輸入管理員密碼繼續：
            </p>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="請輸入密碼"
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                marginBottom: '15px'
              }}
            />
            <Button onClick={handlePasswordSubmit} variant="primary" isFullWidth>
              確認
            </Button>
          </CardBody>
        </Card>
      </div>
    );
  }

  // 房間管理界面
  return (
    <div style={{ padding: '20px', maxWidth: '900px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <Button onClick={onBack}>返回</Button>
        <h1>Firebase 房間重置工具</h1>
        <div></div>
      </div>
      
      {loading && (
        <div style={{ textAlign: 'center', padding: '20px' }}>
          載入中...
        </div>
      )}
      
      {result && (
        <div style={{
          padding: '10px',
          backgroundColor: result.includes('錯誤') ? '#ffe0e0' : '#e0ffe0',
          borderRadius: '4px',
          marginBottom: '20px'
        }}>
          {result}
        </div>
      )}
      
      <h2>房間列表</h2>
      {rooms.length === 0 ? (
        <p>沒有找到房間</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          {rooms.map(room => (
            <Card key={room.id}>
              <CardBody>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <div>
                    <h3>{room.name || '未命名房間'}</h3>
                    <p>ID: {room.id}</p>
                    <p>狀態: {getRoomStatusBadge(room)}</p>
                    <p>房主: {room.host || '無'}</p>
                    <p>玩家數: {room.players ? Object.keys(room.players).length : 0}</p>
                    
                    {/* 顯示問題 */}
                    {getRoomIssues(room)}
                  </div>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <Button onClick={() => resetRoom(room.id)} variant="primary">
                      重置房間
                    </Button>
                    <Button onClick={() => deleteRoom(room.id)} variant="danger">
                      刪除房間
                    </Button>
                  </div>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default FirebaseReset;