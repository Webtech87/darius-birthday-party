import React from 'react';
import { Calendar, Clock, MapPin, Gift } from 'lucide-react';
import '../styles/components.css';

export const PartyDetails: React.FC = () => (
  <div className="card p-8">
    <h2 className="text-4xl font-bold text-purple-600 mb-6 flex items-center gap-3">
      <Gift className="text-pink-500" />
      Party Details
    </h2>
    
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-4 text-lg">
        <Calendar className="text-blue-500 flex-shrink-0" size={28} />
        <div>
          <div className="font-bold text-gray-800">Saturday, July 27th</div>
          <div className="text-gray-600">Don't miss the fun!</div>
        </div>
      </div>

      <div className="flex items-center gap-4 text-lg">
        <Clock className="text-green-500 flex-shrink-0" size={28} />
        <div>
          <div className="font-bold text-gray-800">All Day Fun!</div>
          <div className="text-gray-600">Come whenever you can</div>
        </div>
      </div>

      <div className="flex items-center gap-4 text-lg">
        <MapPin className="text-red-500 flex-shrink-0" size={28} />
        <div>
          <div className="font-bold text-gray-800">Our House</div>
          <div className="text-gray-600">The best party spot!</div>
        </div>
      </div>
    </div>

    {/* Fun Activities */}
    <div className="mt-8">
      <h3 className="text-2xl font-bold text-purple-600 mb-4">🎪 What We'll Have:</h3>
      <div className="grid grid-cols-2 gap-4">
        <div className="activity-card bg-gradient-red-pink hover-rotate-3 transition-transform">
          🍖 Grilled Food
        </div>
        <div className="activity-card bg-gradient-blue-cyan hover-rotate-neg-3 transition-transform">
          🏊‍♂️ Pool Fun
        </div>
        <div className="activity-card bg-gradient-green-emerald hover-rotate-3 transition-transform">
          🤸‍♂️ Trampolines
        </div>
        <div className="activity-card bg-gradient-purple-pink hover-rotate-neg-3 transition-transform">
          🎵 Music & Dancing
        </div>
      </div>
    </div>
  </div>
);