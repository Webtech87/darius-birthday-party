import { useState, useEffect, useRef } from 'react';
import { Star, Gift, Cake, Music, Sparkles, Volume2, VolumeX } from 'lucide-react';
import { ConfettiPiece } from './components/ConfettiPiece';
import { FloatingIcon } from './components/FloatingIcon';
import { PartyDetails } from './components/PartyDetails';
import { RSVPForm } from './components/RSVPForm';
import './styles/App.css';

function App() {
  const [guests, setGuests] = useState<string[]>([]);
  const [showConfetti, setShowConfetti] = useState(true);
  const [isMusicPlaying, setIsMusicPlaying] = useState(false);
  const [musicReady, setMusicReady] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

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
    const musicTimer = setTimeout(startMusic, 500);
    
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
    <div className="main-layout">
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
        Your browser does not support the audio element.
      </audio>

      {/* Subtle Music Control Button (appears only when music is ready) */}
      {musicReady && (
        <button
          onClick={toggleMusic}
          className="music-control-btn"
          title={isMusicPlaying ? "Pause music" : "Play music"}
          style={{
            position: 'fixed',
            top: '20px',
            right: '20px',
            zIndex: 1000,
            background: 'rgba(255, 255, 255, 0.8)',
            backdropFilter: 'blur(10px)',
            border: 'none',
            borderRadius: '50%',
            width: '50px',
            height: '50px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
            transition: 'all 0.3s ease',
            opacity: 0.7
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.opacity = '1';
            e.currentTarget.style.transform = 'scale(1.1)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.opacity = '0.7';
            e.currentTarget.style.transform = 'scale(1)';
          }}
        >
          {isMusicPlaying ? (
            <Volume2 className="text-purple-600" size={20} />
          ) : (
            <VolumeX className="text-gray-500" size={20} />
          )}
        </button>
      )}

      {/* Floating Confetti */}
      {showConfetti && (
        <div className="fixed inset-0 pointer-events-none z-10">
          {Array.from({ length: 30 }).map((_, i) => (
            <ConfettiPiece
              key={i}
              color={confettiColors[i % confettiColors.length]}
              delay={i * 0.1}
            />
          ))}
        </div>
      )}

      {/* Floating Icons */}
      <FloatingIcon icon={Star} delay={0} position="top-10 left-10" />
      <FloatingIcon icon={Gift} delay={1} position="top-20 right-20" />
      <FloatingIcon icon={Sparkles} delay={2} position="bottom-20 left-20" />
      <FloatingIcon icon={Music} delay={1.5} position="top-40 left-1/3" />

      <div className="container py-8 relative z-20">
        {/* Header */}
        <div className="main-header">
          <div>
            <h1 className="main-title">
              🎉 DARIUS IS 4! 🎉
            </h1>
            <div className="subtitle-container">
              <Cake className="cake-icon" />
              <span>Birthday Party!</span>
              <Cake className="cake-icon-reverse" />
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="content-grid">
          <PartyDetails />
          <RSVPForm guests={guests} onAddGuest={handleAddGuest} />
        </div>

        {/* Special Message */}
        <div className="text-center mt-12">
          <div className="message-box">
            <h3 className="text-3xl font-bold text-purple-600 mb-4">
              🎂 Special Birthday Message 🎂
            </h3>
            <p className="text-lg text-gray-700 leading-relaxed">
              Join us as we celebrate our amazing Darius turning 4! 
              It's going to be an unforgettable day filled with laughter, 
              games, delicious food, and so much fun. Bring your swimsuit, 
              your appetite, and get ready to party! 
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

export default App;