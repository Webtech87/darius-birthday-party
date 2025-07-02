import React from 'react';
import type { LucideIcon } from 'lucide-react';
import '../styles/components.css';

interface FloatingIconProps {
  icon: LucideIcon;
  delay: number;
  position: string;
}

export const FloatingIcon: React.FC<FloatingIconProps> = ({ 
  icon: Icon, 
  delay, 
  position 
}) => (
  <div
    className={`floating-icon ${position}`}
    style={{
      animationDelay: `${delay}s`,
      animationDuration: '3s'
    }}
  >
    <Icon size={24} />
  </div>
);