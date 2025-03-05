import React, { useState } from 'react';

const QuestionAdder = () => {
  const [questions, setQuestions] = useState([]);
  const [password, setPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState(['', '', '', '']);
  const [correctAnswer, setCorrectAnswer] = useState(0);

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

    const newQuestion = {
      id: Date.now().toString(),
      question,
      options,
      correctAnswer
    };

    setQuestions([...questions, newQuestion]);

    // 重置表單
    setQuestion('');
    setOptions(['', '', '', '']);
    setCorrectAnswer(0);
  };

  // 密碼輸入畫面
  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-[300px] bg-blue-50">
        <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
          <h2 className="text-2xl mb-4 text-center">管理員登入</h2>
          <input 
            type="password" 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="請輸入管理員密碼" 
            className="w-full p-2 mb-4 border rounded"
          />
          <button 
            onClick={handlePasswordSubmit}
            className="w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600"
          >
            確認
          </button>
        </div>
      </div>
    );
  }

  // 題目新增畫面
  return (
    <div className="bg-white p-6 rounded-lg shadow-md max-w-md mx-auto mt-8">
      <h2 className="text-2xl font-bold mb-4 text-center">新增元素週期表題目</h2>
      
      <div className="mb-4">
        <label className="block text-gray-700 mb-2">題目</label>
        <input 
          type="text" 
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="請輸入題目" 
          className="w-full p-2 border rounded"
        />
      </div>

      <div className="mb-4">
        <label className="block text-gray-700 mb-2">選項</label>
        {options.map((opt, index) => (
          <div key={index} className="flex items-center mb-2">
            <span className="mr-2">{index + 1}.</span>
            <input 
              type="text" 
              value={opt}
              onChange={(e) => handleOptionChange(index, e.target.value)}
              placeholder={`輸入選項 ${index + 1}`}
              className="flex-grow p-2 border rounded mr-2"
            />
            <label className="flex items-center">
              <input 
                type="radio" 
                name="correctAnswer"
                checked={correctAnswer === index}
                onChange={() => setCorrectAnswer(index)}
                className="mr-1"
              />
              正確
            </label>
          </div>
        ))}
      </div>

      <div className="flex space-x-4">
        <button 
          onClick={addQuestion}
          className="flex-1 bg-blue-500 text-white p-2 rounded hover:bg-blue-600 transition"
        >
          新增題目
        </button>
        <button 
          onClick={() => setIsAuthenticated(false)}
          className="flex-1 bg-gray-500 text-white p-2 rounded hover:bg-gray-600 transition"
        >
          登出
        </button>
      </div>

      <div className="mt-6">
        <h3 className="text-lg font-semibold mb-2">已新增題目</h3>
        {questions.length === 0 ? (
          <p className="text-gray-500">尚未新增題目</p>
        ) : (
          <ul className="space-y-2 max-h-48 overflow-y-auto">
            {questions.map((q, index) => (
              <li key={q.id} className="p-2 border rounded bg-gray-50">
                <div className="font-medium">題目 {index + 1}：{q.question}</div>
                <div className="text-sm text-gray-600">
                  正確答案：{q.options[q.correctAnswer]}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default QuestionAdder;