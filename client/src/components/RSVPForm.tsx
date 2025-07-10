import React, { useState, useEffect } from 'react';
import { Users } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import '../styles/components.css';

interface Guest {
  id: number;
  name: string;
  email: string;
  attending: string;
  number_of_guests: number;
  confirmation_code: string;
  submitted_at: string;
}

interface RSVPFormProps {
  guests: string[];
  onAddGuest: (name: string) => void;
  onGuestAdded?: () => void;
}

export const RSVPForm: React.FC<RSVPFormProps> = ({ guests, onAddGuest, onGuestAdded }) => {
  const [guestName, setGuestName] = useState('');
  const [guestPhone, setGuestPhone] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false); // Add submission guard
  const [error, setError] = useState('');
  const [apiGuests, setApiGuests] = useState<Guest[]>([]);
  const [confirmationCode, setConfirmationCode] = useState('');
  const [showGuestList, setShowGuestList] = useState(false);
  const { t, language } = useLanguage();

  // Fetch current guests list
  const fetchGuests = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/guests');
      if (response.ok) {
        const guestData = await response.json();
        setApiGuests(guestData.filter((guest: Guest) => guest.attending === 'yes'));
      }
    } catch (error) {
      console.error('Error fetching guests:', error);
    }
  };

  // Load guests on component mount
  useEffect(() => {
    fetchGuests();
  }, []);

  const handleSubmit = async () => {
    // Prevent double submission
    if (isSubmitting || isLoading) {
      return;
    }

    if (!guestName.trim() || !guestPhone.trim()) {
      setError(language === 'pt' ? 'Por favor, insira seu nome e telefone' : 'Please enter both name and phone');
      return;
    }

    setIsLoading(true);
    setIsSubmitting(true); // Set submission guard
    setError('');

    try {
      const response = await fetch('http://localhost:5000/api/rsvp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: guestName.trim(),
          email: `${guestPhone.replace(/\s+/g, '')}@phone.temp`, // Generate a temporary email from phone
          phone: guestPhone.trim(),
          attending: 'yes',
          number_of_guests: 1,
          message: language === 'pt' ? 'Animado para participar da festa!' : 'Excited to join the party!'
        }),
      });

      const result = await response.json();

      if (response.ok) {
        // Success
        const submittedName = guestName.trim(); // Store name before clearing
        setConfirmationCode(result.confirmation_code);
        setGuestName('');
        setGuestPhone('');
        setIsSubmitted(true);
        setShowGuestList(true); // Show guest list after successful submission
        
        // Refresh the guests list
        await fetchGuests();
        
        // Call parent callback with the new guest name
        if (onAddGuest) {
          onAddGuest(submittedName);
        }
        
        // Call additional callback if provided
        if (onGuestAdded) {
          onGuestAdded();
        }

        // Hide success message after 10 seconds, but keep guest list visible
        setTimeout(() => {
          setIsSubmitted(false);
          setConfirmationCode('');
          // Keep showGuestList = true so the list remains visible
        }, 10000);
      } else {
        // Handle errors
        if (result.error === 'You have already submitted an RSVP' || 
            result.error === 'Você já confirmou presença para esta festa') {
          setError(language === 'pt' ? 'Você já confirmou presença para esta festa' : 'You have already confirmed attendance for this party');
        } else {
          setError(result.error || (language === 'pt' ? 'Falha ao confirmar presença' : 'Failed to confirm attendance'));
        }
      }
    } catch (error) {
      setError(language === 'pt' ? 'Erro de conexão. Tente novamente.' : 'Network error. Please try again.');
      console.error('Error submitting RSVP:', error);
    } finally {
      setIsLoading(false);
      // Reset submission guard after a short delay to prevent rapid clicking
      setTimeout(() => {
        setIsSubmitting(false);
      }, 1000);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSubmit();
    }
  };

  return (
    <div className="card p-8">
      <h2 className="text-4xl font-bold text-purple-600 mb-6 flex items-center gap-3">
        <Users className="text-pink-500" />
        {t.joinParty}
      </h2>

      <div className="flex flex-col gap-6">
        <div>
          <label className="text-lg font-bold text-gray-700 mb-2" style={{display: 'block'}}>
            {t.yourName}
          </label>
          <input
            type="text"
            value={guestName}
            onChange={(e) => setGuestName(e.target.value)}
            onKeyPress={handleKeyPress}
            className="input-primary"
            placeholder={t.namePlaceholder}
            disabled={isLoading}
          />
        </div>

        <div>
          <label className="text-lg font-bold text-gray-700 mb-2" style={{display: 'block'}}>
            {language === 'pt' ? 'Seu Telefone:' : 'Your Phone:'}
          </label>
          <input
            type="tel"
            value={guestPhone}
            onChange={(e) => setGuestPhone(e.target.value)}
            onKeyPress={handleKeyPress}
            className="input-primary"
            placeholder={language === 'pt' ? 'Digite seu telefone aqui...' : 'Enter your phone here...'}
            disabled={isLoading}
          />
        </div>

        <button
          onClick={handleSubmit}
          className="btn-primary"
          disabled={isLoading || isSubmitting}
          style={{
            opacity: (isLoading || isSubmitting) ? 0.7 : 1,
            cursor: (isLoading || isSubmitting) ? 'not-allowed' : 'pointer'
          }}
        >
          {isLoading ? t.submitting : t.submitButton}
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mt-4 p-4 bg-red-100 border border-red-300 rounded-lg">
          <div className="text-red-700 font-bold">
            ❌ {error}
          </div>
        </div>
      )}

      {/* Success Message */}
      {isSubmitted && (
        <div className="mt-4 p-4 bg-green-100 border border-green-300 rounded-lg">
          <div className="text-green-700 font-bold text-lg">
            {t.successMessage}
          </div>
          {confirmationCode && (
            <div className="text-green-600 mt-2">
              {t.confirmationCode} <strong>{confirmationCode}</strong>
            </div>
          )}
        </div>
      )}

      {/* Guest List - Only show after successful submission */}
      {showGuestList && apiGuests.length > 0 && (
        <div className="mt-8">
          <h3 className="text-xl font-bold text-purple-600 mb-4">
            {t.partyHeroes} ({apiGuests.length}):
          </h3>
          <div className="max-h-32 overflow-y-auto flex flex-col gap-2">
            {/* Only display API guests - single source of truth */}
            {apiGuests.map((guest, index) => (
              <div
                key={guest.id || `api-guest-${index}`}
                className="guest-item"
              >
                🎈 {guest.name}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};