// src/components/ui/Timer.js
import React from 'react';
import '../../styles/components.css';

const Timer = ({ 
  seconds, 
  variant = 'normal',
  className = '', 
  ...props 
}) => {
  // 如果秒數低於等於5，使用警告狀態
  const timerVariant = variant === 'auto' 
    ? (seconds <= 5 ? 'warning' : 'normal')
    : variant;
  
  return (
    <div 
      className={`timer timer-${timerVariant} ${className}`} 
      {...props}
    >
      {seconds}
    </div>
  );
};

export default Timer;