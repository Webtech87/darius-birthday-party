import React, { useState, useEffect } from 'react';
import { Users, Trash2 } from 'lucide-react';
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
  guests: Guest[];
  onAddGuest: () => void;
  onClearGuests?: () => void;
  isAdmin?: boolean;
  onGuestAdded?: () => void;
}

export const RSVPForm: React.FC<RSVPFormProps> = ({ 
  guests, 
  onAddGuest, 
  onClearGuests, 
  isAdmin = false, 
  onGuestAdded 
}) => {
  const [guestName, setGuestName] = useState('');
  const [guestPhone, setGuestPhone] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [apiGuests, setApiGuests] = useState<Guest[]>([]);
  const [confirmationCode, setConfirmationCode] = useState('');
  const [showGuestList, setShowGuestList] = useState(false);
  const [isClearingGuests, setIsClearingGuests] = useState(false);
  const { t, language } = useLanguage();

  // Check if current user is admin based on URL params
  const isAdminMode = () => {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('admin') === 'darius' || isAdmin;
  };

  // Fetch current guests list
  const fetchGuests = async () => {
    try {
      const response = await fetch('https://darius-birthday-party.onrender.com/api/guests');
      if (response.ok) {
        const guestData = await response.json();
        const attendingGuests = guestData.filter((guest: Guest) => guest.attending === 'yes');
        setApiGuests(attendingGuests);
        
        // Show guest list ONLY if admin mode is active
        if (attendingGuests.length > 0 && isAdminMode()) {
          setShowGuestList(true);
        }
      }
    } catch (error) {
      console.error('Error fetching guests:', error);
    }
  };

  // Load guests on component mount
  useEffect(() => {
    fetchGuests();
  }, []);

  // Update local state when props change
  useEffect(() => {
    if (guests && guests.length > 0) {
      setApiGuests(guests);
      // Only show guest list in admin mode
      setShowGuestList(isAdminMode());
    }
  }, [guests]);

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
    setIsSubmitting(true);
    setError('');

    try {
      const response = await fetch('https://darius-birthday-party.onrender.com/api/rsvp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: guestName.trim(),
          email: `${guestPhone.replace(/\s+/g, '')}@phone.temp`,
          phone: guestPhone.trim(),
          attending: 'yes',
          number_of_guests: 1,
          message: language === 'pt' ? 'Animado para participar da festa!' : 'Excited to join the party!'
        }),
      });

      const result = await response.json();

      if (response.ok) {
        // Success
        setConfirmationCode(result.confirmation_code);
        setGuestName('');
        setGuestPhone('');
        setIsSubmitted(true);
        
        // Only show guest list in admin mode after adding
        if (isAdminMode()) {
          setShowGuestList(true);
        }
        
        // Refresh the guests list
        await fetchGuests();
        
        // Call parent callback
        if (onAddGuest) {
          onAddGuest();
        }
        
        // Call additional callback if provided
        if (onGuestAdded) {
          onGuestAdded();
        }

        // Hide success message after 10 seconds
        setTimeout(() => {
          setIsSubmitted(false);
          setConfirmationCode('');
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
      setTimeout(() => {
        setIsSubmitting(false);
      }, 1000);
    }
  };

  const handleClearGuests = async () => {
    if (!isAdminMode() || isClearingGuests) return;

    const confirmClear = window.confirm(
      language === 'pt' 
        ? `Tem certeza que deseja remover todos os ${apiGuests.length} convidados? Esta ação não pode ser desfeita.`
        : `Are you sure you want to remove all ${apiGuests.length} guests? This action cannot be undone.`
    );
    
    if (!confirmClear) return;

    setIsClearingGuests(true);

    try {
      const response = await fetch('https://darius-birthday-party.onrender.com/api/clear-guests', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const result = await response.json();
        setApiGuests([]);
        setShowGuestList(false);
        
        alert(
          language === 'pt' 
            ? `Lista limpa com sucesso! ${result.deleted_count || 0} convidados removidos.`
            : `List cleared successfully! ${result.deleted_count || 0} guests removed.`
        );

        // Call parent callback if provided
        if (onClearGuests) {
          onClearGuests();
        }
      } else {
        alert(
          language === 'pt' 
            ? 'Erro ao limpar lista de convidados'
            : 'Error clearing guest list'
        );
      }
    } catch (error) {
      console.error('Error clearing guests:', error);
      alert(
        language === 'pt' 
          ? 'Erro de conexão ao limpar lista'
          : 'Network error while clearing list'
      );
    } finally {
      setIsClearingGuests(false);
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

      {/* Guest List - ONLY VISIBLE TO ADMIN */}
      {showGuestList && apiGuests.length > 0 && isAdminMode() && (
        <div className="mt-8">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold text-purple-600">
              {t.partyHeroes} ({apiGuests.length}):
            </h3>
            
            {/* Admin Clear Button - Only visible to admin */}
            <button
              onClick={handleClearGuests}
              disabled={isClearingGuests}
              className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-sm font-bold disabled:opacity-50"
              title={language === 'pt' ? 'Limpar toda a lista' : 'Clear entire list'}
            >
              <Trash2 size={16} />
              {isClearingGuests 
                ? (language === 'pt' ? 'Limpando...' : 'Clearing...') 
                : (language === 'pt' ? 'Limpar Lista' : 'Clear List')
              }
            </button>
          </div>
          
          <div className="max-h-32 overflow-y-auto flex flex-col gap-2">
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

      {/* Admin Debug Info - Only visible to admin */}
      {isAdminMode() && (
        <div className="mt-4 p-3 bg-yellow-100 border border-yellow-300 rounded-lg">
          <div className="text-yellow-800 text-sm">
            🔧 <strong>Admin Mode Active</strong> - You can see the guest list and manage guests
          </div>
        </div>
      )}
    </div>
  );
};