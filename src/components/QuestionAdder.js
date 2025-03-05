// src/components/QuestionAdder.js
import React, { useState, useEffect } from 'react';
import { ref, push, set, onValue, remove } from 'firebase/database';
import { database } from '../firebase';

const QuestionAdder = ({ onBack }) => {
  const [questions, setQuestions] = useState([]);
  const [password, setPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState(['', '', '', '']);
  const [correctAnswer, setCorrectAnswer] = useState(0);

  // 從 Firebase 加載已有的題目
  useEffect(() => {
    if (!isAuthenticated) return;

    const questionsRef = ref(database, 'questions');
    const unsubscribe = onValue(questionsRef, (snapshot) => {
      const data = snapshot.val();
      if (!data) return;

      const questionList = Object.keys(data).map(key => ({
        id: key,
        ...data[key]
      }));
      
      setQuestions(questionList);
    });

    return () => unsubscribe();
  }, [isAuthenticated]);

  const handlePasswordSubmit = () => {
    if (password === '850227') {
      setIsAuthenticated(true);
    } else {
      alert('密碼錯誤，請重新輸入');
      setPassword('');
    }
  };

  const handleOptionChange = (index, value) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  const addQuestion = () => {
    if (!question.trim()) {
      alert('請輸入題目');
      return;
    }

    if (options.some(opt => !opt.trim())) {
      alert('請填寫所有選項');
      return;
    }

    // 創建新題目
    const questionsRef = ref(database, 'questions');
    const newQuestionRef = push(questionsRef);
    const newQuestion = {
      question,
      options,
      correctAnswer
    };

    set(newQuestionRef, newQuestion);

    // 重置表單
    setQuestion('');
    setOptions(['', '', '', '']);
    setCorrectAnswer(0);
  };

  // 刪除題目
  const deleteQuestion = (questionId) => {
    const questionRef = ref(database, `questions/${questionId}`);
    remove(questionRef);
  };

  // 密碼輸入畫面
  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-[300px] bg-blue-50 p-4">
        <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md">
          <h2 className="text-2xl font-bold mb-4 text-center">管理員登入</h2>
          <input 
            type="password" 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="請輸入管理員密碼" 
            className="w-full p-3 mb-4 border rounded-lg text-lg"
          />
          <div className="flex space-x-4">
            <button 
              onClick={onBack}
              className="flex-1 bg-gray-500 text-white p-3 rounded-lg text-lg font-bold hover:bg-gray-600 transition shadow-md"
            >
              返回
            </button>
            <button 
              onClick={handlePasswordSubmit}
              className="flex-1 bg-blue-500 text-white p-3 rounded-lg text-lg font-bold hover:bg-blue-600 transition shadow-md"
            >
              確認
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 題目新增畫面
  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between mb-4">
        <button 
          onClick={onBack}
          className="bg-blue-500 text-white px-4 py-2 rounded-lg font-bold shadow-md hover:bg-blue-600 transition"
        >
          返回遊戲大廳
        </button>
        <button 
          onClick={() => setIsAuthenticated(false)}
          className="bg-red-500 text-white px-4 py-2 rounded-lg font-bold shadow-md hover:bg-red-600 transition"
        >
          登出
        </button>
      </div>
      
      <div className="bg-white p-6 rounded-lg shadow-lg max-w-3xl mx-auto">
        <h2 className="text-2xl font-bold mb-6 text-center">新增元素週期表題目</h2>
        
        <div className="mb-4">
          <label className="block text-gray-700 mb-2 text-lg font-semibold">題目</label>
          <input 
            type="text" 
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="請輸入題目" 
            className="w-full p-3 border rounded-lg text-lg"
          />
        </div>

        <div className="mb-6">
          <label className="block text-gray-700 mb-2 text-lg font-semibold">選項</label>
          {options.map((opt, index) => (
            <div key={index} className="flex items-center mb-3">
              <span className="mr-3 text-lg font-bold">{index + 1}.</span>
              <input 
                type="text" 
                value={opt}
                onChange={(e) => handleOptionChange(index, e.target.value)}
                placeholder={`輸入選項 ${index + 1}`}
                className="flex-grow p-3 border rounded-lg text-lg mr-3"
              />
              <label className="flex items-center">
                <input 
                  type="radio" 
                  name="correctAnswer"
                  checked={correctAnswer === index}
                  onChange={() => setCorrectAnswer(index)}
                  className="w-5 h-5 mr-2"
                />
                <span className="text-lg font-semibold">正確</span>
              </label>
            </div>
          ))}
        </div>

        <button 
          onClick={addQuestion}
          className="w-full bg-green-500 text-white p-3 rounded-lg text-lg font-bold hover:bg-green-600 transition shadow-md mb-6"
        >
          新增題目
        </button>

        <div className="mt-8">
          <h3 className="text-xl font-bold mb-4">已新增題目</h3>
          {questions.length === 0 ? (
            <p className="text-gray-500 text-center text-lg">尚未新增題目</p>
          ) : (
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {questions.map((q, index) => (
                <div key={q.id} className="p-4 border rounded-lg bg-gray-50 relative shadow-sm">
                  <div className="pr-8">
                    <div className="font-bold text-lg mb-2">題目 {index + 1}：{q.question}</div>
                    <div className="mb-2">
                      {q.options.map((option, optIndex) => (
                        <div key={optIndex} className={`${optIndex === q.correctAnswer ? 'text-green-600 font-bold' : 'text-gray-700'}`}>
                          {optIndex + 1}. {option} {optIndex === q.correctAnswer && '✓'}
                        </div>
                      ))}
                    </div>
                  </div>
                  <button 
                    onClick={() => deleteQuestion(q.id)}
                    className="absolute top-3 right-3 text-red-500 hover:text-red-700 text-xl"
                  >
                    ✕
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

export default QuestionAdder;