// src/App.js
import React, { useState } from 'react';
import RoomManager from './components/RoomManager';
import QuestionAdder from './components/QuestionAdder';
import './index.css';

function App() {
  const [currentScreen, setCurrentScreen] = useState('roomManager'); // 'roomManager' 或 'questionAdder'

  return (
    <div className="App min-h-screen bg-blue-50">
      <header className="bg-blue-600 text-white py-6">
        <div className="container mx-auto">
          <h1 className="text-3xl font-bold text-center">台灣國中元素週期表搶答遊戲</h1>
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