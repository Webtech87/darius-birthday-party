// src/contexts/LanguageContext.tsx
import React, { createContext, useContext, useState, ReactNode } from 'react';

export type Language = 'en' | 'pt';

interface Translations {
  // App.tsx
  mainTitle: string;
  specialMessageTitle: string;
  specialMessage: string;
  musicPause: string;
  musicPlay: string;
  audioNotSupported: string;
  
  // PartyDetails.tsx
  partyDetails: string;
  dateText: string;
  dateSubtext: string;
  timeText: string;
  timeSubtext: string;
  locationText: string;
  locationSubtext: string;
  activitiesTitle: string;
  grilledFood: string;
  poolFun: string;
  trampolines: string;
  musicDancing: string;
  
  // RSVPForm.tsx
  joinParty: string;
  yourName: string;
  yourEmail: string;
  namePlaceholder: string;
  emailPlaceholder: string;
  submitButton: string;
  submitting: string;
  successMessage: string;
  confirmationCode: string;
  partyHeroes: string;
  errorNameEmail: string;
  errorAlreadyRsvped: string;
  errorNetwork: string;
  errorSubmit: string;
}

const translations: Record<Language, Translations> = {
  en: {
    // App.tsx
    mainTitle: "🎉 Churrasquinho do Dede!",
    specialMessageTitle: "🎂 Special Birthday Message 🎂",
    specialMessage: "Join us as we celebrate our amazing Darius turning 4! It's going to be an unforgettable day filled with laughter, games, delicious food, and so much fun. Bring your swimsuit, your appetite, and get ready to party!",
    musicPause: "Pause music",
    musicPlay: "Play music",
    audioNotSupported: "Your browser does not support the audio element.",
    
    // PartyDetails.tsx
    partyDetails: "Party Details",
    dateText: "Saturday, July 26th at 5:00 PM",
    dateSubtext: "Don't miss the fun!",
    timeText: "Starting at 5:00 PM",
    timeSubtext: "Come and celebrate with us!",
    locationText: "Urbanização Quinta do Eucalipto nº4",
    locationSubtext: "8005-227 Faro",
    activitiesTitle: "🎪 What We'll Have:",
    grilledFood: "🍖 Grilled Food",
    poolFun: "🏊‍♂️ Pool Fun",
    trampolines: "🤸‍♂️ Trampolines",
    musicDancing: "🎵 Music & Dancing",
    
    // RSVPForm.tsx
    joinParty: "Join the Party!",
    yourName: "Your Name:",
    yourEmail: "Your Email:",
    namePlaceholder: "Enter your name here...",
    emailPlaceholder: "Enter your email here...",
    submitButton: "🎉 Yes, I'm Coming! 🎉",
    submitting: "⏳ Submitting...",
    successMessage: "🎊 Awesome! Can't wait to see you there! 🎊",
    confirmationCode: "Your confirmation code:",
    partyHeroes: "🌟 Party Heroes",
    errorNameEmail: "Please enter both name and email",
    errorAlreadyRsvped: "You have already confirmed attendance for this party",
    errorNetwork: "Network error. Please try again.",
    errorSubmit: "Failed to confirm attendance"
  },
  pt: {
    // App.tsx
    mainTitle: "🎉 Churrasquinho do Dede!",
    specialMessageTitle: "🎂 Mensagem Especial de Aniversário 🎂",
    specialMessage: "Junte-se a nós para celebrar o nosso incrível Darius que está fazendo 4 anos! Vai ser um dia inesquecível cheio de risos, jogos, comida deliciosa e muita diversão. Traga o seu fato de banho, o seu apetite e prepare-se para a festa!",
    musicPause: "Pausar música",
    musicPlay: "Tocar música",
    audioNotSupported: "Seu navegador não suporta o elemento de áudio.",
    
    // PartyDetails.tsx
    partyDetails: "Detalhes da Festa",
    dateText: "Sábado 26 de julho às 17 horas",
    dateSubtext: "Não perca a diversão!",
    timeText: "Começando às 17 horas",
    timeSubtext: "Venha celebrar conosco!",
    locationText: "Urbanização Quinta do Eucalipto nº4",
    locationSubtext: "8005-227 Faro",
    activitiesTitle: "🎪 O Que Teremos:",
    grilledFood: "🍖 Comida Grelhada",
    poolFun: "🏊‍♂️ Diversão na Piscina",
    trampolines: "🤸‍♂️ Trampolins",
    musicDancing: "🎵 Música e Dança",
    
    // RSVPForm.tsx
    joinParty: "Participe da Festa!",
    yourName: "Seu Nome:",
    yourEmail: "Seu Email:",
    namePlaceholder: "Digite seu nome aqui...",
    emailPlaceholder: "Digite seu email aqui...",
    submitButton: "🎉 Sim, Eu Vou! 🎉",
    submitting: "⏳ Confirmando...",
    successMessage: "🎊 Incrível! Mal posso esperar para te ver lá! 🎊",
    confirmationCode: "Seu código de confirmação:",
    partyHeroes: "🌟 Heróis da Festa",
    errorNameEmail: "Por favor, insira seu nome e email",
    errorAlreadyRsvped: "Você já confirmou presença para esta festa",
    errorNetwork: "Erro de conexão. Tente novamente.",
    errorSubmit: "Falha ao confirmar presença"
  }
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: Translations;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

interface LanguageProviderProps {
  children: ReactNode;
}

export const LanguageProvider: React.FC<LanguageProviderProps> = ({ children }) => {
  const [language, setLanguage] = useState<Language>('en');

  const value = {
    language,
    setLanguage,
    t: translations[language]
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

export default LanguageContext;