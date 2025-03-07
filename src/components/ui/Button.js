// src/components/ui/Button.js
import React from 'react';
import '../../styles/components.css';

const Button = ({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  isFullWidth = false,
  onClick,
  disabled,
  className = '',
  ...props 
}) => {
  const classes = [
    'btn',
    `btn-${variant}`,
    `btn-${size}`,
    isFullWidth ? 'btn-full' : '',
    className
  ].filter(Boolean).join(' ');
  
  return (
    <button 
      className={classes}
      onClick={onClick}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
};

export default Button;