import React from 'react';
import { Calendar, Clock, MapPin, Gift } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import '../styles/components.css';

export const PartyDetails: React.FC = () => {
  const { t } = useLanguage();

  return (
    <div className="card p-8">
      <h2 className="text-4xl font-bold text-purple-600 mb-6 flex items-center gap-3">
        <Gift className="text-pink-500" />
        {t.partyDetails}
      </h2>
      
      <div className="flex flex-col gap-6">
        <div className="flex items-center gap-4 text-lg">
          <Calendar className="text-blue-500 flex-shrink-0" size={28} />
          <div>
            <div className="font-bold text-gray-800">{t.dateText}</div>
            <div className="text-gray-600">{t.dateSubtext}</div>
          </div>
        </div>

        <div className="flex items-center gap-4 text-lg">
          <Clock className="text-green-500 flex-shrink-0" size={28} />
          <div>
            <div className="font-bold text-gray-800">{t.timeText}</div>
            <div className="text-gray-600">{t.timeSubtext}</div>
          </div>
        </div>

        <div className="flex items-center gap-4 text-lg">
          <MapPin className="text-red-500 flex-shrink-0" size={28} />
          <div>
            <div className="font-bold text-gray-800">{t.locationText}</div>
            <div className="text-gray-600">{t.locationSubtext}</div>
          </div>
        </div>
      </div>

      {/* Fun Activities */}
      <div className="mt-8">
        <h3 className="text-2xl font-bold text-purple-600 mb-4">{t.activitiesTitle}</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="activity-card bg-gradient-red-pink hover-rotate-3 transition-transform">
            {t.grilledFood}
          </div>
          <div className="activity-card bg-gradient-blue-cyan hover-rotate-neg-3 transition-transform">
            {t.poolFun}
          </div>
          <div className="activity-card bg-gradient-green-emerald hover-rotate-3 transition-transform">
            {t.trampolines}
          </div>
          <div className="activity-card bg-gradient-purple-pink hover-rotate-neg-3 transition-transform">
            {t.musicDancing}
          </div>
        </div>
      </div>
    </div>
  );
};