// src/App.js - 優化版
import React, { useState } from 'react';
import RoomManager from './components/RoomManager';
import QuestionAdder from './components/QuestionAdder';
import './styles/variables.css';
import './styles/components.css';
import './styles/animations.css';
import './index.css';

function App() {
  const [currentScreen, setCurrentScreen] = useState('roomManager'); // 'roomManager' 或 'questionAdder'

  return (
    <div className="app-container">
      <header className="app-header">
        <div className="container">
          <h1 className="app-title">台灣國中元素週期表搶答遊戲</h1>
        </div>
      </header>

      <main>
        {currentScreen === 'questionAdder' && <QuestionAdder onBack={() => setCurrentScreen('roomManager')} />}
        {currentScreen === 'roomManager' && <RoomManager onManageQuestions={() => setCurrentScreen('questionAdder')} />}
      </main>
    </div>
  );
}

export default App;