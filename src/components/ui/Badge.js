// src/components/ui/Badge.js
import React from 'react';
import '../../styles/components.css';

const Badge = ({ 
  children, 
  variant = 'primary', 
  className = '', 
  ...props 
}) => {
  return (
    <span 
      className={`badge badge-${variant} ${className}`} 
      {...props}
    >
      {children}
    </span>
  );
};

export default Badge;