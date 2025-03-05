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
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column',
        alignItems: 'center', 
        justifyContent: 'center', 
        minHeight: '100vh', 
        backgroundColor: '#EFF6FF',
        padding: '1rem'
      }}>
        <div style={{ 
          position: 'absolute', 
          top: '1rem', 
          left: '1rem'
        }}>
          <button 
            onClick={onBack}
            style={{ 
              backgroundColor: '#3B82F6', 
              color: 'white',
              padding: '1rem 2rem',  // 增加按鈕尺寸
              fontSize: '1.25rem',   // 增加字體大小
              fontWeight: 'bold',
              borderRadius: '0.5rem',
              cursor: 'pointer',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
            }}
          >
            返回遊戲大廳
          </button>
        </div>
        
        <div style={{ 
          width: '100%',
          maxWidth: '500px',  // 增加最大寬度
          backgroundColor: 'white', 
          padding: '2rem', 
          borderRadius: '0.5rem', 
          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
          margin: '4rem auto 0'  // 增加上邊距
        }}>
          <h2 style={{ 
            fontSize: '2rem',   // 增加標題字體大小
            fontWeight: 'bold', 
            marginBottom: '1.5rem', 
            textAlign: 'center' 
          }}>
            管理員登入
          </h2>
          
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
              style={{ 
                width: '100%', 
                padding: '1rem', 
                marginBottom: '1.5rem', 
                border: '1px solid #D1D5DB', 
                borderRadius: '0.5rem',
                fontSize: '1.25rem',
                textAlign: 'center'  // 輸入文字居中
              }}
            />
            <button 
              onClick={handlePasswordSubmit}
              style={{ 
                width: '100%', 
                backgroundColor: '#3B82F6', 
                color: 'white', 
                padding: '1rem',  // 增加大小
                borderRadius: '0.5rem',
                fontSize: '1.25rem', // 增加字體大小
                fontWeight: 'bold',
                cursor: 'pointer',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
              }}
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
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '1rem' }}>
      <div style={{ 
        position: 'absolute', 
        top: '1rem', 
        left: '1rem',
        zIndex: 10
      }}>
        <button 
          onClick={onBack}
          style={{ 
            backgroundColor: '#3B82F6', 
            color: 'white',
            padding: '1rem 2rem',  // 增加按鈕尺寸
            fontSize: '1.25rem',   // 增加字體大小
            fontWeight: 'bold',
            borderRadius: '0.5rem',
            cursor: 'pointer',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
          }}
        >
          返回遊戲大廳
        </button>
      </div>
      
      <div style={{ 
        position: 'absolute', 
        top: '1rem', 
        right: '1rem' 
      }}>
        <button 
          onClick={() => setIsAuthenticated(false)}
          style={{ 
            backgroundColor: '#EF4444', 
            color: 'white',
            padding: '1rem 2rem',  // 增加按鈕尺寸
            fontSize: '1.25rem',   // 增加字體大小
            fontWeight: 'bold',
            borderRadius: '0.5rem',
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
        marginTop: '5rem',
        maxWidth: '800px',
        margin: '5rem auto 0'
      }}>
        <h2 style={{ 
          fontSize: '2rem', 
          fontWeight: 'bold', 
          marginBottom: '2rem', 
          textAlign: 'center' 
        }}>
          新增元素週期表題目
        </h2>
        
        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{ 
            display: 'block', 
            marginBottom: '0.5rem', 
            fontSize: '1.25rem', 
            fontWeight: 'bold' 
          }}>
            題目
          </label>
          <input 
            type="text" 
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="請輸入題目" 
            style={{ 
              width: '100%', 
              padding: '1rem', 
              border: '1px solid #D1D5DB', 
              borderRadius: '0.5rem',
              fontSize: '1.125rem'
            }}
          />
        </div>

        <div style={{ marginBottom: '2rem' }}>
          <label style={{ 
            display: 'block', 
            marginBottom: '1rem', 
            fontSize: '1.25rem', 
            fontWeight: 'bold' 
          }}>
            選項
          </label>
          {options.map((opt, index) => (
            <div key={index} style={{ 
              display: 'flex', 
              alignItems: 'center', 
              marginBottom: '1rem' 
            }}>
              <span style={{ 
                marginRight: '1rem', 
                fontSize: '1.25rem', 
                fontWeight: 'bold' 
              }}>
                {index + 1}.
              </span>
              <input 
                type="text" 
                value={opt}
                onChange={(e) => handleOptionChange(index, e.target.value)}
                placeholder={`輸入選項 ${index + 1}`}
                style={{ 
                  flex: 1, 
                  padding: '1rem', 
                  border: '1px solid #D1D5DB', 
                  borderRadius: '0.5rem',
                  fontSize: '1.125rem',
                  marginRight: '1rem'
                }}
              />
              <label style={{ 
                display: 'flex', 
                alignItems: 'center',
                fontSize: '1.125rem',
                fontWeight: 'bold'
              }}>
                <input 
                  type="radio" 
                  name="correctAnswer"
                  checked={correctAnswer === index}
                  onChange={() => setCorrectAnswer(index)}
                  style={{ 
                    width: '1.25rem', 
                    height: '1.25rem', 
                    marginRight: '0.5rem' 
                  }}
                />
                正確
              </label>
            </div>
          ))}
        </div>

        <button 
          onClick={addQuestion}
          style={{ 
            width: '100%', 
            backgroundColor: '#10B981', 
            color: 'white', 
            padding: '1rem',
            borderRadius: '0.5rem',
            fontSize: '1.25rem',
            fontWeight: 'bold',
            marginBottom: '2rem',
            cursor: 'pointer',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
          }}
        >
          新增題目
        </button>

        <div>
          <h3 style={{ 
            fontSize: '1.5rem', 
            fontWeight: 'bold', 
            marginBottom: '1rem',
            textAlign: 'center'
          }}>
            已新增題目
          </h3>
          {questions.length === 0 ? (
            <p style={{ 
              textAlign: 'center', 
              color: '#6B7280',
              fontSize: '1.125rem'
            }}>
              尚未新增題目
            </p>
          ) : (
            <div style={{ 
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem',
              maxHeight: '400px',
              overflowY: 'auto',
              padding: '0.5rem'
            }}>
              {questions.map((q, index) => (
                <div 
                  key={q.id} 
                  style={{ 
                    position: 'relative',
                    padding: '1.25rem', 
                    border: '1px solid #E5E7EB', 
                    borderRadius: '0.5rem',
                    backgroundColor: '#F9FAFB'
                  }}
                >
                  <div style={{ paddingRight: '2rem' }}>
                    <div style={{ 
                      fontSize: '1.125rem', 
                      fontWeight: 'bold',
                      marginBottom: '0.75rem'
                    }}>
                      題目 {index + 1}：{q.question}
                    </div>
                    <div>
                      {q.options.map((option, optIndex) => (
                        <div 
                          key={optIndex} 
                          style={{ 
                            color: optIndex === q.correctAnswer ? '#059669' : '#1F2937',
                            fontWeight: optIndex === q.correctAnswer ? 'bold' : 'normal',
                            marginBottom: '0.25rem'
                          }}
                        >
                          {optIndex + 1}. {option} {optIndex === q.correctAnswer && '✓'}
                        </div>
                      ))}
                    </div>
                  </div>
                  <button 
                    onClick={() => deleteQuestion(q.id)}
                    style={{ 
                      position: 'absolute',
                      top: '1rem',
                      right: '1rem',
                      backgroundColor: 'transparent',
                      border: 'none',
                      color: '#EF4444',
                      fontSize: '1.25rem',
                      fontWeight: 'bold',
                      cursor: 'pointer'
                    }}
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