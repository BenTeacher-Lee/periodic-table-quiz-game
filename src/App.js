i// src/App.js
import React, { useState } from 'react';
import RoomManager from './components/RoomManager';
import QuestionAdder from './components/QuestionAdder';

function App() {
  const [currentScreen, setCurrentScreen] = useState('roomManager'); // 'roomManager' 或 'questionAdder'

  return (
    <div className="App min-h-screen bg-blue-50 pb-10">
      <header className="bg-blue-600 text-white p-4 mb-6">
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold">台灣國中元素週期表搶答遊戲</h1>
          <div>
            <button 
              onClick={() => setCurrentScreen('roomManager')}
              className={`mr-2 px-3 py-1 rounded ${
                currentScreen === 'roomManager' ? 'bg-white text-blue-600' : 'bg-blue-500'
              }`}
            >
              遊戲房間
            </button>
            <button 
              onClick={() => setCurrentScreen('questionAdder')}
              className={`px-3 py-1 rounded ${
                currentScreen === 'questionAdder' ? 'bg-white text-blue-600' : 'bg-blue-500'
              }`}
            >
              題目管理
            </button>
          </div>
        </div>
      </header>

      <main className="container mx-auto">
        {currentScreen === 'questionAdder' && <QuestionAdder />}
        {currentScreen === 'roomManager' && <RoomManager />}
      </main>
    </div>
  );
}

export default App;