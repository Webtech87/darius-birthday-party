// src/components/LanguageToggle.tsx
import React from 'react';
import { Languages } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

export const LanguageToggle: React.FC = () => {
  const { language, setLanguage } = useLanguage();

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'pt' : 'en');
  };

  return (
    <>
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
          borderRadius: '10px',
          padding: '8px 12px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          cursor: 'pointer',
          boxShadow: '0 2px 15px rgba(0,0,0,0.1)',
          transition: 'all 0.3s ease',
          fontSize: '13px',
          fontWeight: '600',
          color: '#667eea',
          minWidth: '80px',
          minHeight: '44px', // Better touch target
          justifyContent: 'center',
          userSelect: 'none',
          WebkitUserSelect: 'none',
          WebkitTapHighlightColor: 'transparent'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'scale(1.05)';
          e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.15)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'scale(1)';
          e.currentTarget.style.boxShadow = '0 2px 15px rgba(0,0,0,0.1)';
        }}
        onTouchStart={(e) => {
          // Provide immediate visual feedback on touch
          e.currentTarget.style.transform = 'scale(0.95)';
          e.currentTarget.style.opacity = '0.8';
        }}
        onTouchEnd={(e) => {
          // Reset visual state
          setTimeout(() => {
            e.currentTarget.style.transform = 'scale(1)';
            e.currentTarget.style.opacity = '1';
          }, 150);
        }}
      >
        <Languages size={16} />
        <span style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '4px',
          fontSize: '16px'
        }}>
          <span style={{ 
            opacity: language === 'en' ? 1 : 0.4,
            transition: 'opacity 0.3s ease',
            filter: language === 'en' ? 'none' : 'grayscale(50%)'
          }}>🇺🇸</span>
          <span style={{ 
            fontSize: '12px', 
            opacity: 0.6,
            margin: '0 2px'
          }}>|</span>
          <span style={{ 
            opacity: language === 'pt' ? 1 : 0.4,
            transition: 'opacity 0.3s ease',
            filter: language === 'pt' ? 'none' : 'grayscale(50%)'
          }}>🇵🇹</span>
        </span>
      </button>

      {/* Enhanced mobile-friendly styles */}
      <style>{`
        .language-toggle-btn {
          touch-action: manipulation;
          -webkit-touch-callout: none;
          -webkit-user-select: none;
          -khtml-user-select: none;
          -moz-user-select: none;
          -ms-user-select: none;
          user-select: none;
        }
        
        @media (max-width: 768px) {
          .language-toggle-btn {
            top: 12px !important;
            left: 12px !important;
            padding: 10px 14px !important;
            min-height: 48px !important;
            min-width: 85px !important;
            font-size: 14px !important;
            border-radius: 12px !important;
            gap: 10px !important;
            border-width: 3px !important;
          }
        }
        
        @media (max-width: 480px) {
          .language-toggle-btn {
            top: 10px !important;
            left: 10px !important;
            padding: 8px 12px !important;
            min-height: 44px !important;
            min-width: 75px !important;
            font-size: 13px !important;
            border-radius: 10px !important;
            gap: 8px !important;
          }
        }
        
        /* Ensure button is above other elements on mobile */
        @media (max-width: 768px) {
          .language-toggle-btn {
            z-index: 9999 !important;
          }
        }
        
        /* Add active state for mobile */
        .language-toggle-btn:active {
          transform: scale(0.95) !important;
          opacity: 0.8 !important;
        }
        
        /* Improve contrast on mobile */
        @media (max-width: 768px) {
          .language-toggle-btn {
            background: rgba(255, 255, 255, 0.98) !important;
            backdrop-filter: blur(15px) !important;
            box-shadow: 0 4px 20px rgba(0,0,0,0.15) !important;
          }
        }
      `}</style>
    </>
  );
};