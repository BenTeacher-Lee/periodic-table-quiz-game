// src/App.js
import React from 'react';
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom';
import RoomManager from './components/RoomManager';
import QuestionAdder from './components/QuestionAdder';
import './index.css';

function App() {
  return (
    <Router>
      <div className="App min-h-screen bg-blue-50">
        <header className="bg-blue-600 text-white py-6">
          <div className="container mx-auto">
            <h1 className="text-3xl font-bold text-center">台灣國中元素週期表搶答遊戲</h1>
          </div>
        </header>

        <Switch>
          <Route path="/questions">
            <QuestionAdder />
          </Route>
          <Route path="/">
            <RoomManager />
          </Route>
        </Switch>
      </div>
    </Router>
  );
}

export default App;