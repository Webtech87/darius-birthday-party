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
  const [guestEmail, setGuestEmail] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [apiGuests, setApiGuests] = useState<Guest[]>([]);
  const [confirmationCode, setConfirmationCode] = useState('');
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
    if (!guestName.trim() || !guestEmail.trim()) {
      setError(t.errorNameEmail);
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('http://localhost:5000/api/rsvp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: guestName.trim(),
          email: guestEmail.trim(),
          attending: 'yes',
          number_of_guests: 1,
          message: language === 'pt' ? `Animado para participar da festa!` : `Excited to join the party!`
        }),
      });

      const result = await response.json();

      if (response.ok) {
        // Success
        setConfirmationCode(result.confirmation_code);
        setGuestName('');
        setGuestEmail('');
        setIsSubmitted(true);
        
        // Refresh the guests list
        await fetchGuests();
        
        // Call parent callback with the new guest name
        if (onAddGuest) {
          onAddGuest(guestName.trim());
        }
        
        // Call additional callback if provided
        if (onGuestAdded) {
          onGuestAdded();
        }

        // Hide success message after 5 seconds
        setTimeout(() => {
          setIsSubmitted(false);
          setConfirmationCode('');
        }, 5000);
      } else {
        // Handle errors
        if (result.error === 'You have already submitted an RSVP' || 
            result.error === 'Você já confirmou presença para esta festa') {
          setError(t.errorAlreadyRsvped);
        } else {
          setError(result.error || t.errorSubmit);
        }
      }
    } catch (error) {
      setError(t.errorNetwork);
      console.error('Error submitting RSVP:', error);
    } finally {
      setIsLoading(false);
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
            {t.yourEmail}
          </label>
          <input
            type="email"
            value={guestEmail}
            onChange={(e) => setGuestEmail(e.target.value)}
            onKeyPress={handleKeyPress}
            className="input-primary"
            placeholder={t.emailPlaceholder}
            disabled={isLoading}
          />
        </div>

        <button
          onClick={handleSubmit}
          className="btn-primary"
          disabled={isLoading}
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

      {/* Guest List */}
      {(guests.length > 0 || apiGuests.length > 0) && (
        <div className="mt-8">
          <h3 className="text-xl font-bold text-purple-600 mb-4">
            {t.partyHeroes} ({guests.length + apiGuests.length}):
          </h3>
          <div className="max-h-32 overflow-y-auto flex flex-col gap-2">
            {/* Display guests from props first */}
            {guests.map((guest, index) => (
              <div
                key={`prop-guest-${index}`}
                className="guest-item"
              >
                🎈 {guest}
              </div>
            ))}
            {/* Then display API guests */}
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