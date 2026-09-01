import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useTriageStore } from '../../stores/triageStore';
import FacilityCard from '../../components/facility/FacilityCard';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Sparkles, Building2, Navigation, RefreshCw } from 'lucide-react';
import { facilitiesApi } from '../../api/facilities';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import toast from 'react-hot-toast';

export default function FacilityResultsPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const initialFacilities = useTriageStore((state) => state.facilities);
  const assessment = useTriageStore((state) => state.assessment);

  const [facilities, setFacilities] = useState<any[]>(initialFacilities || []);
  const [isLoading, setIsLoading] = useState(false);
  const [gpsLabel, setGpsLabel] = useState('Detect GPS Location');

  const fetchNearby = async (lat: number, lon: number) => {
    setIsLoading(true);
    try {
      const realFacs = await facilitiesApi.discoverFacilities(
        lat,
        lon,
        25,
        assessment?.recommended_specialty || 'General Medicine'
      );
      if (realFacs && realFacs.length > 0) {
        setFacilities(realFacs);
      }
    } catch {
      toast.error('Could not fetch real GPS hospitals.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUseGPS = () => {
    if (!('geolocation' in navigator)) {
      toast.error('Geolocation not supported');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lon = pos.coords.longitude;
        setGpsLabel(`GPS: ${lat.toFixed(3)}, ${lon.toFixed(3)}`);
        fetchNearby(lat, lon);
        toast.success('Discovered real hospitals near your GPS coordinates!');
      },
      () => {
        toast.error('Using default location (Delhi NCR)');
        fetchNearby(28.6139, 77.2090);
      }
    );
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-7 rounded-3xl border border-[#E8E2D8] shadow-warm-sm">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#F4EFE6] text-[#7A5438] text-[11px] font-bold tracking-wider uppercase mb-1.5">
            <Sparkles className="w-3.5 h-3.5 text-[#C86D51]" />
            <span>Smart Routing & Real-World Discovery</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[#2B1810]">
            {t('facility.recommended')}
          </h1>
          <p className="text-xs sm:text-sm text-[#7A7265] mt-0.5">
            Ranked by matching specialist presence, bed capacity, and real-world distance
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleUseGPS}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-[#4A2E1B] bg-[#FAF7F2] border border-[#E8E2D8] hover:bg-[#F4EFE6] px-3.5 py-2 rounded-xl transition"
          >
            <Navigation className="w-3.5 h-3.5 text-[#C86D51]" />
            <span>{gpsLabel}</span>
          </button>
          <button 
            onClick={() => navigate('/triage')} 
            className="inline-flex items-center gap-1.5 text-xs font-bold text-[#4A2E1B] hover:text-[#382011] bg-[#FAF7F2] border border-[#E8E2D8] px-3.5 py-2 rounded-xl transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>{t('common.back')}</span>
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="bg-white p-12 rounded-3xl border border-[#E8E2D8] flex justify-center">
          <LoadingSpinner text="Searching live OpenStreetMap hospital registry..." />
        </div>
      ) : facilities.length === 0 ? (
        <div className="bg-white p-12 rounded-3xl border border-[#E8E2D8] shadow-warm-sm text-center space-y-4">
          <Building2 className="w-12 h-12 text-[#C7BBA6] mx-auto" />
          <h3 className="text-lg font-serif font-bold text-[#2B1810]">{t('facility.noResults')}</h3>
          <p className="text-xs text-[#7A7265]">Tap below to discover real verified hospitals near your GPS coordinates.</p>
          <button
            onClick={handleUseGPS}
            className="bg-[#4A2E1B] hover:bg-[#382011] text-white text-xs font-semibold px-5 py-2.5 rounded-xl transition shadow-warm-sm"
          >
            📍 Find Real Hospitals Near Me →
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {facilities.map((fac, idx) => {
            const actualFacility = fac.facility || fac;
            return (
              <FacilityCard 
                key={actualFacility.id || idx} 
                facility={fac} 
                onBook={() => navigate(`/appointments/book/${actualFacility.id}`)} 
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
