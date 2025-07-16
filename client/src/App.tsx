import { useState, useEffect, useRef } from 'react';
import { Star, Gift, Cake, Music, Sparkles, Volume2, VolumeX } from 'lucide-react';
import { ConfettiPiece } from './components/ConfettiPiece';
import { FloatingIcon } from './components/FloatingIcon';
import { PartyDetails } from './components/PartyDetails';
import { RSVPForm } from './components/RSVPForm';
import { LanguageToggle } from './components/LanguageToggle';
import { LanguageProvider, useLanguage } from './contexts/LanguageContext';
import './styles/App.css';

function AppContent() {
  const [guests, setGuests] = useState<string[]>([]);
  const [showConfetti, setShowConfetti] = useState(true);
  const [isMusicPlaying, setIsMusicPlaying] = useState(false);
  const [musicReady, setMusicReady] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const { t } = useLanguage();

  // Page fade-in effect
  useEffect(() => {
    // Ensure the page starts hidden
    setIsLoaded(false);
    
    const timer = setTimeout(() => {
      setIsLoaded(true);
    }, 300); // Increased delay to ensure smooth transition
    
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => setShowConfetti(false), 5000);
    return () => clearTimeout(timer);
  }, []);

  // Auto-start music when component mounts
  useEffect(() => {
    const startMusic = async () => {
      if (audioRef.current) {
        // Set volume programmatically
        audioRef.current.volume = 0.6;
        
        try {
          // Try to play immediately
          await audioRef.current.play();
          setIsMusicPlaying(true);
          setMusicReady(true);
        } catch (error) {
          // If autoplay is blocked, wait for user interaction
          console.log("Autoplay blocked, waiting for user interaction");
          setMusicReady(true);
          
          // Add event listener for any user interaction
          const playOnInteraction = async () => {
            try {
              await audioRef.current?.play();
              setIsMusicPlaying(true);
              // Remove event listeners after successful play
              document.removeEventListener('click', playOnInteraction);
              document.removeEventListener('keydown', playOnInteraction);
              document.removeEventListener('scroll', playOnInteraction);
            } catch (err) {
              console.log("Still unable to play audio");
            }
          };

          // Listen for any user interaction
          document.addEventListener('click', playOnInteraction);
          document.addEventListener('keydown', playOnInteraction);
          document.addEventListener('scroll', playOnInteraction);
          
          // Cleanup listeners after 30 seconds
          setTimeout(() => {
            document.removeEventListener('click', playOnInteraction);
            document.removeEventListener('keydown', playOnInteraction);
            document.removeEventListener('scroll', playOnInteraction);
          }, 30000);
        }
      }
    };

    // Small delay to ensure component is fully mounted
    const musicTimer = setTimeout(startMusic, 1000); // Increased delay to work with fade-in
    
    return () => clearTimeout(musicTimer);
  }, []);

  // Function to toggle music
  const toggleMusic = () => {
    if (audioRef.current) {
      if (isMusicPlaying) {
        audioRef.current.pause();
        setIsMusicPlaying(false);
      } else {
        audioRef.current.play();
        setIsMusicPlaying(true);
      }
    }
  };

  const handleAddGuest = (name: string) => {
    setGuests([...guests, name]);
  };

  const confettiColors = ['bg-red-500', 'bg-blue-500', 'bg-yellow-500', 'bg-green-500', 'bg-pink-500', 'bg-purple-500'];

  return (
    <div 
      className={`main-layout transition-all duration-[1200ms] ease-out ${
        isLoaded 
          ? 'opacity-100 translate-y-0' 
          : 'opacity-0 translate-y-6'
      }`}
      style={{
        transition: 'opacity 1.2s ease-out, transform 1.2s ease-out'
      }}
    >
      {/* Language Toggle */}
      <div 
        className={`transition-all duration-[1000ms] ease-out ${
          isLoaded 
            ? 'opacity-100 translate-y-0' 
            : 'opacity-0 translate-y-4'
        }`}
        style={{
          transitionDelay: isLoaded ? '200ms' : '0ms',
          transition: 'opacity 1s ease-out, transform 1s ease-out'
        }}
      >
        <LanguageToggle />
      </div>

      {/* Background Music - Hidden Audio Element */}
      <audio
        ref={audioRef}
        loop
        preload="auto"
        onLoadedData={() => setMusicReady(true)}
        onPlay={() => setIsMusicPlaying(true)}
        onPause={() => setIsMusicPlaying(false)}
        style={{ display: 'none' }}
      >
        {/* Add your music file to the public folder */}
        <source src="/birthday-music.mp3" type="audio/mpeg" />
        <source src="/birthday-music.ogg" type="audio/ogg" />
        <source src="/birthday-music.wav" type="audio/wav" />
        {t.audioNotSupported}
      </audio>

      {/* Subtle Music Control Button (appears only when music is ready) */}
      {musicReady && (
        <button
          onClick={toggleMusic}
          className={`music-control-btn transition-all duration-[1000ms] ease-out ${
            isLoaded 
              ? 'opacity-80 translate-y-0' 
              : 'opacity-0 translate-y-4'
          }`}
          title={isMusicPlaying ? t.musicPause : t.musicPlay}
          style={{
            position: 'fixed',
            top: '10px',
            right: '10px',
            zIndex: 1000,
            background: 'rgba(255, 255, 255, 0.9)',
            backdropFilter: 'blur(10px)',
            border: 'none',
            borderRadius: '50%',
            width: '44px',
            height: '44px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
            transitionDelay: isLoaded ? '300ms' : '0ms',
            transition: 'all 0.3s ease, opacity 1s ease-out, transform 1s ease-out'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.opacity = '1';
            e.currentTarget.style.transform = 'scale(1.1)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.opacity = '0.8';
            e.currentTarget.style.transform = 'scale(1)';
          }}
        >
          {isMusicPlaying ? (
            <Volume2 className="text-purple-600" size={18} />
          ) : (
            <VolumeX className="text-gray-500" size={18} />
          )}
        </button>
      )}

      {/* Floating Confetti */}
      {showConfetti && isLoaded && (
        <div className="fixed inset-0 pointer-events-none z-10">
          {Array.from({ length: 30 }).map((_, i) => (
            <ConfettiPiece
              key={i}
              color={confettiColors[i % confettiColors.length]}
              delay={i * 0.1 + 0.5} // Added extra delay for fade-in
            />
          ))}
        </div>
      )}

      {/* Floating Icons */}
      <div 
        className={`transition-all duration-[1000ms] ease-out ${
          isLoaded 
            ? 'opacity-100 translate-y-0' 
            : 'opacity-0 translate-y-4'
        }`}
        style={{
          transitionDelay: isLoaded ? '400ms' : '0ms',
          transition: 'opacity 1s ease-out, transform 1s ease-out'
        }}
      >
        <FloatingIcon icon={Star} delay={0.5} position="top-10 left-10" />
        <FloatingIcon icon={Gift} delay={1.5} position="top-20 right-20" />
        <FloatingIcon icon={Sparkles} delay={2.5} position="bottom-20 left-20" />
        <FloatingIcon icon={Music} delay={2} position="top-40 left-1/3" />
      </div>

      <div className="container py-8 relative z-20">
        {/* Header */}
        <div 
          className={`main-header transition-all duration-[1000ms] ease-out ${
            isLoaded 
              ? 'opacity-100 translate-y-0' 
              : 'opacity-0 translate-y-6'
          }`}
          style={{
            transitionDelay: isLoaded ? '500ms' : '0ms',
            transition: 'opacity 1s ease-out, transform 1s ease-out'
          }}
        >
          <div>
            <h1 className="main-title">
              {t.mainTitle}
            </h1>
          </div>
        </div>

        {/* Main Content Grid */}
        <div 
          className={`content-grid transition-all duration-[1000ms] ease-out ${
            isLoaded 
              ? 'opacity-100 translate-y-0' 
              : 'opacity-0 translate-y-6'
          }`}
          style={{
            transitionDelay: isLoaded ? '700ms' : '0ms',
            transition: 'opacity 1s ease-out, transform 1s ease-out'
          }}
        >
          <PartyDetails />
          <RSVPForm guests={guests} onAddGuest={handleAddGuest} />
        </div>

        {/* Special Message */}
        <div 
          className={`text-center mt-12 transition-all duration-[1000ms] ease-out ${
            isLoaded 
              ? 'opacity-100 translate-y-0' 
              : 'opacity-0 translate-y-6'
          }`}
          style={{
            transitionDelay: isLoaded ? '900ms' : '0ms',
            transition: 'opacity 1s ease-out, transform 1s ease-out'
          }}
        >
          <div className="message-box">
            <h3 className="text-3xl font-bold text-purple-600 mb-4">
              {t.specialMessageTitle}
            </h3>
            <p className="text-lg text-gray-700 leading-relaxed">
              {t.specialMessage}
            </p>
            <div className="mt-6 text-2xl">
              🎈🎁🎪🎊🎉🎂🍰🎵
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function App() {
  return (
    <LanguageProvider>
      <AppContent />
    </LanguageProvider>
  );
}

export default App;