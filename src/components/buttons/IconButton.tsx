import React from 'react';
import './buttons.scss';

function IconButton({ icon: Icon, style, onClick, className }: { icon: React.ElementType, style?: React.CSSProperties, onClick: () => void, className?: string }) {
  return (
    <div className={`icon-button-container ${className}`} style={style} onClick={onClick}>
      <div className="circle"></div>
      <Icon className="icon" />
    </div>
  );
}

export default IconButton;
