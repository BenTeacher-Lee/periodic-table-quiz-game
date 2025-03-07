// src/components/game/AnswerOptions.js
import React from 'react';
import '../../styles/components.css';

const AnswerOptions = ({ 
  options, 
  onSelect, 
  correctAnswer = null, 
  showCorrect = false,
  disabled = false 
}) => {
  if (!options || options.length === 0) return null;
  
  return (
    <div style={{ 
      display: 'grid', 
      gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', 
      gap: 'var(--space-md)'
    }}>
      {options.map((option, index) => {
        // 判斷是否為正確答案並且是否需要顯示
        const isCorrectAnswer = index === correctAnswer;
        const highlightCorrect = showCorrect && isCorrectAnswer;
        
        return (
          <button 
            key={index}
            onClick={() => onSelect(index)}
            disabled={disabled}
            className={`option-button ${highlightCorrect ? 'option-button-correct' : ''}`}
            style={{ 
              transform: highlightCorrect ? 'scale(1.05)' : 'scale(1)',
              animation: highlightCorrect ? 'correctAnswer 1s infinite' : 'none'
            }}
          >
            {String.fromCharCode(65 + index)}. {option} {highlightCorrect ? '✓' : ''}
          </button>
        );
      })}
    </div>
  );
};

export default AnswerOptions;