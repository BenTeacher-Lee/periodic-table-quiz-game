// src/components/game/QuestionDisplay.js
import React from 'react';
import '../../styles/components.css';

const QuestionDisplay = ({ question, showingAnswer = false }) => {
  if (!question) return null;
  
  return (
    <div className={`question-card ${showingAnswer ? 'correct-answer' : ''}`}>
      <p style={{ 
        fontSize: 'var(--text-xl)', 
        marginBottom: 'var(--space-lg)', 
        fontFamily: 'Arial, sans-serif',
        fontWeight: 'bold'
      }}>
        {question.question}
      </p>
    </div>
  );
};

export default QuestionDisplay;