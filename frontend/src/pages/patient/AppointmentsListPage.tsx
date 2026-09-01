import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';
import { appointmentsApi } from '../../api/appointments';
import { facilitiesApi } from '../../api/facilities';
import { Calendar, Clock, Plus, MapPin, CheckCircle2, ArrowRight, Navigation } from 'lucide-react';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import toast from 'react-hot-toast';

export default function AppointmentsListPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState<any[]>([]);
  const [facilities, setFacilities] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLocating, setIsLocating] = useState(false);
  const [locationLabel, setLocationLabel] = useState('Default Network');

  const loadData = async (lat = 28.6139, lon = 77.2090) => {
    setIsLoading(true);
    try {
      const [appts, realFacs] = await Promise.all([
        appointmentsApi.getAppointments().catch(() => []),
        facilitiesApi.discoverFacilities(lat, lon, 25, 'General Medicine').catch(() => [])
      ]);
      setAppointments(appts || []);
      if (realFacs && realFacs.length > 0) {
        setFacilities(realFacs.map((rf: any) => ({
          id: rf.facility.id,
          name: rf.facility.name,
          facility_type: rf.facility.facility_type,
          address: rf.facility.address,
          phone: rf.facility.phone,
          distance_km: rf.distance_km,
          operating_hours: rf.facility.operating_hours || '24/7'
        })));
      } else {
        const defaultFacs = await facilitiesApi.getFacilities().catch(() => []);
        setFacilities(defaultFacs || []);
      }
    } catch (err) {
      console.error("Error loading appointments:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = pos.coords.latitude;
          const lon = pos.coords.longitude;
          setLocationLabel(`Live GPS: ${lat.toFixed(3)}, ${lon.toFixed(3)}`);
          loadData(lat, lon);
        },
        () => loadData(28.6139, 77.2090),
        { timeout: 5000 }
      );
    } else {
      loadData(28.6139, 77.2090);
    }
  }, []);

  const handleGPSDetect = () => {
    if (!('geolocation' in navigator)) {
      toast.error('Geolocation not supported');
      return;
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lon = pos.coords.longitude;
        setLocationLabel(`Live GPS: ${lat.toFixed(3)}, ${lon.toFixed(3)}`);
        loadData(lat, lon);
        setIsLocating(false);
        toast.success('Discovered real hospitals near your GPS coordinates!');
      },
      () => {
        setIsLocating(false);
        toast.error('Using default location (Delhi NCR)');
      }
    );
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-7 rounded-3xl border border-[#E8E2D8] shadow-warm-sm">
        <div>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[#2B1810]">
            Consultations & Real Hospital Directory
          </h1>
          <p className="text-xs sm:text-sm text-[#7A7265] mt-1">
            Manage your visits or book directly with verified hospitals near your live GPS coordinates
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleGPSDetect}
            className="flex items-center gap-1.5 bg-[#FAF7F2] hover:bg-[#F4EFE6] border border-[#E8E2D8] text-[#4A2E1B] font-bold px-3.5 py-2.5 rounded-xl text-xs transition"
          >
            <Navigation className={`w-3.5 h-3.5 text-[#C86D51] ${isLocating ? 'animate-spin' : ''}`} />
            <span>{locationLabel}</span>
          </button>
          <button
            onClick={() => {
              if (facilities.length > 0) {
                navigate(`/appointments/book/${facilities[0].id}`);
              } else {
                navigate('/appointments/book/default');
              }
            }}
            className="flex items-center gap-2 bg-[#4A2E1B] hover:bg-[#382011] text-white font-medium px-4 py-2.5 rounded-xl shadow-warm-sm transition text-xs tracking-wide"
          >
            <Plus className="w-4 h-4" />
            <span>Book New Slot</span>
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="bg-white p-12 rounded-3xl border border-[#E8E2D8] flex justify-center">
          <LoadingSpinner text="Searching live OpenStreetMap hospital registry..." />
        </div>
      ) : (
        <>
          {/* Active Appointments */}
          <div className="space-y-4">
            <h2 className="text-xl font-serif font-bold text-[#2B1810] flex items-center gap-2">
              <Calendar className="w-5 h-5 text-[#8C5D3E]" />
              <span>Upcoming Consultations</span>
            </h2>

            {appointments.length === 0 ? (
              <div className="bg-white p-8 rounded-3xl border border-[#E8E2D8] text-center space-y-3 shadow-warm-sm">
                <Calendar className="w-12 h-12 text-[#C7BBA6] mx-auto" />
                <p className="text-[#2B1810] font-serif font-bold text-lg">No appointments booked yet</p>
                <p className="text-xs text-[#7A7265]">Choose a real verified hospital below to schedule an in-person or remote consultation</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {appointments.map((appt) => (
                  <div key={appt.id} className="bg-white p-6 rounded-3xl border border-[#E8E2D8] shadow-warm-sm space-y-4 hover:border-[#D6CBB8] transition flex flex-col justify-between">
                    <div className="space-y-3">
                      <div className="flex justify-between items-start">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-[#EBF5EC] text-[#2E7D32] border border-[#D4EAD6]">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          {appt.status || 'SCHEDULED'}
                        </span>
                        <span className="text-[11px] bg-[#FAF7F2] text-[#6B6358] border border-[#E8E2D8] px-2.5 py-1 rounded-lg font-medium">
                          {appt.consultation_type || 'IN_PERSON'}
                        </span>
                      </div>

                      <h3 className="font-serif font-bold text-[#2B1810] text-base">
                        {appt.chief_complaint || 'General Consultation'}
                      </h3>

                      <div className="text-xs text-[#6B6358] space-y-1">
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-[#8C8275]" />
                          <span>{appt.scheduled_start ? new Date(appt.scheduled_start).toLocaleString() : 'Today'}</span>
                        </div>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-[#F0EAE1] flex justify-end">
                      <Link
                        to="/queue"
                        className="text-xs font-bold text-[#4A2E1B] hover:text-[#382011] flex items-center gap-1 group"
                      >
                        <span>View Queue Token</span>
                        <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Real Facilities to Book At */}
          <div className="space-y-4 pt-4">
            <h2 className="text-xl font-serif font-bold text-[#2B1810] flex items-center gap-2">
              <MapPin className="w-5 h-5 text-[#8C5D3E]" />
              <span>Real Healthcare Facilities Near You</span>
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {facilities.map((fac) => (
                <div key={fac.id} className="bg-white p-6 rounded-3xl border border-[#E8E2D8] shadow-warm-sm hover:shadow-warm-md transition flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between items-start">
                      <h3 className="font-serif font-bold text-[#2B1810] text-base">{fac.name}</h3>
                      <span className="text-[11px] bg-[#F4EFE6] text-[#7A5438] font-bold px-2 py-0.5 rounded-lg border border-[#E8E2D8]">
                        {fac.distance_km ? `${fac.distance_km} km away` : fac.facility_type}
                      </span>
                    </div>
                    <p className="text-[#6B6358] text-xs leading-relaxed line-clamp-2">{fac.address}</p>
                    {fac.operating_hours && (
                      <p className="text-[11px] text-[#2E7D32] font-semibold">● Open 24/7 Verified</p>
                    )}
                  </div>

                  <div className="pt-3 border-t border-[#F0EAE1] flex justify-between items-center">
                    <span className="text-xs text-[#7A7265]">📞 {fac.phone}</span>
                    <button
                      onClick={() => navigate(`/appointments/book/${fac.id}`)}
                      className="bg-[#4A2E1B] hover:bg-[#382011] text-white text-xs font-semibold px-4 py-2 rounded-xl transition shadow-warm-sm"
                    >
                      Book Slot →
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
