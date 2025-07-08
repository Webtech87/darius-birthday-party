import React, { useState, useEffect } from 'react';
import { Users } from 'lucide-react';
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
  onGuestAdded?: () => void;
}

export const RSVPForm: React.FC<RSVPFormProps> = ({ onGuestAdded }) => {
  const [guestName, setGuestName] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [guests, setGuests] = useState<Guest[]>([]);
  const [confirmationCode, setConfirmationCode] = useState('');

  // Fetch current guests list
  const fetchGuests = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/guests');
      if (response.ok) {
        const guestData = await response.json();
        setGuests(guestData.filter((guest: Guest) => guest.attending === 'yes'));
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
      setError('Please enter both name and email');
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
          message: `Excited to join the party!`
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
        
        // Call parent callback if provided
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
        setError(result.error || 'Failed to submit RSVP');
      }
    } catch (error) {
      setError('Network error. Please try again.');
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
        Join the Party!
      </h2>

      <div className="flex flex-col gap-6">
        <div>
          <label className="text-lg font-bold text-gray-700 mb-2" style={{display: 'block'}}>
            Your Name:
          </label>
          <input
            type="text"
            value={guestName}
            onChange={(e) => setGuestName(e.target.value)}
            onKeyPress={handleKeyPress}
            className="input-primary"
            placeholder="Enter your name here..."
            disabled={isLoading}
          />
        </div>

        <div>
          <label className="text-lg font-bold text-gray-700 mb-2" style={{display: 'block'}}>
            Your Email:
          </label>
          <input
            type="email"
            value={guestEmail}
            onChange={(e) => setGuestEmail(e.target.value)}
            onKeyPress={handleKeyPress}
            className="input-primary"
            placeholder="Enter your email here..."
            disabled={isLoading}
          />
        </div>

        <button
          onClick={handleSubmit}
          className="btn-primary"
          disabled={isLoading}
        >
          {isLoading ? '⏳ Submitting...' : '🎉 Yes, I\'m Coming! 🎉'}
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
            🎊 Awesome! Can't wait to see you there! 🎊
          </div>
          {confirmationCode && (
            <div className="text-green-600 mt-2">
              Your confirmation code: <strong>{confirmationCode}</strong>
            </div>
          )}
        </div>
      )}

      {/* Guest List */}
      {guests.length > 0 && (
        <div className="mt-8">
          <h3 className="text-xl font-bold text-purple-600 mb-4">
            🌟 Party Heroes ({guests.length}):
          </h3>
          <div className="max-h-32 overflow-y-auto flex flex-col gap-2">
            {guests.map((guest, index) => (
              <div
                key={guest.id || index}
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