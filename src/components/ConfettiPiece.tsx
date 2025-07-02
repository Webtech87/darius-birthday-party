import React from 'react';
import '../styles/components.css';

interface ConfettiPieceProps {
  color: string;
  delay: number;
}

export const ConfettiPiece: React.FC<ConfettiPieceProps> = ({ color, delay }) => (
  <div
    className={`confetti-piece ${color}`}
    style={{
      left: `${Math.random() * 100}%`,
      animationDelay: `${delay}s`,
      animationDuration: `${2 + Math.random() * 2}s`
    }}
  />
);