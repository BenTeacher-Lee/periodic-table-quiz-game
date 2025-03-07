// src/components/ui/Card.js
import React from 'react';
import '../../styles/components.css';

const Card = ({ 
  children, 
  className = '', 
  ...props 
}) => {
  return (
    <div className={`card ${className}`} {...props}>
      {children}
    </div>
  );
};

export const CardHeader = ({ 
  children, 
  className = '', 
  ...props 
}) => {
  return (
    <div className={`card-header ${className}`} {...props}>
      {children}
    </div>
  );
};

export const CardBody = ({ 
  children, 
  className = '', 
  ...props 
}) => {
  return (
    <div className={`card-body ${className}`} {...props}>
      {children}
    </div>
  );
};

export const CardFooter = ({ 
  children, 
  className = '', 
  ...props 
}) => {
  return (
    <div className={`card-footer ${className}`} {...props}>
      {children}
    </div>
  );
};

export default Card;