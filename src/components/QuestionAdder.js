// src/components/QuestionAdder.js 優化版
import React, { useState, useEffect } from 'react';
import { ref, push, set, onValue, remove } from 'firebase/database';
import { database } from '../firebase';
import Button from './ui/Button';
import Card, { CardHeader, CardBody } from './ui/Card';
import '../styles/components.css';

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
      <div className="login-container">
        <div style={{ 
          position: 'absolute', 
          top: 'var(--space-md)', 
          left: 'var(--space-md)'
        }}>
          <Button onClick={onBack} variant="primary" size="lg">
            返回遊戲大廳
          </Button>
        </div>
        
        <Card className="login-form">
          <CardHeader>
            <h2 className="login-title">管理員登入</h2>
          </CardHeader>
          <CardBody>
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
                className="input"
                style={{ 
                  marginBottom: 'var(--space-lg)', 
                  textAlign: 'center',
                  fontSize: 'var(--text-lg)'
                }}
              />
              <Button 
                onClick={handlePasswordSubmit}
                variant="primary"
                size="lg"
                isFullWidth
              >
                確認
              </Button>
            </div>
          </CardBody>
        </Card>
      </div>
    );
  }

  // 題目新增畫面
  return (
    <div className="room-container">
      <div style={{ 
        position: 'absolute', 
        top: 'var(--space-md)', 
        left: 'var(--space-md)',
        zIndex: 10
      }}>
        <Button onClick={onBack} variant="primary" size="lg">
          返回遊戲大廳
        </Button>
      </div>
      
      <div style={{ 
        position: 'absolute', 
        top: 'var(--space-md)', 
        right: 'var(--space-md)' 
      }}>
        <Button 
          onClick={() => setIsAuthenticated(false)}
          variant="danger"
          size="lg"
        >
          登出
        </Button>
      </div>
      
      <Card style={{ 
        maxWidth: '800px',
        margin: '5rem auto 0'
      }}>
        <CardHeader>
          <h2 style={{ 
            fontSize: 'var(--text-2xl)', 
            fontWeight: 'bold',
            textAlign: 'center' 
          }}>
            新增元素週期表題目
          </h2>
        </CardHeader>
        
        <CardBody>
          <div style={{ marginBottom: 'var(--space-lg)' }}>
            <label style={{ 
              display: 'block', 
              marginBottom: 'var(--space-sm)', 
              fontSize: 'var(--text-lg)', 
              fontWeight: 'bold' 
            }}>
              題目
            </label>
            <input 
              type="text" 
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="請輸入題目" 
              className="input"
            />
          </div>

          <div style={{ marginBottom: 'var(--space-xl)' }}>
            <label style={{ 
              display: 'block', 
              marginBottom: 'var(--space-md)', 
              fontSize: 'var(--text-lg)', 
              fontWeight: 'bold' 
            }}>
              選項
            </label>
            {options.map((opt, index) => (
              <div key={index} style={{ 
                display: 'flex', 
                alignItems: 'center', 
                marginBottom: 'var(--space-md)' 
              }}>
                <span style={{ 
                  marginRight: 'var(--space-md)', 
                  fontSize: 'var(--text-lg)', 
                  fontWeight: 'bold' 
                }}>
                  {index + 1}.
                </span>
                <input 
                  type="text" 
                  value={opt}
                  onChange={(e) => handleOptionChange(index, e.target.value)}
                  placeholder={`輸入選項 ${index + 1}`}
                  className="input"
                  style={{ 
                    flex: 1, 
                    marginRight: 'var(--space-md)'
                  }}
                />
                <label style={{ 
                  display: 'flex', 
                  alignItems: 'center',
                  fontSize: 'var(--text-lg)',
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
                      marginRight: 'var(--space-xs)' 
                    }}
                  />
                  正確
                </label>
              </div>
            ))}
          </div>

          <Button 
            onClick={addQuestion}
            variant="secondary"
            size="lg"
            isFullWidth
            style={{ marginBottom: 'var(--space-xl)' }}
          >
            新增題目
          </Button>

          <div>
            <h3 style={{ 
              fontSize: 'var(--text-xl)', 
              fontWeight: 'bold', 
              marginBottom: 'var(--space-md)',
              textAlign: 'center'
            }}>
              已新增題目
            </h3>
            {questions.length === 0 ? (
              <p style={{ 
                textAlign: 'center', 
                color: 'var(--text-secondary)',
                fontSize: 'var(--text-lg)'
              }}>
                尚未新增題目
              </p>
            ) : (
              <div style={{ 
                display: 'flex',
                flexDirection: 'column',
                gap: 'var(--space-md)',
                maxHeight: '400px',
                overflowY: 'auto',
                padding: 'var(--space-sm)'
              }}>
                {questions.map((q, index) => (
                  <div 
                    key={q.id} 
                    style={{ 
                      position: 'relative',
                      padding: 'var(--space-lg)', 
                      border: '1px solid var(--background-light)', 
                      borderRadius: 'var(--radius-md)',
                      backgroundColor: 'var(--background-light)'
                    }}
                  >
                    <div style={{ paddingRight: 'var(--space-xl)' }}>
                      <div style={{ 
                        fontSize: 'var(--text-lg)', 
                        fontWeight: 'bold',
                        marginBottom: 'var(--space-md)'
                      }}>
                        題目 {index + 1}：{q.question}
                      </div>
                      <div>
                        {q.options.map((option, optIndex) => (
                          <div 
                            key={optIndex} 
                            style={{ 
                              color: optIndex === q.correctAnswer ? 'var(--success-dark)' : 'var(--text-primary)',
                              fontWeight: optIndex === q.correctAnswer ? 'bold' : 'normal',
                              marginBottom: 'var(--space-xs)'
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
                        top: 'var(--space-md)',
                        right: 'var(--space-md)',
                        backgroundColor: 'transparent',
                        border: 'none',
                        color: 'var(--danger)',
                        fontSize: 'var(--text-lg)',
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
        </CardBody>
      </Card>
    </div>
  );
};

export default QuestionAdder;