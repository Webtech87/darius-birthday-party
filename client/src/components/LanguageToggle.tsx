// src/components/LanguageToggle.tsx
import React from 'react';
import { Languages } from 'lucide-react';
import { useLanguage, Language } from '../contexts/LanguageContext';

export const LanguageToggle: React.FC = () => {
  const { language, setLanguage } = useLanguage();

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'pt' : 'en');
  };

  return (
    <button
      onClick={toggleLanguage}
      className="language-toggle-btn"
      title={language === 'en' ? 'Switch to Portuguese' : 'Mudar para Inglês'}
      style={{
        position: 'fixed',
        top: '10px',
        left: '10px',
        zIndex: 1000,
        background: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(10px)',
        border: '2px solid rgba(102, 126, 234, 0.3)',
        borderRadius: '8px',
        padding: '6px 10px',
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        cursor: 'pointer',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
        transition: 'all 0.3s ease',
        fontSize: '12px',
        fontWeight: '600',
        color: '#667eea',
        minWidth: 'auto',
        height: 'auto'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'scale(1.05)';
        e.currentTarget.style.boxShadow = '0 4px 15px rgba(0,0,0,0.15)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'scale(1)';
        e.currentTarget.style.boxShadow = '0 2px 10px rgba(0,0,0,0.1)';
      }}
    >
      <Languages size={14} />
      <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
        <span style={{ 
          opacity: language === 'en' ? 1 : 0.5,
          transition: 'opacity 0.3s ease',
          fontSize: '14px'
        }}>🇺🇸</span>
        <span style={{ fontSize: '10px', opacity: 0.7 }}>|</span>
        <span style={{ 
          opacity: language === 'pt' ? 1 : 0.5,
          transition: 'opacity 0.3s ease',
          fontSize: '14px'
        }}>🇵🇹</span>
      </span>
      
      {/* Add responsive styles */}
      <style>{`
        @media (max-width: 768px) {
          .language-toggle-btn {
            top: 8px !important;
            left: 8px !important;
            padding: 4px 8px !important;
            font-size: 11px !important;
            border-radius: 6px !important;
            gap: 4px !important;
          }
        }
        
        @media (max-width: 480px) {
          .language-toggle-btn {
            top: 6px !important;
            left: 6px !important;
            padding: 3px 6px !important;
            font-size: 10px !important;
            min-width: auto !important;
          }
        }
      `}</style>
    </button>
  );
};