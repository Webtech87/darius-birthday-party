import React, { useState } from 'react';
import { Users } from 'lucide-react';
import '../styles/components.css';

interface RSVPFormProps {
  guests: string[];
  onAddGuest: (name: string) => void;
}

export const RSVPForm: React.FC<RSVPFormProps> = ({ guests, onAddGuest }) => {
  const [guestName, setGuestName] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = () => {
    if (guestName.trim()) {
      onAddGuest(guestName.trim());
      setGuestName('');
      setIsSubmitted(true);
      setTimeout(() => setIsSubmitted(false), 3000);
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
            className="input-primary"
            placeholder="Enter your name here..."
          />
        </div>

        <button
          onClick={handleSubmit}
          className="btn-primary"
        >
          🎉 Yes, I'm Coming! 🎉
        </button>
      </div>

      {isSubmitted && (
        <div className="success-message">
          <div className="text-green-700 font-bold text-lg">
            🎊 Awesome! Can't wait to see you there! 🎊
          </div>
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
                key={index}
                className="guest-item"
              >
                🎈 {guest}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};