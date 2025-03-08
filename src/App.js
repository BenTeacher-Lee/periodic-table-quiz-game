// src/App.js - 移動端優化版
import React, { useState, useEffect } from 'react';
import RoomManager from './components/RoomManager';
import QuestionAdder from './components/QuestionAdder';
import TestVictory from './components/TestVictory';
import './styles/variables.css';
import './styles/components.css';
import './styles/animations.css';
import './styles/mobile.css';
import './index.css';

function App() {
  const [currentScreen, setCurrentScreen] = useState('roomManager'); // 'roomManager', 'questionAdder', 'testVictory'
  const [isMobile, setIsMobile] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);

  // 檢測移動設備
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    // 初始檢查
    checkMobile();
    
    // 監聽視窗大小變化
    window.addEventListener('resize', checkMobile);
    
    return () => {
      window.removeEventListener('resize', checkMobile);
    };
  }, []);

  // 監聽滾動以顯示/隱藏回到頂部按鈕
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 300) {
        setShowScrollTop(true);
      } else {
        setShowScrollTop(false);
      }
    };
    
    window.addEventListener('scroll', handleScroll);
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  // 移動到頁面頂部
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [currentScreen]);

  // 回到頂部函數
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  return (
    <div className="app-container">
      <header className="app-header">
        <div className="container">
          <h1 className="app-title">台灣國中元素週期表搶答遊戲</h1>
        </div>
      </header>

      <main>
        {currentScreen === 'questionAdder' && <QuestionAdder onBack={() => setCurrentScreen('roomManager')} isMobile={isMobile} />}
        {currentScreen === 'testVictory' && <TestVictory onBack={() => setCurrentScreen('roomManager')} isMobile={isMobile} />}
        {currentScreen === 'roomManager' && (
          <RoomManager 
            onManageQuestions={() => setCurrentScreen('questionAdder')}
            onTestVictory={() => setCurrentScreen('testVictory')} 
            isMobile={isMobile}
          />
        )}
      </main>

      {/* 移動端顯示回到頂部按鈕 */}
      {isMobile && showScrollTop && (
        <button
          onClick={scrollToTop}
          style={{
            position: 'fixed',
            bottom: '20px',
            right: '20px',
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            backgroundColor: 'var(--primary)',
            color: 'white',
            border: 'none',
            boxShadow: 'var(--shadow-md)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            fontSize: '20px',
            zIndex: 1000,
            cursor: 'pointer'
          }}
          aria-label="回到頂部"
        >
          ↑
        </button>
      )}
    </div>
  );
}

export default App;